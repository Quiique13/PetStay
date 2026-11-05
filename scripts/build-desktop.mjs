import { build } from "esbuild";

await build({
  entryPoints: ["desktop/main.ts"], bundle: true, platform: "node", format: "cjs",
  target: "node22", outfile: "dist-desktop/main.cjs", external: ["electron"],
});
