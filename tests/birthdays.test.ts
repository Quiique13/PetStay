import test from "node:test";
import assert from "node:assert/strict";
import { birthdayAlerts, birthdaysInMonth } from "../src/utils/birthdays.ts";
import type { Guest } from "../src/types.ts";
import { defaultData, validateData } from "../src/utils/hotel-data.ts";

const dog = (name: string, birthDate?: string): Guest => ({ name, birthDate, owner: "Ana", breed: "Labrador", age: "Adult" });
test("deceased dogs keep their records but have no birthday events or alerts", () => {
  const deceased = { ...dog("Bobi", "2020-11-08"), deceased: true };
  assert.equal(birthdaysInMonth([deceased], 2026, 10).length, 0);
  assert.equal(birthdayAlerts([deceased], new Date(2026, 10, 7)).length, 0);
  assert.equal(birthdayAlerts([deceased], new Date(2026, 10, 8)).length, 0);
  const data = defaultData(); data.guests = [deceased];
  assert.equal(validateData(JSON.parse(JSON.stringify(data))).guests[0].deceased, true);
  assert.throws(() => validateData({ ...data, guests: [{ ...deceased, deceased: "yes" }] }));
  assert.equal(birthdayAlerts([{ ...deceased, deceased: false }], new Date(2026, 10, 8)).length, 1);
});
test("alerts include today and tomorrow, across month/year boundaries and leap birthdays", () => {
  const guests = [dog("Today", "2020-12-31"), dog("Tomorrow", "2020-01-01"), dog("Later", "2020-01-02"), dog("Unknown")];
  assert.deepEqual(birthdayAlerts(guests, new Date(2026, 11, 31, 23, 59)).map(a => [a.guest.name, a.daysAway, a.age]), [["Today", 0, 6], ["Tomorrow", 1, 7]]);
  assert.deepEqual(birthdayAlerts([dog("Leap", "2020-02-29")], new Date(2026, 1, 27)).map(a => [a.daysAway, a.age]), [[1, 6]]);
  assert.equal(birthdayAlerts([dog("Leap", "2020-02-29")], new Date(2028, 1, 28))[0].daysAway, 1);
  assert.equal(birthdayAlerts([dog("Month end", "2020-04-01")], new Date(2026, 2, 31))[0].daysAway, 1);
  assert.equal(birthdayAlerts(guests, new Date(2026, 5, 1)).length, 0);
});
test("birthdays recur each year, share dates, sort, and omit missing or not-yet-born guests", () => {
  const guests = [dog("Rex", "2020-11-20"), dog("Luna", "2021-11-10"), dog("Bobi", "2022-11-10"), dog("Missing"), dog("Other", "2020-12-01")];
  assert.deepEqual(birthdaysInMonth(guests, 2026, 10).map(b => [b.guest.name, b.day, b.age]), [["Bobi", 10, 4], ["Luna", 10, 5], ["Rex", 20, 6]]);
  assert.equal(birthdaysInMonth(guests, 2019, 10).length, 0);
  assert.equal(birthdaysInMonth([], 2026, 0).length, 0);
});
test("February 29 follows the app's leap birthday rule", () => {
  assert.equal(birthdaysInMonth([dog("Leap", "2020-02-29")], 2026, 1)[0].day, 28);
  assert.equal(birthdaysInMonth([dog("Leap", "2020-02-29")], 2028, 1)[0].day, 29);
});
