import React, { useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

type BreakButtonProps = {
  device: any;
  handleBrake: () => void;
};

export default function BreakButton({
  device,
  handleBrake,
}: BreakButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const disabled = !device;

  const handlePressIn = () => {
    if (disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const brakeGesture = Gesture.Tap()
    .onStart(() => {
      runOnJS(handlePressIn)();
      runOnJS(handleBrake)();
    })
    .enabled(!disabled);

  return (
    <GestureDetector gesture={brakeGesture}>
      <Animated.View
        style={[
          styles.wrapper,
          {
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
      >
        <Svg width={85} height={68} viewBox="0 0 85 68" fill="none">
          <Path
            d="M0.393847 18.3883C-1.78663 8.98505 5.35334 4.0317e-07 15.0061 8.25107e-07L69.026 3.18639e-06C78.428 3.59736e-06 85.5123 8.55023 83.7645 17.7884L80.1299 37L77.1911 54.9266C76.0024 62.1775 69.7363 67.5 62.3887 67.5L22.6485 67.5C15.3992 67.5 9.18727 62.3156 7.89048 55.1833L4.12988 34.5L0.393847 18.3883Z"
            fill="#e8e8e8"
          />
        </Svg>

        <Animated.View style={styles.pauseWrapper}>
          <Animated.View style={styles.pauseBar} />
          <Animated.View style={styles.pauseBar} />
        </Animated.View>
      </Animated.View>
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
  },
  pauseBar: {
    width: 10,
    height: 45,
    backgroundColor: "#FF9E42",
    borderRadius: 8,
    marginHorizontal: 6,
  },
});