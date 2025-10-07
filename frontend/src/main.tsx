import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import AuthProvider from "@/context/AuthContext";
import { ReservaCartProvider } from "@/context/reserva-cart";

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
