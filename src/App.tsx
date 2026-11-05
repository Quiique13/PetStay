import React, { useEffect } from "react";
import "./App.css";
import "./mobile.css";
import { useHotel } from "./context/HotelContext.tsx";
import { Brand } from "./components/Brand.tsx";
import { Onboarding } from "./components/Onboarding.tsx";
import Dashboard from "./components/Dashboard.tsx";

export default function App() {
  const storage = useHotel();
  useEffect(() => {
    document.title = storage.data?.hotel
      ? `${storage.data.hotel.name} | PetStay`
      : "PetStay — gestão de hotéis para animais";
  }, [storage.data?.hotel?.name]);
  if (!storage.data) {
    return (
      <main className="storage-screen">
        <Brand />
        <h1>
          {storage.error
            ? "Não foi possível abrir os dados"
            : "A abrir os dados do dispositivo…"}
        </h1>
        <p role={storage.error ? "alert" : "status"}>
          {storage.error?.message ??
            "A preparar os seus hóspedes, reservas e preços."}
        </p>
        {storage.error && (
          <button className="primary" onClick={storage.retry}>
            Tentar novamente
          </button>
        )}
      </main>
    );
  }
  if (!storage.data.hotel) return <Onboarding />;
  return <Dashboard />;
}

