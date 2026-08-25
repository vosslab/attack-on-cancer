// build_visual_catalog.mjs - bundle the temporary production-component catalog.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { copyFile, mkdir } from "node:fs/promises";

import { build } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

const REPO_ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();
const OUTPUT_DIRECTORY = path.join(REPO_ROOT, "test-results/visual-assets");

async function main() {
  // ASVS 5.3.2: every output name is fixed and repository-owned.
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });
  await build({
    entryPoints: [path.join(REPO_ROOT, "src/visual_catalog.tsx")],
    bundle: true,
    format: "esm",
    target: "es2020",
    platform: "browser",
    minify: true,
    sourcemap: true,
    outfile: path.join(OUTPUT_DIRECTORY, "catalog.js"),
    plugins: [solidPlugin()],
  });
  await copyFile(
    path.join(REPO_ROOT, "src/visual_catalog.html"),
    path.join(OUTPUT_DIRECTORY, "index.html"),
  );
  await copyFile(
    path.join(REPO_ROOT, "src/visual_catalog.css"),
    path.join(OUTPUT_DIRECTORY, "visual_catalog.css"),
  );
  await copyFile(path.join(REPO_ROOT, "src/style.css"), path.join(OUTPUT_DIRECTORY, "style.css"));
  await copyFile(
    path.join(REPO_ROOT, "src/world_visuals.css"),
    path.join(OUTPUT_DIRECTORY, "world_visuals.css"),
  );
  await copyFile(
    path.join(REPO_ROOT, "src/combat_visuals.css"),
    path.join(OUTPUT_DIRECTORY, "combat_visuals.css"),
  );
  await copyFile(
    path.join(REPO_ROOT, "src/combat_motion.css"),
    path.join(OUTPUT_DIRECTORY, "combat_motion.css"),
  );
  process.stdout.write(`Built temporary visual catalog: ${OUTPUT_DIRECTORY}\n`);
}

await main();
