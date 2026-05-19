import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/uiweb/" : "/",
  server: {
    host: "0.0.0.0",
    port: 8787,
  },
  preview: {
    host: "0.0.0.0",
    port: 8787,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: "index.html",
        case: "case.html",
        inspiration: "inspiration.html",
        works: "works.html",
        config: "config.html",
      },
    },
  },
});
