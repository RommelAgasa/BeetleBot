// ============================================================================
// SERVICE INTERFACE (Plain Text Version for BeetleBot)
// ============================================================================

import { DriveMode } from "../types/DriveMode";
import { SteeringDirection } from "../types/SteeringDirection";

/**
 * IDrivingService defines the contract for all driving-related operations.
 * This interface abstracts the logic of sending plain text commands to the BeetleBot
 * (e.g., "F", "B", "+", "-", "S", "O", "C") and managing drive state logic.
 *
 * Implementing this interface allows for:
 * - Centralized logic for command mapping and speed control
 * - Flexibility to swap between different control protocols (e.g., JSON, BLE)
 * - Testable and modular driving logic
 */
export interface IDrivingService {
  /**
   * Determines steering direction based on steering angle
   * @param angle - Steering angle (negative = left, positive = right)
   * @param threshold - Minimum change before considering it as turning
   * @returns The current steering direction ("left", "right", or "center")
   */
  getSteeringDirection(angle: number, threshold: number): SteeringDirection;

  /**
   * Sends a steering command (e.g., "F", "B", "L", "R", "FL", "FR", "BL", "BR", "S")
   * @param pedalPressed - Whether the acceleration pedal is pressed
   * @param driveMode - Current drive mode (forward, reverse, stopped)
   * @param direction - Steering direction ("left", "right", or "center")
   * @param commandMap - Optional map of action keys to command strings
   * @param sendCommand - BLE send function that sends the text command
   */
  sendSteeringCommand(
    pedalPressed: boolean,
    driveMode: DriveMode,
    direction: SteeringDirection,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void>;

  /**
   * Sends an acceleration command (e.g., "+", "F", "FL", "FR")
   * @returns The new speed after acceleration
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
   * Sends reverse acceleration commands (typically gear handled separately)
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
   * Sends deceleration commands (e.g., "-", "S")
   * @returns The new speed and resulting drive mode
   */
  sendDecelerateCommand(
    currentSpeed: number,
    speedStep: number,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<{ newSpeed: number; driveMode: DriveMode }>;

  /**
   * Sends a maintain-speed command to keep the BeetleBot moving
   * at the current constant speed (no acceleration or deceleration).
   *
   * This is typically triggered when the pedal is released but
   * the bot should continue moving forward or backward.
   */
  sendMaintainSpeedCommand(
    currentSpeed: number,
    steeringDirection: SteeringDirection,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<number>;

  /**
   * Sends an immediate stop/brake command ("S")
   */
  sendBrakeCommand(
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void>;

  /**
   * Checks if steering has changed significantly (optional logic)
   */
  hasSteeringChanged(
    currentAngle: number,
    lastAngle: number,
    currentDirection: SteeringDirection,
    lastDirection: SteeringDirection,
    angleThreshold: number
  ): boolean;

  /**
   * Sends a gear change command ("1", "2", or "R")
   * @param gear - The selected gear name
   */
  sendGearChangeCommand(
    gear: string,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void>;

  /**
   * Toggles the claw using plain text ("O" to open, "C" to close)
   */
  toggleClaw(
    open: boolean,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void>;
}
