// src/components/home/servicios.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { GiBarbecue } from "react-icons/gi";
import { MdPool } from "react-icons/md";
import { FaFutbol } from "react-icons/fa";
import { motion } from "framer-motion";

type Service = {
  title: string;
  desc: string;
  icon: React.ReactNode;
  tipo: "QUINCHO" | "PISCINA" | "CANCHA";
};

const services: Service[] = [
  {
    title: "Quincho",
    desc: "Espacio techado y equipado para tus celebraciones y encuentros.",
    icon: <GiBarbecue className="text-4xl" />,
    tipo: "QUINCHO",
  },
  {
    title: "Piscina",
    desc: "Piscina techada ideal para compartir y disfrutar de aguas termadas.",
    icon: <MdPool className="text-4xl" />,
    tipo: "PISCINA",
  },
  {
    title: "Cancha",
    desc: "Cancha multiuso perfecta para deportes y actividades en grupo.",
    icon: <FaFutbol className="text-4xl" />,
    tipo: "CANCHA",
  },
];

export default function ServicesSection() {
  const navigate = useNavigate();
  const goToCatalog = (tipo: Service["tipo"]) => {
    const params = new URLSearchParams({ tipo, activo: "true" });
    navigate(`/recursos?${params.toString()}`);
  };

  return (
    <section
      id="servicios"
      className="relative py-14 sm:py-14 bg-[#e5d0ac] overflow-hidden"
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-96 h-96 bg-[#ffb26a] rounded-full blur-[120px] opacity-30 top-10 left-10"></div>
        <div className="absolute w-[500px] h-[500px] bg-[#c14421] rounded-full blur-[150px] opacity-30 bottom-10 right-10"></div>
      </div>

      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6">
        {/* Título con línea naranja */}
        <motion.div
          className="flex items-center gap-3 justify-center mb-10 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <span className="block w-[3px] sm:w-[4px] md:w-[5px] h-12 sm:h-14 md:h-16 bg-[#c14421] rounded-full" />
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1e1e1e] tracking-tight">
            Reserva tu{" "}
            <span className="bg-gradient-to-r from-[#ffb26a] to-[#c14421] bg-clip-text text-transparent">
              espacio ideal
            </span>
          </h2>
        </motion.div>

        <motion.p
          className="mt-2 text-gray-800 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          Ofrecemos paquetes flexibles y una infraestructura pensada para la comodidad
          ¡Nuestra prioridad es que tu evento sea inolvidable!
        </motion.p>

        {/* Cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {services.map((s, i) => (
            <motion.article
              key={s.tipo}
              className="group relative rounded-3xl bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 + i * 0.12 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="relative z-10 p-10 flex flex-col items-center text-center">
                {/* Icono */}
                <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-r from-[#ffb26a] to-[#c14421] text-4xl shadow-lg relative">
                  <div className="absolute inset-0 rounded-full bg-[#c14421]/40 blur-xl opacity-70 group-hover:opacity-100 transition pointer-events-none"></div>
                  <span className="relative z-10">{s.icon}</span>
                </div>

                {/* Título */}
                <h3 className="mt-6 text-xl font-bold text-gray-900 group-hover:text-[#c14421] transition">
                  {s.title}
                </h3>

                {/* Descripción */}
                <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">
                  {s.desc}
                </p>

                {/* Botón */}
                <button
                  type="button"
                  className="mt-8 inline-flex items-center gap-2 rounded-full 
                             bg-gradient-to-r from-[#ffb26a] to-[#c14421]
                             text-white px-6 py-2.5 text-sm font-semibold shadow-md
                             hover:shadow-xl transition-all"
                  onClick={() => goToCatalog(s.tipo)}
                  aria-label={`Ver ${s.title}`}
                >
                  Ver {s.title}
                  <span className="transform group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </button>
              </div>

              {/* Glow hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#ffb26a]/10 to-[#c14421]/10 opacity-0 group-hover:opacity-100 transition rounded-3xl pointer-events-none"></div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
