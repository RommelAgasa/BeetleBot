import { useCallback, useRef, useState } from "react";

export type DriveMode = "forward" | "reverse" | "stopped";
export type SteeringDir = "left" | "right" | "center";

interface UseDrivingControlsParams {
  sendCommand: (c: string) => Promise<void>;
  commandMap: Record<string, string>;
  maxSpeed: number;
  speedStep: number;
}

export interface UseDrivingControlsReturn {
  speed: number;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
  driveMode: DriveMode;
  steeringDirection: SteeringDir;
  handleSteeringChange: (angle: number) => void;
  handleAccelerate: () => void;
  handleReverse: () => void;
  handleDecelerate: () => void;
  handleBrake: () => void;
  handlePedalRelease: () => void;
  resetDrivingState: () => void;
}

export const useDrivingControls = ({
  sendCommand,
  commandMap,
  maxSpeed,
  speedStep,
}: UseDrivingControlsParams): UseDrivingControlsReturn => {
  const [speed, setSpeed] = useState<number>(0);
  const [driveMode, setDriveMode] = useState<DriveMode>("stopped");
  const [steeringDirection, setSteeringDirection] =
    useState<SteeringDir>("center");
  const [pedalPressed, setPedalPressed] = useState(false);

  const lastSteeringDirection = useRef<SteeringDir>("center");
  const lastDriveMode = useRef<DriveMode>("stopped");
  const lastSteeringAngle = useRef<number>(0);

  const STEERING_THRESHOLD = 10;

  const handleSteeringChange = useCallback(
    (angle: number) => {
      let direction: SteeringDir;
      if (angle < -STEERING_THRESHOLD) direction = "left";
      else if (angle > STEERING_THRESHOLD) direction = "right";
      else direction = "center";

      setSteeringDirection(direction);

      // Send commands even for small angle changes for smoother control
      const angleChanged = Math.abs(angle - lastSteeringAngle.current) > 2;
      const directionChanged = lastSteeringDirection.current !== direction;

      if (!angleChanged && !directionChanged) return;

      lastSteeringDirection.current = direction;
      lastSteeringAngle.current = angle;

      if (pedalPressed && driveMode !== "stopped") {
        if (driveMode === "forward") {
          if (direction === "left") sendCommand(commandMap["FL"]);
          else if (direction === "right") sendCommand(commandMap["FR"]);
          else sendCommand(commandMap["F"]);
        } else if (driveMode === "reverse") {
          if (direction === "left") sendCommand(commandMap["BL"]);
          else if (direction === "right") sendCommand(commandMap["BR"]);
          else sendCommand(commandMap["B"]);
        }
      } else if (!pedalPressed) {
        if (direction === "left") sendCommand(commandMap["L"]);
        else if (direction === "right") sendCommand(commandMap["R"]);
        else {
          sendCommand(commandMap["S"]);
          if (driveMode !== "stopped") {
            setDriveMode("stopped");
            lastDriveMode.current = "stopped";
          }
        }
      }
    },
    [STEERING_THRESHOLD, pedalPressed, driveMode, commandMap, sendCommand]
  );

  const handleAccelerate = useCallback(() => {
    setPedalPressed(true);
    setDriveMode((prev) => {
      if (prev !== "forward") {
        sendCommand(commandMap["F"]);
        sendCommand(commandMap["+"]);
      }
      return "forward";
    });
    setSpeed((prev) => {
      if (prev < maxSpeed) {
        if (steeringDirection === "left") sendCommand(commandMap["FL"]);
        else if (steeringDirection === "right") sendCommand(commandMap["FR"]);
        else sendCommand(commandMap["F"]);
        sendCommand(commandMap["+"]);
        return prev + speedStep;
      }
      return prev;
    });
    lastDriveMode.current = "forward";
  }, [commandMap, maxSpeed, speedStep, steeringDirection, sendCommand]);

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
      if (prev < maxSpeed) {
        if (steeringDirection === "left") sendCommand(commandMap["BL"]);
        else if (steeringDirection === "right") sendCommand(commandMap["BR"]);
        else sendCommand(commandMap["B"]);
        sendCommand(commandMap["+"]);
        return prev + speedStep;
      }
      return prev;
    });
    lastDriveMode.current = "reverse";
  }, [commandMap, maxSpeed, speedStep, steeringDirection, sendCommand]);

  const handleDecelerate = useCallback(() => {
    setSpeed((prev) => {
      if (prev > 0) {
        sendCommand(commandMap["-"]);
        const newSpeed = prev - speedStep;
        if (newSpeed <= 0) {
          if (driveMode !== "stopped") {
            sendCommand(commandMap["S"]);
            setDriveMode("stopped");
            lastDriveMode.current = "stopped";
          }
          return 0;
        }
        return newSpeed;
      } else {
        if (lastDriveMode.current !== "stopped") {
          sendCommand(commandMap["S"]);
          setDriveMode("stopped");
          lastDriveMode.current = "stopped";
        }
        return 0;
      }
    });
  }, [commandMap, speedStep, driveMode, sendCommand]);

  const handleBrake = useCallback(() => {
    setDriveMode("stopped");
    lastDriveMode.current = "stopped";
    sendCommand(commandMap["S"]);
  }, [commandMap, sendCommand]);

  const handlePedalRelease = useCallback(() => {
    setPedalPressed(false);
    if (driveMode === "stopped") {
      setDriveMode("stopped");
      lastDriveMode.current = "stopped";
      sendCommand(commandMap["S"]);
    }
  }, [driveMode, commandMap, sendCommand]);

  const resetDrivingState = useCallback(() => {
    setSpeed(0);
    setDriveMode("stopped");
    setSteeringDirection("center");
    setPedalPressed(false);
    lastDriveMode.current = "stopped";
    lastSteeringDirection.current = "center";
    lastSteeringAngle.current = 0;
  }, []);

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
