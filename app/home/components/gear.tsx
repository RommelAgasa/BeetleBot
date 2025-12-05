import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface GearSelectorProps {
  onGearChange?: (gear: string) => void;
  disabled?: boolean;
  simultaneousHandlers?: any;
}

export default function GearSelector({
  onGearChange,
  disabled,
  simultaneousHandlers,
}: GearSelectorProps) {
  const positions = ["Gear 2", "Gear 1", "Reverse"];
  const totalHeight = 160;
  const handleHeight = 80;
  const maxTravel = totalHeight - handleHeight;
  const slotHeight = maxTravel / (positions.length - 1);
  const [selectedIndex, setSelectedIndex] = useState<number>(1);
  
  const translateY = useSharedValue(selectedIndex * slotHeight);

  const changeGear = (index: number) => {
    if (disabled) return;
    if (index < 0 || index >= positions.length) return;

    setSelectedIndex(index);
    translateY.value = withSpring(index * slotHeight, {
      damping: 10,
      mass: 1,
      stiffness: 100,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onGearChange?.(positions[index]);
  };

  const setTranslateYJS = (val: number) => {
    translateY.value = val;
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (disabled) return;
      const newY = event.translationY + selectedIndex * slotHeight;
      if (newY >= 0 && newY <= maxTravel) {
        translateY.value = newY;
      }
    })
    .onEnd((event) => {
      if (disabled) return;
      const velocity = event.velocityY;
      let targetIndex = selectedIndex;
      const dragThreshold = 35;

      if (event.translationY > dragThreshold && selectedIndex < positions.length - 1) {
        targetIndex = selectedIndex + 1;
      } else if (event.translationY < -dragThreshold && selectedIndex > 0) {
        targetIndex = selectedIndex - 1;
      }

      if (Math.abs(velocity) > 1.6) {
        if (velocity > 0 && selectedIndex < positions.length - 1) {
          targetIndex = selectedIndex + 1;
        } else if (velocity < 0 && selectedIndex > 0) {
          targetIndex = selectedIndex - 1;
        }
      }

      targetIndex = Math.max(0, Math.min(targetIndex, positions.length - 1));
      runOnJS(changeGear)(targetIndex);
    })
    .enabled(!disabled)
    .simultaneousWithExternalGesture(simultaneousHandlers);

  const animatedHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Gear labels */}
      <View style={styles.labelsContainer}>
        {positions.map((pos, i) => (
          <View
            key={i}
            style={[styles.labelSlot, { height: handleHeight / 1.5 }]}
          >
            <Text
              style={[
                styles.label,
                selectedIndex === i && styles.labelActive,
                disabled && { color: "#ccc" },
              ]}
            >
              {pos}
            </Text>
          </View>
        ))}
      </View>

      {/* Gear track + handle */}
      <View style={styles.sliderWrapper}>
        <View style={[styles.sliderTrack, { height: totalHeight }]}>
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.sliderHandle,
                animatedHandleStyle,
                { opacity: disabled ? 0.5 : 1 },
              ]}
            >
              <View style={styles.handleOval} />
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  labelsContainer: {
    flexDirection: "column",
    justifyContent: "space-around",
    height: 160,
  },
  labelSlot: {
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  labelActive: {
    color: "#FF9E42",
    fontWeight: "700",
  },
  sliderWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  sliderTrack: {
    width: 50,
    backgroundColor: "#e8e8e8",
    borderRadius: 40,
    justifyContent: "flex-start",
    alignItems: "center",
    overflow: "hidden",
  },
  sliderHandle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e8e8e8",
    position: "absolute",
    top: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  handleOval: {
    width: 35,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#FF9E42",
  },
});
