import { DriveMode } from "@/hooks/useDrivingControls";
import { useCallback, useRef, useState } from "react";
import { IDrivingService } from "../interface/IDrivingService";
import { DefaultDrivingService } from "../services/DefaultDrivingService";
import { SteeringDirection } from "../types/SteeringDirection";

interface UseDrivingControlsParams {
  sendCommand: (c: string) => Promise<void>;
  commandMap: Record<string, string>;
  maxSpeed: number;
  speedStep: number;
  drivingService: IDrivingService; // Optional: inject custom service
}

export const SteeringWheelController = ({
  sendCommand,
  commandMap,
  maxSpeed,
  speedStep,
  drivingService = new DefaultDrivingService(), // Use default service if not provided
}: UseDrivingControlsParams) => {
  // State variables
  const [speed, setSpeed] = useState<number>(0);
  const [driveMode, setDriveMode] = useState<DriveMode>("stopped");
  const [steeringDirection, setSteeringDirection] = useState<SteeringDirection>("center");
  const [pedalPressed, setPedalPressed] = useState(false);

  // Ref variables
  const lastSteeringDirection = useRef<SteeringDirection>("center");
  const lastDriveMode = useRef<DriveMode>("stopped");
  const lastSteeringAngle = useRef<number>(0);

  const STEERING_THRESHOLD = 10;
  const ANGLE_CHANGE_THRESHOLD = 2;

  // =========================================================================
  // STEERING HANDLER
  // =========================================================================

  const handleSteeringChange = useCallback(
    (angle: number) => {
      // Use service to determine steering direction
      const direction  = drivingService.getSteeringDirection(angle, STEERING_THRESHOLD);
      setSteeringDirection(direction);

      // Check if steering has meaningfully changed
      if (
        !drivingService.hasSteeringChanged(
          angle,
          lastSteeringAngle.current,
          direction,
          lastSteeringDirection.current,
          ANGLE_CHANGE_THRESHOLD
        )
      ) {
        return;
      }

      lastSteeringDirection.current = direction;
      lastSteeringAngle.current = angle;

      // Use service to send steering command
      drivingService.sendSteeringCommand(
        pedalPressed,
        driveMode,
        direction,
        commandMap,
        sendCommand
      );
    },
    [STEERING_THRESHOLD, ANGLE_CHANGE_THRESHOLD, pedalPressed, driveMode, drivingService, commandMap, sendCommand]
  );

  // =========================================================================
  // ACCELERATION HANDLER
  // =========================================================================

  const handleAccelerate = useCallback(() => {
    setPedalPressed(true);

    setDriveMode((prev) => {
      if (prev !== "forward") {
        // Send mode change commands
        sendCommand(commandMap["F"]);
        sendCommand(commandMap["+"]);
      }
      return "forward";
    });

    setSpeed((prev) => {
      // Use service to send acceleration command
      drivingService.sendAccelerateCommand(
        prev,
        maxSpeed,
        speedStep,
        steeringDirection,
        commandMap,
        sendCommand
      );

      // Return new speed
      return prev < maxSpeed ? prev + speedStep : prev;
    });

    lastDriveMode.current = "forward";
  }, [drivingService, commandMap, maxSpeed, speedStep, steeringDirection, sendCommand]);

  // =========================================================================
  // REVERSE HANDLER
  // =========================================================================

  const handleReverse = useCallback(() => {
    setPedalPressed(true);

    setDriveMode((prev) => {
      if (prev !== "reverse") {
        sendCommand(commandMap["B"]);
        sendCommand(commandMap["+"]);
      }
      return "reverse";
    });

    setSpeed((prev) => {
      // Use service to send reverse command
      drivingService.sendReverseCommand(
        prev,
        maxSpeed,
        speedStep,
        steeringDirection,
        commandMap,
        sendCommand
      );

      return prev < maxSpeed ? prev + speedStep : prev;
    });

    lastDriveMode.current = "reverse";
  }, [drivingService, commandMap, maxSpeed, speedStep, steeringDirection, sendCommand]);

  // =========================================================================
  // DECELERATION HANDLER
  // =========================================================================

  const handleDecelerate = useCallback(() => {
    setSpeed((prev) => {
      drivingService
      .sendDecelerateCommand(prev, speedStep, commandMap, sendCommand)
      .then((result) => {
        if (result.driveMode === "stopped") {
          setDriveMode("stopped");
          lastDriveMode.current = "stopped";
        }
        setSpeed(result.newSpeed);
      });

      return prev > 0 ? prev - speedStep : 0;
    });
  }, [drivingService, commandMap, speedStep, sendCommand]);

  // =========================================================================
  // BRAKE HANDLER
  // =========================================================================

  const handleBrake = useCallback(() => {
    setDriveMode("stopped");
    lastDriveMode.current = "stopped";
    drivingService.sendBrakeCommand(commandMap, sendCommand);
  }, [drivingService, commandMap, sendCommand]);

  // =========================================================================
  // PEDAL RELEASE HANDLER
  // =========================================================================

  const handlePedalRelease = useCallback(() => {
    setPedalPressed(false);

    if (driveMode === "stopped") {
      setDriveMode("stopped");
      lastDriveMode.current = "stopped";
      sendCommand(commandMap["S"]);
    }
  }, [driveMode, commandMap, sendCommand]);

  // =========================================================================
  // RESET HANDLER
  // =========================================================================

  const resetDrivingState = useCallback(() => {
    setSpeed(0);
    setDriveMode("stopped");
    setSteeringDirection("center");
    setPedalPressed(false);
    lastDriveMode.current = "stopped";
    lastSteeringDirection.current = "center";
    lastSteeringAngle.current = 0;
  }, []);

  // =========================================================================
  // RETURN HOOK API
  // =========================================================================

  return {
    speed,
    setSpeed,
    driveMode,
    steeringDirection,
    handleSteeringChange,
    handleAccelerate,
    handleReverse,
    handleDecelerate,
    handleBrake,
    handlePedalRelease,
    resetDrivingState,
  };
};