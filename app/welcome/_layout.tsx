import { Slot } from "expo-router";
import { View } from "react-native";
import layoutStyle from "./layout-style";

export default function WelcomeLayout() {
  return (
    <View
      style={layoutStyle.container}
    >
      {/* This Slot renders child screens like welcome/index.tsx */}
      <Slot />
    </View>
  );
}
