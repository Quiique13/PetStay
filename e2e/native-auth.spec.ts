import { test, expect } from "@playwright/test";
import { mockFirebase, testEmail, testToken, testUid } from "./auth-fixture.ts";

test.use({ serviceWorkers: "block" });

test("native Google credentials establish the React session and persist after reopening", async ({ context, page }) => {
  await mockFirebase(context);
  await context.addInitScript(() => {
    Object.assign(window, {
      androidBridge: {},
      Capacitor: {
        PluginHeaders: [{ name: "FirebaseAuthentication", methods: [{ name: "signInWithGoogle", rtype: "promise" }] }],
        nativePromise: async (plugin: string, method: string, options: { skipNativeAuth?: boolean }) => {
          if (plugin !== "FirebaseAuthentication" || method !== "signInWithGoogle" || options.skipNativeAuth !== true) {
            throw new Error("Unexpected native authentication call.");
          }
          return { credential: { idToken: "native-google-id-token" } };
        },
      },
    });
  });
  let credentialExchanges = 0;
  await context.route("https://identitytoolkit.googleapis.com/**/accounts:signInWithIdp*", async route => {
    const body = route.request().postDataJSON();
    const credential = new URLSearchParams(body.postBody);
    expect(credential.get("id_token")).toBe("native-google-id-token");
    expect(credential.get("providerId")).toBe("google.com");
    credentialExchanges++;
    await route.fulfill({ json: {
      localId: testUid, email: testEmail, emailVerified: true, providerId: "google.com",
      idToken: testToken(), refreshToken: "fixture-refresh", expiresIn: "86400",
    } });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Continuar com Google" }).click();
  await expect(page.getByLabel("Nome do hotel", { exact: true })).toBeVisible();
  expect(credentialExchanges).toBe(1);
  await expect(page.locator(".mobile-install")).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Nome do hotel", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Terminar sessão", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao PetStay" })).toBeVisible();
});
