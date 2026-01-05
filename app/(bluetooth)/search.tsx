import { useBleContext } from "@/src/context/BleContext";
import { BleService } from "@/src/services/BleService";
import CustomText from "@/src/theme/custom-theme";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import TopNavBar from "../components/TopNavBar";
import { bluetoothPageStyle } from "./screen-style";

export default function BluetoothSearch() {
  const {
    devicesMap,
    isScanning,
    scanForDevices,
    stopScan,
    tryConnectToDevice,
  } = useBleContext();

  const router = useRouter();
  const [isBleLocationDisabled, setIsBleLocationDisabled] = useState(false);

  // Check if Bluetooth and Location are enabled, then start scanning
  useEffect(() => {
    const checkAndStartScan = async () => {
      const bleService = BleService.getInstance();
      const bleManager = (bleService as any).manager;
      
      if (!bleManager) return;

      const bleState = await bleManager.state();
      const isBluetoothOn = bleState === "PoweredOn";
      const isLocationOn = Platform.OS === "android" 
        ? await Location.hasServicesEnabledAsync() 
        : true;

      if (!isBluetoothOn || !isLocationOn) {
        setIsBleLocationDisabled(true);
        Alert.alert(
          "Enable Bluetooth & Location",
          "Please make sure your Bluetooth and Location are turned on for BLE scanning."
        );
        return; // Don't start scanning if BT/Location are off
      }

      // Only start scanning if Bluetooth and Location are enabled
      setIsBleLocationDisabled(false);
      console.log("Starting BLE scan...");
      if (!isScanning) scanForDevices();
    };

    checkAndStartScan();

    return () => {
      console.log("Stopping BLE scan...");
      stopScan();
    };
  }, []);

  // Handle connect
  const handleConnect = async (d: any) => {
    await stopScan(); // stop scanning before connecting
    const ok = await tryConnectToDevice(d);
    if (ok) {
      console.log("Connected to:", d.name || "Unnamed");
      router.push("/home");
    } else {
      Alert.alert("Connection failed", "Unable to connect to this device.");
    }
  };

  // Retry Scan (debounced)
  const handleRetryScan = async () => {
    if (isScanning) return; // prevent spam
    
    // Check BT/Location before retrying
    const bleService = BleService.getInstance();
    const bleManager = (bleService as any).manager;
    
    if (!bleManager) return;

    const bleState = await bleManager.state();
    const isBluetoothOn = bleState === "PoweredOn";
    const isLocationOn = Platform.OS === "android" 
      ? await Location.hasServicesEnabledAsync() 
      : true;

    if (!isBluetoothOn || !isLocationOn) {
      setIsBleLocationDisabled(true);
      Alert.alert(
        "Enable Bluetooth & Location",
        "Please make sure your Bluetooth and Location are turned on for BLE scanning."
      );
      return;
    }

    setIsBleLocationDisabled(false);
    console.log("Retrying BLE scan...");
    await stopScan();
    scanForDevices();
  };

  return (
    <View style={bluetoothPageStyle.container}>

      {/** Top Navigation Bar */}
      <TopNavBar/>

      {/* Main Content */}
      <View style={bluetoothPageStyle.row}>
        {/* Searching Indicator */}
        <View style={bluetoothPageStyle.searching_container}>
          <View style={bluetoothPageStyle.circle}>
            <Svg width={26} height={38} viewBox="0 0 20 26" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.2284 1.55717L17.4775 4.88641C17.964 5.19998 18.25 5.6895 18.25 6.20906C18.25 6.7286 17.964 7.21814 17.4775 7.53171L9.25063 12.7499L17.4775 17.9682C17.964 18.2819 18.25 18.7713 18.25 19.2908C18.25 19.8104 17.964 20.3 17.4775 20.6135L12.2284 23.9427C11.652 24.3015 10.8861 24.35 10.2537 24.0678C9.62122 23.7857 9.23221 23.222 9.25063 22.6143V2.88558C9.23221 2.27793 9.62122 1.7143 10.2537 1.43218C10.8861 1.15007 11.652 1.19854 12.2284 1.55717Z"
                stroke="#FF9E42"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M1.25 6.25L9.25 12.25L1.25 18.25"
                stroke="#FF9E42"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>

          {/* Status + Retry Button */}
          <View style={{ alignItems: "center" }}>
            {isScanning ? (
              <>
                <ActivityIndicator color="#FF9E42" />
                <CustomText style={{ fontSize: 18, marginTop: 8 }}>
                  Scanning...
                </CustomText>
              </>
            ) : isBleLocationDisabled ? (
              <>
                <CustomText style={{ fontSize: 18, fontWeight: "bold", color: "#FF6B6B", textAlign: "center" }}>
                  Bluetooth & Location Disabled
                </CustomText>
                <CustomText style={{ fontSize: 14, color: "#888", marginTop: 8, textAlign: "center", paddingHorizontal: 20 }}>
                  Please turn on Bluetooth and Location services to scan for devices
                </CustomText>
                <Pressable
                  onPress={handleRetryScan}
                  style={{
                    marginTop: 12,
                    backgroundColor: "#FF9E42",
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <CustomText
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    Check Again
                  </CustomText>
                </Pressable>
              </>
            ) : (
              <>
                <CustomText style={{ fontSize: 20, fontWeight: "bold" }}>
                  Scan complete
                </CustomText>

                {/* Retry Button appears only after scanning stops */}
                <Pressable
                  onPress={handleRetryScan}
                  style={{
                    marginTop: 12,
                    backgroundColor: "#FF9E42",
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <CustomText
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    Retry Scan
                  </CustomText>
                </Pressable>
              </>
            )}
          </View>

        </View>

        {/* Device List */}
        <View style={bluetoothPageStyle.searched_container}>
          <ScrollView
            contentContainerStyle={bluetoothPageStyle.scrollContent}
            scrollEnabled={true}
          >
            {Array.from(devicesMap.values()).length === 0 && !isScanning ? (
              <CustomText style={{ color: "#888" }}>
                No devices found.
              </CustomText>
            ) : (
              Array.from(devicesMap.values()).map((d) => (
                <Pressable
                  key={d.id}
                  style={bluetoothPageStyle.round_rectangle}
                  onPress={() => handleConnect(d)}
                >
                  <CustomText style={{ color: "#FF9E42" }}>
                    {d.name || d.localName || "Unnamed"}
                  </CustomText>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
