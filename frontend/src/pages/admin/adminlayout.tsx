import React from "react";
import { Outlet, Link } from "react-router-dom";
import { FaUserShield } from "react-icons/fa";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
        {/* HERO: Split Bar mejorado */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* Barra superior con gradiente */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#c14421] via-[#ffb26a] to-[#c14421]" />

          {/* Encabezado */}
          <div className="px-6 md:px-8 py-6">
            <div className="flex items-center gap-4">
              {/* Icono React Icons */}
              <div className="h-12 w-12 rounded-xl bg-[#c14421]/10 grid place-items-center ring-1 ring-[#c14421]/15 shadow-sm">
                <FaUserShield className="text-[#c14421]" size={22} />
              </div>

              {/* Títulos */}
              <div className="min-w-0">
                <h1 className="text-[22px] md:text-3xl font-extrabold leading-tight text-[#1e1e1e]">
                  Bienvenido, admin
                </h1>
                <p className="mt-0.5 text-sm md:text-base text-gray-600 truncate">
                  Control de operaciones, ingresos y actividad.
                </p>
              </div>
            </div>

            {/* Acciones rápidas (opcional) */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-sm transition"
                title="Volver al sitio público"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M10 19a1 1 0 0 1-1-1v-5H6l6-7 6 7h-3v5a1 1 0 0 1-1 1h-4Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Inicio
              </Link>
              <a
                href="#dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-[#c14421] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition"
                title="Ir al resumen"
              >
                Ver dashboard
              </a>
            </div>
          </div>
        </div>

        {/* Contenido del dashboard */}
        <section id="dashboard">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
