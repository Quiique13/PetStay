import { test as base, expect } from "@playwright/test";
import type { BrowserContext } from "@playwright/test";
import { defaultFirebaseConfig } from "../src/services/firebase-config.ts";

export const testUid = "e2e-owner";
export const testEmail = "owner@example.test";

export function testToken(uid = testUid) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "RS256", kid: "fixture" })}.${encode({ sub: uid, user_id: uid, email: testEmail,
    iat: now, exp: now + 86400, auth_time: now, aud: defaultFirebaseConfig.projectId,
    iss: `https://securetoken.google.com/${defaultFirebaseConfig.projectId}`,
    firebase: { sign_in_provider: "password", identities: { email: [testEmail] } } })}.fixture`;
}

// Used only by the desktop server created inside the round-trip test.
// Production servers always use the real cryptographic Firebase verifier.
export async function verifyTestToken(token: string) {
  if (!token.endsWith(".fixture") || JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).sub !== testUid) throw new Error("Invalid test token");
  return testUid;
}

export async function mockFirebase(context: BrowserContext) {
  await context.route("https://identitytoolkit.googleapis.com/**", async route => {
    const url = route.request().url();
    const body = route.request().postDataJSON() ?? {};
    const uid = body.email === "second@example.test" ? "e2e-second" : testUid;
    const email = body.email || testEmail;
    const user = { localId: uid, email, emailVerified: false, displayName: "", providerUserInfo: [{ providerId: "password", email, rawId: email }] };
    if (url.includes(":signInWithPassword") && body.password === "incorrect") {
      await route.fulfill({ status: 400, json: { error: { code: 400, message: "INVALID_LOGIN_CREDENTIALS" } } });
    } else if (url.includes(":lookup")) {
      const tokenUid = body.idToken ? JSON.parse(Buffer.from(body.idToken.split(".")[1], "base64url").toString()).sub : testUid;
      await route.fulfill({ json: { users: [{ ...user, localId: tokenUid, email: tokenUid === "e2e-second" ? "second@example.test" : testEmail }] } });
    } else if (url.includes(":signInWithPassword") || url.includes(":signUp")) {
      await route.fulfill({ json: { ...user, idToken: testToken(uid), refreshToken: "fixture-refresh", expiresIn: "86400", registered: true } });
    } else if (url.includes(":sendOobCode")) {
      await route.fulfill({ json: { email } });
    } else if (url.includes("recaptchaConfig")) {
      await route.fulfill({ json: { recaptchaEnforcementState: [] } });
    } else {
      await route.fulfill({ json: { projectId: defaultFirebaseConfig.projectId, authorizedDomains: ["localhost", "127.0.0.1"] } });
    }
  });
  await context.route("https://securetoken.googleapis.com/**", route => route.fulfill({ json: {
    access_token: testToken(), id_token: testToken(), refresh_token: "fixture-refresh", expires_in: "86400", token_type: "Bearer", user_id: testUid,
  } }));
}

export async function seedSignedInAccount(context: BrowserContext) {
  await mockFirebase(context);
  const token = testToken();
  await context.addInitScript(({ apiKey, uid, email, token }) => {
    const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      uid, email, emailVerified: false, isAnonymous: false, providerData: [{ providerId: "password", uid: email, email }],
      stsTokenManager: { refreshToken: "fixture-refresh", accessToken: token, expirationTime: Date.now() + 86400000 },
      createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: "[DEFAULT]",
    }));
  }, { apiKey: defaultFirebaseConfig.apiKey, uid: testUid, email: testEmail, token });
}

export const test = base.extend({
  // WebKit cannot route Firebase requests once a service worker controls a page.
  // Keep fake credentials inside the mocked context; the offline test opts in.
  serviceWorkers: "block",
  context: async ({ context }, use) => {
    await seedSignedInAccount(context);
    await use(context);
  },
});

export { expect };
