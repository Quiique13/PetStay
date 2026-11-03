import { defineConfig } from "vite";
import tailwind from "@tailwindcss/vite";
import { localStoragePlugin } from "./server/local-store.js";

export default defineConfig({
  plugins: [tailwind(), localStoragePlugin()],
  server: {
    host: "127.0.0.1",
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/data/**"] },
  },
  preview: { host: "127.0.0.1" },
});
