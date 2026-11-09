import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { HotelProvider } from "./context/HotelContext.tsx";
import { AppearanceProvider } from "./context/AppearanceContext.tsx";
import { LanguageProvider } from "./context/LanguageContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { AuthGate } from "./components/AuthGate.tsx";
import "./themes.css";

const root = document.getElementById("root");
if (!root) throw new Error("The app root element is missing.");

createRoot(root).render(
  <LanguageProvider>
    <AppearanceProvider>
      <AuthProvider>
        <AuthGate>
          <HotelProvider>
            <App />
          </HotelProvider>
        </AuthGate>
      </AuthProvider>
    </AppearanceProvider>
  </LanguageProvider>,
);
