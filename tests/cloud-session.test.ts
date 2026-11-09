import test from "node:test";
import assert from "node:assert/strict";
import { CloudSession } from "../src/services/cloud-session.ts";
import type { CloudDependencies } from "../src/services/cloud-session.ts";
import type { CloudCache, CloudDraft, CloudSnapshot } from "../src/services/cloud-model.ts";
import { parseCloudHead, splitHotelData } from "../src/services/cloud-model.ts";
import { defaultData, newHotelData } from "../src/utils/hotel-data.ts";
import { setTimeout as delay } from "node:timers/promises";

const hotel = (name = "Hotel") => newHotelData({ name, owner: "Owner", avatar: "" });
const snapshot = (name = "Hotel", revision = 1): CloudSnapshot => ({ id: `s${revision}`, revision, initialized: true, data: hotel(name) });
async function until(check: () => boolean) {
  for (let i = 0; i < 200; i++) { if (check()) return; await delay(10); }
  assert.ok(check(), "condition did not become true");
}
function harness(t: test.TestContext, initial?: CloudCache) {
  const cache: CloudCache = initial ?? { committed: null, draft: null, migrated: false };
  let receive: Parameters<CloudDependencies["watch"]>[0];
  let online = true;
  let legacy = { data: defaultData(), revision: 0, initialized: false };
  const writes: CloudDraft[] = [];
  const recovery: unknown[] = [];
  const deps: CloudDependencies = {
    cache: async () => structuredClone(cache), legacy: async () => legacy,
    saveDraft: async draft => { cache.draft = structuredClone(draft); },
    saveCommitted: async (value, id) => { cache.committed = value; cache.migrated = true; if (id && cache.draft?.id === id) cache.draft = null; },
    saveRecovery: async value => { recovery.push(value); },
    watch: next => { receive = next; return () => {}; },
    write: async draft => { writes.push(draft); return { data: draft.data, revision: draft.baseRevision + 1, initialized: true, id: draft.id }; },
    online: () => online,
  };
  const session = new CloudSession(deps);
  t.after(() => session.stop());
  return { session, deps, cache, writes, recovery, receive: (value: CloudSnapshot, cached = false) => receive(value, cached), offline: () => { online = false; session.network(); }, reconnect: () => { online = true; session.network(); }, legacy: (value: ReturnType<typeof snapshot>) => { legacy = value; } };
}
test("large photo snapshots are split without breaking Unicode and reject damaged manifests", () => {
  const data = hotel();
  data.guests = Array.from({ length: 3000 }, (_, i) => ({ name: `Dog ${i} 🐕`, owner: "Owner 🐕", breed: "Golden Retriever", age: "Adult" }));
  const chunks = splitHotelData(data);
  assert.ok(chunks.length > 1);
  assert.deepEqual(JSON.parse(chunks.join("")), data);
  chunks.forEach(chunk => assert.ok(new TextEncoder().encode(chunk).byteLength < 750000));
  assert.throws(() => parseCloudHead({ revision: 1, snapshot: { id: "bad/path", count: 1 } }));
});
test("legacy UID data migrates to an empty cloud only after a server-confirmed read", async t => {
  const h = harness(t); h.legacy(snapshot("Existing local hotel"));
  await h.session.start();
  const empty = { id: null, revision: 0, initialized: false, data: defaultData() };
  h.receive(empty, true); await delay(20); assert.equal(h.writes.length, 0);
  h.receive(empty);
  await until(() => h.session.state.status === "saved");
  assert.equal(h.writes[0].baseRevision, 0); assert.equal(h.cache.committed!.data.hotel!.name, "Existing local hotel");
});
test("different existing cloud and device hotels require a choice and preserve the displaced copy", async t => {
  const h = harness(t); h.legacy(snapshot("Local")); await h.session.start(); h.receive(snapshot("Cloud", 3));
  await until(() => h.session.state.status === "conflict"); assert.equal(h.writes.length, 0);
  await h.session.resolve("cloud");
  assert.equal(h.session.state.data!.hotel!.name, "Cloud");
  assert.equal((h.recovery[0] as ReturnType<typeof hotel>).hotel!.name, "Local");
});
test("offline drafts survive reload and cannot overwrite a newer remote revision", async t => {
  const initial = { committed: snapshot(), draft: null, migrated: true };
  const h = harness(t, initial); await h.session.start(); h.receive(snapshot()); await until(() => h.session.state.status === "saved");
  h.offline(); h.session.update("capacity", 42); await h.session.flush();
  assert.equal(h.cache.draft!.data.capacity, 42); h.session.stop();
  const reopened = harness(t, h.cache); await reopened.session.start(); reopened.receive(snapshot("Updated elsewhere", 2));
  await until(() => reopened.session.state.status === "conflict");
  await delay(300); assert.equal(reopened.writes.length, 0);
  await reopened.session.resolve("local"); await until(() => reopened.session.state.status === "saved");
  assert.equal(reopened.writes[0].baseRevision, 2); assert.equal(reopened.writes[0].data.capacity, 42);
});
test("edits made during an upload are rebased on our acknowledged write and saved next", async t => {
  const h = harness(t, { committed: snapshot(), draft: null, migrated: true });
  let finish: (value: CloudSnapshot) => void = () => {};
  const normal = h.deps.write;
  h.deps.write = async draft => { h.writes.push(draft); return new Promise(resolve => { finish = resolve; }); };
  await h.session.start(); h.receive(snapshot()); await until(() => h.session.state.status === "saved");
  h.session.update("capacity", 20); await until(() => h.writes.length === 1);
  const first = h.writes[0]; h.session.update("occupancy", 13); await h.session.flush();
  const ack = { id: first.id, revision: 2, initialized: true, data: first.data };
  h.receive(ack); await delay(10); h.deps.write = normal; finish(ack);
  await until(() => h.session.state.status === "saved");
  assert.equal(h.writes[1].baseRevision, 2); assert.equal(h.cache.committed!.data.occupancy, 13); assert.equal(h.cache.committed!.data.capacity, 20);
});
test("permission failures preserve drafts and do not claim synchronization", async t => {
  const h = harness(t, { committed: snapshot(), draft: null, migrated: true });
  h.deps.write = async () => { throw Object.assign(new Error("denied"), { code: "permission-denied" }); };
  await h.session.start(); h.receive(snapshot()); await until(() => h.session.state.status === "saved");
  h.session.update("capacity", 99); await until(() => h.session.state.status === "error");
  assert.equal(h.cache.draft!.data.capacity, 99); assert.match(h.session.state.error!.message, /Firestore/);
  assert.equal((await h.session.flush()).capacity, 99, "A durable draft remains exportable when cloud access is denied");
});
test("an interrupted first migration remains editable offline before the first cloud acknowledgement", async t => {
  const data = hotel("Migrating hotel");
  const h = harness(t, { committed: null, migrated: false, draft: { id: "migration", baseRevision: 0, data, preserveRecovery: false } });
  h.offline(); await h.session.start(); h.session.update("capacity", 31); await h.session.flush();
  assert.equal(h.cache.draft!.data.capacity, 31); assert.equal(h.cache.draft!.baseRevision, 0);
});
