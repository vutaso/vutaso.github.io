const path = require("path");

module.exports = {
  testDir: path.join(__dirname, "tests"),
  testMatch: /e2e\.spec\.js/,
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:8765/devtools/",
    trace: "off",
  },
  webServer: {
    command: "python3 -m http.server 8765",
    cwd: path.join(__dirname, ".."),
    url: "http://127.0.0.1:8765/devtools/",
    reuseExistingServer: !process.env.CI,
  },
};
