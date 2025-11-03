import { StyleSheet } from "react-native";

export default StyleSheet.create({
  // ==============================
  // MAIN CONTAINER
  // ==============================
  container: {
    flex: 1,
    width: "100%",
    padding: 30,
  },

  // ==============================
  // ROW 1 — Title + Bluetooth/Settings
  // ==============================
  row1: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: "20%", // takes up 20% of the screen height
    width: "100%",
    borderWidth: 1,
  },

  title_container: {
    flexDirection: "row",
    padding: 20,
    gap: 2, // small space between Beetle and bot
    borderWidth: 1,
    width: "60%",
  },

  bluetooth_setting_container: {
    flexDirection: "row",
    width: "40%",
    display: "flex",
    justifyContent:  "center",
    alignItems: "center",
    margin: 0,
  },

  title_Beetle: {
    color: "#FF9E42",
    fontSize: 30,
    fontWeight: "500",
  },

  title_bot: {
    color: "#999999",
    fontSize: 30,
    fontWeight: "500",
  },

  bluetooth: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
  },

  setting: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  // ==============================
  //  ROW 2 — Control Section
  // (Left: Steering | Right: Gear + Claw + Accel/Break)
  // ==============================
  row2: {
    flex: 1, // fills remaining height
    flexDirection: "row",
    width: "100%",
  },

  // ----- Left side (Steering Wheel)
  row2_left_container: {
    flex: 1, // 50% width
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  // ----- Right side (Gear + Controls)
  row2_right_container: {
    flex: 1, // 50% width
    flexDirection: "row",
    borderWidth: 1,
  },

  // Gear section
  row2_right_container_left: {
    flex: 0.4, // 40% of right container
    justifyContent: "flex-end",
    alignItems: "center",
    borderWidth: 1,
  },

  // Claw + Accel/Break section
  row2_right_container_right: {
    flex: 0.6, // 60% of right container
    borderWidth: 1,
  },

  // ----- Claw panel
  claw: {
    justifyContent: "center",
    alignItems: "flex-end",
    borderWidth: 1,
    padding: 20,
    height: "40%",
  },

  // ----- Acceleration + Break (side-by-side)
  row2_right_accelaration_break_container: {
    flex: 1,
    flexDirection: "row",
  },

  acceleration: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    padding: 20,
  },

  break: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    borderWidth: 1,
    padding: 20,
  },
});
