import { useLanguage } from "./context/LanguageContext.tsx";
import React, { useEffect } from "react";
import "./App.css";
import "./mobile.css";
import { useHotel } from "./context/HotelContext.tsx";
import { Brand } from "./components/Brand.tsx";
import { Onboarding } from "./components/Onboarding.tsx";
import Dashboard from "./components/Dashboard.tsx";
import { AccountBar } from "./components/AccountBar.tsx";
import { CloudSyncBanner } from "./components/CloudSyncBanner.tsx";

export default function App() {
  return (
    <>
      <AccountBar />
      <CloudSyncBanner />
      <HotelApp />
    </>
  );
}

function HotelApp() {
  const { t } = useLanguage();
  const storage = useHotel();
  useEffect(() => {
    document.title = storage.data?.hotel
      ? `${storage.data.hotel.name} | PetStay`
      : t("PetStay — gestão de hotéis para animais");
  }, [storage.data?.hotel?.name, t]);
  if (storage.conflict) return null;
  if (!storage.data) {
    return (
      <main className="storage-screen">
        <Brand />
        <h1>
          {storage.error
            ? t("Não foi possível abrir os dados")
            : t(
                storage.cloud
                  ? "A abrir os dados da conta…"
                  : "A abrir os dados do dispositivo…",
              )}
        </h1>
        <p role={storage.error ? "alert" : "status"}>
          {t(
            storage.error?.message ??
              "A preparar os seus hóspedes, reservas e preços.",
          )}
        </p>
        {storage.error && (
          <button className="primary" onClick={storage.retry}>
            {t("Tentar novamente")}
          </button>
        )}
      </main>
    );
  }
  if (!storage.data.hotel) return <Onboarding />;
  return <Dashboard />;
}
