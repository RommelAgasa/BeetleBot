import React from "react";
import { Image, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
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
  const steeringAngle = useSharedValue(0);
  const SENSITIVITY_SCALE = 0.1;

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!device) return; // Disable gesture if not connected
      let newAngle =
        steeringAngle.value + event.translationX * SENSITIVITY_SCALE;
      if (newAngle < -90) newAngle = -90;
      if (newAngle > 90) newAngle = 90;
      steeringAngle.value = newAngle;
      runOnJS(onSteeringChange)(newAngle);
    })
    .onEnd(() => {
      if (!device) return;
      steeringAngle.value = withTiming(0, { duration: 200 });
      runOnJS(onSteeringChange)(0);
    })
    .enabled(!!device)
    .simultaneousWithExternalGesture(simultaneousHandlers);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${steeringAngle.value}deg` }],
  }));

  return (
    <View style={[styles.leftPanel, { justifyContent: "center" }]}>
      <View style={styles.steeringWheelContainer}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.steeringWheel, animatedStyle]}>
            <Image
              source={require("../../assets/images/pngegg.png")}
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
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
