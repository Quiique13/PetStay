// Test the packaged app with disposable data and mocked Google/Firebase tokens.
import assert from "node:assert/strict";
import { _electron as electron, chromium, expect } from "@playwright/test";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mockFirebase, testToken, testUid, testEmail } from "../e2e/auth-fixture.ts";
import { defaultData } from "../src/utils/hotel-data.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const temporary = await mkdtemp(join(tmpdir(), "petstay-desktop-auth-test-"));
const env = { ...process.env, PORTABLE_EXECUTABLE_DIR: temporary };
delete env.ELECTRON_RUN_AS_NODE;
let application;
let browser;
try {
  application = await electron.launch({
    executablePath: join(root, `release/v${version}/win-unpacked/PetStay.exe`), env, timeout: 45_000,
  });
  await application.evaluate(({ shell, BrowserWindow }) => {
    // Observe the system-browser handoff without opening the user's real browser.
    globalThis.petStayTestBrowserUrls = [];
    shell.openExternal = async url => { globalThis.petStayTestBrowserUrls.push(url); };
    for (const window of BrowserWindow.getAllWindows()) window.hide();
  });
  const page = await application.firstWindow();
  const context = application.context();
  await mockFirebase(context);
  // This smoke test checks OAuth, without contacting the live database.
  await context.route("https://firestore.googleapis.com/**", route => route.abort());
  await context.route("**/api/storage", route => route.fulfill({ json: {
    data: defaultData(), revision: 0, initialized: false,
  } }));
  let exchanges = 0;
  await context.route("https://identitytoolkit.googleapis.com/**/accounts:signInWithIdp*", async route => {
    const body = new URLSearchParams(route.request().postDataJSON().postBody);
    assert.equal(body.get("id_token"), "fixture-google-token");
    assert.equal(body.get("providerId"), "google.com");
    exchanges++;
    await route.fulfill({ json: {
      localId: testUid, email: testEmail, emailVerified: true, providerId: "google.com",
      idToken: testToken(), refreshToken: "fixture-refresh", expiresIn: "86400",
    } });
  });
  await page.waitForURL(/^http:\/\/127\.0\.0\.1:/);
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator(".app-version")).toHaveText(`v${version}`);
  await expect(page.getByRole("button", { name: "Continuar com Google" })).toBeEnabled();
  assert.equal(await page.evaluate(() => typeof window.require), "undefined");
  assert.equal(await page.evaluate(() => window.open("https://example.com") === null), true);

  await page.getByRole("button", { name: "Continuar com Google" }).click();
  await expect(page.getByRole("status")).toContainText("navegador");
  await expect.poll(() => application.evaluate(() => globalThis.petStayTestBrowserUrls.length)).toBe(1);
  const helperUrl = await application.evaluate(() => globalThis.petStayTestBrowserUrls[0]);
  const helper = new URL(helperUrl);
  assert.equal(helper.origin, new URL(page.url()).origin);
  assert.match(helper.hash, /^#[a-f0-9]{64}$/);

  // The actual packaged browser helper renders without exposing hotel records.
  browser = await chromium.launch();
  const helperPage = await browser.newPage();
  await helperPage.goto(helperUrl);
  await expect(helperPage.getByRole("heading", { name: "Iniciar sessão no PetStay" })).toBeVisible();
  await expect(helperPage.getByRole("button", { name: "Continuar com Google" })).toBeEnabled();
  assert.equal(new URL(helperPage.url()).hash, "");
  assert.equal(await helperPage.locator("#auth-email").count(), 0);
  await helperPage.reload();
  await expect(helperPage.getByRole("alert")).toContainText("expirou");
  await expect(helperPage.getByRole("button", { name: "Continuar com Google" })).toBeDisabled();

  const callback = await fetch(helper.origin + "/api/desktop-auth/complete", {
    method: "POST", headers: { Origin: helper.origin, "Content-Type": "application/json", "X-PetStay-Sign-In": helper.hash.slice(1) },
    body: JSON.stringify({ idToken: "fixture-google-token" }),
  });
  assert.equal(callback.status, 204);
  await expect(page.locator(".account-bar")).toContainText(testEmail);
  assert.equal(exchanges, 1);
  await page.getByRole("button", { name: "Terminar sessão", exact: true }).click();
  await page.getByRole("button", { name: "Continuar com Google" }).click();
  await expect(page.getByRole("button", { name: "Cancelar", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("cancelado");
  await expect(page.getByRole("button", { name: "Continuar com Google" })).toBeEnabled();
  await page.screenshot({ path: join(root, "release/desktop-auth-smoke.png") });

  // Packaged resources must exclude the user's data and build dependencies.
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const asar = require("@electron/asar");
  const archive = join(root, `release/v${version}/win-unpacked/resources/app.asar`);
  assert(asar.listPackage(archive).every(file => /^[/\\](dist(?:[/\\]|$)|main\.cjs$|preload\.cjs$|package\.json$)/.test(file)));
  console.log("PASS: packaged desktop app requests the system browser, accepts a single-use callback, exchanges Google credentials, signs out, cancels, rejects expired helper links, and excludes private data.");
} finally {
  await browser?.close();
  await application?.close();
  if (dirname(resolve(temporary)) !== resolve(tmpdir()) || !basename(temporary).startsWith("petstay-desktop-auth-test-")) {
    throw new Error("Unsafe test cleanup path");
  }
  await rm(temporary, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
}
