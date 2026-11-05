// Exercise the actual portable executable with disposable data, never the user's hotel.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

const executable = resolve(process.argv[2] ?? "release/PetStay-1.0.0-windows-x64-portable.exe");
const temporary = await mkdtemp(join(tmpdir(), "petstay-portable-test-"));
const copy = join(temporary, "PetStay.exe");
await copyFile(executable, copy);
let child;
let socket;
let nextId = 0;
const pending = new Map();
const errors = [];
const pause = ms => new Promise(done => setTimeout(done, ms));
async function until(action, message) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try { const value = await action(); if (value) return value; } catch { /* startup is asynchronous */ }
    await pause(200);
  }
  throw new Error(message);
}
async function launch() {
  const environment = { ...process.env };
  // Coding tools can set this for their own Electron-hosted Node processes.
  delete environment.ELECTRON_RUN_AS_NODE;
  child = spawn(copy, ["--remote-debugging-port=0"], { windowsHide: true, stdio: "ignore", env: environment });
  child.on("error", error => errors.push(error.message));
  const portFile = join(temporary, "data", ".runtime", "DevToolsActivePort");
  const target = await until(async () => {
    const port = (await readFile(portFile, "utf8")).split(/\r?\n/)[0];
    const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    return pages.find(page => page.type === "page" && page.url.startsWith("http://127.0.0.1:"));
  }, "Portable app did not expose its window for testing: " + errors.join(", "));
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, reject) => { socket.onopen = done; socket.onerror = reject; });
  socket.onclose = () => {
    for (const waiter of pending.values()) waiter.reject(new Error("App window closed"));
    pending.clear();
  };
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const waiter = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) waiter?.reject(new Error(message.error.message));
      else waiter?.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
  };
  await send("Runtime.enable");
}
function send(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
}
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function close() {
  await send("Browser.close").catch(() => {});
  socket?.close();
  await until(async () => {
    try { await fetch(`http://127.0.0.1:${(await readFile(join(temporary, "data", ".runtime", "DevToolsActivePort"), "utf8")).split(/\r?\n/)[0]}/json/list`); return false; }
    catch { return true; }
  }, "Portable app did not shut down");
  await rm(join(temporary, "data", ".runtime", "DevToolsActivePort"), { force: true });
}
try {
  await launch();
  await until(() => evaluate("!!document.querySelector('input[name=hotelName]')"), "Registration form did not render");
  await evaluate(`(() => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const [name, value] of [['hotelName', 'Portable Smoke Hotel'], ['ownerName', 'Smoke Owner']]) {
      const input = document.querySelector('input[name=' + name + ']');
      set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return true;
  })()`);
  await evaluate("document.querySelector('form').requestSubmit()");
  await until(async () => JSON.parse(await readFile(join(temporary, "data", "hotel.json"), "utf8")).data.hotel.name === "Portable Smoke Hotel", "Registration did not persist beside the portable executable");
  await until(() => evaluate("!document.querySelector('input[name=hotelName]') && document.body.innerText.includes('Portable Smoke Hotel')"), "Dashboard did not render");
  const screenshot = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(resolve("release/portable-smoke.png"), Buffer.from(screenshot.data, "base64"));
  await close();
  await launch();
  await until(() => evaluate("!document.querySelector('input[name=hotelName]') && document.body.innerText.includes('Portable Smoke Hotel')"), "Saved hotel did not survive restarting the executable");
  assert.deepEqual(errors, [], "Renderer exceptions");
  await close();
  console.log("PASS: portable executable launches, registers, saves beside the exe, and reopens the saved hotel.");
} finally {
  socket?.close();
  if (child?.pid && child.exitCode === null) {
    await new Promise(done => { const kill = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" }); kill.on("exit", done); kill.on("error", done); });
  }
  if (dirname(resolve(temporary)) !== resolve(tmpdir()) || !basename(temporary).startsWith("petstay-portable-test-")) throw new Error("Unsafe test cleanup path");
  await rm(temporary, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
}
