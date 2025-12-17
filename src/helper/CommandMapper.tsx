import { DriveMode } from "../types/DriveMode";
import { SteeringDirection } from "../types/SteeringDirection";

/**
 * CommandMapper - Responsible for building and mapping command strings based on driving state
 * Single Responsibility: Determine which command to send based on direction and drive mode
 */
export class CommandMapper {
  /**
   * Gets the command string for forward movement with optional steering
   */
  getForwardCommand(direction: SteeringDirection): string {
    if (direction === "left") return "FL";
    else if (direction === "right") return "FR";
    else return "F";
  }

  /**
   * Gets the command string for reverse movement with optional steering
   */
  getReverseCommand(direction: SteeringDirection): string {
    if (direction === "left") return "BL";
    else if (direction === "right") return "BR";
    else return "B";
  }

  /**
   * Gets the command string for steering-only movement (pedal not pressed)
   */
  getSteeringOnlyCommand(direction: SteeringDirection): string {
    if (direction === "left") return "L";
    else if (direction === "right") return "R";
    else return "S";
  }

  /**
   * Gets the appropriate movement command based on drive mode and steering
   */
  getMovementCommand(
    driveMode: DriveMode,
    direction: SteeringDirection
  ): string {
    if (driveMode === "forward") return this.getForwardCommand(direction);
    else if (driveMode === "reverse") return this.getReverseCommand(direction);
    else return this.getSteeringOnlyCommand(direction);
  }
}
