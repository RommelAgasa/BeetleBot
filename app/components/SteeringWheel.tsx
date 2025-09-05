import React from "react";
import { Image, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import styles from "../styles";

export default function SteeringWheel({
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
}) {
  // Current animated steering angle (deg)
  const steeringAngle = useSharedValue(0);
  // Track last angle we forwarded to JS to avoid excessive bridge traffic
  const lastSentAngle = useSharedValue(0);
  const WHEEL_SIZE = 180; // px (matches image size)
  const HALF = WHEEL_SIZE / 2;
  const MAX_ANGLE = 80; // clamp range
  const BASE_SMOOTHING = 0.85; // Base smoothing factor when centered
  const MIN_SMOOTHING = 0.5; // Minimum smoothing (maximum stickiness) at max angle
  const SEND_THRESHOLD_DEG = 0.5; // only propagate to JS when angle changes this much

  // Use rotation gesture for natural wheel behavior while finger stays down.
  const cumulativeAngle = useSharedValue(0); // total accumulated angle before clamping
  let lastRotation = 0; // JS shadow for wrap handling

  const rotationGesture = Gesture.Rotation()
    .onBegin(() => {
      lastRotation = 0;
    })
    .onUpdate((event) => {
      if (!device) return;
      // event.rotation is radians relative to gesture start. We accumulate deltas each frame.
      const deltaRad = event.rotation - lastRotation;
      lastRotation = event.rotation;
      const deltaDeg = (deltaRad * 180) / Math.PI;

      // Apply progressive resistance to delta based on current angle
      const currentAngleAbs = Math.abs(cumulativeAngle.value);
      const resistanceFactor = 1 - (currentAngleAbs / MAX_ANGLE) * 0.7; // Reduce delta by up to 70% at max angle
      const adjustedDelta = deltaDeg * Math.max(0.3, resistanceFactor); // Minimum 30% sensitivity

      const proposed = cumulativeAngle.value + adjustedDelta;

      // Apply limits with smoother clamping
      if (proposed > MAX_ANGLE) {
        cumulativeAngle.value = MAX_ANGLE;
      } else if (proposed < -MAX_ANGLE) {
        cumulativeAngle.value = -MAX_ANGLE;
      } else {
        cumulativeAngle.value = proposed;
      }

      const target = cumulativeAngle.value;
      // Progressive stickiness - harder to move as angle increases
      const current = steeringAngle.value;
      // Calculate dynamic smoothing inline (worklet-safe)
      const normalizedAngle = Math.abs(current) / MAX_ANGLE; // 0 to 1
      const stickinessMultiplier = normalizedAngle * normalizedAngle; // Quadratic curve for more dramatic effect
      const dynamicSmoothing =
        BASE_SMOOTHING -
        (BASE_SMOOTHING - MIN_SMOOTHING) * stickinessMultiplier;
      const newAngle = current + (target - current) * dynamicSmoothing;
      steeringAngle.value = newAngle;

      // Send updates more frequently for smoother control
      if (Math.abs(newAngle - lastSentAngle.value) >= SEND_THRESHOLD_DEG) {
        lastSentAngle.value = newAngle;
        runOnJS(onSteeringChange)(newAngle);
      }
    })
    .onEnd(() => {
      if (!device) return;
      const startAngle = steeringAngle.value;
      const angleAbs = Math.abs(startAngle);

      // Progressive spring strength - stronger return force from larger angles
      const baseStiffness = 120;
      const baseDamping = 15;
      const stiffnessMultiplier = 1 + (angleAbs / MAX_ANGLE) * 1.5; // Up to 2.5x stronger
      const dampingMultiplier = 1 + (angleAbs / MAX_ANGLE) * 0.5; // Slightly more damped

      steeringAngle.value = withSpring(0, {
        damping: baseDamping * dampingMultiplier,
        stiffness: baseStiffness * stiffnessMultiplier,
        mass: 1,
      });
      cumulativeAngle.value = 0;
      lastSentAngle.value = 0;
      runOnJS(onSteeringChange)(0);
    })
    .enabled(!!device);

  // Add pan gesture for additional touch responsiveness
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!device) return;
      // Convert horizontal pan to rotation angle
      const deltaX = event.translationX;

      // Progressive resistance - reduce sensitivity as we move further from center
      const currentAngleAbs = Math.abs(steeringAngle.value);
      const resistanceFactor = 1 - (currentAngleAbs / MAX_ANGLE) * 0.6; // Reduce sensitivity by up to 60%
      const scaleFactor = 0.8 * Math.max(0.4, resistanceFactor); // Minimum 40% sensitivity

      const targetAngle = Math.max(
        -MAX_ANGLE,
        Math.min(MAX_ANGLE, deltaX * scaleFactor)
      );

      // Progressive stickiness for pan gesture too
      const current = steeringAngle.value;
      // Calculate dynamic smoothing inline (worklet-safe)
      const normalizedAngle = Math.abs(current) / MAX_ANGLE; // 0 to 1
      const stickinessMultiplier = normalizedAngle * normalizedAngle; // Quadratic curve for more dramatic effect
      const dynamicSmoothing =
        BASE_SMOOTHING -
        (BASE_SMOOTHING - MIN_SMOOTHING) * stickinessMultiplier;
      const newAngle = current + (targetAngle - current) * dynamicSmoothing;
      steeringAngle.value = newAngle;
      cumulativeAngle.value = newAngle;

      if (Math.abs(newAngle - lastSentAngle.value) >= SEND_THRESHOLD_DEG) {
        lastSentAngle.value = newAngle;
        runOnJS(onSteeringChange)(newAngle);
      }
    })
    .onEnd(() => {
      if (!device) return;
      const startAngle = steeringAngle.value;
      const angleAbs = Math.abs(startAngle);

      // Progressive spring strength for pan gesture too
      const baseStiffness = 120;
      const baseDamping = 15;
      const stiffnessMultiplier = 1 + (angleAbs / MAX_ANGLE) * 1.5;
      const dampingMultiplier = 1 + (angleAbs / MAX_ANGLE) * 0.5;

      steeringAngle.value = withSpring(0, {
        damping: baseDamping * dampingMultiplier,
        stiffness: baseStiffness * stiffnessMultiplier,
        mass: 1,
      });
      cumulativeAngle.value = 0;
      lastSentAngle.value = 0;
      runOnJS(onSteeringChange)(0);
    })
    .enabled(!!device);

  // Combine both gestures for maximum responsiveness
  const combinedGesture = Gesture.Simultaneous(
    rotationGesture.simultaneousWithExternalGesture(simultaneousHandlers),
    panGesture.simultaneousWithExternalGesture(simultaneousHandlers)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${steeringAngle.value}deg` }],
  }));

  return (
    <View style={[styles.leftPanel, { justifyContent: "center" }]}>
      <View style={[styles.steeringWheelContainer, { marginRight: 40 }]}>
        <GestureDetector gesture={combinedGesture}>
          <Animated.View style={[styles.steeringWheel, animatedStyle]}>
            <Image
              source={require("../../assets/images/pngegg.png")}
              style={{
                width: WHEEL_SIZE,
                height: WHEEL_SIZE,
                borderRadius: HALF,
                borderWidth: 12,
                borderColor: "black",
                backgroundColor: "transparent",
                alignItems: "center",
                justifyContent: "center",
                opacity: device ? 1 : 0.5,
                resizeMode: "contain",
                tintColor: "black",
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
      </View>
    </View>
  );
}
