import { useLanguage } from "../context/LanguageContext.tsx";
import React from "react";
import { PawPrint } from "lucide-react";
import { initials } from "../utils/format.ts";
import type { HotelProfile } from "../types.ts";

export function HotelAvatar({ hotel, large = false }: { hotel?: Pick<HotelProfile, "name" | "avatar"> | null; large?: boolean }) {
  const { t } = useLanguage();
  return <span className={`hotel-avatar ${large ? "hotel-avatar-large" : ""}`}>
    {hotel?.avatar ? <img src={hotel.avatar} alt={t("Avatar de {name}", { name: hotel.name || t("hotel") })} />
      : hotel?.name ? initials(hotel.name).toUpperCase() : <PawPrint size={large ? 38 : 24} />}
  </span>;
}
