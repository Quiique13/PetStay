import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { readCloudCache, readCloudRecovery, saveCloudCommitted, saveCloudDraft, saveCloudRecovery } from "../src/services/cloud-cache.ts";
import { newHotelData } from "../src/utils/hotel-data.ts";

test("durable cloud drafts and recovery copies are account-specific, and acknowledgements only clear their own draft", async () => {
  const data = newHotelData({ name: "Account A", owner: "Ana", avatar: "" });
  const uid = crypto.randomUUID(), other = crypto.randomUUID();
  const first = { id: "first", baseRevision: 0, data, preserveRecovery: false };
  await saveCloudDraft(uid, first);
  assert.deepEqual((await readCloudCache(uid)).draft, first);
  assert.equal((await readCloudCache(other)).draft, null);
  const second = { ...first, id: "second", data: { ...data, capacity: 22 } };
  await saveCloudDraft(uid, second);
  const snapshot = { id: "first", data, revision: 1, initialized: true };
  await saveCloudCommitted(uid, snapshot, "first");
  assert.equal((await readCloudCache(uid)).draft!.id, "second");
  await saveCloudRecovery(uid, data);
  assert.deepEqual(await readCloudRecovery(uid), data); assert.equal(await readCloudRecovery(other), null);
  await saveCloudCommitted(uid, { ...snapshot, id: "second", revision: 2 }, "second");
  assert.equal((await readCloudCache(uid)).draft, null); assert.equal((await readCloudCache(uid)).migrated, true);
});
