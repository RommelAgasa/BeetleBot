import React from "react";
import { Text, View } from "react-native";
import Svg, { Ellipse, Path, Rect } from "react-native-svg";

export const renderIcon = (iconType: string) => {
  switch(iconType) {
    case "steering":
      return (
        <Svg width="80" height="80" viewBox="0 0 162 158" fill="none">
          <Ellipse cx="81" cy="79" rx="81" ry="79" fill="#FF880F" />
          <Ellipse cx="81" cy="79" rx="66" ry="67" fill="#e4e0e0ff" />
          <Path
            d="M45 71.638L81.61 65 116 71.638v17.15l-16.086 10.51L91.594 117h-16.64L62.194 99.298 45 88.234V71.638zM74 119h18l-1.8 15.5L92 150H74l1.8-15.5L74 119zM43 72v16l-15.5-1.6L12 88V72l15.5 1.6L43 72zM147 72v16l-15-1.6-15 1.6V72l15 1.6 15-1.6z"
            fill="#FF880F"
          />
          <Ellipse cx="80" cy="88.5" rx="13" ry="11.5" fill="#e4e0e0ff" />
        </Svg>
      );
    case "gear":
      return (
        <View style={{ alignItems: "center", display: "flex", flexDirection: "row", gap: 10 }}>
          <View style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
            <Text style={{ fontSize: 11, color: "#999999", marginBottom: 6 }}>Gear 2</Text>
            <Text style={{ fontSize: 11, color: "#999999", marginBottom: 6 }}>Gear 1</Text>
            <Text style={{ fontSize: 11, color: "#999999" }}>Reverse</Text>
          </View>
          <Svg width="42" height="99" viewBox="0 0 42 99" fill="none">
            <Rect width="42" height="99" rx="21" fill="#EEEDED"/>
            <Rect x="5" y="6" width="32" height="39" rx="16" fill="#FF9E42"/>
          </Svg>
        </View>
      );
    case "brake":
      return (
        <Svg width="85" height="68" viewBox="0 0 85 68" fill="none">
          <Path
            d="M0.393847 18.3883C-1.78663 8.98505 5.35334 4.0317e-07 15.0061 8.25107e-07L69.026 3.18639e-06C78.428 3.59736e-06 85.5123 8.55023 83.7645 17.7884L80.1299 37L77.1911 54.9266C76.0024 62.1775 69.7363 67.5 62.3887 67.5L22.6485 67.5C15.3992 67.5 9.18727 62.3156 7.89048 55.1833L4.12988 34.5L0.393847 18.3883Z"
            fill="#e8e8e8"
          />
          <Rect x="30" y="16" width="10" height="36" rx="5" fill="#FF9E42"/>
          <Rect x="45" y="16" width="10" height="36" rx="5" fill="#FF9E42"/>
        </Svg>
      );
    case "accelerator":
      return (
        <Svg width="54" height="108" viewBox="0 0 54 108" fill="none">
          <Path
            d="M3.23658 6.21415C3.11531 2.81865 5.83509 3.63698e-07 9.23276 5.12215e-07L44.3334 2.04651e-06C47.7171 2.19442e-06 50.4314 2.79635 50.3308 6.17849L48.0446 82.9932C48.0248 83.6598 48.1162 84.3249 48.3151 84.9614L53.0804 100.21C54.2877 104.074 51.4013 108 47.3535 108L6.00483 108C1.86235 108 -1.03389 103.902 0.349069 99.9969L5.63348 85.0762C5.88533 84.3651 6.00082 83.6129 5.97389 82.859L3.23658 6.21415Z"
            fill="#e8e8e8"
          />
          <Rect x="15" y="24" width="10" height="52" rx="5" fill="#FF9E42"/>
          <Rect x="30" y="24" width="10" height="52" rx="5" fill="#FF9E42"/>
        </Svg>
      );
    case "horn":
      return (
        <Svg width="75" height="85" viewBox="24 23 77 78" fill="none">
          <Path
            d="M34.653 67.413l8.444 11.227c4.233 5.63 12.268 6.676 17.803 2.319l-5.674-8.603h-3.338a10.975 10.975 0 01-10.072-6.614l-.041-.096a11.294 11.294 0 01-.4-7.906l1.242-3.914-2.521-9.926-5.328 6.883a13.707 13.707 0 00-.115 16.63zM90.147 67.413L81.703 78.64c-4.234 5.63-12.269 6.676-17.803 2.319l5.674-8.603h3.338a10.975 10.975 0 0010.071-6.614l.042-.096a11.294 11.294 0 00.4-7.906l-1.242-3.914 2.521-9.926 5.328 6.883a13.707 13.707 0 01.115 16.63z"
            fill="#FF9E42"
          />
        </Svg>
      );
    default:
      return null;
  }
};