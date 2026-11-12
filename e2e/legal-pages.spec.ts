import { test, expect } from "@playwright/test";

test("legal pages are public, script-free and linked before sign-in", async ({ page, request }) => {
  for (const document of ["index", "privacy", "terms", "cookies", "rights"]) {
    const response = await request.get(`/legal/${document}.html`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/html");
    expect(await response.text()).not.toMatch(/<script/i);
  }
  const outgoing: string[] = [];
  page.on("request", request => outgoing.push(request.url()));
  await page.goto("/legal/privacy.html");
  await expect(page.getByRole("heading", { name: "Política de privacidade", exact: true })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("Rascunho");
  expect(outgoing.some(url => /googleapis|firebase|gstatic/.test(url))).toBe(false);
  await page.goto("/");
  const information = page.getByRole("navigation", { name: "Informação legal", exact: true });
  await expect(information.getByRole("link", { name: "Privacidade", exact: true })).toHaveAttribute("href", /legal\/privacy.html$/);
  await expect(information.getByRole("link", { name: "Termos de utilização", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar com Google", exact: true })).toBeVisible();
});
