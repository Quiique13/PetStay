import { createContext, useCallback, useContext, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { isLanguage, languages, translate } from "../i18n/index.ts";
import type { Language, TranslationValues } from "../i18n/index.ts";

const storageKey = "petstay-language";
function readLanguage(): Language {
  try {
    const saved = localStorage.getItem(storageKey);
    return isLanguage(saved) ? saved : "pt";
  } catch { return "pt"; }
}

const LanguageContext = createContext<{
  language: Language;
  locale: string;
  changeLanguage: (language: Language) => void;
  t: (message: string, values?: TranslationValues) => string;
  error: string;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(readLanguage);
  const [error, setError] = useState("");
  const locale = languages.find(option => option.value === language)!.locale;
  const t = useCallback((message: string, values?: TranslationValues) => translate(message, language, values), [language]);

  useLayoutEffect(() => { document.documentElement.lang = locale; }, [locale]);

  function changeLanguage(next: Language) {
    if (!isLanguage(next)) return;
    setLanguage(next);
    try { localStorage.setItem(storageKey, next); setError(""); }
    catch { setError("O idioma foi aplicado, mas não foi possível guardá-lo neste dispositivo."); }
  }

  return <LanguageContext.Provider value={{ language, locale, changeLanguage, t, error }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider.");
  return context;
}
