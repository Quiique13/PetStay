import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useDeviceData } from "../hooks/useDeviceData.ts";
import { useAuth } from "./AuthContext.tsx";

const HotelContext = createContext<ReturnType<typeof useDeviceData> | null>(
  null,
);

export function HotelProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) throw new Error("HotelProvider requires a signed-in account.");
  const storage = useDeviceData(user);
  return (
    <HotelContext.Provider value={storage}>{children}</HotelContext.Provider>
  );
}

export function useHotel() {
  const storage = useContext(HotelContext);
  if (!storage) throw new Error("useHotel must be used within HotelProvider.");
  return storage;
}
