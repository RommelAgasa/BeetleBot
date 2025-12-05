import React, { useImperativeHandle } from "react";
import { Image, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import styles from "../styles";

const SteeringWheel = React.forwardRef((
  {
    device,
    commandMap,
    sendCommand,
    simultaneousHandlers,
    driveMode,
    onSteeringChange,
  }: {
    device: any;
    commandMap: any;
    sendCommand: (cmd: string) => void;
    simultaneousHandlers?: any;
    driveMode: "forward" | "reverse" | "stopped";
    onSteeringChange: (angle: number) => void;
  },
  ref
) => {
  const steeringAngle = useSharedValue(0);
  const lastSentAngle = useSharedValue(0);
  const WHEEL_SIZE = 180; // px
  const HALF = WHEEL_SIZE / 2;
  const MAX_ANGLE = 80;
  const ROTATION_GAIN = 1; // multiply raw rotation delta (deg). >1 = more sensitive.
  const PAN_GAIN = 0.8; // multiply pan-derived angle. >1 to make center more lively.
  const CENTER_DIRECT_THRESHOLD = 12; // degrees: below this we apply almost direct movement
  const INTERP_SMOOTHING = 0.55; // interpolation factor (0..1) when outside center zone; smaller => snappier
  const SEND_THRESHOLD_DEG = 0.5; // only propagate to JS when angle changes this much

  const cumulativeAngle = useSharedValue(0); // total accumulated angle before clamping
  let lastRotation = 0;

  const rotationGesture = Gesture.Rotation()
    .onBegin(() => {
      lastRotation = 0;
    })
    .onUpdate((event) => {
      if (!device) return;
      const deltaRad = event.rotation - lastRotation;
      lastRotation = event.rotation;
      const deltaDeg = (deltaRad * 180) / Math.PI;

      const currentAngleAbs = Math.abs(cumulativeAngle.value);

      const scaledDeltaDeg = deltaDeg * ROTATION_GAIN;

      const proposed = cumulativeAngle.value + scaledDeltaDeg;
      if (proposed > MAX_ANGLE) cumulativeAngle.value = MAX_ANGLE;
      else if (proposed < -MAX_ANGLE) cumulativeAngle.value = -MAX_ANGLE;
      else cumulativeAngle.value = proposed;

      const target = cumulativeAngle.value;
      const current = steeringAngle.value;
      let newAngle: number;
      if (Math.abs(target) < CENTER_DIRECT_THRESHOLD) {
        newAngle = target;
      } else {
        newAngle = current + (target - current) * INTERP_SMOOTHING;
      }
      steeringAngle.value = newAngle;

      if (Math.abs(newAngle - lastSentAngle.value) >= SEND_THRESHOLD_DEG) {
        lastSentAngle.value = newAngle;
        runOnJS(onSteeringChange)(newAngle);
      }
    })
    .onEnd(() => {
      if (!device) return;
      steeringAngle.value = withSpring(0, {
        damping: 14,
        stiffness: 100,
        mass: 1,
      });
      cumulativeAngle.value = 0;
      lastSentAngle.value = 0;
      runOnJS(onSteeringChange)(0);
    })
    .enabled(!!device);

  const panGesture = Gesture.Pan()
    .onBegin(() => {})
    .onUpdate((event) => {
      if (!device) return;

      const rawDeltaX = event.translationX;
      const currentAngleAbs = Math.abs(steeringAngle.value);

      const baseTargetAngle = rawDeltaX * PAN_GAIN;
      const targetAngle = Math.max(
        -MAX_ANGLE,
        Math.min(MAX_ANGLE, baseTargetAngle)
      );

      const current = steeringAngle.value;

      let newAngle;
      if (Math.abs(targetAngle) < CENTER_DIRECT_THRESHOLD) {
        newAngle = targetAngle;
      } else {
        newAngle = current + (targetAngle - current) * INTERP_SMOOTHING;
      }

      steeringAngle.value = newAngle;
      cumulativeAngle.value = newAngle;

      if (Math.abs(newAngle - lastSentAngle.value) >= SEND_THRESHOLD_DEG) {
        lastSentAngle.value = newAngle;
        runOnJS(onSteeringChange)(newAngle);
      }
    })
    .onEnd(() => {
      if (!device) return;
      steeringAngle.value = withSpring(0, {
        damping: 15,
        stiffness: 120,
        mass: 1,
      });
      cumulativeAngle.value = 0;
      lastSentAngle.value = 0;
      runOnJS(onSteeringChange)(0);
    })
    .enabled(!!device);

  const combinedGesture = Gesture.Simultaneous(
    rotationGesture.simultaneousWithExternalGesture(simultaneousHandlers),
    panGesture.simultaneousWithExternalGesture(simultaneousHandlers)
  );

  useImperativeHandle(ref, () => ({
    gesture: combinedGesture,
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${steeringAngle.value}deg` }],
  }));

  return (
    <View style={[styles.leftPanel, { justifyContent: "center" }]}>
      <View
        style={[
          styles.steeringWheelContainer,
          { marginRight: 40, marginTop: 50 },
        ]}
      >
        <GestureDetector gesture={combinedGesture}>
          <Animated.View style={[styles.steeringWheel, animatedStyle]}>
            <Image
              source={require("../../assets/images/steering-wheel.png")}
              style={{
                width: WHEEL_SIZE,
                height: WHEEL_SIZE,
                borderRadius: HALF,
                borderWidth: 12,
                borderColor: "transparent",
                backgroundColor: "transparent",
                alignItems: "center",
                justifyContent: "center",
                opacity: device ? 1 : 0.5,
                resizeMode: "contain",
              }}
            />
            <View
              style={{
                position: "absolute",
                top: 65,
                left: 0,
                right: 0,
                alignItems: "center",
              }}
            ></View>
          </Animated.View>
        </GestureDetector>
        {/* Box covering the bottom part of the wheel to prevent interaction */}
        <View
          style={{
            position: "absolute",
            top: 85,
            bottom: 0,
            left: 0,
            right: 0,
            height: 70,
            backgroundColor: "transparent", // Light gray background
            zIndex: 10, // Make sure it sits above the wheel
            pointerEvents: "auto", // This blocks touch events
          }}
        />
      </View>
    </View>
  );
});

SteeringWheel.displayName = 'SteeringWheel';

export default SteeringWheel;
