import Slider from "@react-native-community/slider";
import React, { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import Svg, { Ellipse, Path } from "react-native-svg";

type SteeringWheelSliderProps = {
  device: any;
  onValueChange?: (v: number) => void;
  onSteeringChange?: (angle: number) => void | Promise<void>;
};

export default function SteeringWheelSlider({
  device,
  onValueChange,
  onSteeringChange,
}: SteeringWheelSliderProps) {
  // Local slider value in range -100 (full left) .. 0 (center) .. 100 (full right)
  const [internalValue, setInternalValue] = useState<number>(0);
  const lastSentDirectionKey = useRef<number>(0); // -1 left, 0 center, 1 right

  const STEER_THRESHOLD = 10; // ±10 considered neutral
  const PAN_GAIN = 0.8; // how sensitive the wheel is to horizontal drag
  const MAX_SLIDER_VALUE = 100;

  const maybeSendSteering = React.useCallback(
    (v: number) => {
      if (!device || !onSteeringChange) return;
      let directionKey = 0;
      if (v < -STEER_THRESHOLD) directionKey = -1;
      else if (v > STEER_THRESHOLD) directionKey = 1;

      if (directionKey !== lastSentDirectionKey.current) {
        lastSentDirectionKey.current = directionKey;
        const angleForJs = directionKey === 0 ? 0 : directionKey * (STEER_THRESHOLD + 1);
        console.log("Slider → steering angle:", angleForJs);
        onSteeringChange(angleForJs);
      }
    },
    [device, onSteeringChange]
  );

  // Pan gesture over the entire wheel; updates internalValue like a virtual slider
  const panGesture = Gesture.Pan()
    .minDistance(0)
    .hitSlop({ left: 40, right: 40, top: 40, bottom: 40 })
    .onUpdate((event) => {
      const raw = event.translationX * PAN_GAIN;
      const clamped = Math.max(-MAX_SLIDER_VALUE, Math.min(MAX_SLIDER_VALUE, raw));
      const rounded = Math.round(clamped);

      // Run JS-state updates and BLE commands on the JS thread
      runOnJS(setInternalValue)(rounded);
      if (onValueChange) {
        runOnJS(onValueChange)(rounded);
      }
      runOnJS(maybeSendSteering)(rounded);
    })
    .onEnd(() => {
      // Snap back to center and send neutral steering when finger lifts
      runOnJS(setInternalValue)(0);
      if (onValueChange) {
        runOnJS(onValueChange)(0);
      }
      runOnJS(maybeSendSteering)(0);
    });

  const clampedAngle = Math.max(-135, Math.min(135, (internalValue / 100) * 135));

  return (
    <View style={styles.container}>
      {/* Steering wheel visual + gesture area */}
      <GestureDetector gesture={device ? panGesture : Gesture.Pan().enabled(false)}>
        <View style={styles.overlay}>
          <View
            style={[
              styles.wheel,
              {
                transform: [
                  {
                    rotate: `${clampedAngle}deg`,
                  },
                ],
              },
            ]}
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
          </View>
        </View>
      </GestureDetector>

      {/* Slider underneath, still visible and tied to the same value */}
      <View style={styles.sliderBox}>
        <Slider
          style={styles.slider}
          minimumValue={-MAX_SLIDER_VALUE}
          maximumValue={MAX_SLIDER_VALUE}
          step={1}
          value={internalValue}
          onValueChange={(v) => {
            const numericValue = typeof v === "number" ? v : Number(v);
            setInternalValue(numericValue);
            if (onValueChange) onValueChange(numericValue);
            maybeSendSteering(numericValue);
          }}
          onSlidingComplete={() => {
            // When the user releases the slider, snap back to center and send neutral steering
            setInternalValue(0);
            if (onValueChange) onValueChange(0);
            maybeSendSteering(0);
          }}
          disabled={!device}
          minimumTrackTintColor="#1fb28a"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#1fb28a"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 170,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  sliderBox: {
    width: 170,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  slider: {
    width: 170,
    height: 40,
    opacity: 0.001, // keep slider interactive but visually hidden
  },
});
