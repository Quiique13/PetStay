import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e", timeout: 60_000, fullyParallel: false, workers: 1,
  use: { baseURL: "http://127.0.0.1:4174", trace: "retain-on-failure" },
  projects: [
    { name: "android-chromium", use: { ...devices["Pixel 7"] } },
    { name: "iphone-webkit", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "node node_modules/vite/bin/vite.js preview --mode mobile --host 127.0.0.1 --port 4174 --strictPort",
    port: 4174, reuseExistingServer: false,
  },
});
