import { useCallback, useRef, useState } from "react";

// DriveMode – Represents the car’s driving state: moving forward, moving reverse, or stopped.
export type DriveMode = "forward" | "reverse" | "stopped";
// SteeringDir – Represents the steering wheel’s direction: left, right, or center.
export type SteeringDir = "left" | "right" | "center";

// Parameters passed to the hook:
interface UseDrivingControlsParams {
  sendCommand: (c: string) => Promise<void>;
  commandMap: Record<string, string>;
  maxSpeed: number;
  speedStep: number;
}

// This describes everything the hook returns, i.e., the current speed, 
// drive/steering state, and all control functions. Essentially, 
// it defines your API for the component that uses the hook.
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

  const decelInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const accelInterval = useRef<ReturnType<typeof setInterval> | null>(null);


  // Steering Handling
  const STEERING_THRESHOLD = 10;

  const handleSteeringChange = useCallback(
    (angle: number) => {

      /**
       * Converts a numeric angle into a steering direction.
       */
      let direction: SteeringDir;
      // -10 → left, +10 → right, otherwise center.
      if (angle < -STEERING_THRESHOLD) direction = "left";
      else if (angle > STEERING_THRESHOLD) direction = "right";
      else direction = "center";

      // Updates steeringDirection state.
      setSteeringDirection(direction); 

      // Send commands even for small angle changes for smoother control
      const angleChanged = Math.abs(angle - lastSteeringAngle.current) > 2;
      const directionChanged = lastSteeringDirection.current !== direction;

      if (!angleChanged && !directionChanged) return;

      lastSteeringDirection.current = direction;
      lastSteeringAngle.current = angle;

      /**
       * Logic for sending commands:
        If pedal is pressed and car is moving:
          Forward → F, FL, FR
          Reverse → B, BL, BR
        If pedal is not pressed, send turning-only commands: L, R, or stop (S).
       */
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

  // Accelerator / Reverse / Deceleration
  const handleAccelerate = useCallback(() => {
    setPedalPressed(true);

    // Stop deceleration if currently decelerating
    if (decelInterval.current) {
      clearInterval(decelInterval.current);
      decelInterval.current = null;
    }

    // Prevent multiple acceleration loops
    if (accelInterval.current) return;

    accelInterval.current = setInterval(() => {
      setSpeed((prev) => {
        if (prev >= maxSpeed) {
          clearInterval(accelInterval.current!);
          accelInterval.current = null;
          return prev;
        }

        const newSpeed = Math.min(prev + speedStep, maxSpeed);

        // Choose direction commands
        if (steeringDirection === "left") sendCommand(commandMap["FL"]);
        else if (steeringDirection === "right") sendCommand(commandMap["FR"]);
        else sendCommand(commandMap["F"]);

        sendCommand(commandMap["+"]);

        // Update drive mode
        if (driveMode !== "forward") {
          setDriveMode("forward");
          lastDriveMode.current = "forward";
        }

        return newSpeed;
      });
    }, 150); // accelerate smoothly every 150ms
  }, [commandMap, driveMode, maxSpeed, speedStep, steeringDirection, sendCommand]);


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
    // Stop acceleration if decelerating
    if (accelInterval.current) {
      clearInterval(accelInterval.current);
      accelInterval.current = null;
    }

    // Prevent multiple decel loops
    if (decelInterval.current) return;

    console.log("Decelerating smoothly...");

    decelInterval.current = setInterval(() => {
      setSpeed((prev) => {
        if (prev <= 0) {
          clearInterval(decelInterval.current!);
          decelInterval.current = null;

          if (driveMode !== "stopped") {
            sendCommand(commandMap["S"]);
            setDriveMode("stopped");
            lastDriveMode.current = "stopped";
          }
          return 0;
        }

        // Smooth proportional deceleration
        const decelFactor = Math.max(0.05, prev / maxSpeed); // between 0.05–1
        const variableStep = Math.max(speedStep * decelFactor * 1.5, 0.5);

        const newSpeed = Math.max(prev - variableStep, 0);
        sendCommand(commandMap["-"]);

        return newSpeed;
      });
    }, 200); // update every 200ms for smoother transition
  }, [commandMap, speedStep, driveMode, maxSpeed, sendCommand]);



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
