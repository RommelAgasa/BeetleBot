
// ============================================================================
// SERVICE INTERFACE
// ============================================================================

import { DriveMode } from "../types/DriveMode";
import { SteeringDirection } from "../types/SteeringDirection";

/**
 * IDrivingService defines the contract for all driving-related operations.
 * This interface abstracts away the implementation details of sending commands,
 * calculating states, and managing driving logic from the React hook.
 * 
 * Implementing this interface allows for:
 * - Easy testing with mock implementations
 * - Switching between different car control systems
 * - Centralized business logic management
 */
export interface IDrivingService {
  /**
   * Determines steering direction based on a numeric angle
   * @param angle - The steering angle (negative = left, positive = right)
   * @param threshold - The threshold for determining center position
   * @returns The categorical steering direction
   */
  getSteeringDirection(angle: number, threshold: number): SteeringDirection;

  /**
   * Sends a steering command based on drive mode and steering direction
   * @param pedalPressed - Wether the accelerator/reverse pedal is pressed
   * @param driveMode - Current drive mode (forward/reverse/stopped)
   * @param direction - Current steering direction
   * @param commandMap - Map of action keys to command strings
   * @param sendCommand - Function to send commands to the car
   */
  sendSteeringCommand(
    pedalPressed: boolean,
    driveMode: DriveMode,
    direction: SteeringDirection,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void>;

  /**
   * Sends forward acceleration commands
   * @param currentSpeed - Current speed
   * @param maxSpeed - Maximum allowed speed
   * @param speedStep - Amount to increase speed
   * @param steeringDirection - Current steering direction
   * @param commandMap - Map of action keys to command strings
   * @param sendCommand - Function to send commands to the car
   * @returns New speed value after acceleration
   */
  sendAccelerateCommand(
    currentSpeed: number,
    maxSpeed: number,
    speedStep: number,
    steeringDirection: SteeringDirection,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<number>;

  /**
   * Sends reverse acceleration commands
   * @param currentSpeed - Current speed
   * @param maxSpeed - Maximum allowed speed
   * @param speedStep - Amount to increase speed
   * @param steeringDirection - Current steering direction
   * @param commandMap - Map of action keys to command strings
   * @param sendCommand - Function to send commands to the car
   * @returns New speed value after reverse acceleration
   */
  sendReverseCommand(
    currentSpeed: number,
    maxSpeed: number,
    speedStep: number,
    steeringDirection: SteeringDirection,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<number>;

  /**
   * Sends deceleration commands
   * @param currentSpeed - Current speed
   * @param speedStep - Amount to decrease speed
   * @param commandMap - Map of action keys to command strings
   * @param sendCommand - Function to send commands to the car
   * @returns New speed value after deceleration
   */
  sendDecelerateCommand(
    currentSpeed: number,
    speedStep: number,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<{ newSpeed: number; driveMode: DriveMode }>;

  /**
   * Sends an immediate stop/brake command
   * @param commandMap - Map of action keys to command strings
   * @param sendCommand - Function to send commands to the car
   */
  sendBrakeCommand(
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void>;

  /**
   * Checks if steering or angle has meaningfully changed
   * @param currentAngle - The current steering angle
   * @param lastAngle - The last recorded steering angle
   * @param currentDirection - The current steering direction
   * @param lastDirection - The last recorded steering direction
   * @param angleThreshold - The minimum angle change to be considered significant
   * @returns True if there's a meaningful change
   */
  hasSteeringChanged(
    currentAngle: number,
    lastAngle: number,
    currentDirection: SteeringDirection,
    lastDirection: SteeringDirection,
    angleThreshold: number
  ): boolean;

  /**
   * Handles gear change — updates internal state and sends BLE command
   * @param gear - The selected gear (e.g., "Gear 1", "Gear 2", "Reverse")
   * @param commandMap - Map of action keys to command strings
   * @param sendCommand - Function to send commands to the car
   */
  sendGearChangeCommand(
    gear: string,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void>;

    /**
   * Toggles the claw open/close state
   * @param open - Whether to open (true) or close (false) the claw
   * @param sendCommand - Function to send the JSON command to the car
   */
  toggleClaw(
    open: boolean,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void>;

}
