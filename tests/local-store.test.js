import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { request as httpRequest } from "node:http";
import { createLocalStore } from "../server/local-store.js";
import { defaultData, newHotelData } from "../src/utils/hotel-data.js";
import { fixture } from "./storage-fixture.js";

test("clients, bookings, prices and simulator settings survive a new store instance", async t => {
  const { store, directory } = await fixture(t);
  assert.equal((await store.read()).initialized, false);
  const data = newHotelData({ name: "Hotel de teste", owner: "Tutor de teste", avatar: "data:image/png;base64,aGVsbG8=" });
  data.guests.push({ name: "Teste", owner: "Tutor de teste", age: "Senior", breed: "Sem raça definida" });
  data.bookings.push({ dog: "Teste", start: "2026-12-01", end: "2026-12-03", type: "Boarding", paid: false, total: 72.5 });
  data.rates.day = 19.75;
  data.capacity = 20;
  data.occupancy = 80;
  await store.save(data, 0);
  const restarted = createLocalStore(directory);
  assert.deepEqual((await restarted.read()).data, data);
  const updated = structuredClone(data);
  updated.bookings.at(-1).paid = true;
  await restarted.save(updated, 1);
  assert.deepEqual(JSON.parse(await readFile(join(directory, "hotel.json.bak"), "utf8")).data, data);
  assert.deepEqual((await store.read()).data, updated);
  assert.deepEqual((await readdir(directory)).sort(), ["hotel.json", "hotel.json.bak"]);
});

test("invalid data and stale or concurrent writes cannot replace saved records", async t => {
  const { store } = await fixture(t);
  const data = defaultData();
  await store.save(data, 0);
  const invalid = structuredClone(data);
  invalid.rates.day = -1;
  await assert.rejects(store.save(invalid, 1), /inválido/);
  const a = structuredClone(data), b = structuredClone(data);
  a.rates.day = 20;
  b.rates.day = 25;
  const results = await Promise.allSettled([store.save(a, 1), store.save(b, 1)]);
  assert.equal(results[0].status, "fulfilled");
  assert.equal(results[1].status, "rejected");
  assert.equal(results[1].reason.status, 409);
  assert.deepEqual((await store.read()).data, a);
});

test("a damaged file is preserved rather than silently reset", async t => {
  const { store, directory } = await fixture(t);
  const file = join(directory, "hotel.json");
  await writeFile(file, "damaged file");
  await assert.rejects(store.read());
  await assert.rejects(store.save(defaultData(), 0));
  assert.equal(await readFile(file, "utf8"), "damaged file");
});

test("HTTP API persists data and blocks asset access, foreign origins and invalid payloads", async t => {
  const { url, store } = await fixture(t, true);
  const get = await fetch(url + "/api/storage");
  assert.equal(get.headers.get("cache-control"), "no-store");
  const initial = await get.json();
  const put = data => fetch(url + "/api/storage", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  assert.equal((await put({ data: initial.data, revision: 0 })).status, 200);
  assert.equal((await put({ data: initial.data, revision: 0 })).status, 409);
  const invalid = structuredClone(initial.data);
  invalid.bookings.push({ dog: "Teste", start: "2026-02-31", end: "2026-03-04", type: "Boarding", paid: false, total: 40 });
  assert.equal((await put({ data: invalid, revision: 1 })).status, 400);
  assert.equal((await fetch(url + "/api/storage", { headers: { Origin: "https://example.com" } })).status, 403);
  const foreignHostStatus = await new Promise((resolve, reject) => {
    const req = httpRequest(url + "/api/storage", { headers: { Host: "example.com" } }, res => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on("error", reject);
    req.end();
  });
  assert.equal(foreignHostStatus, 403);
  assert.equal((await fetch(url + "/api/storage", { method: "POST" })).status, 405);
  for (const path of ["/data/hotel.json", "/data/hotel.json.bak", "/data/momo.json", "/@fs/C:/project/data/hotel.json", "/%64ata/hotel.json?raw"]) {
    assert.equal((await fetch(url + path)).status, 404);
  }
  assert.deepEqual((await store.read()).data, initial.data);
});

test("registering a hotel starts clean and preserves the previous legacy file", async t => {
  const { store, directory } = await fixture(t);
  const legacy = defaultData();
  delete legacy.hotel;
  legacy.guests.push({ name: "Anterior", owner: "Tutor anterior", age: "Adult", breed: "Teste" });
  legacy.rates.day = 19;
  const contents = JSON.stringify({ schemaVersion: 1, revision: 3, data: legacy });
  await writeFile(join(directory, "momo.json"), contents);
  const existing = await store.read();
  assert.equal(existing.data.hotel, null);
  assert.equal(existing.data.guests.length, 1);
  const clean = newHotelData({ name: "Novo hotel", owner: "Nova pessoa", avatar: "" });
  await store.save(clean, existing.revision);
  const restarted = createLocalStore(directory);
  assert.deepEqual((await restarted.read()).data, clean);
  assert.equal(await readFile(join(directory, "momo.json"), "utf8"), contents);
  assert.equal(await readFile(join(directory, "hotel.json.bak"), "utf8"), contents);
});

test("pre-registration data in the new file gets a permanent archive", async t => {
  const { store, directory } = await fixture(t);
  const previous = defaultData();
  previous.rates.day = 15;
  await store.save(previous, 0);
  const clean = newHotelData({ name: "Hotel", owner: "Pessoa", avatar: "" });
  await store.save(clean, 1);
  clean.rates.day = 20;
  await store.save(clean, 2);
  const archive = (await readdir(directory)).find(name => name.startsWith("before-hotel-setup-"));
  assert.ok(archive);
  assert.equal(JSON.parse(await readFile(join(directory, archive), "utf8")).data.rates.day, 15);
});
