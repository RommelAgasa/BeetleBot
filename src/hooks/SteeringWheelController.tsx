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


  // Ref to store deceleration interval
  const decelerationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const decelerationStep = 1.5; // smaller value = smoother, slower deceleration
  const decelerationIntervalMs = 250; // interval between steps, adjust for smoothness

  const handleDecelerate = useCallback((): Promise<{ newSpeed: number; driveMode: DriveMode }> => {
    return new Promise((resolve) => {
      // If there's already a deceleration interval, just return
      if (decelerationIntervalRef.current) return;

      decelerationIntervalRef.current = setInterval(async () => {
        if (speedRef.current <= 0) {
          clearInterval(decelerationIntervalRef.current!);
          decelerationIntervalRef.current = null;
          setSpeed(0);
          setDriveMode("stopped");
          await drivingService.sendBrakeCommand(commandMap, sendCommand); // ensure stopped
          resolve({ newSpeed: 0, driveMode: "stopped" });
          return;
        }

        // Decelerate by a small step
        const result = await drivingService.sendDecelerateCommand(
          speedRef.current,
          decelerationStep,
          commandMap,
          sendCommand
        );

        setSpeed(result.newSpeed);
        setDriveMode(result.driveMode);

        // Resolve if fully stopped
        if (result.newSpeed <= 0) {
          clearInterval(decelerationIntervalRef.current!);
          decelerationIntervalRef.current = null;
          resolve(result);
        }
      }, decelerationIntervalMs);
    });
  }, [drivingService, commandMap, sendCommand]);


  const handleAccelerate = useCallback(async () => {
    if (decelerationIntervalRef.current) {
      clearInterval(decelerationIntervalRef.current);
      decelerationIntervalRef.current = null;
    }

    const newSpeed = await drivingService.sendAccelerateCommand(
      speedRef.current,
      maxSpeed,
      speedStep, // keep normal step for acceleration
      steeringRef.current,
      commandMap,
      sendCommand
    );

    setSpeed(newSpeed);
    setDriveMode("forward");
  }, [maxSpeed, speedStep, drivingService, commandMap, sendCommand]);


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
