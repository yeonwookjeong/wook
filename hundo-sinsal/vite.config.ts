import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import aitDevtools from "@apps-in-toss/devtools/unplugin";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The 신살 engine and its pictures are the site's (../jojeong), the birth form, storage and ads the first mini app's
// (../hundo-toss/src, as "@common/…"). Every package those files import resolves from this project, one copy each.
export default defineConfig({
  plugins: [aitDevtools.vite(), react()],
  publicDir: here("../hundo-toss/public"),
  resolve: {
    alias: {
      "@/": here("../jojeong/"),
      "@common/": here("../hundo-toss/src/"),
      "lunar-javascript": here("./node_modules/lunar-javascript"),
      iztro: here("./node_modules/iztro"),
    },
    dedupe: ["react", "react-dom", "@apps-in-toss/web-framework"],
  },
});
