import * as NavigationBar from "expo-navigation-bar";
import { Slot } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { View } from "react-native";
import layoutStyle from "./layout-style";

export default function HomeLayout() {
  useEffect(() => {
    // Lock orientation to landscape
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    // Set safe area / background color (optional)
    SystemUI.setBackgroundColorAsync("black");

    // Hide navigation bar, but allow swipe to reveal
    NavigationBar.setVisibilityAsync("hidden");
    NavigationBar.setBehaviorAsync("inset-swipe"); 
    // Options: "inset-swipe" (auto-hide), "overlay-swipe" (overlay style), or "inset" (always visible)

    return () => {
      // Cleanup when leaving this layout
      ScreenOrientation.unlockAsync();
      NavigationBar.setVisibilityAsync("visible");
    };
  }, []);

  return (
    <>
      {/* Hide top status bar */}
      <StatusBar hidden />

      <View style={layoutStyle.container}>
        <Slot />
      </View>
    </>
  );
}
