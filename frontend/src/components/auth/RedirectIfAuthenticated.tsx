import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

export default function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Si hay usuario autenticado, redirige a home
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Si no hay usuario, muestra el contenido (login/registro)
  return <>{children}</>;
}