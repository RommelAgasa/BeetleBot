import React from "react";
import { Text, TextProps, TextStyle } from "react-native";

interface CustomTextProps extends TextProps {
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

export default function CustomText({ style, children, ...props }: CustomTextProps) {
  return (
    <Text
      {...props}
      style={[{ fontFamily: "InstrumentSans_400Regular", color: "#999999"}, style]}
    >
      {children}
    </Text>
  );
}
