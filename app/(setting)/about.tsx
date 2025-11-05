import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import TopNavBar from "../components/TopNavBar";
import { settingPageStyle } from "./screen-style";

export default function SettingAbout() {
  const navigation = useNavigation();

  const handleSettingPress = () => {
    navigation.goBack();
  };

  return (
    <>
      <View style={settingPageStyle.container}>
        {/** Top Navigation Bar */}
        <TopNavBar />

        {/** Breadcrumb */}
        <View style={styles.breadcrumb}>
          <TouchableOpacity onPress={handleSettingPress}>
            <Text style={styles.breadcrumbLink}>Setting</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbText}> / About</Text>
        </View>

        {/** Beetlebot Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beetlebot Controller</Text>
          <View style={styles.detailsContainer}>
            <View>
              <Text style={styles.label}>Version: 2.0.0-beta</Text>
              <Text style={styles.label}>Last Update: Date</Text>
            </View>
          </View>
        </View>

        {/** Developed By Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developed By</Text>
          <View style={styles.detailsContainer}>
            <Text style={styles.italicText}>Sorsogon Community Innovation-Labs Inc.</Text>
            <Text style={styles.italicText}>Creators: Community Members</Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  breadcrumb: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  breadcrumbLink: {
    fontSize: 18,
    color: "#4A90E2",
    fontWeight: "500",
  },
  breadcrumbText: {
    fontSize: 18,
    color: "#999999",
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999999",
    marginBottom: 12,
  },
  detailsContainer: {
    marginLeft: 8,
  },
  label: {
    fontSize: 13,
    color: "#999999",
    marginBottom: 4,
  },
  italicText: {
    fontSize: 13,
    color: "#999999",
    fontStyle: "italic",
    marginBottom: 4,
  },
});