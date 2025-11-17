import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "#inicio", label: "Inicio" },
  { href: "#nosotros", label: "Sobre nosotros" },
  { href: "#servicios", label: "Servicios" },
  { href: "#galeria", label: "Galeria" },
  { href: "#contacto", label: "Contacto" },
];

function Logo() {
  return (
    <div className="flex items-center">
      <img
        src="/img/logo.webp"
        alt="Logo"
        className="h-20 w-auto object-contain"
      />
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  // en páginas distintas a home solo mostramos Inicio y Contacto
  const navLinks = isHome
    ? links
    : links.filter((l) => l.href === "#inicio");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2" aria-label="Home">
              <Logo />
            </Link>

            <nav className="hidden md:flex flex-1 justify-center">
              <ul className="flex items-center gap-10 text-[15px] font-medium text-gray-800">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    {isHome ? (
                      // En home usamos anchors normales
                      <a
                        href={l.href}
                        className="hover:text-[#c14421] transition-colors"
                      >
                        {l.label}
                      </a>
                    ) : (
                      // En otras páginas, volvemos a "/" con el hash
                      <Link
                        to={`/${l.href}`} // ej: "/#inicio"
                        className="hover:text-[#c14421] transition-colors"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Acciones (desktop) */}
            <div className="hidden md:flex items-center gap-4">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-700 hover:text-[#c14421]"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-md px-4 py-2 text-sm font-semibold text-white bg-[#c14421] hover:bg-[#1e1e1e]"
                  >
                    Registrarse
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/perfil")}
                    className="group flex items-center gap-2 rounded-full pl-2 pr-3 py-1 hover:bg-gray-100"
                    title="Ver perfil"
                  >
                    {/* Avatar iniciales */}
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#c14421] text-white text-sm font-semibold">
                      {user.nombre?.[0]?.toUpperCase() ?? "U"}
                    </span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-[#c14421]">
                      {user.nombre}
                    </span>
                    {/* ícono chevron */}
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4 text-gray-500 group-hover:text-[#c14421]"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 0 1 1.08 1.04l-4.25 4.25a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={logout}
                    className="group inline-flex items-center justify-center rounded-full px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 transition"
                  >
                    <span className="group-hover:text-[#c14421]">
                      Cerrar sesión
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Hamburguesa (mobile) */}
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#c14421]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-6 w-6"
              >
                <path
                  fill="currentColor"
                  d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75Zm0 5.25c0-.414.336-.75.75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Zm.75 4.5a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Panel móvil */}
      <div className={`md:hidden ${open ? "fixed" : "hidden"} inset-0 z-[100]`}>
        <div
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-black/70"
          aria-hidden
        />
        <aside
          role="dialog"
          aria-modal="true"
          className="absolute top-0 right-0 h-full w-[88%] max-w-sm bg-white shadow-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#c14421]"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="mt-8 space-y-2">
            {navLinks.map((l) =>
              isHome ? (
                <a
                  key={l.href}
                  href={l.href}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-gray-800 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.href}
                  to={`/${l.href}`} // "/#inicio", "/#contacto"
                  className="block rounded-lg px-3 py-2 text-base font-medium text-gray-800 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              )
            )}
          </nav>

          <div className="mt-6 border-t pt-6 flex items-center gap-3">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-[#c14421]"
                  onClick={() => setOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white bg-[#c14421] hover:bg-[#c14421]"
                  onClick={() => setOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/perfil");
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#c14421] text-white text-sm font-semibold">
                    {user.nombre?.[0]?.toUpperCase() ?? "U"}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    Mi Perfil
                  </span>
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
