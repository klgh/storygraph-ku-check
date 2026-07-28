import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        "service-worker": resolve(__dirname, "src/background/service-worker.ts"),
        storygraph: resolve(__dirname, "src/content/storygraph.ts"),
        amazon: resolve(__dirname, "src/content/amazon.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js"
      }
    }
  },
  test: {
    environment: "jsdom"
  }
});
