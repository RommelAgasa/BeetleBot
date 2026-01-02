import { useBleContext } from "@/src/context/BleContext";
import { SteeringWheelController } from "@/src/hooks/SteeringWheelController";
import { DefaultDrivingService } from "@/src/services/DefaultDrivingService";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import TopNavBar from "../components/TopNavBar";
import AcceleratorButton from "./components/accelaration";
import BreakButton from "./components/break";
import ClawButton from "./components/claw";
import GearSelector from "./components/gear";
import SliderReplacement from "./components/SliderReplacement";
import style from "./screen-style";



const DEFAULT_COMMANDS = {
  F: "F",
  B: "B",
  L: "L",
  R: "R",
  S: "S",
  "+": "+",
  "-": "-",
  FL: "FL",
  FR: "FR",
  BL: "BL",
  BR: "BR",
};

export default function Home() {
  const {
    device,
    stopScan,
    sendCommand,
  } = useBleContext();

  const [commandMap, setCommandMap] = useState({ ...DEFAULT_COMMANDS });
  const [maxSpeed, setMaxSpeed] = useState<number>(100);

  const steeringGestureRef = useRef<any>(undefined);
  const acceleratorGestureRef = useRef<any>(undefined);

  const drivingService = useMemo(() => new DefaultDrivingService(), []);
  const driving = SteeringWheelController({
    sendCommand,
    commandMap,
    maxSpeed,
    speedStep: 10,
    drivingService,
  });

  useEffect(() => {
    if (device) {
      sendCommand("/");
      sendCommand(`MAX:${maxSpeed}`);
      driving.resetDrivingState();
    }
  }, [device, sendCommand, maxSpeed]);

  useEffect(() => {
    if (!device) {
      console.log("Device disconnected — resetting driving state.");
      driving.resetDrivingState();
    }
  }, [device]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[style.container, { flex: 1 }]}>
        <TopNavBar device={device} />

        <View style={style.row}>
          <View style={style.row2_left_container}>
            {/* Temporary Slider replacement for SteeringWheel to test multitouch */}
            <SliderReplacement
              device={device}
              value={0}
              onValueChange={(v: number) => {
                driving.handleSteeringChange(v);
              }}
              gestureRef={steeringGestureRef}
              simultaneousGestureRef={acceleratorGestureRef}
            />
          </View>

          <View style={style.row2_right_container}>
            <View style={style.row2_right_container_left}>
              <GearSelector
                onGearChange={(gear) => driving.handleGearChange(gear)}
                disabled={!device}
              />
            </View>

            <View style={style.row2_right_container_right}>
              <View style={style.claw}>
                <ClawButton
                  clawOpen={driving.clawOpen}
                  onToggleClaw={driving.handleClawToggle}
                  disabled={!device}
                />
              </View>

              <View style={style.row2_right_accelaration_break_container}>
                <View style={style.break}>
                  <BreakButton
                    device={device}
                    handleBrake={() => driving.handleBrake()}
                  />
                </View>

                <View style={style.acceleration}>
                  <AcceleratorButton
                    device={device}
                    handleAccelerate={() => driving.handleAccelerate()}
                    handleDecelerate={() => driving.handleMaintainSpeed()}
                    gestureRef={acceleratorGestureRef}
                    simultaneousGestureRef={steeringGestureRef}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}