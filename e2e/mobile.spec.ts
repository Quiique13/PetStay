import { test, expect } from "@playwright/test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { createLocalStore } from "../server/local-store.ts";
import { startDesktopServer } from "../desktop/server.ts";
import { newHotelData } from "../src/utils/hotel-data.ts";

test("desktop → mobile → desktop keeps hotel records and confirms replacement", async ({ page, browser }) => {
  const directory = await mkdtemp(join(tmpdir(), "petstay-roundtrip-"));
  const dataDirectory = join(directory, "data");
  const store = createLocalStore(dataDirectory);
  const data = newHotelData({ name: "Hotel São João", owner: "Ana Silva", avatar: "" });
  data.guests.push({ name: "Bobi", owner: "Maria", breed: "Labrador", age: "Adult" });
  data.bookings.push({ dog: "Bobi", start: "2026-11-10", end: "2026-11-12", type: "Boarding", total: 48.5, paid: false });
  data.rates = { Puppy: [20, 25], Adult: [24.25, 30], Senior: [22, 28], day: 15, high: [6, 7] };
  data.capacity = 18; data.occupancy = 73;
  await store.save(data, 0);
  const desktop = await startDesktopServer(resolve("dist"), dataDirectory);
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, acceptDownloads: true });
  const computer = await context.newPage();
  try {
    await computer.goto(desktop.url);
    await computer.getByRole("button", { name: "Dados e cópias", exact: true }).click();
    const downloadEvent = computer.waitForEvent("download");
    await computer.getByRole("button", { name: "Exportar cópia", exact: true }).click();
    await computer.getByRole("link", { name: "Guardar ficheiro", exact: true }).click();
    const download = await downloadEvent;
    const exported = await readFile((await download.path())!);
    expect(JSON.parse(exported.toString()).data).toEqual(data);

    await page.goto("/");
    await page.getByText("Já tem um hotel? Importar cópia", { exact: true }).click();
    await page.getByLabel("Ficheiro de cópia PetStay").setInputFiles({ name: "desktop.json", mimeType: "application/json", buffer: exported });
    await expect(page.getByRole("heading", { name: data.hotel!.name, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Importar e substituir", exact: true }).click();
    await expect(page.locator(".heading h1")).toContainText("Olá, Ana");
    await page.getByRole("button", { name: "Pagamentos", exact: true }).click();
    await page.getByRole("button", { name: "Marcar como pago", exact: true }).click();
    // Export before the autosave debounce fires: the export must flush the change.
    await page.getByRole("button", { name: "Dados e cópias", exact: true }).click();
    const phoneDownloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar cópia", exact: true }).click();
    await page.getByRole("link", { name: "Guardar ficheiro", exact: true }).click();
    const phoneDownload = await phoneDownloadEvent;
    const fromPhone = await readFile((await phoneDownload.path())!);
    const updated = structuredClone(data);
    updated.bookings[0].paid = true;
    expect(JSON.parse(fromPhone.toString()).data).toEqual(updated);

    await computer.getByLabel("Ficheiro de cópia PetStay").setInputFiles({ name: "phone.json", mimeType: "application/json", buffer: fromPhone });
    await expect(computer.getByRole("button", { name: "Importar e substituir", exact: true })).toBeDisabled();
    expect((await store.read()).data).toEqual(data);
    await computer.getByRole("checkbox").check();
    await computer.getByRole("button", { name: "Importar e substituir", exact: true }).click();
    await expect(computer.getByText("Dados importados e guardados neste dispositivo.", { exact: true })).toBeVisible();
    expect((await store.read()).data).toEqual(updated);
    expect(await store.readRecovery()).toEqual(data);

    // A malformed file must not enable import or alter the saved data.
    await computer.getByLabel("Ficheiro de cópia PetStay").setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from('{"schemaVersion":99}') });
    await expect(computer.getByRole("alert")).toContainText("incompatível");
    expect((await store.read()).data).toEqual(updated);
    await expect(computer.getByRole("button", { name: "Importar e substituir", exact: true })).toHaveCount(0);
    await computer.getByRole("button", { name: "Recuperar dados anteriores", exact: true }).click();
    await computer.getByRole("checkbox").check();
    await computer.getByRole("button", { name: "Importar e substituir", exact: true }).click();
    await expect(computer.getByText("Dados importados e guardados neste dispositivo.", { exact: true })).toBeVisible();
    expect((await store.read()).data).toEqual(data);
  } finally {
    await context.close();
    await new Promise<void>((done, reject) => { desktop.server.close(error => error ? reject(error) : done()); desktop.server.closeAllConnections(); });
    if (dirname(resolve(directory)) !== resolve(tmpdir()) || !basename(directory).startsWith("petstay-roundtrip-")) throw new Error("Unsafe test cleanup path");
    await rm(directory, { recursive: true, force: true });
  }
});

test("mobile installs an offline shell, saves offline, and fits small screens", async ({ page, context }, testInfo) => {
  const exceptions: string[] = [];
  page.on("pageerror", error => exceptions.push(error.message));
  await page.goto("/");
  await page.getByLabel("Nome do hotel", { exact: true }).fill("Hotel do Telemóvel");
  await page.getByLabel("O seu nome", { exact: true }).fill("Joana");
  await page.getByRole("button", { name: "Criar o meu hotel", exact: true }).click();
  await expect(page.locator(".heading h1")).toContainText("Olá, Joana");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(done => navigator.serviceWorker.addEventListener("controllerchange", () => done(), { once: true }));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".heading h1")).toContainText("Olá, Joana");
  await page.getByRole("button", { name: "Hóspedes e tutores", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar hóspede", exact: true }).first().click();
  await page.getByLabel("Nome do cão", { exact: true }).fill("Luna");
  await page.getByLabel("Nome do tutor", { exact: true }).fill("Sofia");
  await page.getByLabel("Raça", { exact: true }).fill("Labrador");
  await page.getByRole("button", { name: "Guardar hóspede", exact: true }).click();
  await expect(page.getByText("Dados guardados neste dispositivo.", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Hóspedes e tutores", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Luna", exact: true })).toBeVisible();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of ["Visão geral", "Reservas", "Hóspedes e tutores", "Pagamentos", "Preços e épocas"]) {
      await page.getByRole("button", { name, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `page overflow at ${width}: ${name}`).toBe(true);
    }
  }
  await page.getByRole("button", { name: "Dados e cópias", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("mobile-transfer.png") });
  await context.setOffline(false);
  expect(exceptions).toEqual([]);
});
