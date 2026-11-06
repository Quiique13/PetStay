import { useLanguage } from "../context/LanguageContext.tsx";
import React from "react";
import { PawPrint } from "lucide-react";

export function Brand() {
  const { t } = useLanguage();
  return (
    <a
      className="brand"
      href={import.meta.env.BASE_URL}
      aria-label={t("PetStay — início")}
    >
      <span className="brand-symbol">
        <PawPrint size={30} />
      </span>
      <span className="brand-name">
        PetStay<small>{t("Gestão de hotéis para animais")}</small>
      </span>
    </a>
  );
}
