import { test, expect } from "./auth-fixture.ts";
import { interfaceThemes } from "../src/utils/appearance.ts";

test.use({ serviceWorkers: "block" });

test("nine distinct workspaces support light, dark, saved preferences and mobile navigation", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByLabel("Nome do hotel", { exact: true }).fill("Hotel dos Temas");
  await page.getByLabel("O seu nome", { exact: true }).fill("Ana");
  await page.getByRole("button", { name: "Criar o meu hotel", exact: true }).click();
  await page.getByRole("button", { name: "Definições", exact: true }).click();
  await expect(page.locator('.theme-picker input[type="radio"]')).toHaveCount(9);
  // A theme change must not reset forms or hotel records.
  await page.getByLabel("Nome do hotel", { exact: true }).fill("Nome por guardar");
  const styles = new Set<string>();
  for (const theme of interfaceThemes) {
    await page.getByRole("radio", { name: theme.label, exact: true }).check();
    await expect(page.getByLabel("Nome do hotel", { exact: true })).toHaveValue("Nome por guardar");
    await page.getByRole("radio", { name: "Claro", exact: true }).check();
    const lightPage = await page.locator("html").evaluate(el => getComputedStyle(el).backgroundColor);
    const signature = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const rail = getComputedStyle(document.querySelector(".app > aside")!);
      return [root.getPropertyValue("--page-bg"), root.getPropertyValue("--font-display"), root.getPropertyValue("--card-radius"), rail.width, getComputedStyle(document.querySelector(".app")!).flexDirection].join("|");
    });
    styles.add(signature);
    for (const [modeLabel, mode] of [["Claro", "light"], ["Escuro", "dark"]] as const) {
      await page.getByRole("radio", { name: modeLabel, exact: true }).check();
      await expect(page.locator("html")).toHaveAttribute("data-theme", mode);
      if (mode === "dark") expect(await page.locator("html").evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(lightPage);
      await page.getByRole("button", { name: "Visão geral", exact: true }).click();
      await expect(page.locator(".heading h1")).toContainText("Ana");
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: testInfo.outputPath(`${theme.value}-${mode}-desktop.png`) });
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${theme.value} ${mode} overflows at ${width}`).toBe(true);
        await expect(page.getByRole("button", { name: "Definições", exact: true })).toBeVisible();
      }
      await page.getByRole("button", { name: "Definições", exact: true }).click();
      await expect(page.locator(".theme-picker")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await page.getByLabel("Nome do hotel", { exact: true }).fill("Nome por guardar");
  }
  expect(styles.size).toBe(9);
  await page.reload();
  await page.getByRole("button", { name: "Definições", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Arcade", exact: true })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Escuro", exact: true })).toBeChecked();
  for (const theme of interfaceThemes) {
    await page.getByRole("radio", { name: theme.label, exact: true }).check();
    await page.getByRole("radio", { name: "Máximo", exact: true }).check();
    await expect(page.locator("html")).toHaveCSS("color", "rgb(255, 255, 255)");
    await page.getByRole("radio", { name: "Normal", exact: true }).check();
  }
  expect(errors).toEqual([]);
});
