import { useLanguage } from "../context/LanguageContext.tsx";
import { isLanguage, languages } from "../i18n/index.ts";

export function LanguageSelector() {
  const { language, changeLanguage, t, error } = useLanguage();
  return <div className="language-selector">
    <label>{t("Idioma da aplicação")}
      <select name="appLanguage" value={language} onChange={event => { if (isLanguage(event.target.value)) changeLanguage(event.target.value); }}>
        {languages.map(option => <option key={option.value} value={option.value} lang={option.locale}>{option.label}</option>)}
      </select>
    </label>
    {error && <p className="form-error" role="alert">{t(error)}</p>}
  </div>;
}
