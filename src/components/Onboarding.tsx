import { useLanguage } from "../context/LanguageContext.tsx";
import React from "react";
import { Check } from "lucide-react";
import { useHotel } from "../context/HotelContext.tsx";
import { Brand } from "./Brand.tsx";
import { HotelProfileForm } from "./HotelProfileForm.tsx";
import { DataTransfer } from "./DataTransfer.tsx";
import { InstallMobile } from "./InstallMobile.tsx";
import { isMobileApp } from "../services/storage-mode.ts";
import { LanguageSelector } from "./LanguageSelector.tsx";

export function Onboarding() {
  const { t } = useLanguage();
  const storage = useHotel();
  return (
    <main className="onboarding">
      <section className="onboarding-story">
        <Brand />
        <div>
          <span className="tag">{t("MAIS TEMPO PARA OS PATUDOS")}</span>
          <h1>
            {t("O seu hotel.")}
            <br />
            {t("O seu espaço.")}
          </h1>
          <p>
            {t(
              "Uma casa para a gestão do seu hotel, desde o primeiro hóspede.",
            )}
          </p>
          <ul>
            <li>
              <Check size={18} />{" "}
              {t("Hóspedes, tutores e reservas num só lugar")}
            </li>
            <li>
              <Check size={18} /> {t("Os seus preços, definidos por si")}
            </li>
            <li>
              <Check size={18} /> {t("Dados guardados neste dispositivo")}
            </li>
          </ul>
        </div>
        <small>{t("Feito com carinho, para quem cuida.")}</small>
      </section>
      <section className="onboarding-card">
        <LanguageSelector />
        <span className="eyebrow">{t("VAMOS COMEÇAR")}</span>
        <h2>{t("Dê as boas-vindas ao seu hotel")}</h2>
        <p>
          {t(
            "Crie o perfil do hotel. Depois, adicione os seus hóspedes e defina os seus preços, ao seu ritmo.",
          )}
        </p>
        <HotelProfileForm
          onSubmit={storage.register}
          busy={storage.status === "saving"}
          error={storage.error}
          submitLabel={t("Criar o meu hotel")}
        />
        <p className="setup-note">
          {t(
            "O seu hotel começa com uma ficha limpa: sem hóspedes, reservas ou preços predefinidos.",
          )}
        </p>
        <details className="onboarding-import">
          <summary>{t("Já tem um hotel? Importar cópia")}</summary>
          <DataTransfer />
        </details>
        {isMobileApp && <InstallMobile />}
      </section>
    </main>
  );
}
