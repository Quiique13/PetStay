import test from "node:test";
import assert from "node:assert/strict";
import { bookingPrice, defaultData, validateData } from "../src/utils/hotel-data.ts";

function fixture() {
  const data = defaultData();
  data.guests = [{ name: "Bobi", owner: "Ana", breed: "Labrador", age: "Adult", neutered: false }];
  data.rates.Adult = [10, 20]; data.rates.day = 7;
  data.rates.high = [{ start: "07-15", end: "07-20" }];
  return data;
}
test("daily custom rates multiply nights before applying discount and optional surcharge", () => {
  const data = fixture();
  assert.equal(bookingPrice(data, "Bobi", "2027-07-14", "2027-07-17", "Boarding", { customRate: 20, discountPercent: 10 }), 54);
  assert.equal(bookingPrice(data, "Bobi", "2027-07-14", "2027-07-17", "Boarding", { customRate: 20, discountPercent: 10, intactSurcharge: true }), 59.4);
  assert.equal(bookingPrice(data, "Bobi", "2027-07-14", "2027-07-17", "Boarding", { discountPercent: 10 }), 45);
  assert.equal(bookingPrice(data, "Bobi", "2027-07-14", "2027-07-14", "Daycare", { customRate: 20, discountPercent: 10 }), 18);
  assert.equal(bookingPrice(data, "Bobi", "2027-07-14", "2027-07-14", "Daycare", { discountPercent: 12.5 }), 6.13);
  assert.equal(bookingPrice(data, "Bobi", "2027-07-14", "2027-07-17", "Boarding", { customRate: 0 }), 0);
  assert.equal(bookingPrice(data, "Bobi", "2027-07-14", "2027-07-17", "Boarding", { discountPercent: 100 }), 0);
  assert.equal(bookingPrice(data, "Bobi", "2027-07-14", "2027-07-17", "Boarding", { customTotal: 45 }), 45);
  assert.equal(bookingPrice(data, "Bobi", "2027-07-14", "2027-07-17", "Boarding", { customTotal: 45, discountPercent: 10 }), 40.5);
});
test("discount and daily prices survive storage validation and invalid values are rejected", () => {
  const data = fixture();
  data.bookings = [{ dog: "Bobi", start: "2027-07-14", end: "2027-07-17", type: "Boarding", paid: true, total: 54, customRate: 20, discountPercent: 10 }];
  assert.deepEqual(validateData(JSON.parse(JSON.stringify(data))), data);
  for (const discountPercent of [-1, 101, NaN, Infinity]) {
    assert.throws(() => bookingPrice(data, "Bobi", "2027-07-14", "2027-07-17", "Boarding", { discountPercent }));
    assert.throws(() => validateData({ ...data, bookings: [{ ...data.bookings[0], discountPercent }] }));
  }
  for (const customRate of [-1, NaN, Infinity]) assert.throws(() => bookingPrice(data, "Bobi", "2027-07-14", "2027-07-17", "Boarding", { customRate }));
  data.rates.Adult = [null, null]; data.rates.day = null;
  assert.equal(bookingPrice(data, "Bobi", "2027-07-14", "2027-07-17", "Boarding", { customRate: 20, discountPercent: 10 }), 54);
  assert.equal(bookingPrice(data, "Bobi", "2027-07-14", "2027-07-14", "Daycare", { customRate: 20 }), 20);
});
