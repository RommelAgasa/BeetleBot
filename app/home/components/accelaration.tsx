import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

type AcceleratorButtonProps = {
  device: any;
  handleAccelerate: () => void;
  handleDecelerate: () => void;
  onPedalRelease?: () => void;
  simultaneousHandlers?: any;
};

export default function AcceleratorButton({
  device,
  handleAccelerate,
  handleDecelerate,
  onPedalRelease,
  simultaneousHandlers,
}: AcceleratorButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const accelInterval = useRef<number | null>(null);
  const decelInterval = useRef<number | null>(null);
  const disabled = !device;

  const handlePressIn = () => {
    if (disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();

    // Clear any running intervals
    if (decelInterval.current) {
      clearInterval(decelInterval.current);
      decelInterval.current = null;
    }

    handleAccelerate();
    accelInterval.current = setInterval(() => {
      handleAccelerate();
    }, 100);
  };

  const handlePressOut = () => {
    if (disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    if (accelInterval.current) {
      clearInterval(accelInterval.current);
      accelInterval.current = null;
    }

    // Start gradual deceleration
    if (decelInterval.current) {
      clearInterval(decelInterval.current);
      decelInterval.current = null;
    }

    decelInterval.current = setInterval(() => {
      handleDecelerate();
    }, 100);

    if (onPedalRelease) onPedalRelease();
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (accelInterval.current) clearInterval(accelInterval.current);
      if (decelInterval.current) clearInterval(decelInterval.current);
    };
  }, []);

  const accelerateGesture = Gesture.LongPress()
    .minDuration(1)
    .onStart(() => runOnJS(handlePressIn)())
    .onEnd(() => runOnJS(handlePressOut)())
    .onFinalize(() => runOnJS(handlePressOut)())
    .enabled(!disabled)
    .simultaneousWithExternalGesture(simultaneousHandlers);

  return (
    <GestureDetector gesture={accelerateGesture}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.wrapper,
            {
              transform: [{ scale: scaleAnim }],
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          {/* SVG Background Shape */}
          <Svg width={54} height={108} viewBox="0 0 54 108" fill="none">
            <Path
              d="M3.23658 6.21415C3.11531 2.81865 5.83509 3.63698e-07 9.23276 5.12215e-07L44.3334 2.04651e-06C47.7171 2.19442e-06 50.4314 2.79635 50.3308 6.17849L48.0446 82.9932C48.0248 83.6598 48.1162 84.3249 48.3151 84.9614L53.0804 100.21C54.2877 104.074 51.4013 108 47.3535 108L6.00483 108C1.86235 108 -1.03389 103.902 0.349069 99.9969L5.63348 85.0762C5.88533 84.3651 6.00082 83.6129 5.97389 82.859L3.23658 6.21415Z"
              fill="#e8e8e8"
            />
          </Svg>

          {/* Pause bars */}
          <Animated.View style={styles.pauseWrapper}>
            <Animated.View style={styles.pauseBar} />
            <Animated.View style={styles.pauseBar} />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  pauseWrapper: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    top: 30,
  },
  pauseBar: {
    width: 8,
    height: 62,
    backgroundColor: "#FF9E42",
    borderRadius: 6,
    marginHorizontal: 4,
  },
});