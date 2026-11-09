import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { connectFirestoreEmulator, doc, getDoc, initializeFirestore, onSnapshot, persistentLocalCache, persistentMultipleTabManager, runTransaction, serverTimestamp, writeBatch } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { HotelData } from "../types.ts";
import { defaultData, validateData } from "../utils/hotel-data.ts";
import { parseCloudHead, splitHotelData } from "./cloud-model.ts";
import type { CloudDraft, CloudHead, CloudSnapshot, SnapshotPointer } from "./cloud-model.ts";

let instance: Firestore | undefined;
function firestore() {
  if (!instance) {
    instance = initializeFirestore(getApp(), { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
    if (import.meta.env.MODE === "cloud-test") connectFirestoreEmulator(instance, "127.0.0.1", 8080);
  }
  return instance;
}
function current(db: Firestore, uid: string) { return doc(db, "owners", uid, "state", "current"); }
function chunk(db: Firestore, uid: string, id: string, index: number) { return doc(db, "owners", uid, "snapshots", id, "chunks", String(index)); }
export const emptyCloudSnapshot = (): CloudSnapshot => ({ id: null, revision: 0, initialized: false, data: defaultData() });

async function readSnapshot(db: Firestore, uid: string, pointer: SnapshotPointer, revision: number): Promise<CloudSnapshot> {
  const chunks = await Promise.all(Array.from({ length: pointer.count }, (_, index) => getDoc(chunk(db, uid, pointer.id, index))));
  const json = chunks.map(part => {
    const value: unknown = part.data()?.json;
    if (typeof value !== "string") throw new Error("Não foi possível abrir todos os dados da conta. Tente novamente.");
    return value;
  }).join("");
  return { id: pointer.id, revision, initialized: true, data: validateData(JSON.parse(json)) };
}
export function watchCloudHotel(uid: string, receive: (snapshot: CloudSnapshot, cached: boolean) => void, fail: (error: unknown) => void) {
  const db = firestore();
  let sequence = 0;
  const stop = onSnapshot(current(db, uid), { includeMetadataChanges: true }, snapshot => {
    const token = ++sequence;
    if (snapshot.metadata.hasPendingWrites || !snapshot.exists() && snapshot.metadata.fromCache) return;
    if (!snapshot.exists()) { receive(emptyCloudSnapshot(), false); return; }
    try {
      const head = parseCloudHead(snapshot.data());
      void readSnapshot(db, uid, head.snapshot, head.revision).then(result => {
        if (token === sequence) receive(result, snapshot.metadata.fromCache);
      }).catch(error => { if (token === sequence) fail(error); });
    } catch (error) { fail(error); }
  }, fail);
  return () => { sequence++; stop(); };
}
export async function writeCloudHotel(uid: string, draft: CloudDraft): Promise<CloudSnapshot> {
  const db = firestore();
  if (getAuth().currentUser?.uid !== uid) throw new Error("Inicie sessão para sincronizar os dados desta conta.");
  const chunks = splitHotelData(draft.data);
  // Upload immutable pieces first so neither a photo nor a large hotel exceeds
  // Firestore's document/transaction limits. Only a complete snapshot is published.
  for (let start = 0; start < chunks.length; start += 12) {
    const batch = writeBatch(db);
    chunks.slice(start, start + 12).forEach((json, offset) => batch.set(chunk(db, uid, draft.id, start + offset), { json }));
    await batch.commit();
  }
  let previous: CloudHead | null = null;
  const revision = await runTransaction(db, async tx => {
    const old = await tx.get(current(db, uid));
    previous = old.exists() ? parseCloudHead(old.data()) : null;
    if ((previous?.revision ?? 0) !== draft.baseRevision) {
      throw Object.assign(new Error("Os dados foram alterados noutro dispositivo. Escolha a cópia que pretende manter."), { status: 409 });
    }
    const revision = draft.baseRevision + 1;
    tx.set(current(db, uid), {
      schemaVersion: 1, revision, snapshot: { id: draft.id, count: chunks.length },
      previous: previous?.snapshot ?? null,
      recovery: draft.preserveRecovery ? previous?.snapshot ?? null : previous?.recovery ?? null,
      updatedAt: serverTimestamp(),
    });
    return revision;
  });
  // Keep current, previous, and the pre-import copy. An older version can never
  // be referenced by a future successful revision, since updates compare revisions.
  const old = previous as CloudHead | null;
  const garbage = old?.previous;
  const recovery = draft.preserveRecovery ? old?.snapshot : old?.recovery;
  if (garbage && garbage.id !== recovery?.id && garbage.id !== old?.snapshot.id) {
    const batch = writeBatch(db);
    for (let index = 0; index < garbage.count; index++) batch.delete(chunk(db, uid, garbage.id, index));
    void batch.commit().catch(() => {});
  }
  return { id: draft.id, revision, initialized: true, data: draft.data };
}
export async function loadCloudImportRecovery(uid: string): Promise<HotelData | null> {
  const db = firestore();
  const snapshot = await getDoc(current(db, uid));
  if (!snapshot.exists()) return null;
  const head = parseCloudHead(snapshot.data());
  return head.recovery ? (await readSnapshot(db, uid, head.recovery, head.revision)).data : null;
}
