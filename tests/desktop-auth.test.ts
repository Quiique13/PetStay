import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { startDesktopServer } from "../server/desktop-server.ts";
import { createDesktopAuthBridge } from "../server/desktop-auth.ts";
import { fixture } from "./storage-fixture.ts";

test("desktop Google callback requires its one-use secret, exact origin and bounded JSON body", async t => {
  const { directory } = await fixture(t);
  const assets = join(directory, "assets");
  await mkdir(assets);
  await writeFile(join(assets, "index.html"), "PetStay");
  const local = await startDesktopServer(assets, join(directory, "data"));
  t.after(() => {
    local.desktopAuth.cancel();
    local.server.close();
    local.server.closeAllConnections();
  });
  const attempt = local.desktopAuth.begin(local.url);
  const helper = new URL(attempt.url);
  assert.equal(helper.origin, local.url);
  assert.equal(helper.search, "?desktop-sign-in=1");
  assert.match(helper.hash, /^#[a-f0-9]{64}$/);
  const secret = helper.hash.slice(1);
  const headers = { Origin: local.url, "Content-Type": "application/json", "X-PetStay-Sign-In": secret };
  const endpoint = local.url + "/api/desktop-auth/complete";
  const post = (body: string, replacements = {}) => fetch(endpoint, { method: "POST", headers: { ...headers, ...replacements }, body });

  assert.equal((await fetch(endpoint)).status, 405);
  assert.equal((await post('{"idToken":"google-token"}', { Origin: "https://attacker.invalid" })).status, 403);
  assert.equal((await post('{"idToken":"google-token"}', { "X-PetStay-Sign-In": "a".repeat(64) })).status, 403);
  assert.equal((await post('{"idToken":"google-token"}', { "X-PetStay-Sign-In": "é".repeat(64) })).status, 403);
  assert.equal((await post('{"idToken":"google-token"}', { "Content-Type": "text/plain" })).status, 415);
  assert.equal((await post("not-json")).status, 400);
  assert.equal((await post('{"idToken":false}')).status, 400);
  assert.equal((await post("x".repeat(17_000))).status, 413);
  assert.equal((await post('{"idToken":"google-token"}')).status, 204);
  assert.equal(await attempt.result, "google-token");
  assert.equal((await post('{"idToken":"google-token"}')).status, 403, "a callback cannot be replayed");
  assert.equal((await fetch(local.url + "/api/storage")).status, 401, "Google callback does not bypass Firebase token verification");
});

test("desktop sign-in cancels replaced requests, explicit cancellation and expired attempts", async () => {
  const bridge = createDesktopAuthBridge(20);
  const first = bridge.begin("http://127.0.0.1:12345");
  const second = bridge.begin("http://127.0.0.1:12345");
  assert.notEqual(first.url, second.url);
  await assert.rejects(first.result, { code: "auth/popup-closed-by-user" });
  bridge.cancel();
  await assert.rejects(second.result, { code: "auth/popup-closed-by-user" });
  const third = bridge.begin("http://127.0.0.1:12345");
  await new Promise(done => setTimeout(done, 30));
  await assert.rejects(third.result, { code: "auth/popup-closed-by-user" });
});
