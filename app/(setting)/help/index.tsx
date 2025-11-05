import { useNavigation } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import TopNavBar from "../../components/TopNavBar";
import { settingPageStyle } from "../screen-style";
import { helpItems } from "./data";
import { renderIcon } from "./icons";

export default function SettingHelp() {
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
          <Text style={styles.breadcrumbText}> / Help</Text>
        </View>

        {/** Help Content - Scrollable */}
        <ScrollView style={styles.contentContainer}>
          {/* Icon Grid Section */}
          <View style={styles.iconGridContainer}>
            <View style={styles.iconGrid}>
              {helpItems.map((item) => (
                <View key={item.id} style={styles.iconWrapper}>
                  <View style={styles.iconBox}>
                    {renderIcon(item.icon)}
                  </View>
                  <View style={{ marginTop: 20}}>
                    <Text style={styles.iconLabel}>{item.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            {helpItems.map((item, index) => (
              <View key={item.id} style={[styles.helpItem, index % 2 === 0 && styles.leftColumn]}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                
                <Text style={styles.sectionLabel}>Purpose:</Text>
                <Text style={styles.sectionText}>{item.purpose}</Text>
                
                <Text style={styles.sectionLabel}>Function:</Text>
                {item.functions.map((func, funcIndex) => (
                  <Text key={funcIndex} style={styles.bulletPoint}>
                    • {func}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
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
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "500",
  },
  breadcrumbText: {
    fontSize: 14,
    color: "#999999",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  iconGridContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  iconGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconWrapper: {
    alignItems: "center",
    flex: 1,
  },
  iconBox: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  iconLabel: {
    fontSize: 11,
    color: "#666666",
    textAlign: "center",
  },
  detailsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  helpItem: {
    width: "50%",
    paddingRight: 8,
    marginBottom: 20,
  },
  leftColumn: {
    paddingRight: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF9E42",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333333",
    marginTop: 6,
    marginBottom: 3,
  },
  sectionText: {
    fontSize: 11,
    color: "#999999",
    lineHeight: 15,
    marginBottom: 4,
  },
  bulletPoint: {
    fontSize: 11,
    color: "#999999",
    lineHeight: 15,
    marginLeft: 4,
    marginBottom: 2,
  },
});