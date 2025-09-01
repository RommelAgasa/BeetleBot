import React from "react";
import { Text, View } from "react-native";
import styles from "../styles";

export default function TitleBlock() {
  return (
    <View style={styles.titleContainer}>
      <Text style={styles.labTitle}>Sorsogon Community Innovation Labs</Text>
      <Text style={styles.title}>BLE Car Controller</Text>
    </View>
  );
}
