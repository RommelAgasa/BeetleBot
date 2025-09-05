import * as ScreenOrientation from "expo-screen-orientation";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useBle } from "../hooks/useBle";
import { useDrivingControls } from "../hooks/useDrivingControls";
import ConnectionBar from "./components/ConnectionBar";
import PedalControls from "./components/PedalControls";
import SteeringWheel from "./components/SteeringWheel";
import TitleBlock from "./components/TitleBlock";
import TopBar from "./components/TopBar";
import styles from "./styles";

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

export default function App() {
  // BLE hook encapsulated logic
  const {
    device,
    devicesMap,
    isScanning,
    connectedDeviceId,
    showDeviceModal,
    setShowDeviceModal,
    scanForDevices,
    stopScan,
    connectToDevice,
    disconnectDevice,
    sendCommand,
  } = useBle();

  // Command mapping & settings state
  const [commandMap, setCommandMap] = useState({ ...DEFAULT_COMMANDS });
  const [editMap, setEditMap] = useState({ ...DEFAULT_COMMANDS });
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"about" | "help" | "advanced">(
    "about"
  );

  // Speed related configuration (max speed etc.)
  const [maxSpeed, setMaxSpeed] = useState<number>(60);

  // Driving controls hook (provides speed, driveMode, steering handlers, etc.)
  const {
    speed,
    setSpeed,
    driveMode,
    handleSteeringChange,
    handleAccelerate,
    handleReverse,
    handleDecelerate,
    handleBrake,
    handlePedalRelease,
    resetDrivingState,
  } = useDrivingControls({
    sendCommand,
    commandMap,
    maxSpeed,
    speedStep: 10,
  });

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // On device connect set baseline commands and speed (default 60)
  useEffect(() => {
    if (device) {
      sendCommand("/");
      sendCommand(`MAX:${maxSpeed}`);
      setSpeed(0);
    }
  }, [device, sendCommand, setSpeed, maxSpeed]);

  // On initial launch ensure UI speed shows 60
  useEffect(() => {
    setSpeed(60);
  }, []);

  // Reset driving state when BLE connection is lost
  useEffect(() => {
    if (!device) {
      resetDrivingState();
    }
  }, [device, resetDrivingState]);

  // Orientation lock & initial alert
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    Alert.alert(
      "Enable Bluetooth & Location",
      "Please make sure your Bluetooth and Location are turned on for BLE scanning."
    );
    return () => {
      stopScan();
    };
  }, [stopScan]);

  // Helper to update diagonal commands automatically
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

  // Gesture handler refs
  const steeringRef = useRef(null);
  const pedalRef = useRef(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
        <TopBar isLandscape={isLandscape} openSettings={openSettings} />
        {!isLandscape && <TitleBlock />}
        <ConnectionBar
          isLandscape={isLandscape}
          device={device}
          isScanning={isScanning}
          disconnectDevice={disconnectDevice}
          scanForDevices={scanForDevices}
        />
        <View style={[styles.landscapeContainer, { marginTop: 10 }]}>
          <SteeringWheel
            device={device}
            commandMap={commandMap}
            sendCommand={sendCommand}
            simultaneousHandlers={pedalRef}
            driveMode={driveMode}
            onSteeringChange={handleSteeringChange}
          />
          <PedalControls
            device={device}
            handleAccelerate={handleAccelerate}
            handleBrake={handleBrake}
            handleReverse={handleReverse}
            handleDecelerate={handleDecelerate}
            simultaneousHandlers={steeringRef}
            speed={speed}
            setSpeed={setSpeed}
            sendCommand={sendCommand}
            commandMap={commandMap}
            onPedalRelease={handlePedalRelease}
          />
        </View>
        {/* Device Selection Modal */}
        {showDeviceModal && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 100,
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 20,
                width: "90%",
                maxWidth: 420,
                minWidth: 280,
                alignItems: "stretch",
              }}
            >
              <Text style={styles.modalTitle}>Nearby Devices</Text>
              {isScanning && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <ActivityIndicator />
                  <Text style={{ marginLeft: 10 }}>Scanning...</Text>
                </View>
              )}
              <FlatList
                data={Array.from(devicesMap.values())}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 300, width: "100%" }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.deviceItem,
                      item.id === connectedDeviceId && styles.connectedDevice,
                    ]}
                    onPress={() => connectToDevice(item)}
                    disabled={item.id === connectedDeviceId}
                  >
                    <Text>
                      {item.name || item.localName || "Unnamed"} ({item.id})
                    </Text>
                    {item.id === connectedDeviceId && (
                      <Text style={{ color: "green" }}>Connected</Text>
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  !isScanning ? (
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ textAlign: "center", color: "#888" }}>
                        No devices found.
                      </Text>
                    </View>
                  ) : null
                }
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                  marginTop: 15,
                }}
              >
                <TouchableOpacity
                  style={styles.rescanButton}
                  onPress={() => {
                    stopScan();
                    scanForDevices();
                  }}
                  disabled={isScanning}
                >
                  <Text style={styles.rescanButtonText}>Refresh</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowDeviceModal(false);
                    stopScan();
                  }}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        {/* Settings Overlay */}
        {showSettings && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 100,
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 20,
                width: isLandscape ? "98%" : "92%",
                maxWidth: isLandscape ? 520 : 420,
                minWidth: 280,
                alignItems: "stretch",
                maxHeight: isLandscape ? "90%" : undefined,
              }}
            >
              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                <TouchableOpacity
                  style={[
                    styles.settingsTab,
                    settingsTab === "about" && styles.settingsTabActive,
                  ]}
                  onPress={() => setSettingsTab("about")}
                >
                  <Text style={styles.settingsTabText}>About</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.settingsTab,
                    settingsTab === "help" && styles.settingsTabActive,
                  ]}
                  onPress={() => setSettingsTab("help")}
                >
                  <Text style={styles.settingsTabText}>Help</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.settingsTab,
                    settingsTab === "advanced" && styles.settingsTabActive,
                  ]}
                  onPress={() => setSettingsTab("advanced")}
                >
                  <Text style={styles.settingsTabText}>Advanced</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={{ width: "100%" }}
                contentContainerStyle={
                  settingsTab === "advanced"
                    ? isLandscape
                      ? { paddingBottom: 24, minHeight: 320 }
                      : { paddingBottom: 12 }
                    : { paddingBottom: 12 }
                }
                horizontal={false}
                alwaysBounceVertical={true}
              >
                {settingsTab === "about" && (
                  <View>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 15,
                        color: "#023c69",
                        textAlign: "center",
                        marginBottom: 0,
                        letterSpacing: 0.2,
                      }}
                    >
                      Sorsogon Community Innovation Labs
                    </Text>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 18,
                        marginBottom: 8,
                        color: "#023c69",
                        textAlign: "center",
                      }}
                    >
                      RoboCar Controller
                    </Text>
                    <Text>
                      Version 1.0.4{"\n"}Developed for controlling BLE-enabled
                      cars via Bluetooth Low Energy.
                    </Text>
                    <Text style={{ marginTop: 10, fontWeight: "bold" }}>
                      Facebook:
                    </Text>
                    <Text
                      style={{ marginLeft: 10, color: "#1976d2" }}
                      onPress={() =>
                        Linking.openURL(
                          "https://www.facebook.com/share/g/18r6AjqyBG/"
                        )
                      }
                    >
                      Sorsogon Community Innovation Labs
                    </Text>
                    <Text
                      style={{ marginLeft: 10, color: "#1976d2" }}
                      onPress={() =>
                        Linking.openURL(
                          "https://www.facebook.com/profile.php?id=61571653147947"
                        )
                      }
                    >
                      The Workshop
                    </Text>
                    <Text style={{ marginTop: 10, fontWeight: "bold" }}>
                      Website:
                    </Text>
                    <Text
                      style={{ marginLeft: 10, color: "#1976d2" }}
                      onPress={() =>
                        Linking.openURL("http://innovationlabs.ph/")
                      }
                    >
                      Innovation Labs
                    </Text>
                  </View>
                )}
                {settingsTab === "help" && (
                  <View>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 8,
                      }}
                    >
                      Help
                    </Text>
                    <Text style={{ marginBottom: 10 }}>
                      <Text style={{ fontWeight: "bold" }}>Steering:</Text> Use
                      the steering wheel to control the car&apos;s direction
                      (left, right, center).{"\n\n"}
                      <Text style={{ fontWeight: "bold" }}>
                        Pedal Controls:
                      </Text>{" "}
                      Accelerate, brake, and reverse using the pedal buttons.
                      {"\n\n"}
                      <Text style={{ fontWeight: "bold" }}>Bluetooth:</Text> Tap
                      the Bluetooth icon to connect or disconnect from your BLE
                      car.{"\n\n"}
                      <Text style={{ fontWeight: "bold" }}>
                        Advanced Settings:
                      </Text>
                      {"\n"}• Change Max Speed and remap commands.
                      {"\n"}• Remap controller commands for each control button.
                      {"\n\n"}
                      <Text style={{ fontWeight: "bold" }}>Saving:</Text> After
                      changing settings, don&apos;t forget to tap{" "}
                      <Text style={{ fontWeight: "bold" }}>Save</Text> to apply
                      and send updates to your car.{"\n\n"}
                    </Text>
                  </View>
                )}
                {settingsTab === "advanced" && (
                  <View>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 4,
                      }}
                    >
                      Speed Settings
                    </Text>
                    <Text style={{ marginBottom: 5 }}>
                      You can change and tune the speed of your car. {"\n"}
                    </Text>
                    <View style={{ marginBottom: 12 }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text style={{ fontWeight: "bold" }}>Speed</Text>
                        <Text
                          style={{ color: "#888", fontSize: 12, marginLeft: 8 }}
                        >
                          (Max: 100)
                        </Text>
                      </View>
                      <TextInput
                        style={styles.commandInput}
                        keyboardType="numeric"
                        value={String(maxSpeed)}
                        onChangeText={(v) => {
                          const num = Number(v.replace(/[^0-9]/g, ""));
                          if (isNaN(num)) {
                            setMaxSpeed(0);
                            return;
                          }
                          const clamped = Math.min(100, Math.max(0, num));
                          setMaxSpeed(clamped);
                        }}
                        maxLength={3}
                        placeholder="0-100"
                        placeholderTextColor="#666"
                        selectionColor="#1976d2"
                        cursorColor="#1976d2"
                      />
                    </View>
                    {/* Removed Turn Speed and Speed Step settings */}
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 16,
                        marginBottom: 4,
                        marginTop: 16,
                      }}
                    >
                      Command Mapping
                    </Text>
                    <Text style={{ marginBottom: 5 }}>
                      You can change the BLE command sent for each control.
                      {"\n"}
                    </Text>
                    <View
                      style={{
                        flexDirection: "column",
                        flexWrap: "nowrap",
                        gap: 12,
                        justifyContent: "flex-start",
                      }}
                    >
                      {Object.entries(DEFAULT_COMMANDS)
                        .filter(
                          ([key]) => !["FL", "FR", "BL", "BR"].includes(key)
                        )
                        .map(([key, defVal]) => (
                          <View
                            key={key}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 6,
                            }}
                          >
                            <Text style={{ width: 90 }}>
                              {key === "F" && "Forward"}
                              {key === "B" && "Backward"}
                              {key === "L" && "Left"}
                              {key === "R" && "Right"}
                              {key === "S" && "Stop"}
                              {key === "+" && "Speed Up"}
                              {key === "-" && "Speed Down"}
                            </Text>
                            <TextInput
                              style={styles.commandInput}
                              value={
                                editMap[key as keyof typeof DEFAULT_COMMANDS]
                              }
                              onChangeText={(v) =>
                                setEditMap((prev) => {
                                  const next = {
                                    ...prev,
                                    [key]: v,
                                  } as typeof editMap;
                                  if (["F", "B", "L", "R"].includes(key)) {
                                    return updateEditMapDiagonals(next);
                                  }
                                  return next;
                                })
                              }
                              autoCapitalize="characters"
                              maxLength={12}
                            />
                            <Text style={{ color: "#888", marginLeft: 6 }}>
                              (Default: {defVal})
                            </Text>
                          </View>
                        ))}
                    </View>
                    <Text style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
                      Note: If you change the command (e.g., from F to UP), make
                      sure your Arduino code or device firmware is updated to
                      recognize and respond to the new command.
                    </Text>
                  </View>
                )}
              </ScrollView>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 12,
                  gap: 10,
                }}
              >
                {settingsTab === "advanced" && (
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveAdvancedSettings}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
