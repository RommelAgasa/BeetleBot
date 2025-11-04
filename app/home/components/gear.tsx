import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface GearSelectorProps {
  onGearChange?: (gear: string) => void;
}

export default function GearSelector({ onGearChange }: GearSelectorProps) {
  // 🏷 Available gear positions (top to bottom)
  const positions = ["Gear 2", "Gear 1", "Reverse"];

  // 📏 Total height of the track and handle dimensions
  const totalHeight = 160; // Total visible slider area
  const handleHeight = 80; // Handle (movable oval button)
  const maxTravel = totalHeight - handleHeight; // Ensures handle never leaves track

  // 📍 Calculate vertical distance between each gear stop
  const slotHeight = maxTravel / (positions.length - 1);

  // ⚙️ Start in the middle gear (Gear 1)
  const [selectedIndex, setSelectedIndex] = useState<number>(1);

  // 🎞️ Animated Y position for the slider handle
  const translateY = useRef(new Animated.Value(selectedIndex * slotHeight)).current;

  /**
   * 🔄 Function to change gear with animation and haptic feedback
   */
  const changeGear = (index: number) => {
    if (index < 0 || index >= positions.length) return; // guard

    setSelectedIndex(index);

    // 🌀 Smooth spring animation for handle movement
    Animated.spring(translateY, {
      toValue: index * slotHeight,
      damping: 10,
      mass: 1,
      stiffness: 100,
      useNativeDriver: true,
    }).start();

    // 💥 Haptic feedback for tactile feel
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 📤 Notify parent component of the gear change (optional)
    if (onGearChange) onGearChange(positions[index]);
  };

  /**
   * ✋ PanResponder — handles dragging gestures on the handle
   */
  const panResponder: PanResponderInstance = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // don't start immediately
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10, // only respond to significant vertical movement

      // 📍 While dragging
      onPanResponderMove: (
        _: GestureResponderEvent,
        gesture: PanResponderGestureState
      ) => {
        const newY = gesture.dy + selectedIndex * slotHeight;

        // 🚫 Prevent dragging beyond top/bottom limits
        if (newY >= 0 && newY <= maxTravel) {
          translateY.setValue(newY);
        }
      },

      // 🏁 When drag is released, determine which gear to snap to
      onPanResponderRelease: (
        _: GestureResponderEvent,
        gesture: PanResponderGestureState
      ) => {
        const velocity = gesture.vy; // finger flick speed
        let targetIndex = selectedIndex;

        // ⚙️ Adjusted drag sensitivity (more precise, less jumpy)
        const dragThreshold = 35; // increased from 20 → more controlled

        // If drag is downward past threshold → next gear
        if (gesture.dy > dragThreshold && selectedIndex < positions.length - 1) {
          targetIndex = selectedIndex + 1;
        }
        // If drag is upward past threshold → previous gear
        else if (gesture.dy < -dragThreshold && selectedIndex > 0) {
          targetIndex = selectedIndex - 1;
        }

        // 🌀 Velocity bias for flicks (but not too sensitive)
        if (Math.abs(velocity) > 1.6) {
          if (velocity > 0 && selectedIndex < positions.length - 1)
            targetIndex = selectedIndex + 1;
          else if (velocity < 0 && selectedIndex > 0)
            targetIndex = selectedIndex - 1;
        }

        // 🔒 Keep target index within valid range
        targetIndex = Math.max(0, Math.min(targetIndex, positions.length - 1));

        // 🎬 Apply gear change
        changeGear(targetIndex);
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* 🔠 Gear labels (Gear 2, Gear 1, Reverse) */}
      <View style={styles.labelsContainer}>
        {positions.map((pos, i) => (
          <View key={i} style={[styles.labelSlot, { height: handleHeight / 1.5 }]}>
            <Text
              style={[
                styles.label,
                selectedIndex === i && styles.labelActive, // highlight current gear
              ]}
            >
              {pos}
            </Text>
          </View>
        ))}
      </View>

      {/* 🎚 Main slider track */}
      <View style={styles.sliderWrapper}>
        <View style={[styles.sliderTrack, { height: totalHeight }]}>
          {/* 🟠 Movable orange handle */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.sliderHandle,
              { transform: [{ translateY }] },
            ]}
          >
            <View style={styles.handleOval} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

/**
 * 🎨 Styles
 */
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
    color: "#FF9E42", // 🔸 orange for active gear
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
