import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { HotelProvider } from "./context/HotelContext.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("The app root element is missing.");

createRoot(root).render(
  <HotelProvider>
    <App />
  </HotelProvider>,
);
