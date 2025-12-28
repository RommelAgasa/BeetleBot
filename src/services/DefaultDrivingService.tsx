import { IDrivingService } from "../interface/IDrivingService";
import { DriveMode } from "../types/DriveMode";
import { SteeringDirection } from "../types/SteeringDirection";

/**
 * DefaultDrivingService - Updated to send plain text commands compatible with BeetleBot firmware
 */
export class DefaultDrivingService implements IDrivingService {
  getSteeringDirection(angle: number, threshold: number): SteeringDirection {
    throw new Error("Method not implemented.");
  }

  private currentGear: string = "Gear 1"; // "Gear 1" | "Gear 2" | "Reverse"
  private clawOpen = false;
  private lastDriveMode: DriveMode = "stopped";
  private lastSteeringDirection: SteeringDirection = "center";

  /** Converts gear label to Arduino command */
  private getGearCommand(): string {
    switch (this.currentGear) {
      case "Gear 1":
        return "1";
      case "Gear 2":
        return "2";
      case "Reverse":
        // IMPORTANT: Do NOT use "R" here because the firmware also uses "R" as
        // the steering-right movement command.
        // The Arduino sketch should treat this as "Reverse gear".
        return "V";
      default:
        return "1";
    }
  }

  /** Sends a plain text command to Arduino */
  private async sendText(sendCommand: (c: string) => Promise<void>, cmd: string) {
    console.log("Sending command:", cmd);
    await sendCommand(cmd);
  }

  /** Gear switching: sends 1, 2, or V (Reverse gear) */
    async sendGearChangeCommand(
      gear: string,
      _commandMap: Record<string, string>,
      sendCommand: (c: string) => Promise<void>
    ): Promise<void> {
      // Stop motors before gear change to prevent unwanted movement
      //await this.sendText(sendCommand, "S");
      this.currentGear = gear;
      const cmd = this.getGearCommand();
      await this.sendText(sendCommand, cmd);
    }

  /** Steering: sends F, B, L, R or S */
  async sendSteeringCommand(
      pedalPressed: boolean,
      driveMode: DriveMode,
      direction: SteeringDirection,
      _commandMap: Record<string, string>,
      sendCommand: (c: string) => Promise<void>
    ): Promise<void> {
    // When the pedal is not pressed, only steer without movement
    if (!pedalPressed || driveMode === "stopped") {
      let cmd = "S";
      if (direction === "left") cmd = "L";
      else if (direction === "right") cmd = "R";
      await this.sendText(sendCommand, cmd);
      return;
    }

    // While moving: ALWAYS send forward-style commands.
    // The Arduino firmware swaps F<->B (and diagonals) when gear is Reverse.
    // If we send B/BL/BR from the app while gear is Reverse, the firmware swaps
    // them again and the robot drives forward.
    let cmd = "F";
    if (direction === "left") cmd = "FL";
    else if (direction === "right") cmd = "FR";

    this.lastSteeringDirection = direction;
    this.lastDriveMode = "forward";

    await this.sendText(sendCommand, cmd);
  }


  /** Accelerate: sends + then a movement command */
  async sendAccelerateCommand(
    currentSpeed: number,
    maxSpeed: number,
    speedStep: number,
    steeringDirection: SteeringDirection,
    _commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<number> {
    // Track steering direction for use in deceleration
    this.lastSteeringDirection = steeringDirection;
    this.lastDriveMode = "forward";

    await this.sendText(sendCommand, "+");

    // Always send forward commands - Arduino handles gear reversal
    let cmd = "F";
    if (steeringDirection === "left") cmd = "FL";
    else if (steeringDirection === "right") cmd = "FR";

    await this.sendText(sendCommand, cmd);

    const newSpeed = Math.min(currentSpeed + speedStep, maxSpeed);
    return newSpeed;
  }

  /** Reverse acceleration: sends + then a reverse movement command */
  async sendReverseCommand(
    currentSpeed: number,
    maxSpeed: number,
    speedStep: number,
    steeringDirection: SteeringDirection,
    _commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<number> {
    // Track steering direction for use in deceleration
    this.lastSteeringDirection = steeringDirection;
    this.lastDriveMode = "forward";

    await this.sendText(sendCommand, "+");

    // Same reasoning as sendSteeringCommand(): keep sending forward-style
    // commands and let the firmware swap direction when reverse gear is active.
    let cmd = "F";
    if (steeringDirection === "left") cmd = "FL";
    else if (steeringDirection === "right") cmd = "FR";

    await this.sendText(sendCommand, cmd);

    const newSpeed = Math.min(currentSpeed + speedStep, maxSpeed);
    return newSpeed;
  }

  /** Decelerate: sends - and direction command to keep firmware aware */
  async sendDecelerateCommand(
    currentSpeed: number,
    speedStep: number,
    _commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<{ newSpeed: number; driveMode: DriveMode }> {
    if (currentSpeed <= 0) {
      await this.sendText(sendCommand, "S");
      this.lastDriveMode = "stopped";
      return { newSpeed: 0, driveMode: "stopped" };
    }

    // Send speed decrease command
    await this.sendText(sendCommand, "-");

    // Send + to keep wheels running
    await this.sendText(sendCommand, "+");

    // Always send forward commands - Arduino handles gear reversal
    let cmd = "F";
    if (this.lastSteeringDirection === "left") cmd = "FL";
    else if (this.lastSteeringDirection === "right") cmd = "FR";

    await this.sendText(sendCommand, cmd);

    const newSpeed = Math.max(currentSpeed - speedStep, 0);

    let driveMode: DriveMode = "forward";
    if (newSpeed === 0) driveMode = "stopped";
    this.lastDriveMode = driveMode;

    return { newSpeed, driveMode };
  }

  // Inside DefaultDrivingService.ts
  async sendMaintainSpeedCommand(
    currentSpeed: number,
    steering: SteeringDirection,
    commandMap: Record<string, string>,
    sendCommand: (cmd: string) => Promise<void>
  ) {
    // Simply keep sending forward command or steering adjustment
    const command = commandMap["forward"] || "F";
    await sendCommand(command);
    return currentSpeed;
  }



  /** Brake: sends S to stop motors */
  async sendBrakeCommand(
    _commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void> {
    await this.sendText(sendCommand, "S");
  }

  /** Toggle claw: sends O (open) or C (close) */
  async toggleClaw(
    open: boolean,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void> {
    this.clawOpen = open;
    const cmd = open ? "O" : "C";
    await this.sendText(sendCommand, cmd);
  }

  hasSteeringChanged(): boolean {
    return true;
  }
}
