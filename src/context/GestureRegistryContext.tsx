import React, { createContext, useContext, useRef } from "react";

type GestureRegistry = {
  steeringGesture: React.MutableRefObject<any>;
  acceleratorGesture: React.MutableRefObject<any>;
};

const GestureRegistryContext = createContext<GestureRegistry | null>(null);

export function GestureRegistryProvider({ children }: { children: React.ReactNode }) {
  const steeringGesture = useRef<any>(null);
  const acceleratorGesture = useRef<any>(null);

  return (
    <GestureRegistryContext.Provider value={{ steeringGesture, acceleratorGesture }}>
      {children}
    </GestureRegistryContext.Provider>
  );
}

export function useGestureRegistry() {
  const context = useContext(GestureRegistryContext);
  if (!context) throw new Error("useGestureRegistry must be used within GestureRegistryProvider");
  return context;
}
