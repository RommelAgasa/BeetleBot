import { BeetleBotLabel } from "@/src/theme/BeetleBotLabel";
import CustomText from "@/src/theme/custom-theme";
import { NavbarStyle } from "@/src/theme/NavBarStyle";
import { Link } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import Bluetooth from "../home/components/bluetooth";
import Settings from "../home/components/settings";
import { bluetoothPageStyle } from "./screen-style";

export default function BluetoothSearch() {
  // Mock data - replace with your actual data
  const bluetoothDevices = [
    { id: 1, name: "Beetlebot 1" },
    { id: 2, name: "Beetlebot 2" },
    { id: 3, name: "Beetlebot 1" },
    { id: 4, name: "Beetlebot 2" },
    { id: 5, name: "Beetlebot 1" },
    { id: 6, name: "Beetlebot 2" },
    { id: 7, name: "Beetlebot 2" },
    { id: 8, name: "Beetlebot 2" },
    { id: 9, name: "Beetlebot 2" },
    { id: 10, name: "Beetlebot 2" },
    { id: 11, name: "Beetlebot 2" },
    { id: 12, name: "Beetlebot 2" },
    // Add more as needed
  ];

  return (
    <> 
      <View style={bluetoothPageStyle.container}>
        {/** Navbar */}
        <View style={NavbarStyle.navbar_row}>
          <View style={NavbarStyle.title_container}>
            <BeetleBotLabel/>
          </View>
          <View style={NavbarStyle.bluetooth_setting_container}>
            <View style={NavbarStyle.bluetooth}>
              <Bluetooth />
            </View>
            <View style={NavbarStyle.setting}>
              <Settings/>
            </View>
          </View>
        </View>

        {/** Main Content */}
        <View style={bluetoothPageStyle.row}>
          
          {/** LEFT - Searching */}
          <View style={bluetoothPageStyle.searching_container}>
            <View style={bluetoothPageStyle.circle}>
              <Svg width={26} height={48} viewBox="0 0 20 26" fill="none">
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
            <CustomText style={{fontSize: 20, fontWeight: "bold"}}>Searching ...</CustomText>
          </View>

          {/** RIGHT - Searched Results with ScrollView */}
          <View style={bluetoothPageStyle.searched_container}>
            <ScrollView 
              contentContainerStyle={bluetoothPageStyle.scrollContent}
              scrollEnabled={true}
            >
              {bluetoothDevices.map((device) => (
                <Link key={device.id} href="/" asChild>
                  <Pressable style={bluetoothPageStyle.round_rectangle}>
                    <CustomText style={{color: "#FF9E42"}}>
                      {device.name}
                    </CustomText>
                  </Pressable>
                </Link>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </>
  );
}