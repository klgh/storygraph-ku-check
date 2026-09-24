import { copyFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const watch = process.argv.includes('--watch');
const manifest = resolve(project, 'manifest.json');

function copyManifestPlugin() {
  return {
    name: 'copy-manifest',
    buildStart() {
      this.addWatchFile(manifest);
    },
    async writeBundle() {
      await copyFile(manifest, resolve(project, 'dist', 'manifest.json'));
    },
  };
}

const entries = {
  'service-worker': resolve(project, 'src/background/service-worker.ts'),
  storygraph: resolve(project, 'src/content/storygraph.ts'),
  amazon: resolve(project, 'src/content/amazon.ts'),
};

function buildEntry(name, input, { emptyOutDir, copyManifest }) {
  return build({
    configFile: false,
    root: project,
    publicDir: false,
    plugins: copyManifest ? [copyManifestPlugin()] : [],
    build: {
      emptyOutDir,
      outDir: resolve(project, 'dist'),
      watch: watch ? {} : null,
      rollupOptions: {
        input,
        output: {
          format: 'iife',
          entryFileNames: `${name}.js`,
          inlineDynamicImports: true,
        },
      },
    },
  });
}

if (watch) {
  await rm(resolve(project, 'dist'), { recursive: true, force: true });
  await Promise.all(
    Object.entries(entries).map(([name, input], index) =>
      buildEntry(name, input, {
        emptyOutDir: false,
        copyManifest: index === 0,
      })
    )
  );
} else {
  let first = true;
  for (const [name, input] of Object.entries(entries)) {
    await buildEntry(name, input, {
      emptyOutDir: first,
      copyManifest: first,
    });
    first = false;
  }
}
