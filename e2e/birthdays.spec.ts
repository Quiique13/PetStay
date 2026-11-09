import { test, expect } from "./auth-fixture.ts";
import { defaultData } from "../src/utils/hotel-data.ts";

test("birthday calendar shows all dogs, empty months and leap birthdays on small screens", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-08T12:00:00"));
  const data = defaultData(); data.hotel = { name: "Hotel", owner: "Ana", avatar: "" };
  data.guests = [
    { name: "Today", birthDate: "2020-11-08" }, { name: "Tomorrow", birthDate: "2021-11-09" },
    { name: "Bobi", birthDate: "2020-11-10" }, { name: "Luna", birthDate: "2021-11-10" },
    { name: "Leap", birthDate: "2020-02-29" }, { name: "Missing" },
  ].map(dog => ({ ...dog, owner: dog.name === "Missing" ? "Ana" : "Maria", breed: "Labrador", age: "Adult" }));
  await page.goto("/");
  await page.getByText("Já tem um hotel? Importar cópia", { exact: true }).click();
  await page.getByLabel("Ficheiro de cópia PetStay").setInputFiles({ name: "birthdays.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ schemaVersion: 2, revision: 1, data })) });
  await page.getByRole("button", { name: "Importar e substituir", exact: true }).click();
  await expect(page.locator(".birthday-reminders")).toContainText("Hoje: Today faz 6 anos!");
  await expect(page.locator(".birthday-reminders")).toContainText("Amanhã: Tomorrow faz 5 anos!");
  await page.getByRole("button", { name: "Notificações", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Hoje: Today faz 6 anos!");
  await expect(page.getByRole("dialog")).toContainText("Amanhã: Tomorrow faz 5 anos!");
  await page.getByRole("dialog").getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: "Hóspedes e tutores", exact: true }).click();
  await page.getByLabel("Filtrar por tutor", { exact: true }).selectOption({ label: "Ana" });
  await expect(page.locator(".guestcard")).toHaveCount(1);
  await expect(page.locator(".guestcard")).toContainText("Missing");
  await page.getByLabel("Filtrar por tutor", { exact: true }).selectOption({ label: "Maria" });
  await expect(page.locator(".guestcard")).toHaveCount(5);
  await page.getByLabel("Filtrar por tutor", { exact: true }).selectOption("");
  await expect(page.locator(".guestcard")).toHaveCount(6);
  await page.getByRole("button", { name: "Aniversários", exact: true }).click();
  const calendar = page.getByRole("region", { name: "Calendário de aniversários", exact: true });
  await expect(calendar.locator(".birthday-day")).toHaveCount(30);
  const tenth = calendar.locator(".birthday-day").nth(9);
  await expect(tenth).toContainText("Bobi"); await expect(tenth).toContainText("Luna");
  await expect(tenth).toContainText("Faz 6 anos"); await expect(tenth).toContainText("Faz 5 anos");
  await expect(calendar).toContainText("Hóspedes sem data de nascimento: 1");
  await calendar.getByRole("button", { name: "Mês seguinte" }).click();
  await expect(calendar).toContainText("Sem aniversários neste mês.");
  await calendar.getByRole("button", { name: "Este mês", exact: true }).click();
  for (let i = 0; i < 9; i++) await calendar.getByRole("button", { name: "Mês anterior" }).click();
  await expect(calendar.locator(".birthday-day").nth(27)).toContainText("Leap");
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.clock.setFixedTime(new Date("2026-11-09T12:00:00"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByRole("button", { name: "Notificações", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Hoje: Tomorrow faz 5 anos!");
  await expect(page.getByRole("dialog")).not.toContainText("Hoje: Today");
  await expect(page.getByRole("dialog")).toContainText("Amanhã: Bobi faz 6 anos!");
  await page.getByRole("dialog").getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: "Lista de hóspedes", exact: true }).click();
  const card = page.locator(".guestcard").filter({ has: page.getByRole("heading", { name: "Tomorrow", exact: true }) });
  await card.getByRole("button", { name: "Editar hóspede" }).click();
  await page.getByRole("dialog").getByLabel("Falecido", { exact: true }).check();
  await page.getByRole("dialog").getByRole("button", { name: "Guardar hóspede" }).click();
  await expect(card).toContainText("Falecido");
  await expect(card.locator("h3 .memorial-cross")).toHaveText("✝");
  await expect(page.getByText("Dados guardados neste dispositivo.", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Notificações", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toContainText("Hoje: Tomorrow");
  await page.getByRole("dialog").getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: "Hóspedes e tutores", exact: true }).click();
  await page.getByRole("button", { name: "Aniversários", exact: true }).click();
  await expect(calendar).not.toContainText("Tomorrow");
  await page.getByRole("button", { name: "Lista de hóspedes", exact: true }).click();
  await card.getByRole("button", { name: "Editar hóspede" }).click();
  await expect(page.getByRole("dialog").getByLabel("Falecido", { exact: true })).toBeChecked();
  await page.getByRole("dialog").getByLabel("Falecido", { exact: true }).uncheck();
  await page.getByRole("dialog").getByRole("button", { name: "Guardar hóspede" }).click();
  await page.getByRole("button", { name: "Notificações", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Hoje: Tomorrow faz 5 anos!");
});
