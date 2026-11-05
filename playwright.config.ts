import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

const port = Number(process.env.E2E_PORT ?? 3100);
const preinstalled = "/opt/pw-browsers/chromium";
const executablePath = process.env.PW_CHROMIUM_PATH ?? (fs.existsSync(preinstalled) ? preinstalled : undefined);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure", launchOptions: executablePath ? { executablePath } : {} },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /responsive\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: {
    command: process.env.E2E_SERVER_COMMAND ?? `npx next start -p ${port}`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { PAYMENTS_MODE: "test", AI_PROVIDER: "none", PAYU_CLIENT_ID: "", PAYU_MERCHANT_ID: "", BETTER_AUTH_URL: `http://localhost:${port}`, TRUSTED_ORIGINS: `http://localhost:${port}` },
  },
});
