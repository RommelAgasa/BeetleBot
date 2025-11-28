import { useBleContext } from "@/src/context/BleContext";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import TopNavBar from "../components/TopNavBar";
import { settingPageStyle } from "./screen-style";

// Need to import
// import { ChevronRight } from "lucide-react-native"; // or use an icon library you prefer

export default function Setting() {

  const router = useRouter();
  const { device } = useBleContext();
  const settingItems = [
    { label: "Connection", id: "connection", route: "/search" },
    { label: "Help", id: "help", route: "/help" },
    { label: "About", id: "about", route: "/about" },
  ] as const;

  const handleSettingPress = (id: string, route: string) => {
    console.log(`Pressed: ${id}`);
    if (route) {
      if(id === "connection") {
        if(device) {
          router.push("/connection");
          return;
        }
        router.push("/search");
        return;
      }
      router.push(route as any); // or cast to the specific union type
    } else {
      console.warn(`No route defined for ${id}`);
    }
  };

  return (
    <>
      <View style={settingPageStyle.container}>
        {/** Top Navigation Bar */}
        <TopNavBar device={device}/>

        {/** Settings Header */}
        <View style={styles.settingsHeader}>
          <Text style={styles.headerTitle}>Setting</Text>
        </View>

        {/** Settings List - Scrollable */}
        <ScrollView style={styles.settingsList} showsVerticalScrollIndicator={true}>
          {settingItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={styles.settingItem}
              onPress={() => handleSettingPress(item.id, item.route)}
              activeOpacity={0.7}
            >
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  settingsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666666",
  },
  settingsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  settingLabel: {
    fontSize: 16,
    color: "#999999",
    fontWeight: "500",
  },
  chevron: {
    fontSize: 24,
    color: "#CCCCCC",
  },
});