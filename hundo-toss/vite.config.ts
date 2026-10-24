import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import aitDevtools from "@apps-in-toss/devtools/unplugin";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The chart engine is the site's own (../jojeong/lib), imported as "@/lib/…" exactly as the site does. Its packages
// resolve from this project's node_modules, so the site need not be installed to build the mini app.
export default defineConfig({
  plugins: [aitDevtools.vite(), react()],
  resolve: {
    alias: {
      "@/": here("../jojeong/"),
      "lunar-javascript": here("./node_modules/lunar-javascript"),
      iztro: here("./node_modules/iztro"),
    },
  },
});
