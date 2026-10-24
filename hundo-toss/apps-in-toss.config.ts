import { defineConfig } from "@apps-in-toss/web-framework/config";

// appName must match the mini app's name in the Apps in Toss console.
export default defineConfig({
  appName: "hundo-saju",
  brand: {
    primaryColor: "#8B2E2E",
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    withTitle: true,
  },
  webView: {},
  permissions: [],
  webBundleDir: "dist",
});
