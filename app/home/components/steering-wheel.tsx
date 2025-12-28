import React from "react";
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
  gestureRef?: React.MutableRefObject<any>;
  simultaneousGestureRef?: React.RefObject<any>;
};

function SteeringWheel(props: SteeringWheelProps) {
  const {
    device,
    onSteeringChange,
    maxRotation = 135,
    gestureRef,
    simultaneousGestureRef,
  } = props;
  const enabled = !!device;
  
  const steeringAngle = useSharedValue(0);
  const lastSentDirectionKey = useSharedValue<number>(0); // -1 left, 0 center, 1 right

  const PAN_GAIN = 0.8;
  const CENTER_DIRECT_THRESHOLD = 12;
  const INTERP_SMOOTHING = 0.55;
  const STEER_THRESHOLD_DEG = 10;

  const logJs = React.useCallback((msg: string, extra?: any) => {
    // Keep logs on JS thread so they always show up.
    if (extra !== undefined) console.log(msg, extra);
    else console.log(msg);
  }, []);

  let panGesture = Gesture.Pan()
    .minDistance(0)
    .shouldCancelWhenOutside(false)
    .hitSlop({ left: 40, right: 40, top: 40, bottom: 40 })
    .minPointers(1)
    .maxPointers(1)
    .averageTouches(true)
    .onBegin(() => {
      lastSentDirectionKey.value = 0;
      runOnJS(logJs)("🎯 Steering BEGIN");
    })
    .onUpdate((event) => {
      // One-time-ish heartbeat so we can confirm updates arrive while accelerator is held.
      // (Runs on UI thread; log is bridged to JS.)
      runOnJS(logJs)("🎯 Steering UPDATE translationX:", event.translationX);

      const baseTargetAngle = event.translationX * PAN_GAIN;
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

      let directionKey = 0;
      if (newAngle < -STEER_THRESHOLD_DEG) directionKey = -1;
      else if (newAngle > STEER_THRESHOLD_DEG) directionKey = 1;

      if (directionKey !== lastSentDirectionKey.value) {
        lastSentDirectionKey.value = directionKey;
        const angleForJs =
          directionKey === 0 ? 0 : directionKey * (STEER_THRESHOLD_DEG + 1);
        runOnJS(logJs)("🎯 SENDING STEERING COMMAND - angle:", angleForJs);
        runOnJS(onSteeringChange)(angleForJs);
      }
    })
    .onEnd(() => {
      runOnJS(logJs)("🎯 Steering END - resetting to 0");
      steeringAngle.value = withSpring(0, {
        damping: 15,
        stiffness: 120,
        mass: 1,
      });
      if (lastSentDirectionKey.value !== 0) {
        lastSentDirectionKey.value = 0;
        runOnJS(onSteeringChange)(0);
      }
    })
    .onFinalize(() => {
      runOnJS(logJs)("🎯 Steering FINALIZE");
    })
    .enabled(enabled);

  if (gestureRef) {
    panGesture = panGesture.withRef(gestureRef);
  }

  if (simultaneousGestureRef) {
    panGesture = panGesture.simultaneousWithExternalGesture(simultaneousGestureRef);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${steeringAngle.value}deg` }],
  }));

  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.wheel, animatedStyle]}
        >
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

export default SteeringWheel;