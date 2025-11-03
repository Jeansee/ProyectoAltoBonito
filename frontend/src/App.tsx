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
import AdminRoute from "@/routes/adminroute";
import AdminLayout from "@/pages/admin/adminlayout";
import DashboardPage from "@/pages/admin/dashboardpage";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Públicas sólo si NO está autenticado */}
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

          {/* Protegidas */}
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

          {/* Admin (nido correcto) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            {/* Más subrutas admin aquí */}
          </Route>
        </Routes>
      </main>

      <Footer />
    </>
  );
}
