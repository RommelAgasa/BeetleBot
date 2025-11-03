import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import styles from "../styles";

export default function PedalControls({
  device,
  handleAccelerate,
  handleBrake,
  handleReverse,
  handleDecelerate,
  simultaneousHandlers,
  speed,
  setSpeed,
  sendCommand,
  commandMap,
  onPedalRelease,
}: {
  device: any;
  handleAccelerate: () => void;
  handleBrake: () => void;
  handleReverse: () => void;
  handleDecelerate: () => void;
  simultaneousHandlers?: any;
  speed: number;
  setSpeed: (s: number) => void;
  sendCommand: (cmd: string) => void;
  commandMap: any;
  onPedalRelease?: () => void;
}) {
  const disabled = !device;
  const accelInterval = useRef<number | null>(null);
  const decelInterval = useRef<number | null>(null);
  const reverseInterval = useRef<number | null>(null);

  const onAcceleratePressIn = () => {
    if (disabled) return;
    // Clear any running reverse interval
    if (reverseInterval.current) {
      clearInterval(reverseInterval.current);
      reverseInterval.current = null;
    }
    if (decelInterval.current) {
      clearInterval(decelInterval.current);
      decelInterval.current = null;
    }
    handleAccelerate();
    accelInterval.current = setInterval(() => {
      handleAccelerate();
    }, 100);
  };

  const onAcceleratePressOut = () => {
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

  const onReversePressIn = () => {
    if (disabled) return;
    // Clear any running accelerate interval
    if (accelInterval.current) {
      clearInterval(accelInterval.current);
      accelInterval.current = null;
    }
    if (decelInterval.current) {
      clearInterval(decelInterval.current);
      decelInterval.current = null;
    }
    handleReverse();
    reverseInterval.current = setInterval(() => {
      handleReverse();
    }, 100);
  };

  const onReversePressOut = () => {
    if (reverseInterval.current) {
      clearInterval(reverseInterval.current);
      reverseInterval.current = null;
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

  // Optionally, clear decelInterval when unmounting
  React.useEffect(() => {
    return () => {
      if (accelInterval.current) clearInterval(accelInterval.current);
      if (decelInterval.current) clearInterval(decelInterval.current);
      if (reverseInterval.current) clearInterval(reverseInterval.current);
    };
  }, []);

  // Gesture definitions for each pedal
  const brakeGesture = Gesture.Tap()
    .onStart(() => runOnJS(handleBrake)())
    .enabled(!disabled)
    .simultaneousWithExternalGesture(simultaneousHandlers);

  // Use LongPress for holdable accelerate
  const accelerateGesture = Gesture.LongPress()
    .minDuration(1) // respond immediately
    .onStart(() => runOnJS(onAcceleratePressIn)())
    .onEnd(() => runOnJS(onAcceleratePressOut)())
    .onFinalize(() => runOnJS(onAcceleratePressOut)())
    .enabled(!disabled)
    .simultaneousWithExternalGesture(simultaneousHandlers);

  const reverseGesture = Gesture.LongPress()
    .minDuration(1)
    .onStart(() => runOnJS(onReversePressIn)())
    .onEnd(() => runOnJS(onReversePressOut)())
    .onFinalize(() => runOnJS(onReversePressOut)())
    .enabled(!disabled)
    .simultaneousWithExternalGesture(simultaneousHandlers);

  return (
    <View style={styles.rightPanel}>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
        }}
      >
        {/* Accelerator, Brake, and Reverse pedals (horizontal layout) */}
        <View
          style={{
            flexDirection: "row",
            gap: 20,
            marginTop: 40,
            alignItems: "flex-end",
          }}
        >


          {/* Brake pedal (left, wide and short rectangle) */}
          <GestureDetector gesture={brakeGesture}>
            <View style={{ alignItems: "center" }}>
              <Pressable
                style={[
                  styles.pedalButton,
                  {
                    backgroundColor: "#fbc02d",
                    width: 80,
                    height: 60,
                    borderRadius: 14,
                    opacity: disabled ? 0.5 : 1,
                    alignItems: "center",
                    justifyContent: "flex-end",
                    elevation: 3,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    paddingBottom: 8,
                  },
                ]}
                disabled={disabled}
              >
                <Ionicons name="pause" size={36} color="#fff" />
              </Pressable>
              <Text
                style={{
                  fontSize: 11,
                  color: "#1e1e1e",
                  fontWeight: "bold",
                  marginTop: 6,
                }}
              ></Text>
            </View>
          </GestureDetector>




          {/* Accelerator pedal (center, tall rectangle) */}
          <GestureDetector gesture={accelerateGesture}>
            <View style={{ alignItems: "center" }}>
              <Pressable
                style={[
                  styles.pedalButton,
                  {
                    backgroundColor: "#43a047",
                    width: 70, // increased width
                    height: 150,
                    borderRadius: 18,
                    opacity: disabled ? 0.5 : 1,
                    alignItems: "center",
                    justifyContent: "center", // center the icon vertically
                    elevation: 3,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    paddingBottom: 8,
                  },
                ]}
                disabled={disabled}
              >
                <Ionicons name="arrow-up" size={36} color="#fff" />
              </Pressable>
              <Text
                style={{
                  fontSize: 11,
                  color: "#1e1e1e",
                  fontWeight: "bold",
                  marginTop: 6,
                }}
              ></Text>
            </View>
          </GestureDetector>

          {/* Reverse pedal (right, tall rectangle, red) */}
          <GestureDetector gesture={reverseGesture}>
            <View style={{ alignItems: "center" }}>
              <Pressable
                style={[
                  styles.pedalButton,
                  {
                    backgroundColor: "#e53935",
                    width: 70, // increased width
                    height: 150,
                    borderRadius: 18,
                    opacity: disabled ? 0.5 : 1,
                    alignItems: "center",
                    justifyContent: "center", // center the icon vertically
                    elevation: 3,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    paddingBottom: 8,
                  },
                ]}
                disabled={disabled}
              >
                <Ionicons name="arrow-down" size={36} color="#fff" />
              </Pressable>
              <Text
                style={{
                  fontSize: 11,
                  color: "#1e1e1e",
                  fontWeight: "bold",
                  marginTop: 6,
                }}
              ></Text>
            </View>
          </GestureDetector>


          
        </View>
      </View>
    </View>
  );
}
