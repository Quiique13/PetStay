import { build as bundle } from "esbuild";
import { build, Platform, Arch } from "electron-builder";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname, join } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const withInstaller = process.argv.includes("--installer");
const staging = join(root, "release", `packaging-v${manifest.version}`);
const output = join(root, "release", `v${manifest.version}`);
await mkdir(staging, { recursive: true });
await cp(join(root, "dist"), join(staging, "dist"), { recursive: true });
await writeFile(join(staging, "package.json"), JSON.stringify({
  name: "petstay", version: manifest.version, description: "PetStay", author: manifest.author, main: "main.cjs",
}, null, 2) + "\n");
for (const name of ["main", "preload"]) {
  await bundle({ entryPoints: [join(root, `desktop/${name}.ts`)], bundle: true,
    platform: "node", format: "cjs", target: "node22", outfile: join(staging, `${name}.cjs`), external: ["electron"] });
}
const cachedElectron = join(root, "release/electron-v45.2.3");
const icon = join(root, "desktop/icon.ico");
await build({
  projectDir: staging,
  targets: Platform.WINDOWS.createTarget(withInstaller ? ["portable", "nsis"] : ["portable"], Arch.x64),
  publish: "never",
  config: {
    appId: "pt.petstay.desktop", productName: "PetStay", electronVersion: "45.2.3",
    ...(existsSync(cachedElectron) ? { electronDist: cachedElectron } : {}),
    directories: { output },
    files: ["dist/**/*", "main.cjs", "preload.cjs", "package.json", "!node_modules/**/*"],
    asar: true, npmRebuild: false,
    win: { icon, signExecutable: false },
    portable: { requestExecutionLevel: "user", artifactName: "PetStay-${version}-windows-x64-portable.exe" },
    nsis: {
      oneClick: false, perMachine: false, allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true, createStartMenuShortcut: true,
      deleteAppDataOnUninstall: false,
      artifactName: "PetStay-${version}-windows-x64-setup.exe",
    },
  },
});
const filenames = [`PetStay-${manifest.version}-windows-x64-portable.exe`, ...(withInstaller ? [`PetStay-${manifest.version}-windows-x64-setup.exe`] : [])];
const checksums = [];
for (const filename of filenames) {
  const artifact = join(output, filename);
  checksums.push(`${createHash("sha256").update(await readFile(artifact)).digest("hex")}  ${filename}`);
  console.log(`Windows app: ${artifact}`);
}
await writeFile(join(output, "SHA256SUMS.txt"), checksums.join("\n") + "\n");
