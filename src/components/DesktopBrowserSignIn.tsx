import { useEffect, useState } from "react";
import { getApp, getApps, initializeApp } from "firebase/app";
import { browserPopupRedirectResolver, GoogleAuthProvider, inMemoryPersistence, initializeAuth, signInWithPopup, signOut } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { firebaseConfig } from "../services/firebase.ts";
import { authErrorMessage } from "../services/auth-errors.ts";
import { useLanguage } from "../context/LanguageContext.tsx";
import { LanguageSelector } from "./LanguageSelector.tsx";
import { Brand } from "./Brand.tsx";
import { LegalLinks } from "./LegalLinks.tsx";
import "./Auth.css";

export function DesktopBrowserSignIn() {
  const { t, locale } = useLanguage();
  const [secret] = useState(() => location.hash.slice(1));
  const [phase, setPhase] = useState<"idle" | "busy" | "done" | "expired">("idle");
  const [error, setError] = useState("");
  const valid = /^[a-f0-9]{64}$/.test(secret);
  useEffect(() => {
    // Keep the one-use secret out of browser history and later copied URLs.
    history.replaceState(null, "", "/?desktop-sign-in=1");
    document.title = t("Iniciar sessão no PetStay");
  }, [t]);

  async function signIn() {
    if (!valid || phase !== "idle") return;
    setPhase("busy");
    setError("");
    let auth: Auth | undefined;
    try {
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      auth = initializeAuth(app, { persistence: inMemoryPersistence });
      auth.languageCode = locale;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      const idToken = GoogleAuthProvider.credentialFromResult(result)?.idToken;
      if (!idToken) throw new Error("Missing Google ID token.");
      const response = await fetch("/api/desktop-auth/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-PetStay-Sign-In": secret },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) {
        setError("Este pedido expirou. Volte ao PetStay e tente novamente.");
        setPhase("expired");
        return;
      }
      setPhase("done");
    } catch (cause) {
      setError(authErrorMessage(cause));
      setPhase("idle");
    } finally {
      // The helper has no persistent Firebase session or hotel data.
      if (auth) await signOut(auth).catch(() => {});
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="desktop-sign-in-title">
        <Brand />
        <LanguageSelector />
        <h1 id="desktop-sign-in-title">{t("Iniciar sessão no PetStay")}</h1>
        <LegalLinks disclosure />
        {phase === "done" ? <p className="auth-success" role="status">{t("Sessão enviada à aplicação. Pode fechar este separador e voltar ao PetStay.")}</p> : <>
          <p>{t("Continue com Google neste navegador para entrar na aplicação PetStay.")}</p>
          {!valid && <p role="alert">{t("Este pedido expirou. Volte ao PetStay e tente novamente.")}</p>}
          {error && <p role="alert">{t(error)}</p>}
          <button className="secondary auth-google" disabled={!valid || phase !== "idle"} onClick={() => void signIn()}>
            {t("Continuar com Google")}
          </button>
          <p>{t("Os dados do hotel continuam guardados na pasta da aplicação.")}</p>
        </>}
      </section>
    </main>
  );
}
