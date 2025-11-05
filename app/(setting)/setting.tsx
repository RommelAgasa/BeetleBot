import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import TopNavBar from "../components/TopNavBar";
import { settingPageStyle } from "./screen-style";

// Need to import
// import { ChevronRight } from "lucide-react-native"; // or use an icon library you prefer

export default function Setting() {

  const router = useRouter();

  const settingItems = [
    { label: "Connect Beetlebot", id: "connect", route: "/"},
    { label: "Help", id: "help", route: "/help"},
    { label: "About", id: "about", route: "/about" },
  ];

  const handleSettingPress = (id: string, route: string) => {
    // Handle navigation or action based on setting item
    console.log(`Pressed: ${id}`);
    if (route) {
      router.push(route);
      } else {
        console.warn(`No route defined for ${id}`);
    }
  };

  return (
    <>
      <View style={settingPageStyle.container}>
        {/** Top Navigation Bar */}
        <TopNavBar />

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