import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { useHotel } from "../context/HotelContext.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { authErrorMessage } from "../services/auth-errors.ts";

export function AccountBar() {
  const { user, logout } = useAuth();
  const storage = useHotel();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function leave() {
    setBusy(true);
    setError("");
    try {
      // Save pending edits before AuthGate unmounts the hotel screens.
      if (storage.data) {
        try {
          await storage.flush();
        } catch {
          setError(
            "Não foi possível guardar os dados. Resolva o erro antes de terminar sessão.",
          );
          return;
        }
      }
      await logout();
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="account-bar">
      <span>{user?.email || user?.displayName}</span>
      <button disabled={busy} onClick={() => void leave()}>
        <LogOut size={16} />
        {t(busy ? "Aguarde…" : "Terminar sessão")}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {t(error)}
        </p>
      )}
    </div>
  );
}
