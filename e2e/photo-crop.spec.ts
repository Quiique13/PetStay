import { test, expect } from "./auth-fixture.ts";
import { verifyTestToken } from "./auth-fixture.ts";
import { startDesktopServer } from "../server/desktop-server.ts";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

test("dog photos support square crops, dragging, zoom, cancellation and saved framing", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByLabel("Nome do hotel", { exact: true }).fill("Hotel Teste");
  await page.getByLabel("O seu nome", { exact: true }).fill("Ana");
  await page
    .getByRole("button", { name: "Criar o meu hotel", exact: true })
    .click();
  const banner = await page.locator(".dogscene img").boundingBox();
  expect(Math.abs(banner!.width - banner!.height)).toBeLessThan(1);
  await page
    .getByRole("button", { name: "Hóspedes e tutores", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Adicionar hóspede", exact: true })
    .click();

  const landscape = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 300;
    const context = canvas.getContext("2d")!;
    ["#ff0000", "#00ff00", "#0000ff"].forEach((color, index) => {
      context.fillStyle = color;
      context.fillRect(index * 300, 0, 300, 300);
    });
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const file = {
    name: "landscape.png",
    mimeType: "image/png",
    buffer: Buffer.from(landscape, "base64"),
  };
  const editor = page.locator(".dog-profile-dialog");
  await editor.locator('input[type="file"]').setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("invalid image"),
  });
  await expect(editor.getByRole("alert")).toContainText(
    "Não foi possível abrir a imagem. Tente outra fotografia.",
  );
  await expect(
    editor.getByRole("button", { name: "Definir preços", exact: true }),
  ).toHaveCount(0);
  await expect(editor.locator('button[type="submit"]')).toBeEnabled();
  await editor.locator('input[type="file"]').setInputFiles(file);
  const cropper = page.getByRole("dialog", {
    name: "Recortar fotografia",
    exact: true,
  });
  await expect(cropper).toBeVisible();
  await expect(editor.getByRole("alert")).toHaveCount(0);
  await expect(editor).toHaveJSProperty("inert", true);
  const area = cropper.getByRole("group", {
    name: "Enquadramento da fotografia",
  });
  const box = (await area.boundingBox())!;
  expect(Math.abs(box.width - box.height)).toBeLessThan(1);
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - box.width * 0.3, box.y + box.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await cropper.getByLabel("Zoom").press("End");
  await expect(cropper.locator('input[type="range"]')).toHaveValue("4");
  await cropper.screenshot({ path: testInfo.outputPath("crop-tool.png") });
  await cropper
    .getByRole("button", { name: "Usar fotografia", exact: true })
    .click();
  const preview = editor.locator(".guest-photo-preview");
  const saved = await preview.getAttribute("src");
  const image = await preview.evaluate(async (element: HTMLImageElement) => {
    await element.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    context.drawImage(element, 0, 0, 1, 1);
    return {
      width: element.naturalWidth,
      height: element.naturalHeight,
      pixel: Array.from(context.getImageData(0, 0, 1, 1).data),
    };
  });
  expect(image.width).toBe(75);
  expect(image.height).toBe(75);
  expect(image.pixel[2]).toBeGreaterThan(220);
  expect(image.pixel[0]).toBeLessThan(20);

  await editor
    .getByRole("button", { name: "Recortar fotografia", exact: true })
    .click();
  await cropper
    .getByRole("button", { name: "Repor enquadramento", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(cropper).toHaveCount(0);
  await expect(editor).toBeVisible();
  await expect(editor).toHaveJSProperty("inert", false);
  await expect(preview).toHaveAttribute("src", saved!);
  await editor.locator('[name="name"]').fill("Isha");
  await editor.locator('[name="owner"]').fill("Ana");
  await editor.locator('[name="breed"]').fill("Labrador");
  await editor.locator('[name="birthDate"]').fill("2020-05-15");
  await editor
    .getByRole("button", { name: "Guardar hóspede", exact: true })
    .click();
  await expect(
    page.getByText("Dados guardados neste dispositivo.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Hóspedes e tutores", exact: true })
    .click();
  const avatar = page.locator(".guest-avatar-large img");
  await expect(avatar).toHaveAttribute("src", saved!);
  const avatarBox = (await avatar.boundingBox())!;
  expect(Math.abs(avatarBox.width - avatarBox.height)).toBeLessThan(1);
});

test("desktop-hosted guest photos can be cropped under the app content security policy", async ({
  page,
}) => {
  const directory = await mkdtemp(join(tmpdir(), "petstay-photo-test-"));
  const local = await startDesktopServer(
    resolve("dist"),
    directory,
    verifyTestToken,
  );
  try {
    const response = await page.goto(local.url);
    expect(await response!.headerValue("content-security-policy")).toContain(
      "data: blob:",
    );
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
    await page
      .locator('.dog-profile-dialog input[type="file"]')
      .setInputFiles("src/assets/hotel-dog.jpg");
    const cropper = page.getByRole("dialog", {
      name: "Recortar fotografia",
      exact: true,
    });
    await expect(cropper).toBeVisible();
    await expect(cropper.locator("img")).toHaveJSProperty("complete", true);
    await cropper
      .getByRole("button", { name: "Usar fotografia", exact: true })
      .click();
    const size = await page
      .locator(".guest-photo-preview")
      .evaluate(async (image: HTMLImageElement) => {
        await image.decode();
        return { width: image.naturalWidth, height: image.naturalHeight };
      });
    expect(size.width).toBeGreaterThan(0);
    expect(size.width).toBe(size.height);
  } finally {
    await new Promise<void>((done) => {
      local.server.close(() => done());
      local.server.closeAllConnections();
    });
    if (
      dirname(resolve(directory)) !== resolve(tmpdir()) ||
      !basename(directory).startsWith("petstay-photo-test-")
    )
      throw new Error("Unsafe photo test cleanup path");
    await rm(directory, { recursive: true, force: true });
  }
});
