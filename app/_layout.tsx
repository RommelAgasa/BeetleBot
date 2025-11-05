import { BleProvider } from "@/src/context/BleContext";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, useSegments } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    async function setup() {
      try {
        await SystemUI.setBackgroundColorAsync("black");
        await NavigationBar.setVisibilityAsync("hidden");
        await NavigationBar.setBehaviorAsync("inset-swipe");

        // Safe check: handle empty or undefined segments
        const firstSegment = segments?.[0];
        if (!firstSegment || firstSegment === "welcome") {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    setup();
  }, []);

  // React to route changes dynamically
  useEffect(() => {
    async function handleOrientationChange() {
      const firstSegment = segments?.[0];
      if (firstSegment === "welcome") {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
    }

    if (isReady) handleOrientationChange();
  }, [segments, isReady]);

  if (!isReady) return null;

  return (
    <BleProvider>
      <Stack>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="(bluetooth)" options={{ headerShown: false }} />
        <Stack.Screen name="(setting)" options={{ headerShown: false }} />
      </Stack>
    </BleProvider>
  );
}
