import CustomText from "@/src/theme/custom-theme";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import style from "./screen-style";

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/home");
    }, 3000);

    return () => clearTimeout(timer); // cleanup on unmount
  }, [router]);

  return (
    <View style={style.container}>
      <View style={style.title_container}>
        <CustomText style={style.title_Beetle}>Beetle</CustomText>
        <CustomText style={style.title_bot}>bot</CustomText>
      </View>
    </View>
  );
}
