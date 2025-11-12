import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import AuthProvider from "@/context/AuthContext";
import { ReservaCartProvider } from "@/context/reserva-cart";

// 👇 inicializa Mercado Pago con tu public key .env (TEST)
import { initMercadoPago } from "@mercadopago/sdk-react";
initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY!, { locale: "es-CL" });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReservaCartProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ReservaCartProvider>
  </React.StrictMode>
);
