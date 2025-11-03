import { CommandExecutor } from "../helper/CommandExecutor";
import { CommandMapper } from "../helper/CommandMapper";
import { SpeedCalculator } from "../helper/SpeedCalculator";
import { SteeringDirectionCalculator } from "../helper/SteeringDirectionCalculator";
import { SteeringValidator } from "../helper/SteeringWheelValidator";
import { IDrivingService } from "../interface/IDrivingService";
import { DriveMode } from "../types/DriveMode";
import { SteeringDirection } from "../types/SteeringDirection";

/**
 * DefaultDrivingService implements IDrivingService with standard car control logic.
 * This is the concrete implementation that handles all driving-related operations.
 * 
 */
export class DefaultDrivingService implements IDrivingService {
  // Inject dependencies for specialized responsibilities
  private commandMapper: CommandMapper;
  private steeringValidator: SteeringValidator;
  private steeringDirectionCalculator: SteeringDirectionCalculator;
  private speedCalculator: SpeedCalculator;
  private commandExecutor: CommandExecutor;

  constructor() {
    this.commandMapper = new CommandMapper();
    this.steeringValidator = new SteeringValidator();
    this.steeringDirectionCalculator = new SteeringDirectionCalculator();
    this.speedCalculator = new SpeedCalculator();
    this.commandExecutor = new CommandExecutor();
  }

  /**
   * Converts a numeric angle to a categorical steering direction
   */
  getSteeringDirection(angle: number, threshold: number): SteeringDirection {
    return this.steeringDirectionCalculator.calculate(angle, threshold);
  }

  /**
   * Sends the appropriate steering command based on the current driving state
   * 
   * Logic:
   * - If pedal is pressed and moving: combine direction with drive mode (e.g., FL, FR, BL, BR)
   * - If pedal not pressed: send pure steering commands or stop
   */
  async sendSteeringCommand(
    pedalPressed: boolean,
    driveMode: DriveMode,
    direction: SteeringDirection,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void> {
    if (pedalPressed && driveMode !== "stopped") {
      // Pedal pressed: combine steering with movement
      const command = this.commandMapper.getMovementCommand(driveMode, direction);
      await this.commandExecutor.sendCommand(command, commandMap, sendCommand);
    } else {
      // Pedal not pressed: steering only
      const command = this.commandMapper.getSteeringOnlyCommand(direction);
      await this.commandExecutor.sendCommand(command, commandMap, sendCommand);
    }
  }

  /**
   * Handles forward acceleration with steering consideration
   */
  async sendAccelerateCommand(
    currentSpeed: number,
    maxSpeed: number,
    speedStep: number,
    steeringDirection: SteeringDirection,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<number> {
    // Send directional command based on steering
    const command = this.commandMapper.getForwardCommand(steeringDirection);
    await this.commandExecutor.sendCommand(command, commandMap, sendCommand);

    // Send speed increase command
    await this.commandExecutor.sendCommand("+", commandMap, sendCommand);

    // Calculate and return new speed
    return this.speedCalculator.calculateAcceleratedSpeed(
      currentSpeed,
      maxSpeed,
      speedStep
    );
  }

  /**
   * Handles reverse acceleration with steering consideration
   */
  async sendReverseCommand(
    currentSpeed: number,
    maxSpeed: number,
    speedStep: number,
    steeringDirection: SteeringDirection,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<number> {
    // Send directional command based on steering
    const command = this.commandMapper.getReverseCommand(steeringDirection);
    await this.commandExecutor.sendCommand(command, commandMap, sendCommand);

    // Send speed increase command
    await this.commandExecutor.sendCommand("+", commandMap, sendCommand);

    // Calculate and return new speed
    return this.speedCalculator.calculateAcceleratedSpeed(
      currentSpeed,
      maxSpeed,
      speedStep
    );
  }

  /**
   * Handles deceleration and returns new speed and drive mode
   */
  async sendDecelerateCommand(
    currentSpeed: number,
    speedStep: number,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<{ newSpeed: number; driveMode: DriveMode }> {
    if (currentSpeed > 0) {
      // Send decelerate command
      await this.commandExecutor.sendCommand("-", commandMap, sendCommand);

      // Calculate new speed
      const newSpeed = this.speedCalculator.calculateDeceleratedSpeed(
        currentSpeed,
        speedStep
      );

      // Check if we should stop
      if (this.speedCalculator.shouldStop(newSpeed)) {
        await this.commandExecutor.sendCommand("S", commandMap, sendCommand);
        return { newSpeed: 0, driveMode: "stopped" };
      }

      return { newSpeed, driveMode: "forward" };
    }

    // Already stopped
    await this.commandExecutor.sendCommand("S", commandMap, sendCommand);
    return { newSpeed: 0, driveMode: "stopped" };
  }

  /**
   * Sends an immediate stop command
   */
  async sendBrakeCommand(
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void> {
    await this.commandExecutor.sendCommand("S", commandMap, sendCommand);
  }

  /**
   * Determines if steering has meaningfully changed to avoid redundant commands
   */
  hasSteeringChanged(
    currentAngle: number,
    lastAngle: number,
    currentDirection: SteeringDirection,
    lastDirection: SteeringDirection,
    angleThreshold: number
  ): boolean {
    return this.steeringValidator.hasSteeringChanged(
      currentAngle,
      lastAngle,
      currentDirection,
      lastDirection,
      angleThreshold
    );
  }
}
