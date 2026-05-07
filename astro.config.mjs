import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// ── Astro config ─────────────────────────────────────────────────────────────
// Static-only build. No SSR adapter: every page renders to HTML at build time
// for instant TTFB on any CDN. View Transitions handle in-page nav smoothness.
//
// `site` is the canonical origin used for sitemap, RSS, and canonical <link>
// tags. Update before deploying to production if the domain changes.
export default defineConfig({
  site: "https://tubelane.in",
  output: "static",
  trailingSlash: "never",
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/_"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: "auto",
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
});
