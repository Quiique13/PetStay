import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const task = process.argv[2];
if (!["assembleDebug", "signingReport", "run"].includes(task)) {
  throw new Error("Expected assembleDebug, signingReport or run.");
}
if (task !== "signingReport" && !existsSync(resolve(root, "android/app/google-services.json"))) {
  console.error("Download google-services.json for com.app.petstay from Firebase into android/app/. See docs/android.md.");
  process.exit(1);
}

const env = { ...process.env };
const localJdk = resolve(root, ".android-tools/jdk21");
if (existsSync(localJdk)) env.JAVA_HOME = localJdk;
if (!env.ANDROID_HOME && process.platform === "win32" && env.LOCALAPPDATA) {
  const sdk = resolve(env.LOCALAPPDATA, "Android/Sdk");
  if (existsSync(sdk)) env.ANDROID_HOME = sdk;
}

// Tasks are allowlisted above; no user text is interpolated into a shell command.
const run = task === "run";
const result = spawnSync(run ? process.execPath : process.platform === "win32" ? "gradlew.bat" : "./gradlew",
  run ? [resolve(root, "node_modules/@capacitor/cli/bin/capacitor"), "run", "android", "--no-sync"] : [task, "--console=plain"], {
    cwd: run ? root : resolve(root, "android"), env, stdio: "inherit", shell: !run && process.platform === "win32",
  });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
