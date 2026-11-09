// @ts-check
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.AIG_BASE_URL || "http://192.168.7.112:4000";

export default defineConfig({
  testDir: "./scripts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  timeout: 180000,
  expect: { timeout: 15000 },
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    video: process.env.AIG_VIDEO === "on" ? "on" : "off",
    screenshot: "only-on-failure",
    ignoreHTTPSErrors: true,
    actionTimeout: 20000,
    navigationTimeout: 45000,
    viewport: { width: 1600, height: 1000 },
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.AIG_BROWSER === "chromium" ? undefined : "chrome",
      },
    },
  ],
});
