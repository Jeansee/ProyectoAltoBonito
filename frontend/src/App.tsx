import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Login from "./pages/loginyregistro/login";
import Registro from "./pages/loginyregistro/registro";
import Perfil from "./pages/usuario/perfil";
import Footer from "./components/footer";
import RecursosPage from "./pages/recursos";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RedirectIfAuthenticated from "./components/auth/RedirectIfAuthenticated";
import AuthCallbackPage from "./pages/loginyregistro/callback"; 

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Ruta pública para el callback de Google */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Rutas públicas solo para no autenticados */}
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <Login />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfAuthenticated>
                <Registro />
              </RedirectIfAuthenticated>
            }
          />

          {/* Rutas protegidas */}
          <Route
            path="/recursos"
            element={
              <ProtectedRoute>
                <RecursosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
