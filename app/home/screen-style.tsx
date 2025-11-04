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
  //  ROW  — Control Section
  // (Left: Steering | Right: Gear + Claw + Accel/Break)
  // ==============================
  row: {
    flex: 1, // fills remaining height
    flexDirection: "row",
    width: "100%",
  },

  // ----- Left side (Steering Wheel)
  row2_left_container: {
    flex: 1, // 50% width
    justifyContent: "flex-end",
    alignItems: "flex-start",
    paddingBottom: 30,
    paddingLeft: 30,
  },

  // ----- Right side (Gear + Controls)
  row2_right_container: {
    flex: 1, // 50% width
    flexDirection: "row",
  },

  // Gear section
  row2_right_container_left: {
    flex: 0.4, // 40% of right container
    justifyContent: "flex-end",
    alignItems: "center",
  },

  // Claw + Accel/Break section
  row2_right_container_right: {
    flex: 0.6, // 60% of right container
  },

  // ----- Claw panel
  claw: {
    justifyContent: "center",
    alignItems: "flex-end",
    padding: 20,
    height: "50%",
  },

  // ----- Acceleration + Break (side-by-side)
  row2_right_accelaration_break_container: {
    flex: 1,
    flexDirection: "row",
  },

  acceleration: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 20,
  },

  break: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 20,
  },
});
