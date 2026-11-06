import { createContext, useContext, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";

type Mode = "light" | "dark" | "system";
type ColorScheme = "forest" | "ocean" | "berry";
interface Appearance { mode: Mode; colorScheme: ColorScheme }
const storageKey = "petstay-appearance";
const defaults: Appearance = { mode: "system", colorScheme: "forest" };

function readAppearance(): Appearance {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    return {
      mode: ["light", "dark", "system"].includes(saved?.mode) ? saved.mode : defaults.mode,
      colorScheme: ["forest", "ocean", "berry"].includes(saved?.colorScheme) ? saved.colorScheme : defaults.colorScheme,
    };
  } catch { return defaults; }
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
      const dark = appearance.mode === "dark" || (appearance.mode === "system" && media.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document.documentElement.dataset.colorScheme = appearance.colorScheme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#191d21" : "#faf8f3");
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
      setError("A aparência foi aplicada, mas não foi possível guardá-la neste dispositivo.");
    }
  }

  return <AppearanceContext.Provider value={{ appearance, update, error }}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance must be used within AppearanceProvider.");
  return context;
}
