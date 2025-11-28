import { useBleContext } from "@/src/context/BleContext";
import { SteeringWheelController } from "@/src/hooks/SteeringWheelController";
import { DefaultDrivingService } from "@/src/services/DefaultDrivingService";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, useWindowDimensions, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import TopNavBar from "../components/TopNavBar";
import AcceleratorButton from "./components/accelaration";
import BreakButton from "./components/break";
import ClawButton from "./components/claw";
import GearSelector from "./components/gear";
import SteeringWheel from "./components/steering-wheel";
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
  // Use shared BLE instance
  const {
    device,
    devicesMap,
    isScanning,
    scanForDevices,
    stopScan,
    connectToDevice,
    disconnectDevice,
    sendCommand,
  } = useBleContext();

  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  const [commandMap, setCommandMap] = useState({ ...DEFAULT_COMMANDS });
  const [editMap, setEditMap] = useState({ ...DEFAULT_COMMANDS });
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"about" | "help" | "advanced">("about");
  const [maxSpeed, setMaxSpeed] = useState<number>(60);

  const drivingService = useMemo(() => new DefaultDrivingService(), []);
  const driving = SteeringWheelController({
    sendCommand,
    commandMap,
    maxSpeed,
    speedStep: 10,
    drivingService,
  });

  const steeringRef = useRef(null);
  const pedalRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const handleConnect = async (d: any) => {
    await connectToDevice(d);
    setConnectedDeviceId(d.id);
    setShowDeviceModal(false);
  };

  const handleDisconnect = async () => {
    await disconnectDevice();
    setConnectedDeviceId(null);
  };

  useEffect(() => {
    if (device) {
      // Send initial commands to the device
      sendCommand("/"); 
      sendCommand(`MAX:${maxSpeed}`);
      
      // Reset driving state safely
      driving.resetDrivingState();
    }
  }, [device, sendCommand, maxSpeed]);


  useEffect(() => {
    console.log(device);

    if (!device) {
      console.log("Device disconnected — resetting driving state.");
      driving.resetDrivingState();
      //handleDisconnect(); // only if there’s no device
    }
  }, [device]);

  useEffect(() => {
    if(!device){
        Alert.alert(
        "Enable Bluetooth & Location",
        "Please make sure your Bluetooth and Location are turned on for BLE scanning."
      );
      return () => stopScan();
    }
  }, [stopScan]);

  const updateEditMapDiagonals = (baseMap: typeof DEFAULT_COMMANDS) => ({
    ...baseMap,
    FL: (baseMap.F || "") + (baseMap.L || ""),
    FR: (baseMap.F || "") + (baseMap.R || ""),
    BL: (baseMap.B || "") + (baseMap.L || ""),
    BR: (baseMap.B || "") + (baseMap.R || ""),
  });

  const openSettings = () => {
    setEditMap({ ...commandMap });
    setShowSettings(true);
    setSettingsTab("about");
  };

  const saveAdvancedSettings = () => {
    const clamped = Math.min(100, Math.max(0, maxSpeed || 0));
    if (clamped !== maxSpeed) setMaxSpeed(clamped);
    const updated = updateEditMapDiagonals(editMap);
    setCommandMap(updated);
    sendCommand(`MAX:${clamped}`);
    setShowSettings(false);
  };

  return (
    <GestureHandlerRootView>
      <View style={style.container}>

        {/** Top Navigation Bar */}
        <TopNavBar device={device}/>

        {/* MAIN CONTROLS */}
        <View style={style.row}>
          <View style={style.row2_left_container}>
            <SteeringWheel
              device={device}
              commandMap={commandMap}
              sendCommand={sendCommand}
              simultaneousHandlers={pedalRef}
              driveMode={driving.driveMode}
              onSteeringChange={(dir) => driving.handleSteeringChange(dir)}
            />
          </View>

          <View style={style.row2_right_container}>
            <View style={style.row2_right_container_left}>
              <GearSelector onGearChange={(gear) => driving.handleGearChange(gear)}/>
            </View>
            <View style={style.row2_right_container_right}>
              <View style={style.claw}>
                <ClawButton
                  clawOpen={driving.clawOpen}
                  onToggleClaw={driving.handleClawToggle}
                />
              </View>
              <View style={style.row2_right_accelaration_break_container}>
                <View style={style.break}>
                  <BreakButton
                    device={device}
                    handleBrake={() => driving.handleBrake()}
                    simultaneousHandlers={steeringRef}
                  />
                </View>
                <View style={style.acceleration}>
                  <AcceleratorButton
                    device={device}
                    handleAccelerate={() => driving.handleAccelerate()}
                    handleDecelerate={() => driving.handleDecelerate()}
                    onPedalRelease={() => driving.handlePedalRelease()}
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
