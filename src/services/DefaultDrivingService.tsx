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
        return "R";
      default:
        return "1";
    }
  }

  /** Sends a plain text command to Arduino */
  private async sendText(sendCommand: (c: string) => Promise<void>, cmd: string) {
    console.log("Sending command:", cmd);
    await sendCommand(cmd);
  }

  /** Gear switching: sends 1, 2, or R */
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

    /** Steering: sends F, B, L, R, FL, FR, BL, BR, or S */
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

    // Otherwise, send directional driving command (while moving)
    let cmd = driveMode === "reverse" || this.currentGear === "Reverse" ? "B" : "F";

    if (direction === "left") cmd = driveMode === "reverse" ? "BL" : "FL";
    else if (direction === "right") cmd = driveMode === "reverse" ? "BR" : "FR";

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

    let cmd = "F";
    if (this.currentGear === "Reverse") cmd = "B";

    if (steeringDirection === "left") cmd = this.currentGear === "Reverse" ? "BL" : "FL";
    else if (steeringDirection === "right") cmd = this.currentGear === "Reverse" ? "BR" : "FR";

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
    this.lastDriveMode = "reverse";

    await this.sendText(sendCommand, "+");

    let cmd = "B"; // default reverse
    if (steeringDirection === "left") cmd = "BL";
    else if (steeringDirection === "right") cmd = "BR";

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

    // Also send direction command to keep firmware aware of direction during deceleration
    let cmd = this.lastDriveMode === "reverse" || this.currentGear === "Reverse" ? "B" : "F";

    if (this.lastSteeringDirection === "left") {
      cmd = this.lastDriveMode === "reverse" || this.currentGear === "Reverse" ? "L" : "L";
    } else if (this.lastSteeringDirection === "right") {
      cmd = this.lastDriveMode === "reverse" || this.currentGear === "Reverse" ? "R" : "R";
    }

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
