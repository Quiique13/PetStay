import test from "node:test";
import assert from "node:assert/strict";
import { squareCrop } from "../src/utils/photo-crop.ts";

test("square photo crops can reach both edges of landscape and portrait photos without gaps", () => {
  assert.deepEqual(squareCrop(900, 300, 1, 0.5, 0.5), { x: 300, y: 0, size: 300, outputSize: 300 });
  assert.equal(squareCrop(900, 300, 1, 1, 0.5).x, 600);
  assert.equal(squareCrop(900, 300, 1, 0, 0.5).x, 0);
  assert.equal(squareCrop(300, 900, 1, 0.5, 1).y, 600);
  assert.equal(squareCrop(300, 900, 1, 0.5, 0).y, 0);
  const zoomed = squareCrop(900, 300, 2, 1, 1);
  assert.deepEqual(zoomed, { x: 750, y: 150, size: 150, outputSize: 150 });
  assert.equal(zoomed.x + zoomed.size, 900);
  assert.equal(zoomed.y + zoomed.size, 300);
});

test("photo crops cap output size, preserve small images and constrain movement", () => {
  assert.equal(squareCrop(4000, 3000, 1, 0.5, 0.5).outputSize, 800);
  assert.equal(squareCrop(64, 48, 1, 0.5, 0.5).outputSize, 48);
  assert.deepEqual(squareCrop(900, 300, 0, -1, 2), { x: 0, y: 0, size: 300, outputSize: 300 });
  assert.equal(squareCrop(100, 100, 100, 0, 0).size, 25);
  for (const dimensions of [[0, 300], [-1, 300], [300, NaN], [Infinity, 300]]) {
    assert.throws(() => squareCrop(dimensions[0], dimensions[1], 1, 0.5, 0.5), RangeError);
  }
});
