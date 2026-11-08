import { test, expect } from "@playwright/test";
import { defaultData } from "../src/utils/hotel-data.ts";

test("daily season ranges migrate, save, and price a stay across mid-month boundaries", async ({ page }, testInfo) => {
  const exceptions: string[] = [];
  page.on("pageerror", error => exceptions.push(error.message));
  const data = defaultData();
  data.hotel = { name: "Hotel das Patas", owner: "Ana", avatar: "" };
  data.guests = [{ name: "Bobi", owner: "Ana", breed: "Teste", age: "Adult" }];
  data.rates.Adult = [10, 20];
  const legacy = { ...data, rates: { ...data.rates, high: [6] } };
  await page.goto("/");
  await page.getByText("Já tem um hotel? Importar cópia", { exact: true }).click();
  await page.getByLabel("Ficheiro de cópia PetStay").setInputFiles({
    name: "legacy.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 2, revision: 1, data: legacy })),
  });
  await page.getByRole("button", { name: "Importar e substituir", exact: true }).click();
  await page.getByRole("button", { name: "Preços e épocas", exact: true }).click();
  await expect(page.getByLabel("Dia de início do período 1", { exact: true })).toHaveValue("1");
  await expect(page.getByLabel("Dia de fim do período 1", { exact: true })).toHaveValue("31");
  await expect(page.getByLabel("Mês de início do período 1", { exact: true })).toHaveValue("7");
  await page.getByLabel("Dia de início do período 1", { exact: true }).selectOption("15");
  await page.getByLabel("Dia de fim do período 1", { exact: true }).selectOption("20");

  await page.getByRole("button", { name: "Adicionar período de época alta", exact: true }).click();
  await page.getByLabel("Mês de início do período 2", { exact: true }).selectOption("1");
  await page.getByLabel("Dia de início do período 2", { exact: true }).selectOption("31");
  await page.getByLabel("Mês de início do período 2", { exact: true }).selectOption("2");
  await expect(page.getByLabel("Dia de início do período 2", { exact: true })).toHaveValue("29");
  await page.getByRole("button", { name: "Remover período 2", exact: true }).click();

  await page.getByRole("button", { name: "Nova reserva", exact: true }).click();
  await page.getByLabel("Data de entrada / dia de creche", { exact: true }).fill("2027-07-14");
  await page.getByLabel("Data de saída (hotel)", { exact: true }).fill("2027-07-22");
  await page.getByRole("button", { name: "Criar reserva", exact: true }).click();
  await page.getByRole("button", { name: "Pagamentos", exact: true }).click();
  await expect(page.locator(".records-table tbody")).toContainText("140,00");

  // Export flushes pending changes before reloading the saved ranges.
  await page.getByRole("button", { name: "Dados e cópias", exact: true }).click();
  await page.getByRole("button", { name: "Exportar cópia", exact: true }).click();
  await expect(page.getByRole("link", { name: "Guardar ficheiro", exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Preços e épocas", exact: true }).click();
  await expect(page.locator(".season-range")).toHaveCount(1);
  await expect(page.getByLabel("Dia de início do período 1", { exact: true })).toHaveValue("15");
  await expect(page.getByLabel("Dia de fim do período 1", { exact: true })).toHaveValue("20");

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.getByRole("group", { name: "Época alta", exact: true }).screenshot({ path: testInfo.outputPath(`seasons-${width}.png`) });
  }
  expect(exceptions).toEqual([]);
});
