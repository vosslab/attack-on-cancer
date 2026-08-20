import { build } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

const entry = process.argv[2];
if (entry === undefined) {
  throw new Error("Expected an entry-point path.");
}

await build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  target: "es2020",
  platform: "browser",
  minify: true,
  sourcemap: true,
  outfile: "dist/main.js",
  plugins: [solidPlugin()],
});
