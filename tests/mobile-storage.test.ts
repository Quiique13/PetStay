import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { loadMobileData, loadMobileRecovery, saveMobileData } from "../src/services/mobile-storage.ts";
import { defaultData, newHotelData } from "../src/utils/hotel-data.ts";

function resetDatabase() { Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: new IDBFactory() }); }

test("mobile records survive reopening and imports preserve a recovery copy after later edits", async () => {
  resetDatabase();
  assert.deepEqual((await loadMobileData()).data, defaultData());
  const original = newHotelData({ name: "Original", owner: "Pessoa", avatar: "" });
  await saveMobileData(original, 0);
  assert.deepEqual((await loadMobileData()).data, original);
  const imported = newHotelData({ name: "Importado", owner: "Pessoa", avatar: "" });
  await saveMobileData(imported, 1, true);
  imported.rates.day = 25;
  await saveMobileData(imported, 2);
  assert.deepEqual((await loadMobileRecovery())?.data, original);
  assert.equal((await loadMobileData()).data.rates.day, 25);
});

test("mobile concurrent writes and stale imports cannot overwrite newer data", async () => {
  resetDatabase();
  const data = newHotelData({ name: "Hotel", owner: "Pessoa", avatar: "" });
  await saveMobileData(data, 0);
  const results = await Promise.allSettled([
    saveMobileData({ ...data, capacity: 10 }, 1), saveMobileData({ ...data, capacity: 20 }, 1, true),
  ]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  const rejected = results.find(result => result.status === "rejected");
  assert.ok(rejected?.status === "rejected" && rejected.reason.status === 409);
  const before = await loadMobileData();
  await assert.rejects(saveMobileData({ ...data, occupancy: 1000 }, before.revision));
  assert.deepEqual(await loadMobileData(), before);
});
