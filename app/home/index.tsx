import { BeetleBotLabel } from "@/src/theme/BeetleBotLabel";
import { NavbarStyle } from "@/src/theme/NavBarStyle";
import { View } from "react-native";
import AccelaratorButton from "./components/accelaration";
import Bluetooth from "./components/bluetooth";
import BreakButton from "./components/break";
import ClawButton from "./components/claw";
import GearSelector from "./components/gear";
import Settings from "./components/settings";
import SteeringWheel from "./components/steering-wheel";
import style from "./screen-style";


export default function Home(){
    return (
        <>
            <View style={style.container}>
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

                <View style={style.row}>
                    <View style={style.row2_left_container}>
                        <SteeringWheel onAngleChange={(angle) => console.log( angle)}/>
                    </View>
                    <View style={style.row2_right_container}>
                        <View style={style.row2_right_container_left}>
                            <GearSelector/>
                        </View>
                        <View style={style.row2_right_container_right}>
                            <View style={style.claw}>
                                <ClawButton/>
                            </View>
                            <View style={style.row2_right_accelaration_break_container}>
                                <View style={style.break}>
                                    <View style={{ display: "flex", justifyContent: "flex-end", alignItems: "center"}}>
                                        <BreakButton/>
                                    </View>
                                </View>
                                <View style={style.acceleration}>
                                    <View style={{ display: "flex", justifyContent: "flex-end", alignItems: "center"}}>
                                        <AccelaratorButton/>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </>
    );
}