// src/components/home/servicios.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

type Service = {
  title: string;
  desc: string;
  icon: React.ReactNode;
  tipo: "QUINCHO" | "PISCINA" | "CANCHA";
};

const services: Service[] = [
  { title: "Quincho", desc: "Espacio techado...", icon: ("/* tu SVG */"), tipo: "QUINCHO" },
  { title: "Piscina", desc: "Piscina al aire libre...", icon: (""/* tu SVG */), tipo: "PISCINA" },
  { title: "Cancha",  desc: "Cancha multiuso...", icon: (""), tipo: "CANCHA"  },
];

export default function ServicesSection() {
  const navigate = useNavigate();
  const goToCatalog = (tipo: Service["tipo"]) => {
    const params = new URLSearchParams({ tipo, activo: "true" });
    navigate(`/recursos?${params.toString()}`);
  };

  return (
    <section id="servicios" className="bg-[#efefef] pt-8 sm:pt-3 pb-14 sm:pb-16">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-800">
          Arrienda tu espacio
        </h2>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((s) => (
            <article
              key={s.tipo}
              className="group relative rounded-xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md transition p-6 flex flex-col items-center text-center"
            >
              <div className="mb-4 text-gray-700 group-hover:text-indigo-600 transition">
                {s.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{s.title}</h3>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-[28ch]">
                {s.desc}
              </p>
              <button
                className="mt-5 inline-flex items-center rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition"
                onClick={() => goToCatalog(s.tipo)}
                aria-label={`Ver ${s.title}`}
              >
                Ver {s.title}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
