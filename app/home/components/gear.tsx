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
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface GearSelectorProps {
  onGearChange?: (gear: string) => void;
  disabled?: boolean; // added
}

export default function GearSelector({ onGearChange, disabled }: GearSelectorProps) {
  const positions = ["Gear 2", "Gear 1", "Reverse"];
  const totalHeight = 160;
  const handleHeight = 80;
  const maxTravel = totalHeight - handleHeight;
  const slotHeight = maxTravel / (positions.length - 1);
  const [selectedIndex, setSelectedIndex] = useState<number>(1);
  const translateY = useRef(new Animated.Value(selectedIndex * slotHeight)).current;

  const changeGear = (index: number) => {
    if (disabled) return; // prevent changing
    if (index < 0 || index >= positions.length) return;

    setSelectedIndex(index);

    Animated.spring(translateY, {
      toValue: index * slotHeight,
      damping: 10,
      mass: 1,
      stiffness: 100,
      useNativeDriver: true,
    }).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    console.log(positions[index]);
    onGearChange?.(positions[index]);
  };

  const panResponder: PanResponderInstance = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled, // only allow if not disabled
    onMoveShouldSetPanResponder: (_, gesture) => !disabled && Math.abs(gesture.dy) > 10,

    onPanResponderMove: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
      if (disabled) return; // stop handle from moving
      const newY = gesture.dy + selectedIndex * slotHeight;
      if (newY >= 0 && newY <= maxTravel) translateY.setValue(newY);
    },

    onPanResponderRelease: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
      if (disabled) return; // stop snapping
      const velocity = gesture.vy;
      let targetIndex = selectedIndex;
      const dragThreshold = 35;

      if (gesture.dy > dragThreshold && selectedIndex < positions.length - 1) targetIndex = selectedIndex + 1;
      else if (gesture.dy < -dragThreshold && selectedIndex > 0) targetIndex = selectedIndex - 1;

      if (Math.abs(velocity) > 1.6) {
        if (velocity > 0 && selectedIndex < positions.length - 1) targetIndex = selectedIndex + 1;
        else if (velocity < 0 && selectedIndex > 0) targetIndex = selectedIndex - 1;
      }

      targetIndex = Math.max(0, Math.min(targetIndex, positions.length - 1));
      changeGear(targetIndex);
    },
  })
).current;


  return (
    <TouchableWithoutFeedback disabled={disabled}>
    <View style={styles.container}>
      {/* Gear labels */}
      <View style={styles.labelsContainer}>
        {positions.map((pos, i) => (
          <TouchableWithoutFeedback
            key={i}
            onPress={() => changeGear(i)}
            disabled={disabled} // prevent label taps
          >
            <View style={[styles.labelSlot, { height: handleHeight / 1.5 }]}>
              <Text
                style={[
                  styles.label,
                  selectedIndex === i && styles.labelActive,
                  disabled && { color: "#ccc" }, // gray out if disabled
                ]}
              >
                {pos}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        ))}
      </View>

      {/* Gear track + handle */}
      <View style={styles.sliderWrapper}>
        <View style={[styles.sliderTrack, { height: totalHeight }]}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.sliderHandle,
              { transform: [{ translateY }], opacity: disabled ? 0.5 : 1 }, // gray out handle
            ]}
          >
            <View style={styles.handleOval} />
          </Animated.View>
        </View>
      </View>
    </View>
    </TouchableWithoutFeedback>
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
