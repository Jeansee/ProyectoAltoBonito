import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Si no hay usuario autenticado, redirige a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, muestra el contenido protegido
  return <>{children}</>;
}