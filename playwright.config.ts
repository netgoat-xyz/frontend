import { defineConfig, devices } from "@playwright/test";

const projectRoot = process.cwd();
const port = process.env.PORT ?? "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const useExternalServer = process.env.PW_EXTERNAL_SERVER === "1";

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: {
    timeout: 20_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    browserName: "chromium",
    channel: "msedge",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "edge",
      use: { ...devices["Desktop Edge"] },
    },
  ],
  webServer: useExternalServer
    ? undefined
    : {
        command: "npm run dev",
        cwd: projectRoot,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
