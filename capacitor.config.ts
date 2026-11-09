import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.app.petstay",
  appName: "PetStay",
  webDir: "dist-android",
  plugins: {
    FirebaseAuthentication: {
      // Keep React's Firebase session as the source of identity and persistence.
      skipNativeAuth: true,
      providers: ["google.com"],
    },
  },
};

export default config;
