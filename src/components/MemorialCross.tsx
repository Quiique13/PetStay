import { useLanguage } from "../context/LanguageContext.tsx";

export function MemorialCross() {
  const { t } = useLanguage();
  return <span className="memorial-cross" aria-hidden="true" title={t("Falecido")}>✝</span>;
}
