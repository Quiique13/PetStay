export const interfaceThemes = [
  { value: "forest", label: "Floresta", description: "Natural e acolhedor", color: "#547447" },
  { value: "ocean", label: "Oceano", description: "Vidro e ondas suaves", color: "#167d9b" },
  { value: "berry", label: "Amora", description: "Elegância editorial", color: "#9e3159" },
  { value: "lavender", label: "Lavanda", description: "Suave e flutuante", color: "#7754c8" },
  { value: "amber", label: "Âmbar", description: "Retro com personalidade", color: "#b45918" },
  { value: "slate", label: "Ardósia", description: "Precisão e organização", color: "#395978" },
  { value: "citrus", label: "Cítrico", description: "Formas cheias de energia", color: "#a74a17" },
  { value: "noir", label: "Noir", description: "O essencial em destaque", color: "#363636" },
  { value: "arcade", label: "Arcade", description: "Néon e geometria digital", color: "#a82cc7" },
] as const;

export type InterfaceTheme = typeof interfaceThemes[number]["value"];
export type DisplayMode = "light" | "dark" | "system";
export interface Appearance {
  mode: DisplayMode;
  colorScheme: InterfaceTheme;
  contrast: "standard" | "enhanced" | "high";
  textSize: "default" | "large" | "largest";
}

export const defaultAppearance: Appearance = { mode: "system", colorScheme: "forest", contrast: "standard", textSize: "default" };

export function parseAppearance(value: unknown): Appearance {
  const saved = value && typeof value === "object" ? value as Partial<Appearance> : {};
  return {
    mode: ["light", "dark", "system"].includes(saved.mode ?? "") ? saved.mode! : defaultAppearance.mode,
    colorScheme: interfaceThemes.some(theme => theme.value === saved.colorScheme) ? saved.colorScheme! : defaultAppearance.colorScheme,
    contrast: ["standard", "enhanced", "high"].includes(saved.contrast ?? "") ? saved.contrast! : defaultAppearance.contrast,
    textSize: ["default", "large", "largest"].includes(saved.textSize ?? "") ? saved.textSize! : defaultAppearance.textSize,
  };
}
