import { defineConfig } from "vite";
import tailwind from "@tailwindcss/vite";
import { localStoragePlugin } from "./server/local-store.ts";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const mobile = mode === "mobile";
  return {
  base: mobile ? (process.env.PETSTAY_MOBILE_BASE ?? "./") : "/",
  define: { "import.meta.env.VITE_STORAGE_MODE": JSON.stringify(mobile ? "mobile" : "desktop") },
  build: { outDir: mobile ? "dist-mobile" : "dist" },
  plugins: [tailwind(), ...(!mobile ? [localStoragePlugin()] : []), VitePWA({
    disable: !mobile,
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
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/data/**"] },
  },
  preview: { host: "127.0.0.1" },
  };
});
