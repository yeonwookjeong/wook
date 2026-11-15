import { defineConfig } from "@apps-in-toss/web-framework/config";

// appName must match the mini app's name in the Apps in Toss console (and the share link, src/App.tsx).
export default defineConfig({
  appName: "hundo-sinsal",
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
