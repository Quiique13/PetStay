import { test, expect } from "@playwright/test";
import { mockFirebase } from "./auth-fixture.ts";

// WebKit does not route requests once a service worker controls the page.
// Keep authentication HTTP mocks deterministic; offline PWA behavior has its
// own test with service workers enabled.
test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ context }) => { await mockFirebase(context); });

test("login, errors, persistence, logout and switching accounts keep separate hotels", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByLabel("Nome do hotel", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continuar com Google" })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
  await page.getByLabel("Palavra-passe", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Email ou palavra-passe incorretos.");
  await page.screenshot({ path: testInfo.outputPath("login.png") });
  await page.getByLabel("Palavra-passe", { exact: true }).fill("correct-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByLabel("Nome do hotel", { exact: true }).fill("Primeiro hotel");
  await page.getByLabel("O seu nome", { exact: true }).fill("Ana");
  await page.getByRole("button", { name: "Criar o meu hotel", exact: true }).click();
  await expect(page.locator(".heading h1")).toContainText("Ana");
  await page.reload();
  await expect(page.locator(".heading h1")).toContainText("Ana");
  await page.getByRole("button", { name: "Terminar sessão", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao PetStay" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao PetStay" })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("second@example.test");
  await page.getByLabel("Palavra-passe", { exact: true }).fill("correct-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByLabel("Nome do hotel", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Terminar sessão", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
  await page.getByLabel("Palavra-passe", { exact: true }).fill("correct-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator(".heading h1")).toContainText("Ana");
});

test("signup validates password confirmation, password reset and language selection work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Esqueci-me da palavra-passe" }).click();
  await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
  const resetRequest = page.waitForRequest(request => request.url().includes(":sendOobCode"));
  await page.getByRole("button", { name: "Enviar email de recuperação" }).click();
  expect((await resetRequest).postDataJSON()).toMatchObject({ requestType: "PASSWORD_RESET", email: "owner@example.test" });
  await expect(page.getByRole("status")).toContainText("Se existir uma conta");
  await page.getByRole("button", { name: "Voltar ao início de sessão" }).click();
  await page.getByRole("button", { name: "Ainda não tem conta? Criar conta" }).click();
  await page.getByLabel("Palavra-passe", { exact: true }).fill("password-one");
  await page.getByLabel("Confirmar palavra-passe", { exact: true }).fill("password-two");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("As palavras-passe não coincidem.");
  await page.getByLabel("Confirmar palavra-passe", { exact: true }).fill("password-one");
  await page.locator('select[name="appLanguage"]').selectOption("en");
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByLabel("Hotel name", { exact: true })).toBeVisible();
});
