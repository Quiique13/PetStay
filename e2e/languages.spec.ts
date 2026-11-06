import { test, expect } from "@playwright/test";

test("language changes translate the whole app and preserve profiles and unsaved input", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByLabel("Nome do hotel", { exact: true })
    .fill("Hôtel São João");
  await page.getByLabel("O seu nome", { exact: true }).fill("Élodie Costa");
  await page.locator('select[name="appLanguage"]').selectOption("en");
  await expect(page.getByLabel("Hotel name", { exact: true })).toHaveValue(
    "Hôtel São João",
  );
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Élodie Costa",
  );
  await expect(page).toHaveTitle("PetStay — pet hotel management");
  await page
    .getByRole("button", { name: "Create my hotel", exact: true })
    .click();
  await expect(page.locator(".heading h1")).toContainText("Hello, Élodie");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Hotel name", { exact: true }).fill("Hôtel des Amis");

  const variants = [
    {
      language: "fr",
      locale: "fr-FR",
      settings: "Paramètres",
      hotel: "Nom de l’hôtel",
      display: "Affichage et apparence",
      save: "Enregistrer le profil",
      saved: "Profil enregistré sur cet appareil.",
      overview: "Vue d’ensemble",
      greeting: "Bonjour, Élodie",
      pricing: "Tarifs et saisons",
      month: "janv.",
      season: "Tarif Chiot — haute saison",
      newGuest: "Ajouter un pensionnaire",
      guestTitle: "Un nouvel ami à quatre pattes",
    },
    {
      language: "es",
      locale: "es-ES",
      settings: "Ajustes",
      hotel: "Nombre del hotel",
      display: "Pantalla y apariencia",
      save: "Guardar perfil",
      saved: "Perfil guardado en este dispositivo.",
      overview: "Resumen",
      greeting: "Hola, Élodie",
      pricing: "Precios y temporadas",
      month: "ene",
      season: "Precio de Cachorro — temporada alta",
      newGuest: "Añadir huésped",
      guestTitle: "Un nuevo amigo de cuatro patas",
    },
    {
      language: "pt",
      locale: "pt-PT",
      settings: "Definições",
      hotel: "Nome do hotel",
      display: "Ecrã e aparência",
      save: "Guardar perfil",
      saved: "Perfil guardado neste dispositivo.",
      overview: "Visão geral",
      greeting: "Olá, Élodie",
      pricing: "Preços e épocas",
      month: "jan.",
      season: "Preço de Cachorro — época alta",
      newGuest: "Adicionar hóspede",
      guestTitle: "Um novo amigo de quatro patas",
    },
    {
      language: "en",
      locale: "en-GB",
      settings: "Settings",
      hotel: "Hotel name",
      display: "Display & appearance",
      save: "Save profile",
      saved: "Profile saved on this device.",
      overview: "Overview",
      greeting: "Hello, Élodie",
      pricing: "Pricing & seasons",
      month: "Jan",
      season: "Puppy price — high season",
      newGuest: "Add guest",
      guestTitle: "A new four-legged friend",
    },
  ];

  for (const [index, variant] of variants.entries()) {
    await page
      .locator('select[name="appLanguage"]')
      .selectOption(variant.language);
    await expect(page.locator("html")).toHaveAttribute("lang", variant.locale);
    await expect(page.locator(".heading h1")).toHaveText(variant.settings);
    await expect(
      page.getByRole("heading", { name: variant.display, exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel(variant.hotel, { exact: true })).toHaveValue(
      "Hôtel des Amis",
    );
    if (index === 0) {
      await page
        .getByRole("button", { name: variant.save, exact: true })
        .click();
      await expect(
        page.getByText(variant.saved, { exact: true }),
      ).toBeVisible();
    }
    await page
      .getByRole("button", { name: variant.overview, exact: true })
      .click();
    await expect(page.locator(".heading h1")).toContainText(variant.greeting);
    await page
      .getByRole("button", { name: variant.pricing, exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: variant.month, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("spinbutton", { name: variant.season, exact: true }),
    ).toBeVisible();
    const guests = {
      fr: "Pensionnaires et propriétaires",
      es: "Huéspedes y tutores",
      pt: "Hóspedes e tutores",
      en: "Guests & owners",
    };
    await page
      .getByRole("button", {
        name: guests[variant.language as keyof typeof guests],
        exact: true,
      })
      .click();
    await page
      .locator(".heading")
      .getByRole("button", { name: variant.newGuest, exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText(variant.guestTitle);
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: variant.settings, exact: true })
      .click();
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        variant.language,
      ).toBe(true);
    }
  }

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
  await expect(page.locator(".heading h1")).toContainText("Hello, Élodie");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.locator('select[name="appLanguage"]')).toHaveValue("en");
  await expect(page.getByLabel("Hotel name", { exact: true })).toHaveValue(
    "Hôtel des Amis",
  );
  await page.screenshot({
    path: testInfo.outputPath("settings-english.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
