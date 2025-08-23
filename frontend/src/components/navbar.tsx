// src/components/Navbar.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { isLoggedIn, logout } from "../lib/auth";

const sections = [
  { id: "inicio", label: "Inicio" },
  { id: "sobre", label: "Sobre nosotros" },
  { id: "servicios", label: "Servicios" },
  { id: "contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setAuthed(isLoggedIn()), []);

  function goTo(id: string) {
    const doScroll = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

    if (location.pathname !== "/") {
      navigate("/", { replace: false });
      // pequeño delay para que la landing se monte
      setTimeout(doScroll, 60);
    } else {
      doScroll();
    }
    setOpen(false);
  }

  function handleLogout() {
    logout();
    setAuthed(false);
    navigate("/");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur border-b">
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button onClick={() => goTo("inicio")} className="font-bold text-xl tracking-tight">
          Quincho <span className="text-indigo-600">Altobonito</span>
        </button>

        {/* desktop */}
        <div className="hidden md:flex items-center gap-6">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => goTo(s.id)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {s.label}
            </button>
          ))}
          {authed ? (
            <button onClick={handleLogout} className="rounded-lg bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black">
              Salir
            </button>
          ) : (
            <Link to="/login" className="rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700">
              Iniciar sesión
            </Link>
          )}
        </div>

        {/* mobile toggle */}
        <button
          className="md:hidden inline-flex items-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
          onClick={() => setOpen(v => !v)}
          aria-label="Abrir menú"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </nav>

      {/* mobile panel */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => goTo(s.id)}
                className="py-2 text-gray-700 hover:text-gray-900 text-left"
              >
                {s.label}
              </button>
            ))}
            {authed ? (
              <button
                onClick={() => { setOpen(false); handleLogout(); }}
                className="mt-2 rounded-lg bg-gray-900 text-white px-3 py-2 text-sm"
              >
                Salir
              </button>
            ) : (
              <Link
                to="/login" onClick={() => setOpen(false)}
                className="mt-2 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm text-center"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
