import React, { useMemo, useRef } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";
//import Path from "react-native-svg/lib/typescript/elements/Path";
//import Svg from "react-native-svg/lib/typescript/elements/Svg";
import Svg, { Ellipse, Path } from "react-native-svg";

type SteeringWheelProps = {
  onAngleChange?: (angle: number) => void;
  maxRotation?: number; // degrees
};
//
export default function SteeringWheel({ onAngleChange, maxRotation = 135 }: SteeringWheelProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4,
        onPanResponderMove: (_, gesture) => {
          const nextAngle = Math.max(-maxRotation, Math.min(maxRotation, gesture.dx));
          rotation.setValue(nextAngle);
          onAngleChange?.(nextAngle);
        },
        onPanResponderRelease: () => {
          Animated.spring(rotation, { toValue: 0, useNativeDriver: true }).start();
          onAngleChange?.(0);
        },
      }),
    [maxRotation, onAngleChange, rotation]
  );

  const spin = rotation.interpolate({
    inputRange: [-180, 180],
    outputRange: ["-180deg", "180deg"],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        {...responder.panHandlers}
        style={[styles.wheel, { transform: [{ rotate: spin }] }]}
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