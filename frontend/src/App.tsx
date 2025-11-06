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

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Handler para eventos del chatbot
  const handleChatEvent = (event: string, payload?: any) => {
    if (event === "go_to") {
      const path = payload?.path ?? "/";
      if (location.pathname !== path) {
        navigate(path);
      } else {
        // Si quieres, aquí podrías disparar un "refetch" en /recursos
      }
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
        setTimeout(doScroll, 120); // tiempo para montar el DOM de destino
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
            {/* más subrutas admin aquí */}
          </Route>
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
        onEvent={handleChatEvent}  // <-- clave
      />
    </>
  );
}
