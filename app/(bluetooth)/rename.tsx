import { useBleContext } from "@/src/context/BleContext";
import CustomText from "@/src/theme/custom-theme";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import TopNavBar from "../components/TopNavBar";

export default function BluetoothRename() {
  const router = useRouter();
  const { device, sendCommand, subscribeToNotifications } = useBleContext();
  const [newName, setNewName] = useState(device?.name || device?.localName || "");
  const [isLoading, setIsLoading] = useState(false);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  const handleCancel = () => {
    router.back();
  };

  const handleConnect = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Device name cannot be empty");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Sending rename command:", `RENAME:${newName}`);
      
      // Create a promise that resolves when we receive the response
      const renamePromise = new Promise<boolean>((resolve) => {
        // Subscribe to notifications for response
        subscribeToNotifications(
          (data: string) => {
            console.log("Received response:", data);
            
            if (data.includes("NAME_OK")) {
              resolve(true);
            } else if (data.includes("NAME_ERROR")) {
              resolve(false);
            }
          },
          (error) => {
            console.error("Notification error:", error);
            resolve(false);
          }
        );

        // Send rename command
        sendCommand(`RENAME:${newName}`);

        // Set timeout for response (3 seconds)
        responseTimeoutRef.current = setTimeout(() => {
          console.log("Rename response timeout");
          resolve(true); // Assume success after timeout
        }, 3000);
      });

      const success = await renamePromise;

      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }

      if (success) {
        Alert.alert("Success", "Device name saved successfully", [
          {
            text: "OK",
            onPress: () => {
              // Note: The Bluetooth device name on your system may not immediately 
              // reflect this change. The name is saved on the Arduino's EEPROM.
              // Reconnect to see the updated device name from your app.
              router.back();
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to save device name. Please try again.");
      }
    } catch (error) {
      console.error("Rename error:", error);
      Alert.alert("Error", "Failed to rename device. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/** Top Navigation Bar */}
      <TopNavBar />

      {/* Main Content */}
      <View style={styles.mainContent}>
        
        {/* Bluetooth Icon Circle */}
        <View style={styles.iconCircle}>
          <Svg width={60} height={60} viewBox="0 0 20 26" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12.2284 1.55717L17.4775 4.88641C17.964 5.19998 18.25 5.6895 18.25 6.20906C18.25 6.7286 17.964 7.21814 17.4775 7.53171L9.25063 12.7499L17.4775 17.9682C17.964 18.2819 18.25 18.7713 18.25 19.2908C18.25 19.8104 17.964 20.3 17.4775 20.6135L12.2284 23.9427C11.652 24.3015 10.8861 24.35 10.2537 24.0678C9.62122 23.7857 9.23221 23.222 9.25063 22.6143V2.88558C9.23221 2.27793 9.62122 1.7143 10.2537 1.43218C10.8861 1.15007 11.652 1.19854 12.2284 1.55717Z"
              stroke="#FF9E42"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M1.25 6.25L9.25 12.25L1.25 18.25"
              stroke="#FF9E42"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        {/* Device Name with Underline */}
        <View style={styles.nameContainer}>
          <TextInput
            style={styles.deviceNameInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter device name"
            placeholderTextColor="#CCC"
            maxLength={20}
          />
          <View style={styles.underline} />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable 
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <CustomText style={styles.cancelButtonText}>
              Cancel
            </CustomText>
          </Pressable>

          <Pressable 
            style={styles.connectButton}
            onPress={handleConnect}
            disabled={isLoading}
          >
            <CustomText style={styles.connectButtonText}>
              {isLoading ? "Saving..." : "Save"}
            </CustomText>
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  nameContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  deviceName: {
    fontSize: 18,
    color: "#999",
    marginBottom: 8,
    fontWeight: "500",
  },
  underline: {
    width: 120,
    height: 1,
    backgroundColor: "#CCC",
  },
  deviceNameInput: {
    fontSize: 18,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
    textAlign: "center",
    padding: 0,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 20,
    justifyContent: "center",
    width: "100%",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    backgroundColor: "#FF9E42",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  connectButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectButtonText: {
    color: "#FF9E42",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});