import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { request } from "node:http";
import { startDesktopServer } from "../desktop/server.ts";
import { newHotelData } from "../src/utils/hotel-data.ts";
import { fixture } from "./storage-fixture.ts";

test("desktop serves only packaged assets and preserves hotel records across restarts", async t => {
  const { directory } = await fixture(t);
  const assets = join(directory, "assets");
  const data = join(directory, "data");
  await mkdir(assets);
  await writeFile(join(assets, "index.html"), "<html>PetStay</html>");
  await writeFile(join(directory, "private.txt"), "private");
  let local = await startDesktopServer(assets, data);
  const stop = () => new Promise<void>((done, reject) => {
    local.server.close(error => error ? reject(error) : done());
    local.server.closeAllConnections();
  });
  t.after(stop);
  assert.equal(local.server.address() && (local.server.address() as { address: string }).address, "127.0.0.1");
  const page = await fetch(local.url);
  assert.equal(await page.text(), "<html>PetStay</html>");
  assert.match(page.headers.get("content-security-policy") ?? "", /script-src 'self'/);
  assert.equal((await fetch(local.url, { method: "HEAD" })).status, 200);
  assert.equal((await fetch(local.url, { method: "POST" })).status, 405);
  for (const path of ["/data/hotel.json", "/data/hotel.json.bak", "/%2e%2e%2fprivate.txt", "/%5c..%5cprivate.txt", "/missing.js", "/%00"]) {
    assert.equal((await fetch(local.url + path)).status, 404, path);
  }
  const wrongHost = await new Promise<number | undefined>((done, reject) => {
    const req = request(local.url, { headers: { Host: "attacker.invalid" } }, res => { res.resume(); done(res.statusCode); });
    req.on("error", reject); req.end();
  });
  assert.equal(wrongHost, 403);
  assert.equal((await fetch(local.url + "/api/storage", { headers: { Origin: "https://attacker.invalid" } })).status, 403);
  const hotel = newHotelData({ name: "Portable test", owner: "Test owner", avatar: "" });
  const save = await fetch(local.url + "/api/storage", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: hotel, revision: 0 }),
  });
  assert.equal(save.status, 200);
  assert.equal(JSON.parse(await readFile(join(data, "hotel.json"), "utf8")).data.hotel.name, "Portable test");
  await stop();
  local = await startDesktopServer(assets, data);
  const reopened = await (await fetch(local.url + "/api/storage")).json();
  assert.deepEqual(reopened.data, hotel);
  assert.equal(reopened.revision, 1);
});
