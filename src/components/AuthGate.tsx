import { Fragment, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { authErrorMessage } from "../services/auth-errors.ts";
import { Brand } from "./Brand.tsx";
import { LanguageSelector } from "./LanguageSelector.tsx";
import { AppearanceMenu } from "./ThemePicker.tsx";
import "./Auth.css";

type Mode = "login" | "register" | "reset";

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { t } = useLanguage();
  useEffect(() => {
    if (!auth.user) document.title = t("Acesso ao PetStay");
  }, [auth.user, t]);
  if (auth.loading)
    return (
      <main className="storage-screen">
        <Brand />
        <p role="status">{t("A verificar a sua sessão…")}</p>
      </main>
    );
  if (auth.user) return <Fragment key={auth.user.uid}>{children}</Fragment>;
  return <LoginScreen />;
}

function LoginScreen() {
  const auth = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [desktopSignIn, setDesktopSignIn] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const title =
    mode === "register"
      ? "Criar conta"
      : mode === "reset"
        ? "Recuperar palavra-passe"
        : "Bem-vindo ao PetStay";
  const submitLabel =
    mode === "register"
      ? "Criar conta"
      : mode === "reset"
        ? "Enviar email de recuperação"
        : "Entrar";

  function changeMode(next: Mode) {
    setMode(next);
    setError("");
    setSent(false);
    setPassword("");
    setConfirmation("");
  }

  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setSent(false);
    try {
      await action();
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "register" && password !== confirmation) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    void run(async () => {
      if (mode === "reset") {
        await auth.resetPassword(email);
        setSent(true);
      } else if (mode === "register") await auth.register(email, password);
      else await auth.login(email, password);
    });
  }

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <Brand />
        <LanguageSelector />
        <h1 id="auth-title">{t(title)}</h1>
        <p>
          {t(
            mode === "reset"
              ? "Envie um pedido para recuperar o acesso à sua conta."
              : "Entre com a sua conta Google ou com email e palavra-passe.",
          )}
        </p>
        {mode !== "reset" && (
          <>
            <button
              className="secondary auth-google"
              disabled={busy || !!auth.error}
              onClick={() => {
                setDesktopSignIn(!!window.petStayDesktop);
                void run(async () => {
                  try { await auth.loginWithGoogle(); }
                  finally { setDesktopSignIn(false); }
                });
              }}
            >
              <span aria-hidden="true" className="auth-google-icon">
                G
              </span>
              {t("Continuar com Google")}
            </button>
            {desktopSignIn && <>
              <p role="status">{t("Conclua o início de sessão no navegador que abriu.")}</p>
              <button className="textbutton" onClick={() => void window.petStayDesktop?.cancelSignIn()}>{t("Cancelar")}</button>
            </>}
            <div className="auth-divider">{t("ou use o seu email")}</div>
          </>
        )}
        <form onSubmit={submit} className="auth-form" aria-busy={busy}>
          <fieldset disabled={busy || !!auth.error}>
            <label htmlFor="auth-email">{t("Email")}</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {mode !== "reset" && (
              <>
                <label htmlFor="auth-password">{t("Palavra-passe")}</label>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  required
                  minLength={mode === "register" ? 6 : undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-describedby={
                    mode === "register" ? "password-hint" : undefined
                  }
                />
              </>
            )}
            {mode === "register" && (
              <>
                <small id="password-hint">
                  {t("Use pelo menos 6 caracteres.")}
                </small>
                <label htmlFor="auth-confirmation">
                  {t("Confirmar palavra-passe")}
                </label>
                <input
                  id="auth-confirmation"
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </>
            )}
            {(error || auth.error) && (
              <p className="form-error" role="alert">
                {t(error || auth.error)}
              </p>
            )}
            {sent && (
              <p className="auth-success" role="status">
                {t(
                  "Se existir uma conta com este email, receberá instruções para recuperar a palavra-passe.",
                )}
              </p>
            )}
            <button className="primary" type="submit">
              {t(busy ? "Aguarde…" : submitLabel)}
            </button>
          </fieldset>
        </form>
        <div className="auth-actions">
          {mode === "login" ? (
            <>
              <button disabled={busy} onClick={() => changeMode("reset")}>
                {t("Esqueci-me da palavra-passe")}
              </button>
              <button disabled={busy} onClick={() => changeMode("register")}>
                {t("Ainda não tem conta? Criar conta")}
              </button>
            </>
          ) : (
            <button disabled={busy} onClick={() => changeMode("login")}>
              {t("Voltar ao início de sessão")}
            </button>
          )}
        </div>
        <p className="auth-note">
          {t(
            "O seu hotel está associado à sua conta. Entre com a mesma conta para sincronizar os dados entre dispositivos. O primeiro acesso requer internet.",
          )}
        </p>
        <AppearanceMenu />
        <footer className="auth-footer">
          PetStay{" "}
          <span className="app-version">
            v{import.meta.env.VITE_APP_VERSION}
          </span>
        </footer>
      </section>
    </main>
  );
}
