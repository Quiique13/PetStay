import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e-cloud", timeout: 90_000, workers: 1,
  use: { baseURL: "http://127.0.0.1:4175", trace: "retain-on-failure", serviceWorkers: "block" },
  projects: [
    { name: "cloud-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "cloud-webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: { command: "node node_modules/vite/bin/vite.js preview --mode cloud-test --host 127.0.0.1 --port 4175 --strictPort", port: 4175, reuseExistingServer: false },
});
