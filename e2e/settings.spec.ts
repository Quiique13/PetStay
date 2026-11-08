import { test, expect } from "@playwright/test";

test("settings save the hotel profile and device appearance", async ({
  page,
}, testInfo) => {
  const exceptions: string[] = [];
  page.on("pageerror", (error) => exceptions.push(error.message));
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page
    .getByLabel("Nome do hotel", { exact: true })
    .fill("Hotel das Patas");
  await page.getByLabel("O seu nome", { exact: true }).fill("Ana Silva");
  await page
    .getByRole("button", { name: "Criar o meu hotel", exact: true })
    .click();
  await page.getByRole("button", { name: "Definições", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Definições", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Nova reserva", exact: true }),
  ).toHaveCount(0);

  const save = page.getByRole("button", {
    name: "Guardar perfil",
    exact: true,
  });
  await page.getByLabel("Nome do hotel", { exact: true }).fill(" ");
  await save.click();
  await expect(page.getByRole("alert")).toContainText("Preencha");
  await page
    .getByLabel("Nome do hotel", { exact: true })
    .fill("Hotel do Oceano");
  await page.getByLabel("O seu nome", { exact: true }).fill(" ");
  await save.click();
  await expect(page.getByRole("alert")).toContainText("Preencha");
  await page.getByLabel("O seu nome", { exact: true }).fill("Joana Costa");
  await save.click();
  await expect(
    page.getByText("Perfil guardado neste dispositivo.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Hotel do Oceano | PetStay");

  await page.getByRole("radio", { name: "Escuro", exact: true }).check();
  await page.getByRole("radio", { name: "Oceano", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute(
    "data-color-scheme",
    "ocean",
  );
  expect(
    await page
      .locator(".settings-card")
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe("rgb(34, 39, 44)");
  await page.reload();
  await page.getByRole("button", { name: "Definições", exact: true }).click();
  await expect(page.getByLabel("Nome do hotel", { exact: true })).toHaveValue(
    "Hotel do Oceano",
  );
  await expect(page.getByLabel("O seu nome", { exact: true })).toHaveValue(
    "Joana Costa",
  );
  await expect(
    page.getByRole("radio", { name: "Escuro", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("radio", { name: "Oceano", exact: true }),
  ).toBeChecked();

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: testInfo.outputPath("settings-dark-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("radio", { name: "Amora", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute(
    "data-color-scheme",
    "berry",
  );
  await page.getByRole("radio", { name: "Claro", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("radio", { name: "Sistema", exact: true }).check();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: testInfo.outputPath("settings-light-mobile.png"),
    fullPage: true,
  });
  for (const [label, value] of [["Lavanda", "lavender"], ["Âmbar", "amber"], ["Ardósia", "slate"]]) {
    await page.getByRole("radio", { name: label, exact: true }).check();
    await expect(page.locator("html")).toHaveAttribute("data-color-scheme", value);
  }
  const originalSize = await page.locator(".heading h1").evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  await page.getByRole("radio", { name: /Muito grande/ }).check();
  const enlargedSize = await page.locator(".heading h1").evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(enlargedSize).toBeCloseTo(originalSize * 1.5, 0);
  await page.getByRole("radio", { name: "Reforçado", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "enhanced");
  await page.getByRole("radio", { name: "Máximo", exact: true }).check();
  await page.getByRole("radio", { name: "Escuro", exact: true }).check();
  await expect(page.locator("html")).toHaveCSS("color", "rgb(255, 255, 255)");
  await page.reload();
  await page.getByRole("button", { name: "Definições", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "largest");
  await expect(page.locator("html")).toHaveAttribute("data-color-scheme", "slate");
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath("settings-high-contrast-large.png"), fullPage: true });
  await page
    .getByRole("button", { name: "Gerir preços e épocas", exact: true })
    .click();
  await expect(page.locator(".heading h1")).toHaveText("Preços e épocas");
  expect(exceptions).toEqual([]);
});
