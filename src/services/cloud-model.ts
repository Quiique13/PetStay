import type { HotelData, StorageSnapshot } from "../types.ts";
import { isRecord, validateData } from "../utils/hotel-data.ts";

export interface CloudSnapshot extends StorageSnapshot { id: string | null; }
export interface CloudDraft { id: string; baseRevision: number; data: HotelData; preserveRecovery: boolean; }
export interface CloudCache { committed: CloudSnapshot | null; draft: CloudDraft | null; migrated: boolean; }
export interface SnapshotPointer { id: string; count: number; }
export interface CloudHead { schemaVersion: 1; revision: number; snapshot: SnapshotPointer; previous: SnapshotPointer | null; recovery: SnapshotPointer | null; }

export function sameData(a: HotelData, b: HotelData): boolean {
  function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => [key, canonical(v)]));
    return value;
  }
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

export function splitHotelData(input: HotelData): string[] {
  const json = JSON.stringify(validateData(input));
  if (new TextEncoder().encode(json).byteLength > 10 * 1024 * 1024) throw new Error("Os dados excedem o limite de 10 MB. Reduza as fotografias antes de sincronizar.");
  const chunks: string[] = [];
  for (let start = 0; start < json.length;) {
    let end = Math.min(start + 200_000, json.length);
    const code = json.charCodeAt(end - 1);
    if (end < json.length && code >= 0xd800 && code <= 0xdbff) end--;
    chunks.push(json.slice(start, end)); start = end;
  }
  return chunks;
}

export function parseCloudHead(input: unknown): CloudHead {
  function pointer(value: unknown): value is SnapshotPointer {
    return isRecord(value) && typeof value.id === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(value.id)
      && Number.isInteger(value.count) && Number(value.count) > 0 && Number(value.count) <= 128;
  }
  if (!isRecord(input) || input.schemaVersion !== 1 || !Number.isInteger(input.revision) || Number(input.revision) < 1
    || !pointer(input.snapshot) || input.previous !== null && !pointer(input.previous) || input.recovery !== null && !pointer(input.recovery)) {
    throw new Error("Os dados da conta estão danificados. A cópia local foi preservada.");
  }
  return input as unknown as CloudHead;
}
