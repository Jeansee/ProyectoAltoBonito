import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // 🔸 Si hay token en localStorage pero el user aún no está
  //     (AuthProvider está haciendo fetchMe), espera sin redirigir.
  const hasToken =
    typeof window !== "undefined" && !!localStorage.getItem("token");
  if (!user && hasToken) return null; // puedes mostrar un spinner aquí si quieres

  if (!user) return <Navigate to="/login" replace />;
  if (user.rol !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}
