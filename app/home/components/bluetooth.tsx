import CustomText from "@/src/theme/custom-theme";
import { usePathname, useRouter } from "expo-router";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

export default function Bluetooth({device}:any) {
  
  const router = useRouter();
  const pathname = usePathname(); // current route
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const displayText = device?.name ? device.name : "Connect";

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 5,
    }).start();

    // Navigate
    if(displayText !== "Connect"){
      router.push("/connection"); // if device is connected, go to connection page
    }
    else if (pathname !== "/search") {
      router.push("/search");
    }
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[styles.round_rectangle, { transform: [{ scale: scaleAnim }] }]}
      >
        <Svg width={20} height={26} viewBox="0 0 20 26" fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.2284 1.55717L17.4775 4.88641C17.964 5.19998 18.25 5.6895 18.25 6.20906C18.25 6.7286 17.964 7.21814 17.4775 7.53171L9.25063 12.7499L17.4775 17.9682C17.964 18.2819 18.25 18.7713 18.25 19.2908C18.25 19.8104 17.964 20.3 17.4775 20.6135L12.2284 23.9427C11.652 24.3015 10.8861 24.35 10.2537 24.0678C9.62122 23.7857 9.23221 23.222 9.25063 22.6143V2.88558C9.23221 2.27793 9.62122 1.7143 10.2537 1.43218C10.8861 1.15007 11.652 1.19854 12.2284 1.55717Z"
            stroke="#FF9E42"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M1.25 6.25L9.25 12.25L1.25 18.25"
            stroke="#FF9E42"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>

        <CustomText style={{ marginRight: 10 }}>{displayText}</CustomText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  round_rectangle: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "white",
    borderRadius: 40,
    padding: 10,
    width: 120,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});