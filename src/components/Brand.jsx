import React from "react";
import { PawPrint } from "lucide-react";

export function Brand() {
  return <a className="brand" href="/" aria-label="PetStay — início">
    <span className="brand-symbol"><PawPrint size={30} /></span>
    <span className="brand-name">PetStay<small>Gestão de hotéis para animais</small></span>
  </a>;
}
