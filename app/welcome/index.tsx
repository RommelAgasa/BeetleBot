import { BeetleBotLabel } from "@/src/theme/BeetleBotLabel";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

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
        <BeetleBotLabel/>
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  title_container: {
    display: "flex",
    flexDirection: "row",
    gap:2
  },
});
