import test from "node:test";
import assert from "node:assert/strict";
import { backupFileName, maxBackupBytes, parseBackup, serializeBackup } from "../src/services/backup.ts";
import { defaultData, newHotelData } from "../src/utils/hotel-data.ts";

test("a portable backup preserves every field and can also read the existing desktop hotel.json", () => {
  const data = newHotelData({ name: "Hotel São João", owner: "João", avatar: "data:image/png;base64,aGVsbG8=" });
  data.guests.push({ name: "Bobi", owner: "Maria", breed: "Labrador", age: "Adult" });
  data.bookings.push({ dog: "Bobi", start: "2026-11-10", end: "2026-11-12", type: "Boarding", total: 48.5, paid: true });
  data.rates = { Puppy: [20, 25], Adult: [24.25, 30], Senior: [22, 28], day: 15, high: [6, 7] };
  data.capacity = 18; data.occupancy = 73;
  const date = new Date("2026-11-05T12:34:56Z");
  assert.deepEqual(parseBackup(serializeBackup(data, date)), { data, exportedAt: date.toISOString() });
  assert.deepEqual(parseBackup("\uFEFF" + JSON.stringify({ schemaVersion: 2, revision: 7, data })), { data, exportedAt: null });
  assert.match(backupFileName(data, date), /^petstay-hotel-sao-joao-2026-11-05T12-34-56-000Z\.json$/);
});

test("damaged, oversized, unregistered and future backup formats are refused", () => {
  const data = newHotelData({ name: "Hotel", owner: "Pessoa", avatar: "" });
  const backup = JSON.parse(serializeBackup(data));
  assert.throws(() => parseBackup("not json"), /JSON válida/);
  assert.throws(() => parseBackup("x".repeat(maxBackupBytes + 1)), /10 MB/);
  for (const input of [
    { ...backup, formatVersion: 2 }, { ...backup, schemaVersion: 3 },
    { ...backup, format: "other-app" }, { ...backup, exportedAt: "invalid" },
    { schemaVersion: 2, data }, { ...backup, data: { ...data, occupancy: 200 } },
  ]) assert.throws(() => parseBackup(JSON.stringify(input)));
  assert.throws(() => parseBackup(serializeBackup(defaultData())), /perfil de hotel/);
});
