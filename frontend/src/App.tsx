// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Login from "./pages/login";
import Footer from "./components/footer";

export default function App() {
  return (
    <>
      {/* Navbar fijo en todas las páginas */}
      <Navbar />

      {/* Contenido principal */}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

      {/* Footer global */}
      <Footer /> {/* ✅ usamos el nuevo footer */}
    </>
  );
}
