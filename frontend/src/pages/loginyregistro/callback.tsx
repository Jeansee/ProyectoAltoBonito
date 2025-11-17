// frontend/src/pages/loginyregistro/callback.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallbackPage() {
  const { setTokenAndRefresh } = useAuth();
  const [msg, setMsg] = useState("Procesando inicio de sesión...");

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get("token");
      const connected = url.searchParams.get("googleConnected");

      if (!token) {
        setMsg("No se encontró token en la URL.");
        return;
      }

      setTokenAndRefresh(token)
        .then(() => {
          setMsg(
            connected
              ? "Cuenta de Google conectada. Redirigiendo..."
              : "Inicio de sesión exitoso. Redirigiendo..."
          );
          window.location.replace("/");
        })
        .catch(() => {
          setMsg("No se pudo establecer la sesión.");
        });
    } catch {
      setMsg("Error procesando el callback.");
    }
  }, [setTokenAndRefresh]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="rounded-xl border bg-white shadow p-6 text-center max-w-sm w-full">
        <p className="text-sm text-gray-600">{msg}</p>
      </div>
    </div>
  );
}
