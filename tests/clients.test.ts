import test from "node:test";
import assert from "node:assert/strict";
import { groupClients } from "../src/utils/clients.ts";
import { bookingPrice, defaultData, validateData } from "../src/utils/hotel-data.ts";

test("one client groups multiple dogs despite whitespace and case differences", () => {
  const data = defaultData();
  data.guests = [
    { name: "Bobi", owner: " Ana Costa ", breed: "Labrador", age: "Adult" },
    { name: "Luna", owner: "ana  costa", breed: "Poodle", age: "Senior" },
    { name: "Rex", owner: "Maria", breed: "Poodle", age: "Puppy" },
  ];
  const clients = groupClients(data.guests);
  assert.equal(clients.length, 2);
  assert.equal(clients[0].name, "Ana Costa");
  assert.deepEqual(clients[0].dogs.map(dog => dog.name), ["Bobi", "Luna"]);
  data.rates.Adult = [10, 10]; data.rates.Senior = [20, 20];
  for (const dog of ["Bobi", "Luna"]) data.bookings.push({ dog, start: "2026-11-08", end: "2026-11-10", type: "Boarding", paid: false, total: bookingPrice(data, dog, "2026-11-08", "2026-11-10", "Boarding") });
  assert.deepEqual(validateData(data).bookings.map(b => b.total), [20, 40]);
});
