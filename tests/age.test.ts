import test from "node:test";
import assert from "node:assert/strict";
import { ageGroupFromBirth, ageInMonths, guestAgeGroup, isBirthDate } from "../src/utils/age.ts";
import { bookingPrice, defaultData, validateData } from "../src/utils/hotel-data.ts";

const on = (date: string) => new Date(date + "T12:00:00");

test("age groups change on the exact first and eighth birthdays", () => {
  assert.equal(ageGroupFromBirth("2025-11-09", on("2026-11-08")), "Puppy");
  assert.equal(ageGroupFromBirth("2025-11-09", on("2026-11-09")), "Adult");
  assert.equal(ageGroupFromBirth("2018-11-09", on("2026-11-08")), "Adult");
  assert.equal(ageGroupFromBirth("2018-11-09", on("2026-11-09")), "Senior");
  assert.equal(ageInMonths("2020-12-15", on("2026-01-14")), 60);
  assert.equal(ageInMonths("2020-12-15", on("2026-01-15")), 61);
  assert.equal(ageGroupFromBirth("2026-11-08", on("2026-11-08")), "Puppy");
});

test("leap birthdays use February 28 in non-leap years", () => {
  assert.equal(ageGroupFromBirth("2024-02-29", on("2025-02-27")), "Puppy");
  assert.equal(ageGroupFromBirth("2024-02-29", on("2025-02-28")), "Adult");
  assert.equal(ageGroupFromBirth("2020-02-29", on("2028-02-28")), "Adult");
  assert.equal(ageGroupFromBirth("2020-02-29", on("2028-02-29")), "Senior");
});

test("invalid and future birthdays are rejected, legacy groups stay valid", () => {
  for (const value of ["2025-02-29", "2026-04-31", "2026-13-01", "08/11/2026", "2026-11", ""]) assert.equal(isBirthDate(value), false);
  assert.throws(() => ageGroupFromBirth("2026-11-09", on("2026-11-08")));
  const data = defaultData();
  data.guests = [{ name: "Bobi", owner: "Ana", breed: "Labrador", age: "Adult" }];
  assert.equal(guestAgeGroup(data.guests[0]), "Adult");
  assert.doesNotThrow(() => validateData(data));
  data.guests[0].birthDate = "2199-01-01";
  assert.throws(() => validateData(data));
});

test("booking nights use the dog's age on each night and preserve saved totals", () => {
  const data = defaultData();
  data.guests = [{ name: "Bobi", owner: "Ana", breed: "Labrador", age: "Puppy", birthDate: "2020-11-09" }];
  data.rates.Adult = [10, 10]; data.rates.Senior = [20, 20];
  assert.equal(bookingPrice(data, "Bobi", "2028-11-08", "2028-11-11", "Boarding"), 50);
  assert.equal(data.guests[0].age, "Puppy");
});
