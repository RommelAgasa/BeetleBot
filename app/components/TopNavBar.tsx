import { BeetleBotLabel } from "@/src/theme/BeetleBotLabel";
import { NavbarStyle } from "@/src/theme/NavBarStyle";
import { View } from "react-native";
import Bluetooth from "../home/components/bluetooth";
import Settings from "../home/components/settings";

export default function TopNavBar({device}:any) {
    return (
        <>
            <View style={NavbarStyle.navbar_row}>
                <View style={NavbarStyle.title_container}>
                    <BeetleBotLabel />
                </View>

                <View style={NavbarStyle.bluetooth_setting_container}>
                    <View style={NavbarStyle.bluetooth}>
                        <Bluetooth device={device} />
                    </View>
                    <View style={NavbarStyle.setting}>
                        <Settings />
                    </View>
                </View>
            </View>
        </>
    );
}