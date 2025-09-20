// src/components/Footer.tsx
import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhone,
} from "react-icons/fa";
import { SiTiktok } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="border-t bg-white text-gray-700">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Línea superior azul */}
        <div className="h-[1px] w-full bg-blue-500 mb-8" />

        {/* Contenido principal */}
        <div className="grid gap-8 md:grid-cols-2 md:items-start">
          {/* Logo */}
          <div className="flex justify-center md:justify-start">
            <img
              src="/logo192.png" // cambia la ruta por tu logo
              alt="Quincho Altobonito"
              className="h-14 w-auto"
            />
          </div>

          {/* Datos de contacto */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 md:pl-20">
            <div className="flex items-start gap-2 max-w-[40ch]">
              <FaMapMarkerAlt className="text-blue-600 w-5 h-5 flex-shrink-0 mt-1" />
              <span className="leading-relaxed">
                Alto bonito km. 1028, Puerto Montt
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaPhone className="text-blue-600 w-5 h-5" />
              <a
                href="tel:+11234567890"
                className="hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                (56) 9 1234 5678
              </a>
            </div>
          </div>
        </div>

        {/* Línea separadora */}
        <div className="h-[1px] w-full bg-gray-200 mt-10 mb-4" />

        {/* Barra inferior */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          {/* Redes sociales */}
          <div className="flex gap-3">
            {[
              { Icon: FaFacebookF, label: "Facebook", href: "#" },
              { Icon: FaInstagram, label: "Instagram", href: "#" },
              { Icon: SiTiktok, label: "TikTok", href: "#" },
            ].map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-xs text-gray-500 text-center sm:text-right">
            © {new Date().getFullYear()} — Quincho Altobonito.
          </div>
        </div>
      </div>
    </footer>
  );
}
