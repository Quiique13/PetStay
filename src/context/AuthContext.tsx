import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import type { Auth, User } from "firebase/auth";
import { createFirebaseAuth } from "../services/firebase.ts";
import { authErrorMessage } from "../services/auth-errors.ts";
import { loginWithGoogle } from "../services/google-sign-in.ts";
import { useLanguage } from "./LanguageContext.tsx";

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<unknown>;
  register: (email: string, password: string) => Promise<unknown>;
  loginWithGoogle: () => Promise<unknown>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const [auth] = useState<{ client: Auth | null; error: string }>(() => {
    try {
      return { client: createFirebaseAuth(), error: "" };
    } catch (cause) {
      return { client: null, error: authErrorMessage(cause) };
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!auth.client);
  const [error, setError] = useState(auth.error);

  useEffect(() => {
    if (!auth.client) return;
    return onAuthStateChanged(
      auth.client,
      (next) => {
        setUser(next);
        setLoading(false);
        setError("");
      },
      (cause) => {
        setUser(null);
        setError(authErrorMessage(cause));
        setLoading(false);
      },
    );
  }, [auth.client]);

  useEffect(() => {
    if (auth.client) auth.client.languageCode = locale;
  }, [auth.client, locale]);

  function client(): Auth {
    if (!auth.client) throw new Error(auth.error);
    return auth.client;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login: (email, password) =>
          signInWithEmailAndPassword(client(), email.trim(), password),
        register: (email, password) =>
          createUserWithEmailAndPassword(client(), email.trim(), password),
        loginWithGoogle: () => loginWithGoogle(client()),
        resetPassword: (email) =>
          sendPasswordResetEmail(client(), email.trim()),
        logout: () => signOut(client()),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
