import { useEffect, useState, useSyncExternalStore } from "react";
import type { HotelProfile } from "../types.ts";
import type { StorageAccount } from "../services/device-storage.ts";
import { loadDeviceData } from "../services/device-storage.ts";
import { readCloudCache, readCloudRecovery, saveCloudCommitted, saveCloudDraft, saveCloudRecovery } from "../services/cloud-cache.ts";
import { CloudSession } from "../services/cloud-session.ts";
import { loadCloudImportRecovery, watchCloudHotel, writeCloudHotel } from "../services/cloud-storage.ts";
import { newHotelData } from "../utils/hotel-data.ts";

export function useCloudData(account: StorageAccount) {
  const [session] = useState(() => new CloudSession({
    cache: () => readCloudCache(account.uid), legacy: () => loadDeviceData(account),
    saveDraft: draft => saveCloudDraft(account.uid, draft),
    saveCommitted: (snapshot, id) => saveCloudCommitted(account.uid, snapshot, id),
    saveRecovery: data => saveCloudRecovery(account.uid, data),
    watch: (receive, fail) => watchCloudHotel(account.uid, receive, fail),
    write: draft => writeCloudHotel(account.uid, draft), online: () => navigator.onLine,
  }));
  const state = useSyncExternalStore(session.subscribe, session.snapshot);
  useEffect(() => {
    void session.start();
    window.addEventListener("online", session.network);
    window.addEventListener("offline", session.network);
    const protect = (event: BeforeUnloadEvent) => { if (session.hasUnsavedLocal()) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", protect);
    return () => { window.removeEventListener("online", session.network); window.removeEventListener("offline", session.network); window.removeEventListener("beforeunload", protect); session.stop(); };
  }, [session]);
  return {
    ...state, cloud: true, update: session.update, flush: session.flush,
    retry: session.retry, replaceData: session.replaceData, resolve: session.resolve,
    loadRecovery: async () => await readCloudRecovery(account.uid) ?? await loadCloudImportRecovery(account.uid),
    register: async (profile: HotelProfile) => {
      try { await session.replaceData(newHotelData(profile), false); return true; } catch { return false; }
    },
  };
}
