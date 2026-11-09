import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { request } from "node:http";
import { startDesktopServer } from "../server/desktop-server.ts";
import { newHotelData } from "../src/utils/hotel-data.ts";
import { fixture } from "./storage-fixture.ts";
import { accountDataDirectory } from "../server/local-store.ts";

const verifyToken = async (token: string) => {
  if (token !== "owner-token") throw new Error("Invalid token");
  return "test-owner";
};
const authorization = { Authorization: "Bearer owner-token" };

test("desktop serves only packaged assets and preserves hotel records across restarts", async t => {
  const { directory } = await fixture(t);
  const assets = join(directory, "assets");
  const data = join(directory, "data");
  await mkdir(assets);
  await writeFile(join(assets, "index.html"), "<html>PetStay</html>");
  await writeFile(join(directory, "private.txt"), "private");
  let local = await startDesktopServer(assets, data, verifyToken);
  const stop = () => new Promise<void>((done, reject) => {
    local.server.close(error => error ? reject(error) : done());
    local.server.closeAllConnections();
  });
  t.after(stop);
  assert.equal(local.server.address() && (local.server.address() as { address: string }).address, "127.0.0.1");
  const page = await fetch(local.url);
  assert.equal(await page.text(), "<html>PetStay</html>");
  assert.match(page.headers.get("content-security-policy") ?? "", /script-src 'self'/);
  assert.match(page.headers.get("content-security-policy") ?? "", /img-src 'self' data: blob:/);
  assert.match(page.headers.get("content-security-policy") ?? "", /connect-src[^;]+https:\/\/firestore.googleapis.com/);
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
    method: "PUT", headers: { ...authorization, "Content-Type": "application/json" }, body: JSON.stringify({ data: hotel, revision: 0 }),
  });
  assert.equal(save.status, 200);
  assert.equal(JSON.parse(await readFile(join(accountDataDirectory(data, "test-owner"), "hotel.json"), "utf8")).data.hotel.name, "Portable test");
  await stop();
  const previousPort = Number(new URL(local.url).port);
  local = await startDesktopServer(assets, data, verifyToken, previousPort);
  assert.equal(Number(new URL(local.url).port), previousPort);
  // Use a fresh socket: Undici's old keep-alive pool can still contain a closed
  // connection to this exact port immediately after restarting the server.
  const reopened = await new Promise<{ data: unknown; revision: number }>((done, reject) => {
    const req = request(local.url + "/api/storage", { headers: authorization, agent: false }, response => {
      let body = ""; response.setEncoding("utf8"); response.on("data", chunk => { body += chunk; });
      response.on("end", () => { try { done(JSON.parse(body)); } catch (cause) { reject(cause); } });
    });
    req.on("error", reject); req.end();
  });
  assert.deepEqual(reopened.data, hotel);
  assert.equal(reopened.revision, 1);
});
