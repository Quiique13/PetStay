import { useLanguage } from "../context/LanguageContext.tsx";
import { useState } from "react";
import {
  UserRound,
  Monitor,
  Sun,
  Moon,
  Laptop,
  Check,
  DatabaseBackup,
  SlidersHorizontal,
  ArrowUpRight,
  Languages,
} from "lucide-react";
import { useHotel } from "../context/HotelContext.tsx";
import { useAppearance } from "../context/AppearanceContext.tsx";
import { HotelProfileForm } from "./HotelProfileForm.tsx";
import { DataTransfer } from "./DataTransfer.tsx";
import { LanguageSelector } from "./LanguageSelector.tsx";
import { ThemePicker } from "./ThemePicker.tsx";
import "./SettingsPage.css";

const modes = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Laptop },
] as const;

export function SettingsPage({ onPricing }: { onPricing: () => void }) {
  const { t } = useLanguage();
  const storage = useHotel();
  const { appearance, update, error } = useAppearance();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const hotel = storage.data?.hotel;
  if (!hotel) return null;

  return (
    <div className="settings-grid">
      <section
        className="panel settings-card"
        aria-labelledby="profile-settings-title"
      >
        <div className="settings-card-heading">
          <span className="settings-icon">
            <UserRound size={21} />
          </span>
          <div>
            <h2 id="profile-settings-title">{t("Conta e hotel")}</h2>
            <p>{t("Os seus dados e a identidade do seu hotel.")}</p>
          </div>
        </div>
        <HotelProfileForm
          key={JSON.stringify(hotel)}
          initial={hotel}
          busy={saving}
          error={storage.error}
          submitLabel={t("Guardar perfil")}
          onSubmit={async (profile) => {
            setSaved(false);
            setSaving(true);
            storage.update("hotel", profile);
            try {
              await storage.flush();
              setSaved(true);
            } catch {
              /* Storage errors are displayed by the profile form. */
            } finally {
              setSaving(false);
            }
          }}
        />
        {saved && (
          <p className="settings-saved" role="status">
            <Check size={16} /> {t("Perfil guardado neste dispositivo.")}
          </p>
        )}
      </section>

      <section
        className="panel settings-card"
        aria-labelledby="display-settings-title"
      >
        <div className="settings-card-heading">
          <span className="settings-icon">
            <Monitor size={21} />
          </span>
          <div>
            <h2 id="display-settings-title">{t("Ecrã e aparência")}</h2>
            <p>{t("Um espaço de trabalho à sua medida.")}</p>
          </div>
        </div>
        <fieldset className="settings-options">
          <legend>{t("Modo de apresentação")}</legend>
          <div className="appearance-choices">
            {modes.map(({ value, label, icon: Icon }) => (
              <label className="appearance-choice" key={value}>
                <input
                  type="radio"
                  name="display-mode"
                  value={value}
                  checked={appearance.mode === value}
                  onChange={() => update({ mode: value })}
                />
                <span>
                  <Icon size={23} />
                  <strong>{t(label)}</strong>
                </span>
              </label>
            ))}
          </div>
          <p>{t("O modo Sistema acompanha a aparência do seu dispositivo.")}</p>
        </fieldset>
        <ThemePicker />
        <fieldset className="settings-options">
          <legend>{t("Contraste")}</legend>
          <div className="appearance-choices">
            {(
              [
                { value: "standard", label: "Normal" },
                { value: "enhanced", label: "Reforçado" },
                { value: "high", label: "Máximo" },
              ] as const
            ).map(({ value, label }) => (
              <label className="appearance-choice" key={value}>
                <input
                  type="radio"
                  name="contrast"
                  checked={appearance.contrast === value}
                  onChange={() => update({ contrast: value })}
                />
                <span>
                  <strong>{t(label)}</strong>
                </span>
              </label>
            ))}
          </div>
          <p>
            {t(
              "Aumente o contraste do texto, das superfícies e dos contornos.",
            )}
          </p>
        </fieldset>
        <fieldset className="settings-options">
          <legend>{t("Tamanho do texto")}</legend>
          <div className="appearance-choices">
            {(
              [
                { value: "default", label: "Padrão", percent: "100%" },
                { value: "large", label: "Grande", percent: "125%" },
                { value: "largest", label: "Muito grande", percent: "150%" },
              ] as const
            ).map(({ value, label, percent }) => (
              <label className="appearance-choice" key={value}>
                <input
                  type="radio"
                  name="text-size"
                  checked={appearance.textSize === value}
                  onChange={() => update({ textSize: value })}
                />
                <span>
                  <strong>{t(label)}</strong>
                  <small>{percent}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="settings-note">
          {t(
            "As alterações de aparência são aplicadas e guardadas automaticamente neste dispositivo.",
          )}
        </p>
        {error && (
          <p className="form-error" role="alert">
            {t(error)}
          </p>
        )}
      </section>

      <section
        className="panel settings-card settings-wide"
        aria-labelledby="language-settings-title"
      >
        <div className="settings-card-heading">
          <span className="settings-icon">
            <Languages size={21} />
          </span>
          <div>
            <h2 id="language-settings-title">{t("Idioma")}</h2>
            <p>{t("Escolha o idioma em que prefere usar o PetStay.")}</p>
          </div>
        </div>
        <LanguageSelector />
        <p className="settings-note">
          {t(
            "O idioma é aplicado e guardado automaticamente neste dispositivo.",
          )}
        </p>
      </section>

      <section
        className="panel settings-card settings-wide"
        aria-labelledby="hotel-operations-title"
      >
        <div className="settings-card-heading">
          <span className="settings-icon">
            <SlidersHorizontal size={21} />
          </span>
          <div>
            <h2 id="hotel-operations-title">{t("Preços e épocas do hotel")}</h2>
            <p>
              {t("Defina os preços por idade, creche e dias de época alta.")}
            </p>
          </div>
        </div>
        <button className="secondary" onClick={onPricing}>
          {t("Gerir preços e épocas")} <ArrowUpRight size={16} />
        </button>
      </section>

      <section
        className="panel settings-card settings-wide"
        aria-labelledby="data-settings-title"
      >
        <div className="settings-card-heading">
          <span className="settings-icon">
            <DatabaseBackup size={21} />
          </span>
          <div>
            <h2 id="data-settings-title">{t("Dados e cópias")}</h2>
            <p>
              {t(
                "Guarde uma cópia ou transfira o seu hotel para outro dispositivo.",
              )}
            </p>
          </div>
        </div>
        <DataTransfer />
      </section>
    </div>
  );
}
