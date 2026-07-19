import { defineConfig } from "vite";

// Minimal, mostly-default config.
//
// `publicDir` defaults to "public" — everything in there (the legacy
// standalone HTML pages, doc-page.js, the Brand Manual's runtime-Babel
// .jsx files, assets/, uploads/) is copied verbatim into `dist/` on
// build, untouched by Vite's module graph / esbuild transforms. Only
// the root `index.html` (and whatever it imports, i.e. `app/main.js`)
// is processed as the actual Vite app entry.
export default defineConfig({
  publicDir: "public",
  build: {
    outDir: "dist",
  },
});
