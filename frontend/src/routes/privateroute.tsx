import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "../lib/auth";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const authed = isLoggedIn();
  const location = useLocation();

  return authed ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
