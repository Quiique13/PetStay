import { defaultData, validateData } from "../utils/hotel-data.ts";
import type { HotelData, StorageError, StorageSnapshot } from "../types.ts";

const databaseName = "petstay-mobile";
const storeName = "hotel";

function openDatabase(uid?: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(
        new Error(
          "O armazenamento deste navegador não está disponível. Abra o PetStay num navegador normal, fora do modo privado.",
        ),
      );
      return;
    }
    // Keep the old, unowned database intact. It must never be assigned to the
    // first person who happens to sign in on a shared device.
    const name = uid
      ? `${databaseName}-account-${encodeURIComponent(uid)}`
      : databaseName;
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Não foi possível abrir os dados deste dispositivo. Verifique as permissões de armazenamento do navegador.",
        ),
      );
    request.onblocked = () =>
      reject(
        new Error("Feche as outras janelas do PetStay e tente novamente."),
      );
  });
}

function snapshot(record: StorageSnapshot | undefined): StorageSnapshot {
  if (!record) return { data: defaultData(), revision: 0, initialized: false };
  if (
    !Number.isInteger(record.revision) ||
    record.revision < 1 ||
    record.initialized !== true
  ) {
    throw new Error(
      "O registo guardado está danificado. Importe uma cópia de segurança para recuperar os dados.",
    );
  }
  return { ...record, data: validateData(record.data) };
}

export async function loadMobileData(uid?: string): Promise<StorageSnapshot> {
  const db = await openDatabase(uid);
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const request = transaction.objectStore(storeName).get("current");
      transaction.oncomplete = () => {
        try {
          resolve(snapshot(request.result));
        } catch (error) {
          reject(error);
        }
      };
      transaction.onabort = transaction.onerror = () =>
        reject(
          new Error("Não foi possível ler os dados guardados no telemóvel."),
        );
    });
  } finally {
    db.close();
  }
}

export async function saveMobileData(
  input: HotelData,
  revision: number,
  preserveRecovery = false,
  uid?: string,
): Promise<StorageSnapshot> {
  const data = structuredClone(validateData(input));
  if (!Number.isInteger(revision) || revision < 0)
    throw new Error("Revisão inválida.");
  const db = await openDatabase(uid);
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.get("current");
      let failure: Error | null = null;
      let next: StorageSnapshot;
      request.onsuccess = () => {
        try {
          const current = snapshot(request.result);
          if (current.revision !== revision) {
            const error: StorageError = new Error(
              "Os dados foram alterados noutra janela. Recarregue a aplicação antes de continuar.",
            );
            error.status = 409;
            throw error;
          }
          if (current.initialized) store.put(current, "previous");
          // An import recovery copy survives later automatic saves.
          if (preserveRecovery && current.initialized)
            store.put(current, "before-import");
          next = { data, revision: revision + 1, initialized: true };
          store.put(next, "current");
        } catch (error) {
          failure = error instanceof Error ? error : new Error(String(error));
          transaction.abort();
        }
      };
      transaction.oncomplete = () => resolve(next);
      transaction.onabort = transaction.onerror = () =>
        reject(
          failure ??
            new Error(
              "Não foi possível guardar no telemóvel. Verifique o espaço disponível e exporte uma cópia dos seus dados.",
            ),
        );
    });
  } finally {
    db.close();
  }
}

export async function loadMobileRecovery(
  uid?: string,
): Promise<StorageSnapshot | null> {
  const db = await openDatabase(uid);
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const request = transaction.objectStore(storeName).get("before-import");
      transaction.oncomplete = () => {
        try {
          resolve(request.result ? snapshot(request.result) : null);
        } catch (error) {
          reject(error);
        }
      };
      transaction.onabort = transaction.onerror = () =>
        reject(
          new Error("Não foi possível abrir a cópia anterior à importação."),
        );
    });
  } finally {
    db.close();
  }
}
