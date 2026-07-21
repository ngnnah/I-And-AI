import { defineConfig } from "@playwright/test";

// Solo static game: serve over HTTP so ES module imports resolve (file:// blocks them).
export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8099",
    headless: true,
  },
  webServer: {
    command: "python3 -m http.server 8099",
    url: "http://127.0.0.1:8099/index.html",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
