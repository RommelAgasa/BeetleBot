import { useCallback, useEffect, useState } from "react";
import { Device } from "react-native-ble-plx";
import { BleService } from "../services/BleService";

/**
 * Custom React hook to manage BLE operations using BleService.
 * Provides scanning, connecting, disconnecting, sending commands,
 * and keeps React state in sync with the underlying BLE service.
 */
export const useBle = () => {
  // ---------- BLE SERVICE INSTANCE ----------
  // Single instance of BleService. This is the internal logic for BLE operations.
  // Get the singleton instance
  const bleService = BleService.getInstance();

  // ---------- REACT STATE FOR UI ----------
  // The currently connected BLE device (or null if none connected)
  const [device, setDevice] = useState<Device | null>(null);

  // Map of all discovered BLE devices (id → Device)
  const [devicesMap, setDevicesMap] = useState<Map<string, Device>>(new Map());

  // Boolean indicating if a BLE scan is currently in progress
  const [isScanning, setIsScanning] = useState(false);

  // ---------- SCAN FOR DEVICES ----------
  const scanForDevices = useCallback(async () => {

    try{
        setDevicesMap(new Map()); // Clear previous devices before scanning
        setIsScanning(true); // Update UI to reflect scanning

        // Start scanning using the BleService
        await bleService.scanForDevices(
            (d) => {
                // Called whenever a device is found
                setDevicesMap((prev) => {
                if (prev.has(d.id)) return prev; // Skip if already found
                const next = new Map(prev);
                next.set(d.id, d);
                return next;
                });
            },
            () => setIsScanning(false) // Called when scan stops (timeout or manually)
        );
    } catch (error) {
        console.error("Scan error:", error);
        setIsScanning(false);
    }
    
  }, [bleService]);

  const stopScan = useCallback(() => {
    // Stops the BLE scan immediately and updates UI
    bleService.stopScan();
    setIsScanning(false);
  }, [bleService]);

  // ---------- CONNECT / DISCONNECT DEVICE ----------
  const connectToDevice = useCallback(
    async (d: Device) => {
      // Connect to the device and discover writable characteristic
      await bleService.connectToDevice(d);
      setDevice(bleService.device); // Update state for UI
    },
    [bleService]
  );

  // Non-throwing connect variant that returns a boolean
  const tryConnectToDevice = useCallback(
    async (d: Device): Promise<boolean> => {
      const ok = await bleService.tryConnectToDevice(d);
      setDevice(ok ? bleService.device : null);
      return ok;
    },
    [bleService]
  );

  const disconnectDevice = useCallback(async () => {
    // Disconnect from device and clear state
    await bleService.disconnectDevice();
    setDevice(null);
  }, [bleService]);

  // ---------- SEND COMMAND TO DEVICE ----------
  const sendCommand = useCallback(
    async (cmd: string) => {
      // Sends a command string to the connected BLE device
      await bleService.sendCommand(cmd);
    },
    [bleService]
  );

  // ---------- SUBSCRIBE TO NOTIFICATIONS ----------
  const subscribeToNotifications = useCallback(
    (
      onNotification: (data: string) => void,
      onError?: (error: Error) => void
    ) => {
      // Subscribe to device responses
      return bleService.subscribeToNotifications(onNotification, onError);
    },
    [bleService]
  );

  // ---------- SYNC BLE EVENTS ----------
  useEffect(() => {
    if (!bleService.device) return;

    let subscription: any = null;

    try {
        subscription = bleService.device.onDisconnected(() => {
        setDevice(null);
        });
    } catch (error) {
        console.error("Failed to attach disconnection listener:", error);
    }

    return () => {
        if (subscription) subscription.remove();
    };
 }, [bleService.device]); // Only depend on the device itself

    // Separate cleanup effect
    useEffect(() => {
        return () => {
            stopScan(); // Stop scan on unmount
        };
    }, [stopScan]);

  // ---------- RETURN HOOK API ----------
  // Return all functions and states needed by UI components
  return {
    device,
    devicesMap,
    isScanning,
    scanForDevices,
    stopScan,
    connectToDevice,
    tryConnectToDevice,
    disconnectDevice,
    sendCommand,
    subscribeToNotifications,
  };
};
