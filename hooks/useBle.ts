import { encode as btoa } from "base-64";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, PermissionsAndroid, Platform } from "react-native";
import { BleManager, State as BleState, Device } from "react-native-ble-plx";

const SCAN_DURATION_MS = 10000;

export interface UseBleReturn {
  device: Device | null;
  devicesMap: Map<string, Device>;
  isScanning: boolean;
  connectedDeviceId: string | null;
  showDeviceModal: boolean;
  setShowDeviceModal: (v: boolean) => void;
  scanForDevices: () => Promise<void>;
  stopScan: () => void;
  connectToDevice: (d: Device) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  sendCommand: (cmd: string) => Promise<void>;
}

export const useBle = (): UseBleReturn => {
  const [manager] = useState(() => new BleManager());
  const [device, setDevice] = useState<Device | null>(null);
  const [devicesMap, setDevicesMap] = useState<Map<string, Device>>(new Map());
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(
    null
  );
  const [serviceUUID, setServiceUUID] = useState<string | null>(null);
  const [characteristicUUID, setCharacteristicUUID] = useState<string | null>(
    null
  );
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  const scanTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
      manager.destroy();
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
    };
  }, [manager]);

  const requestAndroidPermissions = useCallback(async () => {
    if (Platform.OS !== "android") return true;
    try {
      const apiLevel = Platform.Version as number;
      if (apiLevel >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === "granted";
      }
    } catch (e: any) {
      Alert.alert("Permission error", e?.toString());
      return false;
    }
  }, []);

  const stopScan = useCallback(() => {
    manager.stopDeviceScan();
    if (scanTimeout.current) clearTimeout(scanTimeout.current);
    setIsScanning(false);
  }, [manager]);

  const scanForDevices = useCallback(async () => {
    const bleState = await manager.state();
    let locationEnabled = true;
    if (Platform.OS === "android") {
      locationEnabled = await Location.hasServicesEnabledAsync();
    }
    const bluetoothOff = bleState !== BleState.PoweredOn;
    const locationOff = Platform.OS === "android" && !locationEnabled;

    if (bluetoothOff || locationOff) {
      Alert.alert(
        "Cannot Scan",
        bluetoothOff && locationOff
          ? "Please turn on both Bluetooth and Location services."
          : bluetoothOff
          ? "Please turn on Bluetooth."
          : "Please turn on Location services."
      );
      return;
    }

    stopScan();
    setDevicesMap(new Map());
    setIsScanning(true);
    setShowDeviceModal(true);

    if (Platform.OS === "android") {
      const granted = await requestAndroidPermissions();
      if (!granted) {
        Alert.alert(
          "Permission Not Granted",
          "Grant Location & Nearby Devices permissions to scan.",
          [
            {
              text: "Go to Settings",
              onPress: () =>
                Platform.OS === "android"
                  ? Linking.openSettings()
                  : Linking.openURL("app-settings:"),
            },
            { text: "OK", style: "cancel" },
          ]
        );
        setIsScanning(false);
        setShowDeviceModal(false);
        return;
      }
    }

    try {
      manager.startDeviceScan(null, null, (error, scannedDevice) => {
        if (error) {
          console.error(error);
          setIsScanning(false);
          setShowDeviceModal(false);
          if (scanTimeout.current) clearTimeout(scanTimeout.current);
          return;
        }
        if (scannedDevice && (scannedDevice.name || scannedDevice.localName)) {
          setDevicesMap((prev) => {
            if (prev.has(scannedDevice.id)) return prev;
            const next = new Map(prev);
            next.set(scannedDevice.id, scannedDevice);
            return next;
          });
        }
      });
      scanTimeout.current = setTimeout(() => {
        stopScan();
      }, SCAN_DURATION_MS);
    } catch (e: any) {
      setIsScanning(false);
      setShowDeviceModal(false);
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
      Alert.alert("Scan error", e?.toString());
    }
  }, [manager, requestAndroidPermissions, stopScan]);

  const connectToDevice = useCallback(
    async (d: Device) => {
      stopScan();
      try {
        const connected = await d.connect();
        const discovered =
          await connected.discoverAllServicesAndCharacteristics();
        setDevice(discovered);
        setConnectedDeviceId(discovered.id);

        let foundService: string | null = null;
        let foundChar: string | null = null;
        try {
          const services = await discovered.services();
          for (const service of services) {
            const characteristics = await service.characteristics();
            for (const char of characteristics) {
              if (
                char.isWritableWithResponse ||
                char.isWritableWithoutResponse
              ) {
                foundService = service.uuid;
                foundChar = char.uuid;
                break;
              }
            }
            if (foundService && foundChar) break;
          }
        } catch {}

        setServiceUUID(foundService);
        setCharacteristicUUID(foundChar);
        setShowDeviceModal(false);

        if (foundService && foundChar) {
          Alert.alert(
            "Connected",
            `Service: ${foundService}\nCharacteristic: ${foundChar}`
          );
        } else {
          Alert.alert(
            "No Writable Characteristic",
            "You may not be able to send commands."
          );
        }
      } catch (err: any) {
        setShowDeviceModal(false);
        Alert.alert("Connection error", err?.toString());
      }
    },
    [stopScan]
  );

  const disconnectDevice = useCallback(async () => {
    if (device) {
      try {
        await device.cancelConnection();
      } catch {}
    }
    setDevice(null);
    setConnectedDeviceId(null);
    setServiceUUID(null);
    setCharacteristicUUID(null);
    if (scanTimeout.current) clearTimeout(scanTimeout.current);
    Alert.alert("Disconnected", "Device has been disconnected.");
  }, [device]);

  const sendCommand = useCallback(
    async (command: string) => {
      if (!device || !serviceUUID || !characteristicUUID) {
        Alert.alert(
          "Not connected to any BLE device or writable characteristic."
        );
        return;
      }
      try {
        await device.writeCharacteristicWithResponseForService(
          serviceUUID,
          characteristicUUID,
          btoa(command)
        );
        console.log(`Sent: ${command}`);
      } catch (err) {
        console.error("Send error", err);
      }
    },
    [device, serviceUUID, characteristicUUID]
  );

  return {
    device,
    devicesMap,
    isScanning,
    connectedDeviceId,
    showDeviceModal,
    setShowDeviceModal,
    scanForDevices,
    stopScan,
    connectToDevice,
    disconnectDevice,
    sendCommand,
  };
};
