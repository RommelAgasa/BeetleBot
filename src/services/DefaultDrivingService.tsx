import { IDrivingService } from "../interface/IDrivingService";
import { DriveMode } from "../types/DriveMode";
import { SteeringDirection } from "../types/SteeringDirection";

/**
 * DefaultDrivingService - Updated to communicate with BeetleBot JSON protocol
 */
export class DefaultDrivingService implements IDrivingService {
  getSteeringDirection(angle: number, threshold: number): SteeringDirection {
    throw new Error("Method not implemented.");
  }
  private currentGear: string = "Gear 1"; // "Gear 1" | "Gear 2" | "Reverse"
  private clawOpen = false;

  private getGearValue(): string {
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

  private async sendJson(sendCommand: (c: string) => Promise<void>, json: any) {
    const jsonString = JSON.stringify(json);
    await sendCommand(jsonString);
  }

  async sendGearChangeCommand(
    gear: string,
    _commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void> {
    this.currentGear = gear;
    const json = {
      type: "gear",
      gear: this.getGearValue(),
    };
    await this.sendJson(sendCommand, json);
  }

  async sendSteeringCommand(
    pedalPressed: boolean,
    driveMode: DriveMode,
    direction: SteeringDirection,
    _commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void> {
    const baseSpeed = pedalPressed ? 60 : 0; // default joystick strength
    const gear = this.getGearValue();

    let leftSpeed = 0;
    let rightSpeed = 0;

    // Direction logic
    if (direction === "left") {
      leftSpeed = baseSpeed * 0.5;
      rightSpeed = baseSpeed;
    } else if (direction === "right") {
      leftSpeed = baseSpeed;
      rightSpeed = baseSpeed * 0.5;
    } else {
      leftSpeed = rightSpeed = baseSpeed;
    }

    // Reverse direction
    if (driveMode === "reverse" || gear === "R") {
      leftSpeed *= -1;
      rightSpeed *= -1;
    }

    const json = {
      type: "joystick",
      leftSpeed,
      rightSpeed,
      gear,
      clawOpen: this.clawOpen,
    };

    await this.sendJson(sendCommand, json);
  }

  async sendAccelerateCommand(
    currentSpeed: number,
    maxSpeed: number,
    speedStep: number,
    steeringDirection: SteeringDirection,
    _commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<number> {
    const newSpeed = Math.min(currentSpeed + speedStep, maxSpeed);
    const gear = this.getGearValue();

    // Determine left/right speeds based on steering
    let leftSpeed = newSpeed;
    let rightSpeed = newSpeed;
    if (steeringDirection === "left") leftSpeed *= 0.5;
    if (steeringDirection === "right") rightSpeed *= 0.5;

    // Reverse gear handling
    if (gear === "R") {
      leftSpeed *= -1;
      rightSpeed *= -1;
    }

    const json = {
      type: "joystick",
      leftSpeed,
      rightSpeed,
      gear,
      clawOpen: this.clawOpen,
    };

    await this.sendJson(sendCommand, json);
    return newSpeed;
  }

  async sendReverseCommand(
    currentSpeed: number,
    maxSpeed: number,
    speedStep: number,
    steeringDirection: SteeringDirection,
    _commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<number> {
    const newSpeed = Math.min(currentSpeed + speedStep, maxSpeed);
    const gear = "R";

    let leftSpeed = -newSpeed;
    let rightSpeed = -newSpeed;
    if (steeringDirection === "left") leftSpeed *= 0.5;
    if (steeringDirection === "right") rightSpeed *= 0.5;

    const json = {
      type: "joystick",
      leftSpeed,
      rightSpeed,
      gear,
      clawOpen: this.clawOpen,
    };

    await this.sendJson(sendCommand, json);
    return newSpeed;
  }

  async sendDecelerateCommand(
    currentSpeed: number,
    speedStep: number,
    _commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<{ newSpeed: number; driveMode: DriveMode }> {
    const newSpeed = Math.max(currentSpeed - speedStep, 0);

    if (newSpeed <= 0) {
      const json = { type: "stop" };
      await this.sendJson(sendCommand, json);
      return { newSpeed: 0, driveMode: "stopped" };
    }

    const gear = this.getGearValue();
    const json = {
      type: "joystick",
      leftSpeed: newSpeed,
      rightSpeed: newSpeed,
      gear,
      clawOpen: this.clawOpen,
    };
    await this.sendJson(sendCommand, json);

    return { newSpeed, driveMode: "forward" };
  }

  async sendBrakeCommand(
    _commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void> {
    const json = { type: "brake" };
    await this.sendJson(sendCommand, json);
  }

  async toggleClaw(
    open: boolean,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void> {
    this.clawOpen = open;
    const json = { type: "claw", clawOpen: this.clawOpen };
    await this.sendJson(sendCommand, json);
  }

  hasSteeringChanged(): boolean {
    return true; // simplified for now
  }
}
