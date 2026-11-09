import { useEffect, useRef, useState } from "react";
import { loadDeviceData, saveDeviceData } from "../services/device-storage.ts";
import type { StorageAccount } from "../services/device-storage.ts";
import { newHotelData, validateData } from "../utils/hotel-data.ts";
import { asStorageError } from "../types.ts";
import type { HotelData, HotelProfile, StorageError } from "../types.ts";

export function useDeviceData(account: StorageAccount) {
  const [data, setData] = useState<HotelData | null>(null);
  const [status, setStatus] = useState<
    "loading" | "saved" | "saving" | "error"
  >("loading");
  const [error, setError] = useState<StorageError | null>(null);
  const [retry, setRetry] = useState(0);
  const revision = useRef(0);
  const latest = useRef<HotelData | null>(null);
  const saved = useRef<HotelData | null>(null);
  const queue = useRef(Promise.resolve());
  const failed = useRef(false);
  const lastFailure = useRef<StorageError | null>(null);
  const replacing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    if (latest.current) return;
    setStatus("loading");
    setError(null);
    loadDeviceData(account)
      .then((result) => {
        if (!active) return;
        revision.current = result.revision;
        latest.current = saved.current = result.data;
        setData(result.data);
        setStatus("saved");
      })
      .catch((cause) => {
        if (!active) return;
        setError(asStorageError(cause));
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [retry]);

  function reportFailure(cause: unknown) {
    failed.current = true;
    lastFailure.current = asStorageError(cause);
    setError(lastFailure.current);
    setStatus("error");
  }

  async function write(next: HotelData, preserveRecovery = false) {
    const result = await saveDeviceData(
      next,
      revision.current,
      preserveRecovery,
      account,
    );
    revision.current = result.revision;
    saved.current = next;
    if (latest.current === next) {
      setStatus("saved");
      setError(null);
    }
  }

  function persistLatest() {
    // Read the latest value when the operation runs, never a stale timer closure.
    const operation = queue.current
      .then(async () => {
        if (failed.current)
          throw (
            lastFailure.current ??
            new Error("Resolva o erro de gravação antes de transferir dados.")
          );
        const next = latest.current;
        if (next && saved.current !== next) await write(next);
      })
      .catch((cause) => {
        reportFailure(cause);
        throw cause;
      });
    queue.current = operation.catch(() => {});
    return operation;
  }

  useEffect(() => {
    if (!data || saved.current === data || replacing.current) return;
    timer.current = setTimeout(() => {
      void persistLatest().catch(() => {});
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [data, retry]);

  useEffect(() => {
    function flushOnBackground() {
      if (
        document.visibilityState === "hidden" &&
        latest.current !== saved.current &&
        !failed.current
      ) {
        if (timer.current) clearTimeout(timer.current);
        void persistLatest().catch(() => {});
      }
    }
    function protectUnsavedChanges(event: BeforeUnloadEvent) {
      if (latest.current !== saved.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    document.addEventListener("visibilitychange", flushOnBackground);
    window.addEventListener("beforeunload", protectUnsavedChanges);
    return () => {
      document.removeEventListener("visibilitychange", flushOnBackground);
      window.removeEventListener("beforeunload", protectUnsavedChanges);
      // Another tab can sign out or switch accounts. Finish the old account's
      // pending write using this provider's captured identity before it unmounts.
      if (latest.current !== saved.current && !failed.current) {
        if (timer.current) clearTimeout(timer.current);
        void persistLatest().catch(() => {});
      }
    };
  }, []);

  function update<Key extends keyof HotelData>(
    key: Key,
    value: HotelData[Key],
  ) {
    if (!latest.current || replacing.current) return;
    const next = { ...latest.current, [key]: value };
    latest.current = next;
    setData(next);
    if (!failed.current) setStatus("saving");
  }

  function retrySave() {
    failed.current = false;
    lastFailure.current = null;
    setError(null);
    setStatus(data ? "saving" : "loading");
    setRetry((value) => value + 1);
  }

  async function flush(): Promise<HotelData> {
    if (timer.current) clearTimeout(timer.current);
    await persistLatest();
    if (!latest.current)
      throw new Error("Os dados ainda não estão disponíveis.");
    while (saved.current !== latest.current) await persistLatest();
    return latest.current;
  }

  async function replaceData(input: HotelData, preserveRecovery = true) {
    const next = structuredClone(validateData(input));
    if (replacing.current) throw new Error("Aguarde até a gravação terminar.");
    replacing.current = true;
    try {
      await flush();
      setStatus("saving");
      const operation = queue.current.then(async () => {
        await write(next, preserveRecovery);
        latest.current = saved.current = next;
        failed.current = false;
        setData(next);
        setStatus("saved");
        setError(null);
      });
      queue.current = operation.catch(() => {});
      await operation;
    } catch (cause) {
      reportFailure(cause);
      throw cause;
    } finally {
      replacing.current = false;
    }
  }

  async function register(hotel: HotelProfile) {
    try {
      await replaceData(newHotelData(hotel), false);
      return true;
    } catch {
      return false;
    }
  }

  return {
    data,
    update,
    status,
    error,
    retry: retrySave,
    register,
    flush,
    replaceData,
  };
}
