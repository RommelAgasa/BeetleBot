// Used to encode strings to Base64, which is the format BLE devices expect when writing data.
import { encode as btoa } from "base-64";


// Used to check or request location permissions (Android requires this for BLE scanning).
import * as Location from "expo-location";

import { useCallback, useEffect, useRef, useState } from "react";

// For showing alerts and handling permissions on Android.
import { Alert, Linking, PermissionsAndroid, Platform } from "react-native";

// The main BLE controller. It manages scanning, connecting, reading/writing characteristics.
// BleState: Represents the Bluetooth state (e.g., PoweredOn, PoweredOff).
// Device: Represents a discovered BLE device.
import { BleManager, State as BleState, Device } from "react-native-ble-plx";

const SCAN_DURATION_MS = 10000; // SCAN_DURATION_MS = 10000: BLE scan will automatically stop after 10 seconds.

// Return Type and Hook Declaration --------------------------------------------------------------------------

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
  resetBleState: () => void;
}

// ---------------------------------------------------------------------------------------------------------------

export const useBle = (): UseBleReturn => {


  // The BLE manager instance (only one is created).
  const [manager] = useState(() => new BleManager());

  // The currently connected device.
  const [device, setDevice] = useState<Device | null>(null);

  // Stores all discovered devices (Map of ID → Device).
  const [devicesMap, setDevicesMap] = useState<Map<string, Device>>(new Map());

  // Whether scanning is in progress.
  const [isScanning, setIsScanning] = useState(false);

  // The ID of the device currently connected.
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(
    null
  );

  // The specific service/characteristic used for sending commands.
  const [serviceUUID, setServiceUUID] = useState<string | null>(null);
  const [characteristicUUID, setCharacteristicUUID] = useState<string | null>(
    null
  );

  // Likely used to show a UI modal listing nearby BLE devices.
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  // used to store persistent values across re-renders (without causing rerenders).
  const serviceUUIDRef = useRef<string | null>(null);
  const characteristicUUIDRef = useRef<string | null>(null);
  const charWriteWithResponseRef = useRef<boolean | null>(null);

  const scanTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------------
  // When the component using this hook unmounts, this runs automatically:
  useEffect(() => {
    return () => {
      manager.stopDeviceScan(); // Stops any ongoing BLE scan.
      manager.destroy(); // Destroys the BLE manager instance (to release native resources).
      if (scanTimeout.current) clearTimeout(scanTimeout.current); // Clears any scan timeout.
    };
  }, [manager]);


  // Requesting Android Permissions --------------------------------------------------------------------------------
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



  // Stopping a Scan ------------------------------------------------------------------------------------------------
  // This function is reused in multiple places (e.g., before starting a new scan, or when connecting).
  const stopScan = useCallback(() => {
    manager.stopDeviceScan(); // Stops any ongoing BLE scan.
    if (scanTimeout.current) clearTimeout(scanTimeout.current); // Cancels the auto-stop timer if it’s active.
    setIsScanning(false); // Updates the UI state to reflect scanning has ended.
  }, [manager]);


  // Scanning For Device ------------------------------------------------------------------------------------------------
  const scanForDevices = useCallback(async () => {
    const bleState = await manager.state();
    let locationEnabled = true;
    if (Platform.OS === "android") {
      locationEnabled = await Location.hasServicesEnabledAsync();
    }
    const bluetoothOff = bleState !== BleState.PoweredOn; // Gets the Bluetooth state (BleState.PoweredOn means it’s ready).
    const locationOff = Platform.OS === "android" && !locationEnabled; // Checks if Location services are enabled (on Android).


    // If all checks pass:
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

    stopScan(); // It stops any existing scan (to start fresh).
    setDevicesMap(new Map()); // Clears the device list (setDevicesMap(new Map())).

    // Sets isScanning and showDeviceModal to true (to show scanning UI).
    setIsScanning(true); 
    setShowDeviceModal(true);

    // Android permission check 
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

    // Starting the Scan
    try {

      manager.startDeviceScan(null, null, (error, scannedDevice) => {

        // If error → stop scanning and show an alert.
        if (error) {
          console.error(error);
          setIsScanning(false);
          setShowDeviceModal(false);
          if (scanTimeout.current) clearTimeout(scanTimeout.current);
          return;
        }

        // If a device is found (scannedDevice):
        if (scannedDevice && (scannedDevice.name || scannedDevice.localName)) {
          
          setDevicesMap((prev) => {
            if (prev.has(scannedDevice.id)) return prev;
            const next = new Map(prev);
            next.set(scannedDevice.id, scannedDevice);
            return next;
          });

        }
      });

      // After SCAN_DURATION_MS (10 seconds):
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

  // ---------------------------------------------------------------------------------------------------

  // Connecting to Device
  const connectToDevice = useCallback(
    async (d: Device) => {
      stopScan(); // Stops any ongoing BLE scan before connecting.
      try {
        const connected = await d.connect(); // Connects to the selected BLE device (d). Returns a connected Device instance.

        // After connecting, the app discovers all services and their characteristics that the device provides.
        // These are like the “features” of the device — some can be read, written, or notified.
        const discovered =
          await connected.discoverAllServicesAndCharacteristics();

        // store the connected device.
        setDevice(discovered);

        // remember which device you connected to.
        setConnectedDeviceId(discovered.id);

        // Finding a writable characteristic
        /**
         * BLE devices have one or more services.
         * Each service can have multiple characteristics.
         * A characteristic is like a data channel — you can write or read from it.
         * This loop goes through each service and each characteristic, looking for one that is writable.
         */
        let foundService: string | null = null;
        let foundChar: string | null = null;
        let writeWithResponse: boolean | null = null;
        try {
          const services = await discovered.services(); 
          for (const service of services) {
            const characteristics = await service.characteristics();
            for (const char of characteristics) {

              // When it finds a writable characteristic, it stores:
              if (
                char.isWritableWithResponse ||
                char.isWritableWithoutResponse
              ) {
                
                foundService = service.uuid; 
                foundChar = char.uuid;
                writeWithResponse = char.isWritableWithResponse;
                break;
              }
            }
            if (foundService && foundChar) break;
          }
        } catch {}

        // Save references
        /**
         * Save the discovered UUIDs in both:
         *  useRef variables → for stable references inside callbacks
         *  useState variables → so the UI can show or use them if needed.
         * 
         */
        serviceUUIDRef.current = foundService;
        characteristicUUIDRef.current = foundChar;
        charWriteWithResponseRef.current = writeWithResponse;
        setServiceUUID(foundService);
        setCharacteristicUUID(foundChar);
        
        // Close Modal
        setShowDeviceModal(false);


        // Notify the User
        // If the writable service and characteristic were found:
          // Shows a success alert with the UUIDs.
        // else
          // Warns the user that sending commands might not work.


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
        // If the connection process throws an error:
        setShowDeviceModal(false);
        Alert.alert("Connection error", err?.toString());
      }
    },
    [stopScan]
  );

  // Internal Reset Function ----------------------------------------------------------------------------
  const internalReset = useCallback((showAlert: boolean) => {
    setDevice(null);
    setConnectedDeviceId(null);
    setServiceUUID(null);
    setCharacteristicUUID(null);
    serviceUUIDRef.current = null;
    characteristicUUIDRef.current = null;
    charWriteWithResponseRef.current = null;
    if (scanTimeout.current) clearTimeout(scanTimeout.current);
    if (showAlert) {
      Alert.alert("Disconnected", "Device has been disconnected.");
    }
  }, []);


  // Disconnecting the Device ------------------------------------------------------------------------
  const disconnectDevice = useCallback(async () => {

    // Check if a device is connected
    if (device) {
      try {
        if (serviceUUIDRef.current && characteristicUUIDRef.current) {
          try {
            /**
             * Send a disconnect command (“S”)
             * If there’s a writable characteristic, it tries to send "S" to the device before disconnecting.
             * This could be a custom protocol command — for example, telling your robot or peripheral to stop or shut down gracefully.
             */
            await device.writeCharacteristicWithResponseForService(
              serviceUUIDRef.current,
              characteristicUUIDRef.current,
              btoa("S")
            );
          } catch {}
        }
        // device.cancelConnection() cleanly disconnects from the device at the BLE level.
        await device.cancelConnection();
      } catch {}   // If any of these steps fail, it safely ignores the error (using empty catch blocks) to prevent the app from crashing.
    }

    // Calls internalReset(true) to clear all state and show an alert that the device has been disconnected.
    internalReset(true);
  }, [device, internalReset]);


  /**
   * This function makes sure your app knows which BLE characteristic can be written to —
      because that’s the “channel” where you send commands like "F", "B", or "S" to your hardware.

      It’s usually called before sending commands or reconnecting, to verify the write characteristic is still valid.
   */
  const ensureWritableCharacteristic = useCallback(async () => {

    // If the device is connected and the write characteristic is already identified,
    if (
      device &&
      serviceUUIDRef.current &&
      characteristicUUIDRef.current &&
      charWriteWithResponseRef.current !== null
    ) {
      // there’s no need to search again → return true.
      // This avoids unnecessary BLE discovery calls (which are slow and drain battery).
      return true;
    }

    // You can’t look for characteristics if you’re not connected to a device.
    if (!device) return false;


    try {
      /**
       * Every BLE peripheral exposes one or more services, which are 
       * like “modules” or “categories” 
       * (e.g., Battery Service, UART Service, Custom Control Service).
       */
      const services = await device.services();
      for (const service of services) { // Each service contains one or more characteristics, which are the actual data points or channels for reading/writing.

        const characteristics = await service.characteristics();
        for (const char of characteristics) { // The function looks for any characteristic that allows writing.
          // isWritableWithResponse → app gets confirmation when data is received.
          // isWritableWithoutResponse → faster, but no confirmation (useful for real-time commands like joystick movement).
          if (char.isWritableWithResponse || char.isWritableWithoutResponse) {
            // Once found:
            /**
             * It stores the UUIDs in both refs and states.
             * Marks the characteristic as writable.
             */
            serviceUUIDRef.current = service.uuid;
            characteristicUUIDRef.current = char.uuid;
            charWriteWithResponseRef.current = char.isWritableWithResponse;
            setServiceUUID(service.uuid);
            setCharacteristicUUID(char.uuid);

            // Returns true → success!
            return true;
          }
        }
      }
    } catch (e) {
      // If anything goes wrong (like the BLE service list can’t be fetched), it warns and returns false.
      console.warn("Re-discovery failed", e); 
    }

    // No writable characteristic found or device not connected.
    return false;
  }, [device]);


  // Sending Commands ------------------------------------------------------------------------------------------------------------
  const sendCommand = useCallback(
    async (command: string) => {
      const ready = await ensureWritableCharacteristic();

      // Checking
      if (
        !ready ||
        !device ||
        !serviceUUIDRef.current ||
        !characteristicUUIDRef.current
      ) {
        Alert.alert(
          "Not connected to any BLE device or writable characteristic."
        );
        return;
      }

      try {
        if (charWriteWithResponseRef.current) {
          await device.writeCharacteristicWithResponseForService(
            serviceUUIDRef.current,
            characteristicUUIDRef.current,
            btoa(command)
          );
        } else {
          await device.writeCharacteristicWithoutResponseForService(
            serviceUUIDRef.current,
            characteristicUUIDRef.current,
            btoa(command)
          );
        }
        console.log(`BLE Sent: ${command}`);
      } catch (err) {
        console.error("Send error", err);
      }
    },
    [device, ensureWritableCharacteristic]
  );

  //  ----------------------------------------------------------------------------------------------------
  /**
   * This is a public function returned by the hook.
   * It simply calls internalReset without showing an alert (showAlert = false).
   * Use case: reset all BLE states quietly, e.g., when leaving a screen, before starting a new scan, or when reconnecting.
   * 
   */

  const resetBleState = useCallback(
    () => internalReset(false),
    [internalReset]
  );


  // : Device Disconnection Listener -----------------------------------------------------------------------
  useEffect(() => {

    if (!device) return; //Check if a device exists: No need to set up a listener if no device is connected

    // This function triggers automatically if the BLE device disconnects unexpectedly (like going out of range or turning off).
    const sub = device.onDisconnected(async () => {
      try {
        // Before fully cleaning up, it attempts to send "S" (Stop) to the device to safely stop the hardware.
        if (serviceUUIDRef.current && characteristicUUIDRef.current) {
          await device.writeCharacteristicWithResponseForService(
            serviceUUIDRef.current,
            characteristicUUIDRef.current,
            btoa("S")
          );
        }
      } catch {}

      // Clears the state internally, but doesn’t show an alert.
      internalReset(false);
    });

    // Removes the disconnection listener to prevent memory leaks.
    return () => {
      // The try/catch ensures the app doesn’t crash if removal fails.
      try {
        sub.remove();
      } catch {}
    };
  }, [device, internalReset]);

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
    resetBleState,
  };
};
