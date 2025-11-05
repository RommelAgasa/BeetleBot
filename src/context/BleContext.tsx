import React, { createContext, ReactNode, useContext } from "react";
import { useBle } from "../hooks/UseBle";

// Get the return type of useBle for automatic typing
export type BleContextType = ReturnType<typeof useBle>;

// Create the context with correct type (or null initially)
const BleContext = createContext<BleContextType | null>(null);

interface BleProviderProps {
  children: ReactNode;
}

export const BleProvider: React.FC<BleProviderProps> = ({ children }) => {
  const ble = useBle(); // Single shared BLE instance
  return <BleContext.Provider value={ble}>{children}</BleContext.Provider>;
};

export const useBleContext = (): BleContextType => {
  const context = useContext(BleContext);
  if (!context) {
    throw new Error("useBleContext must be used inside a BleProvider");
  }
  return context;
};
