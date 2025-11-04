import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

export default function AccelaratorButton() {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    console.log("Pause button pressed!");
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* SVG Background Shape */}
        <Svg
          width={54}
          height={108}
          viewBox="0 0 54 108"
          fill="none"
        >
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
