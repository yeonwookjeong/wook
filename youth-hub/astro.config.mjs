// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { site } from "./src/site.config.ts";

export default defineConfig({
  site: site.url,
  trailingSlash: "never",
  integrations: [sitemap()],
  devToolbar: { enabled: false },
});
