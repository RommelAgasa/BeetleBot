import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import styles from "../styles";

export default function TopBar({
  isLandscape,
  openSettings,
}: {
  isLandscape: boolean;
  openSettings: () => void;
}) {
  return (
    <View
      style={[
        styles.topBar,
        isLandscape && {
          flexDirection: "row",
          alignItems: "flex-start",
          paddingTop: 18,
        },
        !isLandscape && { marginTop: 18 },
      ]}
    >
      {isLandscape ? (
        <>
          <TouchableOpacity
            style={[
              styles.settingsButton,
              { alignSelf: "flex-start", marginTop: 8 },
            ]}
            onPress={openSettings}
          >
            <Ionicons name="settings-outline" size={28} color="#333" />
          </TouchableOpacity>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <Text style={styles.labTitle}>
              Sorsogon Community Innovation Labs
            </Text>
            <Text
              style={[
                styles.title,
                { marginTop: 2, marginBottom: 0, textAlign: "center" },
              ]}
            >
              RoboCar Controller
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </>
      ) : (
        <>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={openSettings}
          >
            <Ionicons name="settings-outline" size={28} color="#333" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
