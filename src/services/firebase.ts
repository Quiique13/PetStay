import { getApp, getApps, initializeApp } from "firebase/app";
import { Capacitor } from "@capacitor/core";
import {
  browserLocalPersistence,
  inMemoryPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth";
import { defaultFirebaseConfig } from "./firebase-config.ts";

// Firebase web configuration is public. Never put service-account credentials here.
// Environment overrides are read by Vite at build time.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    defaultFirebaseConfig.authDomain,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
};

export function createFirebaseAuth() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return initializeAuth(app, {
    persistence: Capacitor.isNativePlatform()
      ? [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence]
      : [browserLocalPersistence, inMemoryPersistence],
  });
}
