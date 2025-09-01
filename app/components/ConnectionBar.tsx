import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import styles from "../styles";

export default function ConnectionBar({
  isLandscape,
  device,
  isScanning,
  disconnectDevice,
  scanForDevices,
}: {
  isLandscape: boolean;
  device: any;
  isScanning: boolean;
  disconnectDevice: () => void;
  scanForDevices: () => void;
}) {
  return (
    <View
      style={[
        styles.connBar,
        isLandscape
          ? {
              marginTop: 0,
              marginBottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }
          : { marginTop: 0, marginBottom: 0 },
      ]}
    >
      <View
        style={
          isLandscape
            ? {
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }
            : undefined
        }
      >
        {device ? (
          <View
            style={{
              flexDirection: "column",
              alignItems: "center",
              gap: 0,
              justifyContent: isLandscape ? "center" : undefined,
            }}
          >
            <Text style={styles.connectedInfoText}>
              Connected: {device.name || device.localName || "Unnamed"}
            </Text>
            <Text>({device.id})</Text>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={disconnectDevice}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={scanForDevices}
            disabled={isScanning}
          >
            <Ionicons name="bluetooth" size={20} color="#fff" />
            <Text style={styles.connectButtonText}>
              {isScanning ? "Scanning..." : "Connect"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
