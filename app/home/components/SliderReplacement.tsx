import Slider from "@react-native-community/slider";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

type SliderReplacementProps = {
  device: any;
  value: number;
  onValueChange?: (v: number) => void;
  onSteeringChange?: (angle: number) => void | Promise<void>;
  gestureRef?: React.MutableRefObject<any>;
  simultaneousGestureRef?: React.RefObject<any>;
};

export default function SliderReplacement({
  device,
  value,
  onValueChange,
  onSteeringChange,
  gestureRef,
  simultaneousGestureRef,
}: SliderReplacementProps) {
  const [internalValue, setInternalValue] = useState<number>(value ?? 0);
  const trackRef = useRef<any>(null);
  const trackLeft = useRef<number>(0);
  const trackWidth = useRef<number>(200);
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

  const handlePointerToValue = React.useCallback((absoluteX: number) => {
    const x = absoluteX - trackLeft.current;
    let pct = 0;
    if (trackWidth.current > 0) pct = x / trackWidth.current;
    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;
    const v = Math.round(pct * 200 - 100);
    console.log("Slider (pointer) value:", v);
    setInternalValue(v);
    if (onValueChange) onValueChange(v);
    maybeSendSteering(v);
  }, [onValueChange, maybeSendSteering]);

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
        // keep value; slider does not auto-center.
      })
      .enabled(!!device);

    if (gestureRef) g = g.withRef(gestureRef);
    if (simultaneousGestureRef) g = g.simultaneousWithExternalGesture(simultaneousGestureRef);

    return g;
  }, [device, gestureRef, simultaneousGestureRef, handlePointerToValue]);

  return (
    <GestureDetector gesture={pan}>
      <View
        ref={trackRef}
        onLayout={measureTrack}
        style={{ width: "100%", paddingHorizontal: 12 }}
      >
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={-100}
          maximumValue={100}
          value={internalValue}
          onValueChange={(v) => {
            const nv = Math.round(v);
            console.log("Slider (drag) value:", nv);
            setInternalValue(nv);
            if (onValueChange) onValueChange(nv);
            maybeSendSteering(nv);
          }}
          disabled={!device}
        />
      </View>
    </GestureDetector>
  );
}
