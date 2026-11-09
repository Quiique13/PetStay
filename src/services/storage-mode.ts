import { Capacitor } from "@capacitor/core";

// Storage is selected at build time. A failed desktop server must never silently
// switch to an empty browser database.
export const isMobileApp = import.meta.env?.VITE_STORAGE_MODE === "mobile";
export const isNativeApp = Capacitor.isNativePlatform();
