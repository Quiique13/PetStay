import React from "react";
import { Check } from "lucide-react";
import { useHotel } from "../context/HotelContext.tsx";
import { Brand } from "./Brand.tsx";
import { HotelProfileForm } from "./HotelProfileForm.tsx";

export function Onboarding() {
  const storage = useHotel();
  return <main className="onboarding">
    <section className="onboarding-story">
      <Brand />
      <div><span className="tag">MAIS TEMPO PARA OS PATUDOS</span>
        <h1>O seu hotel.<br />O seu espaço.</h1>
        <p>Uma casa para a gestão do seu hotel, desde o primeiro hóspede.</p>
        <ul>
          <li><Check size={18} /> Hóspedes, tutores e reservas num só lugar</li>
          <li><Check size={18} /> Os seus preços, definidos por si</li>
          <li><Check size={18} /> Dados guardados neste dispositivo</li>
        </ul>
      </div>
      <small>Feito com carinho, para quem cuida.</small>
    </section>
    <section className="onboarding-card">
      <span className="eyebrow">VAMOS COMEÇAR</span>
      <h2>Dê as boas-vindas ao seu hotel</h2>
      <p>Crie o perfil do hotel. Depois, adicione os seus hóspedes e defina os seus preços, ao seu ritmo.</p>
      <HotelProfileForm onSubmit={storage.register} busy={storage.status === "saving"} error={storage.error} submitLabel="Criar o meu hotel" />
      <p className="setup-note">O seu hotel começa com uma ficha limpa: sem hóspedes, reservas ou preços predefinidos.</p>
    </section>
  </main>;
}
