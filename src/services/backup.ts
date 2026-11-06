import { isRecord, validateData } from "../utils/hotel-data.ts";
import type { HotelData } from "../types.ts";

export const maxBackupBytes = 10 * 1024 * 1024;
export interface BackupPreview {
  data: HotelData;
  exportedAt: string | null;
}

export function serializeBackup(data: HotelData, date = new Date()): string {
  validateData(data);
  return (
    JSON.stringify(
      {
        format: "petstay-backup",
        formatVersion: 1,
        schemaVersion: 2,
        exportedAt: date.toISOString(),
        data,
      },
      null,
      2,
    ) + "\n"
  );
}

export function parseBackup(text: string): BackupPreview {
  if (new TextEncoder().encode(text).length > maxBackupBytes)
    throw new Error("A cópia excede o limite de 10 MB.");
  let record: unknown;
  try {
    record = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error(
      "Este ficheiro não contém uma cópia JSON válida. Nenhum dado foi alterado.",
    );
  }
  if (!isRecord(record) || record.schemaVersion !== 2) {
    throw new Error(
      "Formato de cópia incompatível. Exporte os dados a partir de uma versão atual do PetStay.",
    );
  }
  let exportedAt: string | null = null;
  if ("format" in record) {
    if (
      record.format !== "petstay-backup" ||
      record.formatVersion !== 1 ||
      typeof record.exportedAt !== "string" ||
      Number.isNaN(Date.parse(record.exportedAt))
    ) {
      throw new Error(
        "A cópia é inválida ou pertence a uma versão mais recente do PetStay.",
      );
    }
    exportedAt = record.exportedAt;
  } else if (
    !Number.isInteger(record.revision) ||
    (record.revision as number) < 1
  ) {
    throw new Error(
      "Escolha uma cópia exportada pelo PetStay ou o ficheiro data/hotel.json do computador.",
    );
  }
  const data = structuredClone(validateData(record.data));
  if (!data.hotel)
    throw new Error(
      "Esta cópia não tem um perfil de hotel. Conclua o registo no dispositivo de origem antes de exportar.",
    );
  return { data, exportedAt };
}

export function backupFileName(data: HotelData, date = new Date()): string {
  const name =
    (data.hotel?.name ?? "hotel")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "hotel";
  return `petstay-${name}-${date.toISOString().replace(/[:.]/g, "-")}.json`;
}
