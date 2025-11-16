// src/components/Footer.tsx
import React from "react";
import { FaFacebookF, FaInstagram, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="border-t bg-white text-gray-700">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Línea superior roja */}
        <div className="h-[1px] w-full bg-[#c14421] mt-6 mb-8" />

        {/* Contenido principal: logo + datos + mapa */}
        <div className="grid gap-6 md:grid-cols-3 md:items-center">
          {/* Logo en contenedor fijo */}
          <div className="flex justify-center md:justify-start h-[220px]">
            <img
              src="/img/logo.webp"
              alt="Logo"
              className="h-full w-auto object-contain"
            />
          </div>

          {/* Datos de contacto */}
          <div
            className="flex flex-col items-center md:items-start text-center md:text-left gap-3 md:pl-6"
            id="contacto"
          >
            <div className="flex items-start gap-3 max-w-[48ch]">
              <FaMapMarkerAlt className="text-[#c14421] w-5 h-5 flex-shrink-0 mt-1" />
              <span className="leading-relaxed">
                Alto bonito km. 1028, Puerto Montt
              </span>
            </div>
            <div className="flex items-center gap-3">
              <FaPhone className="text-[#c14421] w-5 h-5" />
              <a
                href="tel:+56912345678"
                className="hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c14421] rounded"
              >
                (56) 9 1234 5678
              </a>
            </div>
          </div>

          {/* Mapa de Google a la derecha, en formato más cuadrado */}
          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-xs h-40 md:h-[220px] rounded-2xl overflow-hidden border border-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2704.1404457376398!2d-73.04160689999999!3d-41.5005373!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x96183dcac6ceb73d%3A0x5cef3f3ac6fc8f4e!2sMM%20CONSTRUCCIONES%202!5e1!3m2!1ses!2scl!4v1763267838505!5m2!1ses!2scl"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>

        {/* Línea separadora */}
        <div className="h-[1px] w-full bg-gray-200 mt-4 mb-2" />

        {/* Barra inferior */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#c14421] hover:text-[#1e1e1e] hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 transition"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-xs text-gray-500 text-center sm:text-right">
            © {new Date().getFullYear()} — Quincho Altoonito.
          </div>
        </div>
      </div>
    </footer>
  );
}
