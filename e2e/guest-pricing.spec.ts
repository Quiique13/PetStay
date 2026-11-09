import { test, expect } from "./auth-fixture.ts";
import { readFileSync } from "node:fs";

test("guest photos, custom prices, monthly calendar and hotel photo changes persist", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByLabel("Nome do hotel", { exact: true }).fill("Hotel Teste");
  await page.getByLabel("O seu nome", { exact: true }).fill("Ana");
  await page
    .getByRole("button", { name: "Criar o meu hotel", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Hóspedes e tutores", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Adicionar hóspede", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const photo = {
    name: "dog.jpg",
    mimeType: "image/jpeg",
    buffer: readFileSync("src/assets/hotel-dog.jpg"),
  };
  await dialog.locator('input[type="file"]').setInputFiles(photo);
  await page.locator(".photo-crop-dialog").screenshot({ path: testInfo.outputPath("dog-crop-tool.png") });
  await page.getByRole("button", { name: "Usar fotografia", exact: true }).click();
  await expect(dialog.locator(".guest-photo-preview")).toBeVisible();
  await dialog.locator('[name="name"]').fill("Bobi");
  await dialog.locator('[name="owner"]').fill("Maria");
  await dialog.locator('[name="breed"]').fill("Labrador");
  await dialog.locator('[name="birthDate"]').fill("2020-05-15");
  const today = new Date();
  const years =
    today.getFullYear() -
    2020 -
    (today.getMonth() < 4 || (today.getMonth() === 4 && today.getDate() < 15)
      ? 1
      : 0);
  await expect(dialog.locator('[name="age"]')).toHaveValue(
    years >= 8 ? "Senior" : "Adult",
  );
  await dialog.locator('[name="neutered"]').selectOption("no");
  await dialog.getByLabel("Falecido", { exact: true }).check();
  await expect(dialog.locator(".guest-photo-preview")).toHaveCSS("filter", "none");
  await expect(dialog.locator(".memorial-cross")).toBeVisible();
  await dialog.getByLabel("Falecido", { exact: true }).uncheck();
  await expect(dialog.locator(".memorial-cross")).toHaveCount(0);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await dialog.screenshot({ path: testInfo.outputPath(`dog-form-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await dialog.getByRole("button", { name: "Guardar hóspede" }).click();
  await expect(page.locator(".guestcard img")).toBeVisible();
  await page.getByRole("button", { name: "Editar hóspede" }).click();
  await expect(dialog.locator('[name="birthDate"]')).toHaveValue("2020-05-15");
  await expect(dialog.locator('[name="neutered"]')).toHaveValue("no");
  await expect(dialog.locator(".guest-photo-preview")).toBeVisible();
  await dialog.getByRole("button", { name: "Guardar hóspede" }).click();
  await page.getByRole("button", { name: "Reservas", exact: true }).click();
  await page.getByRole("button", { name: "Nova reserva", exact: true }).click();
  await dialog
    .getByRole("radio", { name: "Definir preço personalizado", exact: true })
    .check();
  await dialog.locator('[name="customRate"]').fill("45");
  await dialog.getByRole("button", { name: "Criar reserva" }).click();
  expect(await page.locator(".calhead > div").count()).toBe(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
  );
  await page.getByRole("button", { name: "Definições", exact: true }).click();
  await page
    .locator('.hotel-profile-form input[type="file"]')
    .setInputFiles(photo);
  await page
    .getByRole("button", { name: "Guardar perfil", exact: true })
    .click();
  await expect(page.locator(".settings-saved")).toBeVisible();
  await page.reload();
  await expect(
    page.locator(".profile-trigger .hotel-avatar img"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hóspedes e tutores", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Adicionar cão a este cliente" })
    .click();
  await expect(
    dialog.getByRole("combobox", { name: "Cliente", exact: true }),
  ).toHaveValue("Maria");
  await dialog.locator('[name="name"]').fill("Luna");
  await dialog.locator('[name="breed"]').fill("Poodle");
  await dialog.locator('[name="birthDate"]').fill("2021-06-20");
  await dialog.getByRole("button", { name: "Guardar hóspede" }).click();
  await expect(page.locator(".client-group")).toHaveCount(1);
  await expect(page.locator(".client-group .guestcard")).toHaveCount(2);
  await expect(
    page.getByText("Dados guardados neste dispositivo.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Hóspedes e tutores", exact: true })
    .click();
  await expect(page.locator(".client-group .guestcard")).toHaveCount(2);
});
