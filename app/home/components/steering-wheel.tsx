import React, { forwardRef, useEffect, useMemo, useRef } from "react";
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
  simultaneousHandlers?: any[];
  onSteeringChange: (angle: number) => void;
  maxRotation?: number;
};

function SteeringWheel(props: SteeringWheelProps, ref: any) {
  const {
    device,
    simultaneousHandlers,
    onSteeringChange,
    maxRotation = 135,
  } = props;
  
  const steeringAngle = useSharedValue(0);
  const lastSentAngle = useSharedValue(0);
  const cumulativeAngle = useSharedValue(0);
  const lastRotationRef = useRef(0);

  const ROTATION_GAIN = 1;
  const PAN_GAIN = 0.8;
  const CENTER_DIRECT_THRESHOLD = 12;
  const INTERP_SMOOTHING = 0.55;
  const SEND_THRESHOLD_DEG = 0.5;

  const combinedGesture = useMemo(() => {
    let rotationGesture = Gesture.Rotation()
      .onBegin(() => {
        lastRotationRef.current = 0;
      })
      .onUpdate((event) => {
        if (!device) return;

        const deltaRad = event.rotation - lastRotationRef.current;
        lastRotationRef.current = event.rotation;
        const deltaDeg = (deltaRad * 180) / Math.PI;
        const scaledDeltaDeg = deltaDeg * ROTATION_GAIN;
        const proposed = cumulativeAngle.value + scaledDeltaDeg;

        if (proposed > maxRotation) cumulativeAngle.value = maxRotation;
        else if (proposed < -maxRotation) cumulativeAngle.value = -maxRotation;
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

    let panGesture = Gesture.Pan()
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

    // Add simultaneous handlers to individual gestures BEFORE combining
    if (simultaneousHandlers && Array.isArray(simultaneousHandlers)) {
      simultaneousHandlers.forEach((handler: any) => {
        if (handler?.current) {
          rotationGesture = rotationGesture.simultaneousWithExternalGesture(handler.current);
          panGesture = panGesture.simultaneousWithExternalGesture(handler.current);
        }
      });
    }

    return Gesture.Simultaneous(rotationGesture, panGesture);
  }, [device, simultaneousHandlers]);

  // Bind gesture to ref - no delay needed
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(combinedGesture);
    } else {
      ref.current = combinedGesture;
    }
  }, [ref, combinedGesture]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${steeringAngle.value}deg` }],
  }));

  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={combinedGesture}>
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
    alignItems: "flex-start",
    justifyContent: "flex-start",
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

export default forwardRef(SteeringWheel);