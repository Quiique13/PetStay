import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { messages } from "../src/i18n/messages.ts";
import { isLanguage, languages, translate } from "../src/i18n/index.ts";
import { breedLabel, createFormatters } from "../src/utils/format.ts";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();

test("every translation includes all three target languages and preserves placeholders", () => {
  for (const [source, translations] of Object.entries(messages)) {
    assert.equal(translations.length, 3, source);
    for (const translation of translations) {
      assert.ok(translation.trim(), source);
      assert.deepEqual(placeholders(translation), placeholders(source), source);
    }
  }
  const files = ["src/App.tsx", ...readdirSync("src/components").filter(file => file.endsWith(".tsx")).map(file => `src/components/${file}`)];
  for (const file of files) {
    for (const match of readFileSync(file, "utf8").matchAll(/\bt\("([^"\n]+)"/g)) {
      assert.ok(Object.hasOwn(messages, match[1]), `Missing translation in ${file}: ${match[1]}`);
    }
  }
});

test("language validation, interpolation, and unknown error fallbacks are safe", () => {
  assert.ok(isLanguage("pt"));
  assert.ok(isLanguage("fr"));
  assert.equal(isLanguage("de"), false);
  assert.equal(isLanguage(null), false);
  assert.equal(translate("Olá, {name}", "en", { name: "João" }), "Hello, João");
  assert.equal(translate("Olá, {name}", "fr", { name: "Élodie" }), "Bonjour, Élodie");
  assert.equal(translate("Olá, {name}", "es", { name: "María" }), "Hola, María");
  assert.equal(translate("Olá, {name}", "pt", { name: "Ana" }), "Olá, Ana");
  assert.equal(translate("Unknown server error", "en"), "Unknown server error");
  assert.equal(translate("toString", "fr"), "toString");
  assert.equal(breedLabel("French Bulldog", message => translate(message, "es")), "Bulldog francés");
  assert.equal(breedLabel("Raça personalizada", message => translate(message, "en")), "Raça personalizada");
});

test("dates, months, and amounts follow the selected locale while keeping euros", () => {
  for (const { locale } of languages) {
    const format = createFormatters(locale);
    assert.equal(format.money(1234.5), new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(1234.5));
    assert.equal(format.formatDate("2026-11-06"), new Intl.DateTimeFormat(locale).format(new Date(2026, 10, 6, 12)));
    assert.equal(format.monthName(0), new Date(2026, 0, 1).toLocaleString(locale, { month: "long" }));
  }
});
