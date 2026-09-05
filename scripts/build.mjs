import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const watch = process.argv.includes("--watch");

const entries = {
  "service-worker": resolve(project, "src/background/service-worker.ts"),
  storygraph: resolve(project, "src/content/storygraph.ts"),
  amazon: resolve(project, "src/content/amazon.ts")
};

function buildEntry(name, input, { emptyOutDir, publicDir }) {
  return build({
    configFile: false,
    root: project,
    publicDir,
    build: {
      emptyOutDir,
      outDir: resolve(project, "dist"),
      watch: watch ? {} : null,
      rollupOptions: {
        input,
        output: {
          format: "iife",
          entryFileNames: `${name}.js`,
          inlineDynamicImports: true
        }
      }
    }
  });
}

if (watch) {
  await rm(resolve(project, "dist"), { recursive: true, force: true });
  await Promise.all(
    Object.entries(entries).map(([name, input], index) =>
      buildEntry(name, input, {
        emptyOutDir: false,
        publicDir: index === 0 ? resolve(project, "public") : false
      })
    )
  );
} else {
  let first = true;
  for (const [name, input] of Object.entries(entries)) {
    await buildEntry(name, input, {
      emptyOutDir: first,
      publicDir: first ? resolve(project, "public") : false
    });
    first = false;
  }
}
