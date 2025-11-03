import { encode as btoa } from "base-64";
import * as Location from "expo-location";
import { Alert, Linking, PermissionsAndroid, Platform } from "react-native";
import { BleManager, State as BleState, Device } from "react-native-ble-plx";
import { IBleService } from "../interface/IBleService";

/**
 * BleService handles all BLE-related functionality:
 * - Scanning for devices
 * - Connecting to a device
 * - Finding writable characteristics
 * - Sending commands
 * - Disconnecting safely
 *
 */
export class BleService implements IBleService {

  private static instance: IBleService; // singleton instance

  /** How long the BLE scan should run before auto-stopping (milliseconds) */
  private SCAN_DURATION_MS = 10000;

  /** The main BLE manager instance. */
  private manager: BleManager;

  /** The currently connected device, if any. */
  device: Device | null = null;

  /** UUID of the connected device's writable service */
  serviceUUID: string | null = null;

  /** UUID of the writable characteristic in the service */
  characteristicUUID: string | null = null;

  /** Whether the characteristic requires a write with response */
  charWriteWithResponse: boolean | null = null;

  /** Timeout handle used to stop scanning after SCAN_DURATION_MS */
  scanTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Map of discovered devices during scanning */
  devicesMap = new Map<string, Device>();

  /**
   * Constructor allows dependency injection of BleManager (useful for unit testing)
   */
  constructor(manager?: BleManager) {
    this.manager = manager ?? new BleManager();
  }

  /**
   * Get the singleton instance of BleService.
   * If it doesn't exist, create it.
   */
  public static getInstance(): IBleService {
    if (!BleService.instance) {
      BleService.instance = new BleService();
    }
    return BleService.instance;
  }

  /** ---------------------- PERMISSIONS ---------------------- */

  /**
   * Requests necessary permissions on Android.
   * Delegates to Android 12+ or legacy permission requests.
   */
  async requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== "android") return true;

    try {
      const apiLevel = Platform.Version as number;

      if (apiLevel >= 31) return this.requestAndroid12Permissions();
      return this.requestLegacyPermissions();
    } catch (e: any) {
      Alert.alert("Permission error", e?.toString());
      return false;
    }
  }

  /** Requests Bluetooth + Location permissions on Android 12+ */
  private async requestAndroid12Permissions(): Promise<boolean> {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    return (
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  /** Requests legacy location permission for Android < 12 */
  private async requestLegacyPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }

  /** ---------------------- STATE CHECKS ---------------------- */

  /** Returns true if Bluetooth is powered on */
  private async checkBluetoothEnabled(): Promise<boolean> {
    const bleState = await this.manager.state();
    return bleState === BleState.PoweredOn;
  }

  /** Returns true if location services are enabled (Android only) */
  private async checkLocationEnabled(): Promise<boolean> {
    if (Platform.OS !== "android") return true;
    return Location.hasServicesEnabledAsync();
  }

  /**
   * Checks if scanning is possible.
   * Shows an alert if Bluetooth or Location is off.
   */
  private async checkCanScan(): Promise<boolean> {
    const bluetoothOn = await this.checkBluetoothEnabled();
    const locationOn = await this.checkLocationEnabled();

    if (!bluetoothOn || !locationOn) {
      Alert.alert(
        "Cannot Scan",
        !bluetoothOn && !locationOn
          ? "Please turn on both Bluetooth and Location services."
          : !bluetoothOn
          ? "Please turn on Bluetooth."
          : "Please turn on Location services."
      );
      return false;
    }
    return true;
  }

  /** ---------------------- SCANNING ---------------------- */

  /**
   * Starts scanning for BLE devices.
   * Handles permissions and checks state before scanning.
   * @param onDeviceFound Callback called for each discovered device.
   * @param onScanStop Optional callback called when scanning stops.
   */
  async scanForDevices(
    onDeviceFound: (device: Device) => void,
    onScanStop?: () => void
  ) {
    const canScan = await this.checkCanScan();
    if (!canScan) return;

    // Ensure permissions granted on Android
    if (Platform.OS === "android") {
      const granted = await this.requestAndroidPermissions();
      if (!granted) return this.showPermissionsAlert();
    }

    // Start actual scanning
    this.startScan(onDeviceFound, onScanStop);
  }

  /** Shows an alert directing the user to app settings for permissions */
  private showPermissionsAlert() {
    Alert.alert(
      "Permission Not Granted",
      "Grant Location & Nearby Devices permissions to scan.",
      [
        { text: "Go to Settings", onPress: () =>
            Platform.OS === "android" ? Linking.openSettings() : Linking.openURL("app-settings:")
        },
        { text: "OK", style: "cancel" }
      ]
    );
  }

  /**
   * Internal method that handles scanning logic.
   * Stores discovered devices in devicesMap and auto-stops after SCAN_DURATION_MS.
   */
  private startScan(onDeviceFound: (device: Device) => void, onScanStop?: () => void) {
    this.stopScan(); // Always clear previous scan
    this.devicesMap.clear();

    this.manager.startDeviceScan(null, null, (error, scannedDevice) => {
        if (error) {
        console.error(error);
        this.stopScan();
        return;
        }

        if (scannedDevice && (scannedDevice.name || scannedDevice.localName)) {
        if (!this.devicesMap.has(scannedDevice.id)) {
            this.devicesMap.set(scannedDevice.id, scannedDevice);
            onDeviceFound(scannedDevice);
        }
        }
    });

    // Clear any previous timeout before setting new one
    if (this.scanTimeout) clearTimeout(this.scanTimeout);
    
    this.scanTimeout = setTimeout(() => {
        this.stopScan();
        onScanStop?.();
    }, this.SCAN_DURATION_MS);
  }

  /** Stops any ongoing scan and clears the timeout */
  stopScan() {
    this.manager.stopDeviceScan();
    if (this.scanTimeout) clearTimeout(this.scanTimeout);
  }

  /** ---------------------- CONNECTION ---------------------- */

  /**
   * Connects to a device and discovers all services/characteristics.
   * Then identifies a writable characteristic for sending commands.
   */
  async connectToDevice(d: Device) {
  try {
    await this.connectAndDiscover(d);
    await this.findWritableCharacteristic();
    
    if (!this.characteristicUUID) {
      throw new Error("No writable characteristic found");
    }
  } catch (error) {
    this.resetConnection();
    throw error; // Let caller handle it
  }
}

  /** Connects and discovers all services/characteristics */
  private async connectAndDiscover(d: Device) {
    this.stopScan();
    const connected = await d.connect();
    this.device = await connected.discoverAllServicesAndCharacteristics();
  }

  /** Finds the first writable characteristic in the connected device */
  private async findWritableCharacteristic() {
    if (!this.device) return;

    const services = await this.device.services();
    for (const service of services) {
      const characteristics = await service.characteristics();
      for (const char of characteristics) {
        if (char.isWritableWithResponse || char.isWritableWithoutResponse) {
          this.serviceUUID = service.uuid;
          this.characteristicUUID = char.uuid;
          this.charWriteWithResponse = char.isWritableWithResponse;
          return;
        }
      }
    }
  }

  public async connectWithRetry(device: Device, maxRetries = 3): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
        try {
        await this.connectToDevice(device);
        return;
        } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
  }

  /** ---------------------- COMMANDS ---------------------- */

  /**
   * Sends a command string to the device.
   * Encodes the string to Base64 as required by BLE devices.
   */
  async sendCommand(command: string) {
    if (!this.device?.id || !this.serviceUUID || !this.characteristicUUID) {
        Alert.alert("Not connected or writable characteristic missing");
        return;
    }

    try {
        const encoded = btoa(command);
        if (this.charWriteWithResponse) {
        await this.device.writeCharacteristicWithResponseForService(
            this.serviceUUID,
            this.characteristicUUID,
            encoded
        );
        } else {
        await this.device.writeCharacteristicWithoutResponseForService(
            this.serviceUUID,
            this.characteristicUUID,
            encoded
        );
        }
    } catch (error: any) {
        console.error("Send command error:", error);
        // Check if device was disconnected
        if (error?.message?.includes("disconnected")) {
        this.resetConnection();
        }
        throw error;
    }
  }

  /** ---------------------- DISCONNECT ---------------------- */

  /**
   * Disconnects from the device safely.
   * Sends a stop command ("S") if possible, then cancels the BLE connection.
   */
  async disconnectDevice() {
    if (!this.device) return;

    try {
      await this.sendCommand("S"); // Stop the device safely
      await this.device.cancelConnection();
    } catch {} // Ignore errors during disconnect

    this.resetConnection();
  }

  /** Clears all BLE connection state */
  private resetConnection() {
    this.device = null;
    this.serviceUUID = null;
    this.characteristicUUID = null;
    this.charWriteWithResponse = null;
  }
}
