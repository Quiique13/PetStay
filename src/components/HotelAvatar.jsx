import React from "react";
import { PawPrint } from "lucide-react";
import { initials } from "../utils/format.js";

export function HotelAvatar({ hotel, large = false }) {
  return <span className={`hotel-avatar ${large ? "hotel-avatar-large" : ""}`}>
    {hotel?.avatar ? <img src={hotel.avatar} alt={`Avatar de ${hotel.name || "hotel"}`} />
      : hotel?.name ? initials(hotel.name).toUpperCase() : <PawPrint size={large ? 38 : 24} />}
  </span>;
}
