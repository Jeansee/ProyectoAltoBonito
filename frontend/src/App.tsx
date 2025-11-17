// src/App.tsx
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
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
import OptionChatbot from "./components/home/chatbot";
import chatTree from "./services/chatbot.service";
import ResultadoPago from "@/pages/pago/ResultadoPago";

// 👇 IMPORTANTE: tu página de callback Google
import AuthCallbackPage from "@/pages/loginyregistro/callback";


export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleChatEvent = (event: string, payload?: any) => {
    if (event === "go_to") {
      const path = payload?.path ?? "/";
      if (location.pathname !== path) navigate(path);
    }
    if (event === "scroll_to") {
      const selector = payload?.selector as string;
      const route = payload?.route ?? "/";
      const doScroll = () => {
        const el = document.querySelector(selector) as HTMLElement | null;
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      if (location.pathname !== route) {
        navigate(route);
        setTimeout(doScroll, 120);
      } else {
        doScroll();
      }
    }
  };

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          {/* Página principal */}
          <Route path="/" element={<Home />} />

          {/* 👇 RUTA DE CALLBACK DE GOOGLE (IMPORTANTE) */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Públicas solo si NO está autenticado */}
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

          {/* Mis reservas */}
          <Route
            path="/usuario/reservas"
            element={
              <ProtectedRoute>
                <Perfil initialTab="reservas" />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<DashboardPage />} />
          </Route>

          {/* Pago Webpay */}
          <Route path="/pago/ok" element={<ResultadoPago />} />
        </Routes>
      </main>

      <Footer />

      <OptionChatbot
        tree={chatTree}
        title="Asistente Quincho"
        brand={{
          primary: "#c14421",
          primaryText: "#ffffff",
          bubbleBot: "#1e1e1e",
          bubbleUser: "#e5d0ac",
          border: "#e5d0ac",
        }}
        floating
        storageKey="qab-chat-v1"
        onEvent={handleChatEvent}
      />
    </>
  );
}
