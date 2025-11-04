import { StyleSheet } from "react-native";

export const NavbarStyle = StyleSheet.create({
    
  // ==============================
  // NavBar — Title + Bluetooth/Settings
  // ==============================
  navbar_row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: "20%", // takes up 20% of the screen height
    width: "100%",
  },

  title_container: {
    flexDirection: "row",
    padding: 20,
    gap: 2, // small space between Beetle and bot
    width: "60%",
    flex: 1,
  },

  bluetooth_setting_container: {
    flexDirection: "row",
    width: "40%",
    display: "flex",
    justifyContent:  "center",
    alignItems: "center",
    margin: 0,
    gap: 15,
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
  },
});