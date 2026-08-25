// build_visual_catalog.mjs - bundle the temporary production-component catalog.

import path from "node:path";
import { copyFile, mkdir } from "node:fs/promises";

import { build } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

const OUTPUT_DIRECTORY = path.resolve("test-results/visual-assets");

async function main() {
  // ASVS 5.3.2: every output name is fixed and repository-owned.
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });
  await build({
    entryPoints: ["src/visual_catalog.tsx"],
    bundle: true,
    format: "esm",
    target: "es2020",
    platform: "browser",
    minify: true,
    sourcemap: true,
    outfile: path.join(OUTPUT_DIRECTORY, "catalog.js"),
    plugins: [solidPlugin()],
  });
  await copyFile("src/visual_catalog.html", path.join(OUTPUT_DIRECTORY, "index.html"));
  await copyFile("src/visual_catalog.css", path.join(OUTPUT_DIRECTORY, "visual_catalog.css"));
  await copyFile("src/style.css", path.join(OUTPUT_DIRECTORY, "style.css"));
  await copyFile("src/world_visuals.css", path.join(OUTPUT_DIRECTORY, "world_visuals.css"));
  await copyFile("src/combat_visuals.css", path.join(OUTPUT_DIRECTORY, "combat_visuals.css"));
  process.stdout.write(`Built temporary visual catalog: ${OUTPUT_DIRECTORY}\n`);
}

await main();
