import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const NavLink = ({ to, label }: { to: string; label: string }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium ${
        active ? "bg-[#c14421] text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
};

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-14 bg-white shadow-sm border-b flex items-center justify-between px-4">
        <div className="font-bold">Panel Admin · Quincho Alto Bonito</div>
        <nav className="flex items-center gap-2">
          <NavLink to="/admin" label="Dashboard" />
          {/* Puedes agregar más secciones: Recursos, Usuarios, etc. */}
          <Link to="/" className="ml-4 text-sm text-gray-500 hover:underline">Volver al sitio</Link>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
