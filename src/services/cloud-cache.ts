import type { HotelData } from "../types.ts";
import type { CloudCache, CloudDraft, CloudSnapshot } from "./cloud-model.ts";

async function database(uid: string) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(`petstay-cloud-${encodeURIComponent(uid)}`, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("records");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Não foi possível guardar a cópia local da conta."));
  });
}
async function access<T>(uid: string, mode: IDBTransactionMode, action: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  const db = await database(uid);
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction("records", mode);
      let result: T;
      action(tx.objectStore("records"), value => { result = value; });
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(new Error("Não foi possível guardar a cópia local da conta."));
    });
  } finally { db.close(); }
}
export function readCloudCache(uid: string): Promise<CloudCache> {
  return access(uid, "readonly", (store, result) => {
    const committed = store.get("committed"), draft = store.get("draft"), migrated = store.get("migrated");
    migrated.onsuccess = () => result({ committed: committed.result ?? null, draft: draft.result ?? null, migrated: migrated.result === true });
  });
}
export function saveCloudDraft(uid: string, draft: CloudDraft) {
  return access<void>(uid, "readwrite", store => { store.put(draft, "draft"); });
}
export function saveCloudCommitted(uid: string, snapshot: CloudSnapshot, clearDraftId?: string) {
  return access<void>(uid, "readwrite", store => {
    store.put(snapshot, "committed"); store.put(true, "migrated");
    if (clearDraftId) {
      const current = store.get("draft");
      current.onsuccess = () => { if (current.result?.id === clearDraftId) store.delete("draft"); };
    }
  });
}
export function saveCloudRecovery(uid: string, data: HotelData) {
  return access<void>(uid, "readwrite", store => { store.put(data, "recovery"); });
}
export function readCloudRecovery(uid: string): Promise<HotelData | null> {
  return access(uid, "readonly", (store, result) => { const request = store.get("recovery"); request.onsuccess = () => result(request.result ?? null); });
}
