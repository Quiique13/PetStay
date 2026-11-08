import { test, expect } from "@playwright/test";
import { defaultData } from "../src/utils/hotel-data.ts";

test("edit a filtered saved booking, preserve payment, cancel, and restore seasonal pricing", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2027-07-15T12:00:00"));
  const data = defaultData();
  data.hotel = { name: "Hotel", owner: "Ana", avatar: "" };
  data.guests = ["Bobi", "Luna", "No booking"].map((name) => ({
    name,
    owner: "Maria",
    breed: "Labrador",
    age: "Adult",
  }));
  data.rates.Adult = [10, 20];
  data.rates.day = 7;
  data.rates.high = [{ start: "07-15", end: "07-20" }];
  data.bookings = [
    {
      dog: "Bobi",
      start: "2027-07-14",
      end: "2027-07-16",
      type: "Boarding",
      paid: false,
      total: 30,
    },
    {
      dog: "Luna",
      start: "2027-07-14",
      end: "2027-07-16",
      type: "Boarding",
      paid: true,
      total: 45,
      customTotal: 45,
      intactSurcharge: true,
    },
  ];
  await page.goto("/");
  await page
    .getByText("Já tem um hotel? Importar cópia", { exact: true })
    .click();
  await page
    .getByLabel("Ficheiro de cópia PetStay")
    .setInputFiles({
      name: "bookings.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({ schemaVersion: 2, revision: 1, data }),
      ),
    });
  await page
    .getByRole("button", { name: "Importar e substituir", exact: true })
    .click();
  await page.getByRole("button", { name: "Reservas", exact: true }).click();
  await expect(page.locator(".calrow")).toHaveCount(2);
  await expect(page.locator(".calendar")).not.toContainText("No booking");
  await page.getByLabel("Procurar hóspede", { exact: true }).fill("Luna");
  await page
    .getByRole("button", { name: "Editar reserva de Luna", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator('[name="dog"]')).toHaveValue("Luna");
  await expect(dialog.locator('[name="start"]')).toHaveValue("2027-07-14");
  await expect(dialog.locator('[name="customTotal"]')).toHaveValue("45");
  await expect(dialog.locator('[name="intactSurcharge"]')).toBeChecked();
  await dialog.getByRole("button", { name: "Guardar reserva", exact: true }).click();
  await expect(page.locator(".records-table tbody")).toContainText("45,00");
  await page.getByRole("button", { name: "Editar reserva de Luna", exact: true }).click();
  await dialog.getByRole("radio", { name: "Definir preço personalizado", exact: true }).check();
  await dialog.locator('[name="customRate"]').fill("30");
  await dialog
    .getByRole("button", { name: "Guardar reserva", exact: true })
    .click();
  await expect(page.locator(".records-table tbody")).toContainText("60,00");
  await expect(page.locator(".records-table .paid")).toBeVisible();
  await page
    .getByRole("button", { name: "Editar reserva de Luna", exact: true })
    .click();
  await dialog.locator('[name="customRate"]').fill("99");
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.locator(".records-table tbody")).toContainText("60,00");
  await page
    .getByRole("button", { name: "Editar reserva de Luna", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Voltar ao preço automático", exact: true })
    .click();
  await dialog.locator('[name="end"]').fill("2027-07-17");
  await dialog
    .getByRole("button", { name: "Guardar reserva", exact: true })
    .click();
  await expect(page.locator(".records-table tbody")).toContainText("50,00");
  await expect(
    page.getByText("Dados guardados neste dispositivo.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Reservas", exact: true }).click();
  await expect(page.locator(".records-table tbody tr")).toHaveCount(2);
  await expect(page.locator(".records-table tbody")).toContainText("30,00");
  await expect(page.locator(".records-table tbody")).toContainText("50,00");
  await expect(page.locator(".records-table .paid")).toBeVisible();
  await page.getByRole("button", { name: "Editar reserva de Bobi", exact: true }).click();
  await dialog.getByRole("radio", { name: "Definir preço personalizado", exact: true }).check();
  await dialog.locator('[name="customRate"]').fill("25");
  await dialog.locator('[name="discountPercent"]').fill("20");
  await dialog.getByRole("button", { name: "Guardar reserva", exact: true }).click();
  await expect(page.locator(".records-table tbody")).toContainText("40,00");
  await page.getByRole("button", { name: "Editar reserva de Bobi", exact: true }).click();
  await expect(dialog.locator('[name="customRate"]')).toHaveValue("25");
  await expect(dialog.locator('[name="discountPercent"]')).toHaveValue("20");
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.locator(".records-table tbody")).toContainText("50,00");
  await page.getByRole("button", { name: "Mês seguinte", exact: true }).click();
  await expect(page.locator(".calrow")).toHaveCount(0);
  await expect(page.locator(".calendar")).toContainText("Sem reservas neste mês.");
});
