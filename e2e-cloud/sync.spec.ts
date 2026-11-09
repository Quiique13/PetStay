import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc } from "firebase/firestore";
import { readFile } from "node:fs/promises";
import { seedSignedInAccount, testUid } from "../e2e/auth-fixture.ts";
import { newHotelData } from "../src/utils/hotel-data.ts";
import { serializeBackup } from "../src/services/backup.ts";

test.beforeEach(async () => {
  // This project ID only addresses the emulator explicitly configured below.
  const env = await initializeTestEnvironment({ projectId: "petstay-394ce", firestore: { host: "127.0.0.1", port: 8080, rules: await readFile("firestore.rules", "utf8") } });
  await env.clearFirestore(); await env.cleanup();
});
async function open(context: BrowserContext) {
  await seedSignedInAccount(context);
  await context.addInitScript(() => Object.defineProperty(navigator, "onLine", { configurable: true, get: () => localStorage.getItem("test-cloud-offline") !== "yes" }));
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4175");
  return page;
}
async function synced(page: Page) { await expect(page.locator(".cloud-sync-status")).toContainText("Sincronizado com a sua conta.", { timeout: 30000 }); }
async function profile(page: Page, owner: string) {
  await page.getByRole("button", { name: "Definições", exact: true }).click();
  await page.getByLabel("O seu nome", { exact: true }).fill(owner);
  await page.getByRole("button", { name: "Guardar perfil", exact: true }).click();
}

test("two devices sync every hotel field and large photos; offline drafts survive reload and conflicting cloud updates", async ({ browser }) => {
  const first = await browser.newContext({ serviceWorkers: "block" });
  const second = await browser.newContext({ serviceWorkers: "block" });
  try {
    const a = await open(first), b = await open(second);
    await synced(a); await synced(b);
    const data = newHotelData({ name: "Cloud Hotel", owner: "Ana", avatar: "" });
    const tiny = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ9sAAAAASUVORK5CYII=", "base64");
    const photo = `data:image/png;base64,${Buffer.concat([tiny, Buffer.alloc(600000)]).toString("base64")}`;
    data.guests = [{ name: "Bobi", owner: "Maria", breed: "Labrador", age: "Adult", photo, neutered: false }, { name: "Isha", owner: "João", breed: "Husky", age: "Adult", photo }];
    data.bookings = [{ dog: "Bobi", start: "2026-11-10", end: "2026-11-12", type: "Boarding", paid: true, total: 42, discountPercent: 10, intactSurcharge: true }];
    data.capacity = 18; data.occupancy = 73; data.rates.Adult = [24.25, 30, 40]; data.rates.day = 15;
    data.rates.high = [{ start: "07-15", end: "08-20" }]; data.rates.christmas = [{ start: "12-20", end: "01-02" }];
    await a.getByText("Já tem um hotel? Importar cópia", { exact: true }).click();
    await a.getByLabel("Ficheiro de cópia PetStay").setInputFiles({ name: "hotel.json", mimeType: "application/json", buffer: Buffer.from(serializeBackup(data)) });
    await a.getByRole("button", { name: "Importar e substituir", exact: true }).click();
    await synced(a); await expect(b.locator(".heading h1")).toContainText("Olá, Ana"); await synced(b);
    await expect.poll(() => b.evaluate(async uid => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open(`petstay-cloud-${uid}`); r.onsuccess = () => resolve(r.result); r.onerror = reject; });
      try { return await new Promise(resolve => { const r = db.transaction("records").objectStore("records").get("committed"); r.onsuccess = () => resolve(r.result.data); }); } finally { db.close(); }
    }, testUid)).toEqual(data);
    await profile(a, "Ana cloud"); await synced(a);
    await b.getByRole("button", { name: "Definições", exact: true }).click();
    await expect(b.getByLabel("O seu nome", { exact: true })).toHaveValue("Ana cloud");
    await b.evaluate(() => localStorage.setItem("test-cloud-offline", "yes"));
    await second.route("http://127.0.0.1:8080/**", route => route.abort());
    await second.setOffline(true); await second.setOffline(false);
    await profile(b, "Offline owner");
    await expect(b.locator(".cloud-sync-status")).toContainText("cópia local está guardada");
    await b.reload();
    await b.getByRole("button", { name: "Definições", exact: true }).click();
    await expect(b.getByLabel("O seu nome", { exact: true })).toHaveValue("Offline owner");
    await profile(a, "Newer cloud owner"); await synced(a);
    await second.unroute("http://127.0.0.1:8080/**");
    await b.evaluate(() => { localStorage.removeItem("test-cloud-offline"); window.dispatchEvent(new Event("online")); });
    await expect(b.getByRole("heading", { name: "Existem duas versões do seu hotel" })).toBeVisible({ timeout: 30000 });
    await b.getByRole("button", { name: "Usar os dados da conta", exact: true }).click();
    await synced(b); await b.getByRole("button", { name: "Definições", exact: true }).click();
    await expect(b.getByLabel("O seu nome", { exact: true })).toHaveValue("Newer cloud owner");
    await b.reload(); await synced(b);
    await b.getByRole("button", { name: "Definições", exact: true }).click();
    await expect(b.getByLabel("O seu nome", { exact: true })).toHaveValue("Newer cloud owner");
  } finally { await first.close(); await second.close(); }
});

test("an old device hotel requires a choice when the account already has another copy", async ({ browser }) => {
  const first = await browser.newContext({ serviceWorkers: "block" });
  const second = await browser.newContext({ serviceWorkers: "block" });
  try {
    const a = await open(first); await synced(a);
    await a.getByLabel("Nome do hotel", { exact: true }).fill("Cloud copy");
    await a.getByLabel("O seu nome", { exact: true }).fill("Ana");
    await a.getByRole("button", { name: "Criar o meu hotel", exact: true }).click(); await synced(a);
    await second.addInitScript(({ uid, data }) => {
      const r = indexedDB.open(`petstay-mobile-account-${uid}`, 1);
      r.onupgradeneeded = () => r.result.createObjectStore("hotel");
      r.onsuccess = () => { const db = r.result; const tx = db.transaction("hotel", "readwrite"); tx.objectStore("hotel").put({ revision: 1, initialized: true, data }, "current"); tx.oncomplete = () => db.close(); };
    }, { uid: testUid, data: newHotelData({ name: "Existing device copy", owner: "Ana", avatar: "" }) });
    const b = await open(second);
    await expect(b.getByRole("heading", { name: "Existem duas versões do seu hotel" })).toBeVisible();
    await expect(b.locator(".cloud-copies")).toContainText("Existing device copy");
    await expect(b.locator(".cloud-copies")).toContainText("Cloud copy");
    await b.getByRole("button", { name: "Usar esta cópia em todos os dispositivos", exact: true }).click(); await synced(b);
    await expect(a.getByRole("button", { name: "Editar perfil do hotel", exact: true }).first()).toContainText("Existing device copy");
    const env = await initializeTestEnvironment({ projectId: "petstay-394ce", firestore: { host: "127.0.0.1", port: 8080 } });
    try {
      const head = await getDoc(doc(env.authenticatedContext(testUid).firestore(), "owners", testUid, "state", "current"));
      expect(head.data()!.recovery).not.toBeNull();
    } finally { await env.cleanup(); }
  } finally { await first.close(); await second.close(); }
});
