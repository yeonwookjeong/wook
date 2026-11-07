import { defineConfig } from "@apps-in-toss/web-framework/config";

// appName must match the mini app's name in the Apps in Toss console ("내 사주 동네").
export default defineConfig({
  appName: "hundo-dongne",
  brand: {
    primaryColor: "#B3261E",
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
