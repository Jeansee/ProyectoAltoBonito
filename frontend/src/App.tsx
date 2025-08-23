// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Login from "./pages/login";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Quincho Altobonito. Proyecto académico.</p>
          <a href="#inicio" className="hover:text-gray-900">Volver arriba ↑</a>
        </div>
      </footer>
    </>
  );
}
