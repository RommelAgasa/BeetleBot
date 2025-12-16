import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Ellipse, Path } from "react-native-svg";

type SteeringWheelProps = {
  device: any;
  onSteeringChange: (angle: number) => void | Promise<void>;
  maxRotation?: number;
  /**
   * Gesture ref of another control (e.g. accelerator / brake)
   * so steering can work simultaneously
   */
  simultaneousGestureRef?: any;
};

export default function SteeringWheel({
  device,
  onSteeringChange,
  maxRotation = 135,
  simultaneousGestureRef,
}: SteeringWheelProps) {
  // ================================
  // Reanimated shared values
  // ================================
  const steeringAngle = useSharedValue(0);
  const lastSentAngle = useSharedValue(0);

  // ================================
  // Tuning constants
  // ================================
  const PAN_GAIN = 0.8;
  const CENTER_DIRECT_THRESHOLD = 12;
  const INTERP_SMOOTHING = 0.55;
  const SEND_THRESHOLD_DEG = 0.5;

  // ================================
  // Pan gesture
  // ================================
  const panGesture = useMemo(() => {
    let gesture = Gesture.Pan()
      .minDistance(0)
      .maxPointers(1) // ignore extra fingers
      .onBegin(() => {
        console.log("⬅️➡️ Steering pan began");
      })
      .onUpdate((event) => {
        if (!device) return;

        const rawDeltaX = event.translationX;
        const baseTargetAngle = rawDeltaX * PAN_GAIN;

        const targetAngle = Math.max(
          -maxRotation,
          Math.min(maxRotation, baseTargetAngle)
        );

        const current = steeringAngle.value;
        let newAngle: number;

        if (Math.abs(targetAngle) < CENTER_DIRECT_THRESHOLD) {
          newAngle = targetAngle;
        } else {
          newAngle = current + (targetAngle - current) * INTERP_SMOOTHING;
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
          damping: 15,
          stiffness: 120,
          mass: 1,
        });

        lastSentAngle.value = 0;
        runOnJS(onSteeringChange)(0);
      })
      .onFinalize(() => {
        console.log("⬅️➡️ Steering pan finalized");
      })
      .enabled(!!device);

    // Allow steering while another gesture is active
    if (simultaneousGestureRef) {
      gesture = gesture.simultaneousWithExternalGesture(
        simultaneousGestureRef
      );
    }

    return gesture;
  }, [device, onSteeringChange, maxRotation, simultaneousGestureRef]);

  // ================================
  // Animated rotation
  // ================================
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${steeringAngle.value}deg` }],
  }));

  // ================================
  // Render
  // ================================
  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.wheel, animatedStyle]}>
          <Svg width="162" height="158" viewBox="0 0 162 158" fill="none">
            <Ellipse cx="81" cy="79" rx="81" ry="79" fill="#FF880F" />
            <Ellipse cx="81" cy="79" rx="66" ry="67" fill="#e4e0e0ff" />
            <Path
              d="M45 71.638L81.61 65 116 71.638v17.15l-16.086 10.51L91.594 117h-16.64L62.194 99.298 45 88.234V71.638zM74 119h18l-1.8 15.5L92 150H74l1.8-15.5L74 119zM43 72v16l-15.5-1.6L12 88V72l15.5 1.6L43 72zM147 72v16l-15-1.6-15 1.6V72l15 1.6 15-1.6z"
              fill="#FF880F"
            />
            <Ellipse cx="80" cy="88.5" rx="13" ry="11.5" fill="#e4e0e0ff" />
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  wheel: {
    width: 170,
    height: 170,
    borderRadius: 110,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8e8e8",
  },
});
