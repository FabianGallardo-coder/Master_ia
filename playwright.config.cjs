// Playwright Configuration for Maestro IA E2E Testing
// Runs the static server (node server.js) via Playwright's webServer option
// and exercises the app in a real browser against http://localhost:8081.
// This replaces the plain browser-project setup, which bypassed Electron and
// never actually served the app under test.
const { devices } = require('@playwright/test');

module.exports = {
  // Directories where tests live - E2E only
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',

  // Per-test timeout
  timeout: 30000,

  // Single static server on 8081: avoid parallel projects fighting for the port.
  fullyParallel: false,

  // Fail the build in CI if a test is marked .only()
  forbidOnly: !!process.env.CI,

  // Retry flakes in CI, none locally
  retries: process.env.CI ? 2 : 0,

  // One worker on CI; let Playwright pick locally
  workers: process.env.CI ? 1 : undefined,

  // Reporters: list to stdout, html report (never auto-open)
  reporter: [['list'], ['html', { open: 'never' }]],

  // webServer: Playwright starts `node server.js` before the suite and waits
  // for http://localhost:8081 to respond. Reuse a running server locally
  // (faster iteration); always start fresh on CI for determinism.
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  projects: [
    {
      // Main project: real Chromium against the live server on 8081.
      name: 'chromium-server',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8081',
      },
    },
    // Electron project is opt-in because launching a second long-lived process
    // alongside webServer is expensive and most E2E flows only need the
    // browser. Enable with RUN_ELECTRON_E2E=1 when you need to verify the
    // Electron shell itself.
    ...(process.env.RUN_ELECTRON_E2E
      ? [
          {
            name: 'electron',
            testMatch: '**/electron.*.spec.js',
            use: {
              _electron: require('@playwright/test')._electron,
            },
          },
        ]
      : []),
  ],

  // Artifact locations
  outputDir: './test-results/',

  // Video/screenshots/traces only on failure to keep artifacts small.
  video: 'retain-on-failure',
  screenshot: 'only-on-failure',
  trace: 'retain-on-failure',
};