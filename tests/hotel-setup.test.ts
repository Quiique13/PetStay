import test from "node:test";
import assert from "node:assert/strict";
import { defaultData, newHotelData, validateData, bookingPrice } from "../src/utils/hotel-data.ts";

const profile = { name: "Hotel de teste", owner: "Pessoa", avatar: "" };

test("new hotel registration has no clients, bookings, configured seasons or prices", () => {
  const data = newHotelData(profile);
  assert.deepEqual([...data.guests], []);
  assert.deepEqual(data.bookings, []);
  assert.deepEqual(data.rates, { Puppy: [null, null], Adult: [null, null], Senior: [null, null], day: null, high: [] });
  const another = newHotelData({ ...profile, name: "Outro hotel" });
  data.guests.push({ name: "Teste", owner: "Tutor", breed: "Teste", age: "Adult" });
  data.rates.Adult[0] = 22;
  assert.deepEqual(another.guests, []);
  assert.equal(another.rates.Adult[0], null);
});

test("hotel name and owner are required and unsafe or oversized avatars are rejected", () => {
  assert.throws(() => newHotelData(null));
  assert.throws(() => newHotelData({ ...profile, name: " " }));
  assert.throws(() => newHotelData({ ...profile, owner: "" }));
  assert.throws(() => newHotelData({ ...profile, avatar: "https://example.com/avatar.jpg" }));
  assert.throws(() => newHotelData({ ...profile, avatar: "data:image/svg+xml;base64,aGVsbG8=" }));
  assert.throws(() => newHotelData({ ...profile, avatar: "data:image/png;base64," + "A".repeat(1_400_000) }));
  assert.doesNotThrow(() => newHotelData({ ...profile, avatar: "data:image/webp;base64,aGVsbG8=" }));
});

test("unset prices cannot silently create free bookings, while explicit zero is valid", () => {
  const data = newHotelData(profile);
  assert.throws(() => bookingPrice(data, "Teste", "2026-11-03", "2026-11-04", "Boarding"), /hóspede/);
  data.guests.push({ name: "Teste", owner: "Tutor", age: "Adult", breed: "Teste" });
  assert.throws(() => bookingPrice(data, "Teste", "2026-11-03", "2026-11-04", "Boarding"), /Defina/);
  assert.throws(() => bookingPrice(data, "Teste", "2026-11-03", "2026-11-03", "Daycare"), /Defina/);
  data.rates.Adult[0] = 0;
  data.rates.day = 0;
  assert.equal(bookingPrice(data, "Teste", "2026-11-03", "2026-11-04", "Boarding"), 0);
  assert.equal(bookingPrice(data, "Teste", "2026-11-03", "2026-11-03", "Daycare"), 0);
  assert.doesNotThrow(() => validateData(data));
});

test("manually entered prices use each night's season and the guest's age", () => {
  const data = defaultData();
  data.guests.push({ name: "Teste", owner: "Tutor", age: "Senior", breed: "Teste" });
  data.rates.Senior = [22.5, 30.25];
  data.rates.high = [{ start: "12-01", end: "12-31" }];
  assert.equal(bookingPrice(data, "Teste", "2026-11-30", "2026-12-02", "Boarding"), 52.75);
  data.rates.Senior[1] = null;
  assert.throws(() => bookingPrice(data, "Teste", "2026-11-30", "2026-12-02", "Boarding"), /Defina/);
});
