import { StyleSheet } from "react-native";

export const bluetoothPageStyle = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    padding: 30,
  },
  row: {
    flex: 1,
    flexDirection: "column",
    width: "100%",
    gap: 40,
  },
  // LEFT SIDE - Searching
  searching_container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: 100,
  },
  circle: {
    backgroundColor: "white",
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 15,
  },
  // RIGHT SIDE - Searched Results with ScrollView
  searched_container: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 30,
    padding: 20,
  },
  round_rectangle: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: 120,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});