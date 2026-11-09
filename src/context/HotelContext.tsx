import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useDeviceData } from "../hooks/useDeviceData.ts";
import { useAuth } from "./AuthContext.tsx";
import { useCloudData } from "../hooks/useCloudData.ts";
import { loadImportRecovery } from "../services/device-storage.ts";
import { useLanguage } from "./LanguageContext.tsx";

// Legacy storage remains available only to the existing isolated UI test suite.
const localTests = import.meta.env.MODE === "mobile-test" || import.meta.env.MODE === "desktop-test";
function useLocalTestData(user: Parameters<typeof useDeviceData>[0]) {
  const storage = useDeviceData(user);
  return { ...storage, cloud: false, conflict: null, resolve: async (_: "cloud" | "local") => {}, loadRecovery: () => loadImportRecovery(user) };
}
const useAccountData = localTests ? useLocalTestData : useCloudData;

const HotelContext = createContext<ReturnType<typeof useAccountData> | null>(
  null,
);

export function HotelProvider({ children }: { children: ReactNode }) {
  return localTests ? <AccountHotelProvider>{children}</AccountHotelProvider> : <ExclusiveAccount>{children}</ExclusiveAccount>;
}

function ExclusiveAccount({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [acquired, setAcquired] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    let release: (() => void) | undefined;
    // One editor per account/origin protects the durable offline draft shared by
    // tabs. Separate devices still synchronize through Firestore revisions.
    if (navigator.locks && user) void navigator.locks.request(`petstay-account-${user.uid}`, { signal: abort.signal }, async () => {
      if (abort.signal.aborted) return;
      setAcquired(true);
      await new Promise<void>(resolve => { release = resolve; });
    }).catch(() => {});
    return () => { abort.abort(); release?.(); };
  }, [user?.uid]);
  if (!acquired) return <main className="storage-screen"><h1>{t("A abrir a sua conta…")}</h1><p>{t("Se a conta estiver aberta noutra janela do PetStay, feche essa janela para continuar. Use um navegador atualizado.")}</p><button onClick={() => void logout()}>{t("Terminar sessão")}</button></main>;
  return <AccountHotelProvider>{children}</AccountHotelProvider>;
}

function AccountHotelProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) throw new Error("HotelProvider requires a signed-in account.");
  const storage = useAccountData(user);
  return (
    <HotelContext.Provider value={storage}>{children}</HotelContext.Provider>
  );
}

export function useHotel() {
  const storage = useContext(HotelContext);
  if (!storage) throw new Error("useHotel must be used within HotelProvider.");
  return storage;
}
