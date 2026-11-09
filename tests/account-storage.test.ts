import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { IDBFactory } from "fake-indexeddb";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { createFirebaseTokenVerifier } from "../server/firebase-auth.ts";
import { accountDataDirectory, createAccountStorageMiddleware } from "../server/local-store.ts";
import { loadMobileData, loadMobileRecovery, saveMobileData } from "../src/services/mobile-storage.ts";
import { newHotelData } from "../src/utils/hotel-data.ts";
import { authErrorMessage } from "../src/services/auth-errors.ts";
import { fixture } from "./storage-fixture.ts";

test("browser hotels and recovery copies are isolated by account; legacy data stays untouched", async () => {
  Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: new IDBFactory() });
  const legacy = newHotelData({ name: "Legacy", owner: "Legacy", avatar: "" });
  const alice = newHotelData({ name: "Alice's hotel", owner: "Alice", avatar: "" });
  const bob = newHotelData({ name: "Bob's hotel", owner: "Bob", avatar: "" });
  await saveMobileData(legacy, 0);
  await saveMobileData(alice, 0, false, "alice");
  assert.equal((await loadMobileData("bob")).initialized, false);
  await saveMobileData(bob, 0, false, "bob");
  await saveMobileData({ ...alice, capacity: 30 }, 1, true, "alice");
  assert.deepEqual((await loadMobileData("bob")).data, bob);
  assert.deepEqual((await loadMobileRecovery("alice"))?.data, alice);
  assert.equal(await loadMobileRecovery("bob"), null);
  assert.equal((await loadMobileData("alice")).data.capacity, 30);
  assert.deepEqual((await loadMobileData()).data, legacy);
});

test("Firebase verifier rejects forged, expired, wrong-project and future-dated tokens", async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const key = { ...await exportJWK(publicKey), kid: "test-key", alg: "RS256" };
  const verify = createFirebaseTokenVerifier("test-project", createLocalJWKSet({ keys: [key] }));
  const now = Math.floor(Date.now() / 1000);
  const token = (claims = {}) => new SignJWT({ sub: "alice", iat: now, exp: now + 3600, auth_time: now,
    aud: "test-project", iss: "https://securetoken.google.com/test-project", ...claims })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" }).sign(privateKey);
  assert.equal(await verify(await token()), "alice");
  for (const claims of [{ exp: now - 1 }, { aud: "other" }, { iss: "https://attacker.invalid" },
    { sub: "" }, { iat: now + 60 }, { auth_time: now + 60 }]) {
    await assert.rejects(verify(await token(claims)));
  }
  const signed = await token();
  const parts = signed.split(".");
  parts[1] = Buffer.from(JSON.stringify({ sub: "bob" })).toString("base64url");
  await assert.rejects(verify(parts.join(".")));
  await assert.rejects(verify("not-a-token"));
});

test("desktop account endpoints require verified identity and isolate files and recoveries", async t => {
  const { directory } = await fixture(t);
  await mkdir(join(directory, "legacy"));
  const legacyFile = join(directory, "hotel.json");
  await writeFile(legacyFile, "preserved legacy data");
  const middleware = createAccountStorageMiddleware(directory, async token => {
    if (token === "alice-token") return "alice";
    if (token === "bob-token") return "bob";
    throw new Error("Invalid token");
  });
  const server = createServer((req, res) => middleware(req, res, () => res.writeHead(404).end()));
  await new Promise<void>(done => server.listen(0, "127.0.0.1", done));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>(done => server.close(() => done()));
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/api/storage`;
  const headers = (user: string) => ({ Authorization: `Bearer ${user}-token`, "Content-Type": "application/json" });
  for (const suffix of ["", "/recovery"]) {
    assert.equal((await fetch(url + suffix)).status, 401);
    assert.equal((await fetch(url + suffix, { headers: headers("forged") })).status, 401);
  }
  const alice = newHotelData({ name: "Alice", owner: "Alice", avatar: "" });
  assert.equal((await fetch(url, { method: "PUT", headers: headers("alice"), body: JSON.stringify({ data: alice, revision: 0 }) })).status, 200);
  assert.equal((await (await fetch(url, { headers: headers("bob") })).json()).initialized, false);
  assert.equal((await (await fetch(url + "/recovery", { headers: headers("bob") })).json()).data, null);
  assert.deepEqual((await (await fetch(url, { headers: headers("alice") })).json()).data, alice);
  assert.equal(await readFile(legacyFile, "utf8"), "preserved legacy data");
  assert.equal(JSON.parse(await readFile(join(accountDataDirectory(directory, "alice"), "hotel.json"), "utf8")).data.hotel.name, "Alice");
  assert.equal((await fetch(url, { headers: { ...headers("alice"), Origin: "https://attacker.invalid" } })).status, 403);
});

test("authentication errors explain common failures without exposing raw server errors", () => {
  assert.equal(authErrorMessage({ code: "auth/wrong-password" }), authErrorMessage({ code: "auth/user-not-found" }));
  assert.match(authErrorMessage({ code: "auth/unauthorized-domain" }), /domínio/);
  assert.match(authErrorMessage({ code: "auth/operation-not-allowed" }), /ativo/);
  assert.match(authErrorMessage({ code: "auth/popup-blocked" }), /pop-up/);
  assert.doesNotMatch(authErrorMessage(new Error("private details")), /private details/);
});
