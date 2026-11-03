import React, { createContext, useContext } from "react";
import { useDeviceData } from "../hooks/useDeviceData.js";

const HotelContext = createContext(null);

export function HotelProvider({ children }) {
  const storage = useDeviceData();
  return <HotelContext.Provider value={storage}>{children}</HotelContext.Provider>;
}

export function useHotel() {
  const storage = useContext(HotelContext);
  if (!storage) throw new Error("useHotel must be used within HotelProvider.");
  return storage;
}
