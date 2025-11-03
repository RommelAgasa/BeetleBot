import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  title_container: {
    display: "flex",
    flexDirection: "row",
    gap:2
  },
  title_Beetle: {
    color: "#FF9E42",
    fontSize: 30,
    fontWeight: 500,
    marginBottom: 10,
    marginRight: 0,
  },
  title_bot: {
    fontSize: 30,
    fontWeight: 500,
    marginBottom: 10,
    marginLeft: 0,
  },
  subtitle: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#00bcd4",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
