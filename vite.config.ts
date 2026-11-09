import { defineConfig } from "vite";
import tailwind from "@tailwindcss/vite";
import { localStoragePlugin } from "./server/local-store.ts";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig(({ mode }) => {
  const android = mode === "android";
  const mobile = mode === "mobile" || mode === "mobile-test" || mode === "cloud-test" || android;
  return {
  base: android ? "./" : mobile ? (process.env.PETSTAY_MOBILE_BASE ?? "./") : "/",
  define: {
    "import.meta.env.VITE_STORAGE_MODE": JSON.stringify(mobile ? "mobile" : "desktop"),
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(version),
  },
  build: { outDir: android ? "dist-android" : mobile ? "dist-mobile" : "dist" },
  // Scan the application entry only, not generated Android/release HTML files.
  optimizeDeps: { entries: ["index.html"] },
  plugins: [tailwind(), ...(!mobile ? [localStoragePlugin()] : []), VitePWA({
    disable: !mobile || android,
    registerType: "prompt",
    injectRegister: false,
    includeAssets: ["icons/*.png", "icons/*.svg"],
    manifest: {
      id: ".", name: "PetStay", short_name: "PetStay", lang: "pt-PT",
      description: "O seu hotel para animais, sempre consigo.",
      start_url: ".", scope: ".", display: "standalone",
      theme_color: "#724326", background_color: "#faf8f3",
      icons: [
        { src: "icons/petstay-192.png", sizes: "192x192", type: "image/png" },
        { src: "icons/petstay-512.png", sizes: "512x512", type: "image/png" },
        { src: "icons/petstay-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,png,svg,woff2,jpg,webp}"],
      navigateFallback: "index.html",
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },
  })],
  server: {
    host: "127.0.0.1",
    watch: { ignored: ["**/android/**", "**/dist*/**", "**/release/**", "**/.android-tools/**"] },
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/data/**"] },
  },
  preview: { host: "127.0.0.1" },
  };
});
