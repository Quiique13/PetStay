import { test, expect } from "./auth-fixture.ts";
import { defaultData } from "../src/utils/hotel-data.ts";

test("booking bars include the end date and clip correctly across months", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-09T12:00:00"));
  const data = defaultData();
  data.hotel = { name: "Calendar Hotel", owner: "Ana", avatar: "" };
  data.guests = ["Isha", "Previous month", "Next month", "Daycare", "Outside month"].map(name => ({
    name, owner: "Ana", breed: "Labrador", age: "Adult",
  }));
  data.bookings = [
    { dog: "Isha", start: "2026-11-10", end: "2026-11-15", type: "Boarding", paid: false, total: 100 },
    { dog: "Previous month", start: "2026-10-31", end: "2026-11-01", type: "Boarding", paid: false, total: 20 },
    { dog: "Next month", start: "2026-11-30", end: "2026-12-01", type: "Boarding", paid: false, total: 20 },
    { dog: "Daycare", start: "2026-11-10", end: "2026-11-10", type: "Daycare", paid: false, total: 10 },
    { dog: "Outside month", start: "2026-10-29", end: "2026-10-31", type: "Boarding", paid: false, total: 40 },
  ];
  await page.goto("/");
  await page.getByText("Já tem um hotel? Importar cópia", { exact: true }).click();
  await page.getByLabel("Ficheiro de cópia PetStay").setInputFiles({
    name: "calendar.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 2, revision: 1, data })),
  });
  await page.getByRole("button", { name: "Importar e substituir", exact: true }).click();
  await page.getByRole("button", { name: "Reservas", exact: true }).click();
  await expect(page.locator(".calrow")).toHaveCount(4);
  await expect(page.locator(".calendar")).not.toContainText("Outside month");

  async function expectBar(name: string, first: number, last: number, days: number) {
    const row = page.locator(".calrow").filter({ has: page.locator(".guestcell", { hasText: name }) });
    const track = await row.locator(".track").boundingBox();
    const bar = await row.locator(".stay").boundingBox();
    expect(track).not.toBeNull();
    expect(bar).not.toBeNull();
    expect(Math.abs(bar!.x - (track!.x + track!.width * (first - 1) / days))).toBeLessThan(1);
    expect(Math.abs(bar!.x + bar!.width - (track!.x + track!.width * last / days))).toBeLessThan(1);
  }

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expectBar("Isha", 10, 15, 30);
    await expectBar("Previous month", 1, 1, 30);
    await expectBar("Next month", 30, 30, 30);
    await expectBar("Daycare", 10, 10, 30);
  }
  await expect(page.locator(".records-table tbody tr").filter({ hasText: "Isha" })).toContainText("100,00");
  await page.getByRole("button", { name: "Mês seguinte", exact: true }).click();
  await expect(page.locator(".calrow")).toHaveCount(1);
  await expectBar("Next month", 1, 1, 31);
});
