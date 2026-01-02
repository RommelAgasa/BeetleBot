import Slider from "@react-native-community/slider";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

type SliderReplacementProps = {
  device: any;
  value: number;
  onValueChange?: (v: number) => void;
  gestureRef?: React.MutableRefObject<any>;
  simultaneousGestureRef?: React.RefObject<any>;
};

export default function SliderReplacement({
  device,
  value,
  onValueChange,
  gestureRef,
  simultaneousGestureRef,
}: SliderReplacementProps) {
  const [internalValue, setInternalValue] = useState<number>(value ?? 0);
  const trackRef = useRef<any>(null);
  const trackLeft = useRef<number>(0);
  const trackWidth = useRef<number>(200);
  const lastSentDirection = useRef<number>(0); // -1 left, 0 center, 1 right

  const STEER_THRESHOLD = 10;

  useEffect(() => {
    setInternalValue(value ?? 0);
  }, [value]);

  const measureTrack = () => {
    try {
      if (trackRef.current && trackRef.current.measureInWindow) {
        trackRef.current.measureInWindow((x: number, y: number, w: number, h: number) => {
          trackLeft.current = x;
          trackWidth.current = w || 200;
        });
      }
    } catch {
      // ignore
    }
  };

  const handlePointerToValue = useCallback((absoluteX: number) => {
    const x = absoluteX - trackLeft.current;
    let pct = 0;
    if (trackWidth.current > 0) pct = x / trackWidth.current;
    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;
    const v = Math.round(pct * 200 - 100);
    console.log("Slider (pointer) value:", v);
    setInternalValue(v);
    // Map to discrete direction commands similar to steering-wheel
    let directionKey = 0;
    if (v < -STEER_THRESHOLD) directionKey = -1;
    else if (v > STEER_THRESHOLD) directionKey = 1;

    if (directionKey !== lastSentDirection.current) {
      lastSentDirection.current = directionKey;
      const outValue = directionKey === 0 ? 0 : directionKey * (STEER_THRESHOLD + 1);
      if (onValueChange) onValueChange(outValue);
    }
  }, [onValueChange]);

  const pan = useMemo(() => {
    let g = Gesture.Pan()
      .minDistance(0)
      .maxPointers(1)
      .runOnJS(true)
      .onStart((e) => {
        handlePointerToValue((e as any).absoluteX ?? 0);
      })
      .onUpdate((e) => {
        handlePointerToValue((e as any).absoluteX ?? 0);
      })
      .onEnd(() => {
        // Reset to neutral on end of slide
        lastSentDirection.current = 0;
        setInternalValue(0);
        if (onValueChange) onValueChange(0);
      })
      .enabled(!!device);

    if (gestureRef) g = g.withRef(gestureRef);
    if (simultaneousGestureRef) g = g.simultaneousWithExternalGesture(simultaneousGestureRef);

    return g;
  }, [device, gestureRef, simultaneousGestureRef, handlePointerToValue, onValueChange]);

  return (
    <GestureDetector gesture={pan}>
      <View
        ref={trackRef}
        onLayout={measureTrack}
        style={{ width: "100%", paddingHorizontal: 12 }}
      >
        <View pointerEvents="none">
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={-100}
            maximumValue={100}
            value={internalValue}
            disabled={!device}
          />
        </View>
      </View>
    </GestureDetector>
  );
}
