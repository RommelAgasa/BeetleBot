import { DriveMode } from "@/hooks/useDrivingControls";
import { useCallback, useEffect, useRef, useState } from "react";
import { IDrivingService } from "../interface/IDrivingService";
import { DefaultDrivingService } from "../services/DefaultDrivingService";
import { SteeringDirection } from "../types/SteeringDirection";

interface UseDrivingControlsParams {
  sendCommand: (c: string) => Promise<void>;
  commandMap: Record<string, string>;
  maxSpeed: number;
  speedStep: number;
  drivingService?: IDrivingService;
}

export const SteeringWheelController = ({
  sendCommand,
  commandMap,
  maxSpeed,
  speedStep,
  drivingService = new DefaultDrivingService(),
}: UseDrivingControlsParams) => {
  const [speed, setSpeed] = useState(0);
  const [driveMode, setDriveMode] = useState<DriveMode>("stopped");
  const [steeringDirection, setSteeringDirection] = useState<SteeringDirection>("center");
  const [gear, setGear] = useState("Gear 1");
  const [clawOpen, setClawOpen] = useState(false);

  // Refs to keep latest state for intervals
  const speedRef = useRef(speed);
  const steeringRef = useRef(steeringDirection);
  const driveModeRef = useRef(driveMode);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { steeringRef.current = steeringDirection; }, [steeringDirection]);
  useEffect(() => { driveModeRef.current = driveMode; }, [driveMode]);

  const handleAccelerate = useCallback(async () => {
    console.log("Accelerate called");
    const newSpeed = await drivingService.sendAccelerateCommand(
      speedRef.current,
      maxSpeed,
      speedStep,
      steeringRef.current,
      commandMap,
      sendCommand
    );
    setSpeed(newSpeed);
    setDriveMode("forward");
  }, [maxSpeed, speedStep, drivingService, commandMap, sendCommand]);

  const handleDecelerate = useCallback(async () => {
    console.log("Decelerate called");
    const result = await drivingService.sendDecelerateCommand(
      speedRef.current,
      speedStep,
      commandMap,
      sendCommand
    );
    setSpeed(result.newSpeed);
    setDriveMode(result.driveMode);
  }, [speedStep, drivingService, commandMap, sendCommand]);

  const handlePedalRelease = useCallback(async () => {
    console.log("Pedal released, sending stop");
    await sendCommand(JSON.stringify({ type: "stop" }));
    setDriveMode("stopped");
    setSpeed(0);
  }, [sendCommand]);

  const handleBrake = useCallback(async () => {
    await drivingService.sendBrakeCommand(commandMap, sendCommand);
    setDriveMode("stopped");
    setSpeed(0);
  }, [drivingService, commandMap, sendCommand]);

  const handleGearChange = useCallback(
    async (newGear: string) => {
      setGear(newGear);
      await drivingService.sendGearChangeCommand(newGear, commandMap, sendCommand);
      setDriveMode(newGear === "Reverse" ? "reverse" : "forward");
    },
    [drivingService, commandMap, sendCommand]
  );

  const handleSteeringChange = useCallback(
    async (angle: number) => {
      let direction: SteeringDirection = "center";
      if (angle < -10) direction = "left";
      else if (angle > 10) direction = "right";
      setSteeringDirection(direction);

      await drivingService.sendSteeringCommand(
        true,
        driveModeRef.current,
        direction,
        commandMap,
        sendCommand
      );
    },
    [commandMap, sendCommand, drivingService]
  );

  const handleClawToggle = useCallback(async () => {
    const newState = !clawOpen;
    setClawOpen(newState);
    await drivingService.toggleClaw(newState, sendCommand);
  }, [clawOpen, drivingService, sendCommand]);

  const resetDrivingState = useCallback(() => {
    setSpeed(0);
    setDriveMode("stopped");
    setSteeringDirection("center");
  }, []);

  return {
    speed,
    driveMode,
    steeringDirection,
    gear,
    clawOpen,
    handleAccelerate,
    handleDecelerate,
    handlePedalRelease,
    handleBrake,
    handleGearChange,
    handleSteeringChange,
    handleClawToggle,
    resetDrivingState,
  };
};
