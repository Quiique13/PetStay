import { useLanguage } from "../context/LanguageContext.tsx";

export function LegalLinks({ disclosure = false }: { disclosure?: boolean }) {
  const { t } = useLanguage();
  const base = `${import.meta.env.BASE_URL}legal/`;
  return <div className="legal-information">
    {disclosure && <p className="auth-note">{t("O Google partilha o seu email e perfil básico para iniciar sessão. Não pedimos acesso ao Gmail ou Google Drive. Consulte a informação de privacidade antes de continuar.")}</p>}
    <nav className="legal-links" aria-label={t("Informação legal")}>
      <a href={`${base}index.html`} target="_blank" rel="noopener noreferrer">{t("Sobre o PetStay")}</a>
      <a href={`${base}privacy.html`} target="_blank" rel="noopener noreferrer">{t("Privacidade")}</a>
      <a href={`${base}terms.html`} target="_blank" rel="noopener noreferrer">{t("Termos de utilização")}</a>
      <a href={`${base}cookies.html`} target="_blank" rel="noopener noreferrer">{t("Cookies e armazenamento")}</a>
      <a href={`${base}rights.html`} target="_blank" rel="noopener noreferrer">{t("Direitos e pedidos")}</a>
    </nav>
  </div>;
}
