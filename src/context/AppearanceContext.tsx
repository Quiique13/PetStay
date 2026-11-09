import { createContext, useContext, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { defaultAppearance, parseAppearance } from "../utils/appearance.ts";
import type { Appearance } from "../utils/appearance.ts";

const storageKey = "petstay-appearance";

function readAppearance(): Appearance {
  try {
    return parseAppearance(
      JSON.parse(localStorage.getItem(storageKey) ?? "null"),
    );
  } catch {
    return defaultAppearance;
  }
}

const AppearanceContext = createContext<{
  appearance: Appearance;
  update: (changes: Partial<Appearance>) => void;
  error: string;
} | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState(readAppearance);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function apply() {
      const dark =
        appearance.mode === "dark" ||
        (appearance.mode === "system" && media.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document.documentElement.dataset.colorScheme = appearance.colorScheme;
      document.documentElement.dataset.contrast = appearance.contrast;
      document.documentElement.dataset.textSize = appearance.textSize;
      document.documentElement.style.setProperty(
        "--text-scale",
        String({ default: 1, large: 1.25, largest: 1.5 }[appearance.textSize]),
      );
      const background = getComputedStyle(document.documentElement)
        .getPropertyValue("--page-bg")
        .trim();
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", background);
    }
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [appearance]);

  function update(changes: Partial<Appearance>) {
    const next = { ...appearance, ...changes };
    setAppearance(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setError("");
    } catch {
      setError(
        "A aparência foi aplicada, mas não foi possível guardá-la neste dispositivo.",
      );
    }
  }

  return (
    <AppearanceContext.Provider value={{ appearance, update, error }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context)
    throw new Error("useAppearance must be used within AppearanceProvider.");
  return context;
}
