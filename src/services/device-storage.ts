import { isRecord, validateData } from "../utils/hotel-data.ts";
import type { HotelData, StorageError, StorageSnapshot } from "../types.ts";
import { isMobileApp } from "./storage-mode.ts";
import { loadMobileData, loadMobileRecovery, saveMobileData } from "./mobile-storage.ts";

const endpoint = "/api/storage";

async function request(options?: RequestInit): Promise<StorageSnapshot> {
  let response;
  try {
    response = await fetch(endpoint, { cache: "no-store", ...options });
  } catch {
    throw new Error("Não foi possível contactar o servidor local. Inicie a aplicação com npm run dev ou npm start e tente novamente.");
  }
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new Error("O armazenamento do dispositivo não está disponível. Abra a aplicação através do servidor local."); }
  if (!response.ok) {
    const error: StorageError = new Error(isRecord(body) && typeof body.error === "string"
      ? body.error : "Não foi possível aceder aos dados do dispositivo.");
    error.status = response.status;
    throw error;
  }
  if (!isRecord(body) || typeof body.revision !== "number" || !Number.isInteger(body.revision)
    || body.revision < 0 || typeof body.initialized !== "boolean") {
    throw new Error("O armazenamento do dispositivo devolveu dados inválidos.");
  }
  return { data: validateData(body.data), revision: body.revision, initialized: body.initialized };
}

export function saveDeviceData(data: HotelData, revision: number, preserveRecovery = false) {
  if (isMobileApp) return saveMobileData(data, revision, preserveRecovery);
  return request({
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, revision, preserveRecovery }),
  });
}

// A new hotel always starts clean; browser data is never imported automatically.
export function loadDeviceData() {
  if (isMobileApp) return loadMobileData();
  return request();
}

export async function loadImportRecovery(): Promise<HotelData | null> {
  if (isMobileApp) return (await loadMobileRecovery())?.data ?? null;
  const response = await fetch("/api/storage/recovery", { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível abrir a cópia anterior à importação.");
  const body: unknown = await response.json();
  if (!isRecord(body)) throw new Error("A cópia de recuperação é inválida.");
  return body.data === null ? null : validateData(body.data);
}
