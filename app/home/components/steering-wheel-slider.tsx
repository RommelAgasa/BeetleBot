import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Ellipse, Path } from "react-native-svg";

type SteeringWheelSliderProps = {
  device: any;
  value: number;
  onValueChange?: (v: number) => void;
  onSteeringChange?: (angle: number) => void | Promise<void>;
};

export default function SteeringWheelSlider({
  device,
  value,
  onValueChange,
  onSteeringChange,
}: SteeringWheelSliderProps) {
  const [internalValue, setInternalValue] = useState<number>(value ?? 0);
  const halfWidthRef = useRef<number>(85);
  const lastSentDirectionKey = useRef<number>(0); // -1 left, 0 center, 1 right

  const STEER_THRESHOLD = 10; // ±10 considered neutral

  const maybeSendSteering = React.useCallback((v: number) => {
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
  }, [device, onSteeringChange]);

  useEffect(() => {
    setInternalValue(value ?? 0);
  }, [value]);

  const pan = useMemo(() => {
    return Gesture.Pan()
      .minDistance(0)
      .runOnJS(true)
      .onUpdate((e) => {
        if (!device) return;
        const half = halfWidthRef.current || 1;
        let ratio = e.translationX / half;
        if (ratio < -1) ratio = -1;
        if (ratio > 1) ratio = 1;
        const v = Math.round(ratio * 100);
        setInternalValue(v);
        if (onValueChange) onValueChange(v);
        maybeSendSteering(v);
      })
      .onEnd(() => {
        // Auto-center to neutral on release
        setInternalValue(0);
        if (onValueChange) onValueChange(0);
        maybeSendSteering(0);
      })
      .enabled(!!device);
  }, [device, onValueChange, maybeSendSteering]);

  return (
    <GestureDetector gesture={pan}>
      <View
        style={styles.container}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w) halfWidthRef.current = w / 2;
        }}
      >
        {/* Steering wheel visual overlay (no touch interception) */}
        <View style={styles.overlay} pointerEvents="none">
          <View
            style={[
              styles.wheel,
              {
                transform: [
                  {
                    rotate: `${Math.max(-135, Math.min(135, (internalValue / 100) * 135))}deg`,
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
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    // Fixed-size box so parent can position bottom-left cleanly
    width: 170,
    height: 170,
    alignItems: "flex-start",
    justifyContent: "flex-start",
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  slider: {
    width: 170,
    height: 40,
    // Keep the slider interactive but invisible
    opacity: 0.001, // avoid 0 opacity which may disable hit testing on some platforms
  },
});
