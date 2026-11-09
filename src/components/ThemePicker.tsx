import { Check, Laptop, Moon, Palette, Sun } from "lucide-react";
import { useAppearance } from "../context/AppearanceContext.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { interfaceThemes } from "../utils/appearance.ts";
import "./ThemePicker.css";

export function ThemePicker() {
  const { appearance, update } = useAppearance();
  const { t } = useLanguage();
  return (
    <fieldset className="theme-picker">
      <legend>{t("Tema da interface")}</legend>
      <p className="theme-picker-intro">
        {t("Nove estilos de interface, todos com modo claro e escuro.")}
      </p>
      <div className="theme-options">
        {interfaceThemes.map((theme) => (
          <label className="theme-choice" key={theme.value}>
            <input
              type="radio"
              name="color-scheme"
              value={theme.value}
              aria-label={t(theme.label)}
              checked={appearance.colorScheme === theme.value}
              onChange={() => update({ colorScheme: theme.value })}
            />
            <span className="theme-choice-card">
              <span
                className="theme-preview"
                data-preview-theme={theme.value}
                aria-hidden="true"
              >
                <span className="preview-rail">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="preview-workspace">
                  <span className="preview-heading" />
                  <span className="preview-hero" />
                  <span className="preview-tiles">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="preview-table">
                    <i />
                    <i />
                  </span>
                </span>
              </span>
              <span className="theme-choice-heading">
                <strong>{t(theme.label)}</strong>
                <span className="theme-selected" aria-hidden="true">
                  {appearance.colorScheme === theme.value && (
                    <Check size={14} />
                  )}
                </span>
              </span>
              <small>{t(theme.description)}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function AppearanceMenu() {
  const { appearance, update, error } = useAppearance();
  const { t } = useLanguage();
  return (
    <details className="appearance-menu">
      <summary>
        <Palette size={16} />
        {t("Personalizar aparência")}
      </summary>
      <fieldset className="appearance-menu-modes">
        <legend>{t("Modo de apresentação")}</legend>
        {(
          [
            { value: "light", label: "Claro", icon: Sun },
            { value: "dark", label: "Escuro", icon: Moon },
            { value: "system", label: "Sistema", icon: Laptop },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <label key={value}>
            <input
              type="radio"
              name="display-mode"
              value={value}
              checked={appearance.mode === value}
              onChange={() => update({ mode: value })}
            />
            <Icon size={15} />
            {t(label)}
          </label>
        ))}
      </fieldset>
      <ThemePicker />
      {error && (
        <p className="form-error" role="alert">
          {t(error)}
        </p>
      )}
    </details>
  );
}
