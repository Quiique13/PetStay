import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc, runTransaction } from "firebase/firestore";

test("Firestore rules isolate owners, validate manifests, and prevent stale writes", async t => {
  const env = await initializeTestEnvironment({ projectId: "demo-petstay", firestore: { host: "127.0.0.1", port: 8080, rules: await readFile("firestore.rules", "utf8") } });
  t.after(() => env.cleanup()); await env.clearFirestore();
  const owner = env.authenticatedContext("owner-a").firestore();
  const other = env.authenticatedContext("owner-b").firestore();
  const anon = env.unauthenticatedContext().firestore();
  const path = "owners/owner-a/state/current";
  const chunk = "owners/owner-a/snapshots/one/chunks/0";
  const head = { schemaVersion: 1, revision: 1, snapshot: { id: "one", count: 1 }, previous: null, recovery: null, updatedAt: serverTimestamp() };
  await assertFails(getDoc(doc(anon, path))); await assertFails(getDoc(doc(other, path)));
  await assertFails(setDoc(doc(other, path), head)); await assertFails(setDoc(doc(anon, chunk), { json: "{}" }));
  await assertSucceeds(setDoc(doc(owner, chunk), { json: "{}" }));
  await assertSucceeds(setDoc(doc(owner, chunk), { json: "{}" }));
  await assertFails(setDoc(doc(owner, chunk), { json: "changed" }));
  await assertFails(getDoc(doc(other, chunk))); await assertFails(deleteDoc(doc(other, chunk)));
  await assertFails(setDoc(doc(owner, path), { ...head, revision: 2 }));
  await assertSucceeds(setDoc(doc(owner, path), head));
  await assertFails(setDoc(doc(owner, path), head));
  await assertFails(setDoc(doc(owner, path), { ...head, revision: 2, snapshot: { id: "bad/path", count: 1 } }));
  await assertFails(setDoc(doc(owner, path), { ...head, revision: 2, snapshot: { id: "ok", count: 129 } }));
  await assertFails(setDoc(doc(owner, path), { ...head, revision: 2, extra: "not allowed" }));
  await assertFails(deleteDoc(doc(owner, path)));
  const secondClient = env.authenticatedContext("owner-a").firestore();
  const replace = (db: typeof owner, id: string) => runTransaction(db, async tx => {
    const ref = doc(db, path), current = await tx.get(ref);
    if (current.data()!.revision !== 1) throw new Error("conflict");
    tx.set(ref, { ...head, revision: 2, snapshot: { id, count: 1 } });
  });
  const results = await Promise.allSettled([replace(owner, "two"), replace(secondClient, "three")]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  assert.equal((await getDoc(doc(owner, path))).data()!.revision, 2);
  await assertFails(setDoc(doc(other, "unprotected/arbitrary"), { data: "no" }));
});
