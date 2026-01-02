import Slider from "@react-native-community/slider";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
    } catch (e) {
      // ignore
    }
  };

  const handlePointerToValue = (absoluteX: number) => {
    const x = absoluteX - trackLeft.current;
    let pct = 0;
    if (trackWidth.current > 0) pct = x / trackWidth.current;
    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;
    const v = Math.round(pct * 200 - 100);
    console.log("Slider (pointer) value:", v);
    setInternalValue(v);
    if (onValueChange) onValueChange(v);
  };

  const pan = useMemo(() => {
    let g = Gesture.Pan()
      .minDistance(0)
      .runOnJS(true)
      .onStart((e) => {
        handlePointerToValue((e as any).absoluteX ?? 0);
      })
      .onUpdate((e) => {
        handlePointerToValue((e as any).absoluteX ?? 0);
      })
      .onEnd(() => {
        // nothing
      })
      .enabled(!!device);

    if (gestureRef) g = g.withRef(gestureRef);
    if (simultaneousGestureRef) g = g.simultaneousWithExternalGesture(simultaneousGestureRef);

    return g;
  }, [device, gestureRef, simultaneousGestureRef]);

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
          }}
          disabled={!device}
        />
      </View>
    </GestureDetector>
  );
}
