import test from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { loadDeviceData, saveDeviceData } from "../src/services/device-storage.ts";
import { defaultData, newHotelData } from "../src/utils/hotel-data.ts";
import { fixture } from "./storage-fixture.ts";

async function browser(t: TestContext, entries: Record<string, string>) {
  const context = await fixture(t, true);
  const realFetch = globalThis.fetch;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const values = new Map(Object.entries(entries));
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: () => { throw new Error("New data must never be written to browser storage"); },
  } } });
  globalThis.fetch = (path, options) => realFetch(new URL(path instanceof Request ? path.url : path, context.url), options);
  t.after(() => {
    globalThis.fetch = realFetch;
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  });
  return { ...context, values };
}

test("first launch is clean even when old browser data exists", async t => {
  const { store, values } = await browser(t, { guests: "old browser data", rates: "old prices" });
  const loaded = await loadDeviceData();
  assert.equal(loaded.initialized, false);
  assert.deepEqual(loaded.data, defaultData());
  assert.equal((await store.read()).initialized, false);
  assert.equal(values.size, 2);
});

test("existing device records take priority over stale browser data", async t => {
  const { store, values } = await browser(t, { guests: JSON.stringify([]) });
  const data = newHotelData({ name: "Hotel de teste", owner: "Pessoa", avatar: "" });
  data.rates.day = 31;
  await store.save(data, 0);
  const loaded = await loadDeviceData();
  assert.deepEqual(loaded.data, data);
  assert.equal(values.size, 1);
});

test("registration persists the hotel profile and reload skips setup", async t => {
  const { store } = await browser(t, {});
  const initial = await loadDeviceData();
  assert.equal(initial.data.hotel, null);
  const registered = newHotelData({ name: "Meu hotel", owner: "Pessoa", avatar: "data:image/png;base64,aGVsbG8=" });
  await saveDeviceData(registered, initial.revision);
  assert.deepEqual((await loadDeviceData()).data, registered);
  assert.deepEqual((await store.read()).data, registered);
});
