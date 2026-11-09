import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, join, delimiter } from "node:path";

const env = { ...process.env, FIREBASE_CLI_DISABLE_UPDATE_CHECK: "true" };
const java = resolve(".android-tools/jdk21");
if (existsSync(java)) { env.JAVA_HOME = java; env.PATH = join(java, "bin") + delimiter + env.PATH; }
async function run(args) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: "inherit", windowsHide: true });
    child.on("error", reject); child.on("exit", resolve);
  });
  if (code !== 0) process.exit(code ?? 1);
}
if (process.argv.includes("--checks")) {
  await run(["--import", "tsx", "--test", "integration/firestore-rules.test.ts"]);
  await run(["node_modules/@playwright/test/cli.js", "test", "--config", "playwright.cloud.config.ts"]);
} else {
  await run(["node_modules/typescript/bin/tsc", "--noEmit"]);
  await run(["node_modules/vite/bin/vite.js", "build", "--mode", "cloud-test"]);
  await run(["node_modules/firebase-tools/lib/bin/firebase.js", "emulators:exec", "--only", "firestore", "--project", "demo-petstay", "node scripts/test-cloud.mjs --checks"]);
}
