import React, { createContext, useContext, useRef } from "react";

const GestureRegistryContext = createContext<any>(null);

export const GestureRegistryProvider = ({ children }: any) => {
  const gesturesRef = useRef<Record<string, any>>({});

  const registerGesture = (name: string, gesture: any) => {
    gesturesRef.current[name] = gesture;
  };

  const getGestures = (exclude?: string) => {
    const gestures = Object.entries(gesturesRef.current)
      .filter(([key]) => key !== exclude)
      .map(([_, gesture]) => gesture);
    return gestures;
  };

  return (
    <GestureRegistryContext.Provider value={{ registerGesture, getGestures }}>
      {children}
    </GestureRegistryContext.Provider>
  );
};

export const useGestureRegistry = () => useContext(GestureRegistryContext);