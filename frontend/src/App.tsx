import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Login from "./pages/loginyregistro/login";
import Registro from "./pages/loginyregistro/registro";
import Perfil from "./pages/usuario/perfil";
import Footer from "./components/footer";
import PrivateRoute from "../src/routes/privateroute";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registro />} />
          {/* Protegido */}
          <Route element={<PrivateRoute />}>
            <Route path="/perfil" element={<Perfil />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </>
  );
}
