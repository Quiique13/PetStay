import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useDeviceData } from "../hooks/useDeviceData.ts";

const HotelContext = createContext<ReturnType<typeof useDeviceData> | null>(null);

export function HotelProvider({ children }: { children: ReactNode }) {
  const storage = useDeviceData();
  return <HotelContext.Provider value={storage}>{children}</HotelContext.Provider>;
}

export function useHotel() {
  const storage = useContext(HotelContext);
  if (!storage) throw new Error("useHotel must be used within HotelProvider.");
  return storage;
}
