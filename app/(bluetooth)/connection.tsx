import { useBleContext } from "@/src/context/BleContext";
import CustomText from "@/src/theme/custom-theme";
import { useRouter } from "expo-router";
import {
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import TopNavBar from "../components/TopNavBar";

export default function BluetoothConnection() {
  const router = useRouter();
  const { device, disconnectDevice } = useBleContext();

  const handleDisconnect = async () => {
    await disconnectDevice();
    router.back(); // Navigate back to previous screen or search
  };

  const deviceName = device?.name || device?.localName || "Unknown Device";

  const handleBackToController = () => {
    router.push("/home");
  }

  const handleRename = () => {
    router.push("/rename");
  }

  return (
    <View style={styles.container}>
      {/** Top Navigation Bar */}
      <TopNavBar device={device}/>

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

        {/* Connection Status Text */}
        <CustomText style={styles.statusText}>
          Connected to {deviceName}
        </CustomText>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable 
            style={styles.actionButton}
            onPress={handleDisconnect}
          >
            <CustomText style={styles.actionButtonText}>
              Disconnect
            </CustomText>
          </Pressable>

          <Pressable 
            style={styles.actionButton}
            onPress={handleRename}>
            <CustomText style={styles.actionButtonText}>
              Rename
            </CustomText>
          </Pressable>

          <Pressable 
            style={styles.actionButton}
            onPress={handleBackToController}>
            <CustomText style={styles.actionButtonText}>
              Controller
            </CustomText>
          </Pressable>
        </View>

      </View>
    </View>
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
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statusText: {
    fontSize: 18,
    color: "#999",
    marginBottom: 40,
    fontWeight: "500",
    textAlign: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 20,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  actionButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: "#FF9E42",
    fontSize: 16,
    fontWeight: "600",
  },
});