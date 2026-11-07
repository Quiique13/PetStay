import test from "node:test";
import assert from "node:assert/strict";
import { bookingPrice, defaultData, validateData } from "../src/utils/hotel-data.ts";
import { isHighSeason, monthlyRevenue } from "../src/utils/seasons.ts";
import { parseBackup } from "../src/services/backup.ts";

function fixture() {
  const data = defaultData();
  data.hotel = { name: "Hotel", owner: "Ana", avatar: "" };
  data.guests = [{ name: "Bobi", owner: "Ana", age: "Adult", breed: "Teste" }];
  data.rates.Adult = [10, 20];
  data.rates.day = 7;
  return data;
}

test("boarding uses inclusive daily boundaries and excludes the checkout night", () => {
  const data = fixture();
  data.rates.high = [{ start: "07-15", end: "07-20" }];
  assert.equal(bookingPrice(data, "Bobi", "2026-07-14", "2026-07-22", "Boarding"), 140);
  assert.equal(bookingPrice(data, "Bobi", "2026-07-14", "2026-07-15", "Boarding"), 10);
  assert.equal(bookingPrice(data, "Bobi", "2026-07-20", "2026-07-21", "Boarding"), 20);
  assert.equal(bookingPrice(data, "Bobi", "2026-07-21", "2026-07-22", "Boarding"), 10);
  assert.equal(bookingPrice(data, "Bobi", "2026-07-15", "2026-07-15", "Daycare"), 7);
});

test("multiple and overlapping periods repeat annually without charging a night twice", () => {
  const data = fixture();
  data.rates.high = [
    { start: "07-15", end: "07-17" },
    { start: "07-17", end: "07-20" },
    { start: "08-01", end: "08-01" },
  ];
  assert.equal(bookingPrice(data, "Bobi", "2027-07-14", "2027-07-22", "Boarding"), 140);
  assert.equal(bookingPrice(data, "Bobi", "2027-07-31", "2027-08-03", "Boarding"), 40);
});

test("periods can cross New Year and remain low season on surrounding days", () => {
  const data = fixture();
  data.rates.high = [{ start: "12-20", end: "01-05" }];
  for (const date of ["2026-12-20", "2026-12-31", "2027-01-01", "2027-01-05"])
    assert.equal(isHighSeason(data.rates, new Date(date + "T12:00:00")), true, date);
  for (const date of ["2026-12-19", "2027-01-06", "2027-06-01"])
    assert.equal(isHighSeason(data.rates, new Date(date + "T12:00:00")), false, date);
  assert.equal(bookingPrice(data, "Bobi", "2026-12-31", "2027-01-02", "Boarding"), 40);
});

test("monthly projections sum daily rates, leap days, and missing prices", () => {
  const data = fixture();
  data.rates.high = [{ start: "07-15", end: "07-20" }];
  assert.equal(monthlyRevenue(data.rates, 2026, 6, 4, 50), (25 * 10 + 6 * 20) * 2);
  data.rates.high = [{ start: "02-29", end: "02-29" }];
  assert.doesNotThrow(() => validateData(data));
  assert.equal(monthlyRevenue(data.rates, 2028, 1, 1, 100), 300);
  assert.equal(monthlyRevenue(data.rates, 2027, 1, 1, 100), 280);
  data.rates.Adult[1] = null;
  assert.equal(monthlyRevenue(data.rates, 2028, 1, 1, 100), null);
  assert.equal(monthlyRevenue(data.rates, 2027, 1, 1, 100), 280);
  data.rates.high = [];
  assert.equal(bookingPrice(data, "Bobi", "2028-02-29", "2028-03-01", "Boarding"), 10);
});

test("legacy month selections migrate from device records and backups without mutating input", () => {
  const data = fixture();
  const legacy = { ...data, rates: { ...data.rates, high: [1, 6, 11] } };
  const migrated = validateData(legacy);
  assert.deepEqual(migrated.rates.high, [
    { start: "02-01", end: "02-29" },
    { start: "07-01", end: "07-31" },
    { start: "12-01", end: "12-31" },
  ]);
  assert.deepEqual(legacy.rates.high, [1, 6, 11]);
  assert.deepEqual(parseBackup(JSON.stringify({ schemaVersion: 2, revision: 1, data: legacy })).data, migrated);
  assert.equal(bookingPrice(migrated, "Bobi", "2028-02-28", "2028-03-02", "Boarding"), 50);
});

test("invalid seasons are rejected before saving or importing", () => {
  const data = fixture();
  for (const high of [
    [{ start: "02-30", end: "03-01" }], [{ start: "04-31", end: "05-01" }],
    [{ start: "00-01", end: "12-01" }], [{ start: "01-01", end: "13-01" }],
    [{ start: "1-01", end: "01-02" }], [{ start: "2026-01-01", end: "01-02" }],
    [{ start: "01-01" }], [null], [12], [-1], [1, 1], [1, { start: "01-01", end: "01-31" }],
  ]) assert.throws(() => validateData({ ...data, rates: { ...data.rates, high } }));
});
