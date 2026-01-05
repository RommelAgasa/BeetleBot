import { Device } from "react-native-ble-plx";

/**
 * IBleService - Contract for Bluetooth Low Energy operations
 * Handles scanning, connecting, and communicating with BLE devices
 */
export interface IBleService {
  // =========================================================================
  // PROPERTIES
  // =========================================================================

  /** Currently connected BLE device, or null if disconnected */
  device: Device | null;

  /** UUID of the service on the connected device */
  serviceUUID: string | null;

  /** UUID of the writable characteristic for sending commands */
  characteristicUUID: string | null;

  /** Whether the characteristic requires a write response acknowledgment */
  charWriteWithResponse: boolean | null;

  /** Map of discovered devices during scan: Map<deviceId, Device> */
  devicesMap: Map<string, Device>;

  // =========================================================================
  // METHODS
  // =========================================================================

  /**
   * Requests Bluetooth and Location permissions on Android
   * @returns true if all permissions granted, false otherwise
   */
  requestAndroidPermissions(): Promise<boolean>;

  /**
   * Scans for nearby BLE devices
   * @param onDeviceFound - Callback called for each discovered device
   * @param onScanStop - Optional callback when scan stops (timeout or manual)
   */
  scanForDevices(
    onDeviceFound: (device: Device) => void,
    onScanStop?: () => void
  ): Promise<void>;

  /**
   * Stops the current BLE scan immediately
   */
  stopScan(): void;

  /**
   * Connects to a device and discovers its services/characteristics
   * @param device - Device to connect to
   * @throws Error if connection fails or no writable characteristic found
   */
  connectToDevice(device: Device): Promise<void>;

  /**
   * Non-throwing connect helper. Returns true on success, false otherwise.
   */
  tryConnectToDevice(device: Device): Promise<boolean>;

  /**
   * Connects to device with automatic retry on failure
   * Uses exponential backoff: 1s, 2s, 3s between retries
   * @param device - Device to connect to
   * @param maxRetries - Number of connection attempts
   */
  connectWithRetry(device: Device, maxRetries: number): void;

  /**
   * Sends a command string to the connected device (Base64 encoded)
   * @param command - Command to send (e.g., "F" forward, "B" backward, "S" stop)
   * @throws Error if not connected or send fails
   */
  sendCommand(command: string): Promise<void>;

  /**
   * Disconnects from device safely
   * Sends stop command first, then closes connection and clears state
   */
  disconnectDevice(): Promise<void>;
}
