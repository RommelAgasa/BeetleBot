import { useCallback, useEffect, useRef, useState } from "react";
import { IDrivingService } from "../interface/IDrivingService";
import { DefaultDrivingService } from "../services/DefaultDrivingService";
import { DriveMode } from "../types/DriveMode";
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

  // Refs to keep latest state
  const speedRef = useRef(speed);
  const steeringRef = useRef(steeringDirection);
  const driveModeRef = useRef(driveMode);

  const returnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isBrakingRef = useRef(false);  // Flag to stop deceleration when brake is pressed
  const normalSpeed = 60;  // base cruising speed
  const returnStep = 2;    // how fast it returns to normalSpeed

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { steeringRef.current = steeringDirection; }, [steeringDirection]);
  useEffect(() => { driveModeRef.current = driveMode; }, [driveMode]);

  // 🚀 Accelerate while pedal is pressed (boost effect)
  const handleAccelerate = useCallback(async () => {
    // Stop any "return to normal" interval if running
    if (returnIntervalRef.current) {
      clearInterval(returnIntervalRef.current);
      returnIntervalRef.current = null;
    }
    isBrakingRef.current = false;  // Clear brake flag when accelerating

    const newSpeed = await drivingService.sendAccelerateCommand(
      speedRef.current,
      maxSpeed,
      speedStep,
      steeringRef.current,
      commandMap,
      sendCommand
    );

    console.log("Accelerating → newSpeed:", newSpeed); // <-- log here
    setSpeed(newSpeed);
    setDriveMode("forward");
    driveModeRef.current = "forward";
  }, [maxSpeed, speedStep, drivingService, commandMap, sendCommand]);

  // 🕹️ When pedal released → gradually go back to normal speed
  const handleMaintainSpeed = useCallback(async () => {
    if (speedRef.current <= normalSpeed || isBrakingRef.current) return;

    if (returnIntervalRef.current) {
      clearInterval(returnIntervalRef.current);
    }

    returnIntervalRef.current = setInterval(async () => {
      // If brake was pressed, stop the deceleration immediately
      if (isBrakingRef.current) {
        clearInterval(returnIntervalRef.current!);
        returnIntervalRef.current = null;
        return;
      }

      if (speedRef.current <= normalSpeed) {
        clearInterval(returnIntervalRef.current!);
        returnIntervalRef.current = null;
        setSpeed(normalSpeed);
        return;
      }

      const decelResult = await drivingService.sendDecelerateCommand(
        speedRef.current,
        returnStep,
        commandMap,
        sendCommand
      );

      console.log("Returning → currentSpeed:", decelResult.newSpeed); // <-- log here
      setSpeed(decelResult.newSpeed);
      setDriveMode("forward");
      driveModeRef.current = "forward";
    }, 200);
  }, [drivingService, commandMap, sendCommand]);

  // 🛑 Full stop (manual brake)
  const handleBrake = useCallback(async () => {
    isBrakingRef.current = true;  // Set flag to stop deceleration

    if (returnIntervalRef.current) {
      clearInterval(returnIntervalRef.current);
      returnIntervalRef.current = null;
    }

    await drivingService.sendBrakeCommand(commandMap, sendCommand);
    setDriveMode("stopped");
    setSpeed(0);
    driveModeRef.current = "stopped";
  }, [drivingService, commandMap, sendCommand]);

  const handleGearChange = useCallback(
    async (newGear: string) => {
      setGear(newGear);
      await drivingService.sendGearChangeCommand(newGear, commandMap, sendCommand);
      setDriveMode(newGear === "Reverse" ? "reverse" : "forward");
      driveModeRef.current = newGear === "Reverse" ? "reverse" : "forward";
      
      // Reset speed when shifting gear
      setSpeed(0);
      speedRef.current = 0;
      
      // Stop any deceleration interval
      if (returnIntervalRef.current) {
        clearInterval(returnIntervalRef.current);
        returnIntervalRef.current = null;
      }
    },
    [drivingService, commandMap, sendCommand]
  );

  const handleSteeringChange = useCallback(
    async (angle: number) => {
      let direction: SteeringDirection = "center";
      if (angle < -10) direction = "left";
      else if (angle > 10) direction = "right";
      setSteeringDirection(direction);
      steeringRef.current = direction;

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
    handleMaintainSpeed, // now used to return to normal speed
    handleBrake,
    handleGearChange,
    handleSteeringChange,
    handleClawToggle,
    resetDrivingState,
  };
};
