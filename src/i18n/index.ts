import { messages } from "./messages.ts";

export const languages = [
  { value: "pt", label: "Português", locale: "pt-PT" },
  { value: "en", label: "English", locale: "en-GB" },
  { value: "fr", label: "Français", locale: "fr-FR" },
  { value: "es", label: "Español", locale: "es-ES" },
] as const;
export type Language = typeof languages[number]["value"];
export type TranslationValues = Record<string, string | number>;

export function isLanguage(value: unknown): value is Language {
  return languages.some(language => language.value === value);
}

// Portuguese is the source language. Stored hotel records keep their existing values.
export function translate(message: string, language: Language, values: TranslationValues = {}): string {
  const entry = Object.hasOwn(messages, message) ? messages[message as keyof typeof messages] : undefined;
  const translated = language === "pt" || !entry ? message : entry[language === "en" ? 0 : language === "fr" ? 1 : 2];
  return translated.replace(/\{(\w+)\}/g, (placeholder, key: string) => Object.hasOwn(values, key) ? String(values[key]) : placeholder);
}
