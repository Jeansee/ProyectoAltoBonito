import React from "react";
import s from "./home.module.css";
import { motion } from "framer-motion"; // 👈 agregado

export default function AboutSection() {
  return (
    <section id="nosotros" className="bg-[#e5d0ac] py-12 sm:py-24">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6">
        {/* Grid principal: panel/imagenes izq, texto der */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Columna de panel + imágenes (md: 7/12) */}
          <div className="md:col-span-7">
            <div className="grid grid-cols-12 gap-4">
              {/* PANEL ARRIBA (vibrante + movimiento) */}
              <div className="col-span-12">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.25 }}
                  className={`relative aspect-[16/7] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 ${s.animateGlow}`}
                >
                  {/* Gradiente animado principal */}
                  <div
                    className={`absolute inset-0 ${s.animateGradient}`}
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #ffb26a, #c14421, #ffb26a)",
                    }}
                  />
                  {/* Blobs decorativos */}
                  <div className={`pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl ${s.animateFloat1}`} />
                  <div className={`pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-3xl ${s.animateFloat2}`} />
                  {/* Partículas sutiles */}
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute top-6 left-8 h-1 w-24 bg-white/25 rounded-full blur-[1px]" />
                    <div className="absolute bottom-8 right-10 h-1 w-28 bg-white/20 rounded-full blur-[1px]" />
                  </div>
                  {/* Halo lateral */}
                  <div className="pointer-events-none absolute inset-y-0 -left-24 w-40 bg-white/10 blur-3xl" />

                  {/* Contenido del panel */}
                  <div className="relative z-10 h-full w-full flex items-center justify-center p-6 sm:p-10">
                    <div className="max-w-2xl text-center">
                      <h2 className="font-extrabold leading-tight text-lg sm:text-2xl md:text-3xl lg:text-4xl">
                        <span className="text-white">
                          ''Un espacio ideal para celebrar y disfrutar
                        </span>
                        <br />
                        <span className={s.animateShimmer}>en Alto Bonito''</span>
                      </h2>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* IMÁGENES PEQUEÑAS ABAJO */}
              <div className="col-span-12 sm:col-span-6">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                  viewport={{ once: true, amount: 0.25 }}
                  className="group/image relative aspect-square overflow-hidden rounded-xl shadow-md bg-gray-200"
                >
                  <img
                    src="/img/foto13.webp"
                    alt="Área social del quincho"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/image:scale-105"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5 rounded-xl" />
                </motion.div>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                  viewport={{ once: true, amount: 0.25 }}
                  className="group/image relative aspect-square overflow-hidden rounded-xl shadow-md bg-gray-200"
                >
                  <img
                    src="/img/foto17.webp"
                    alt="Cocina y equipamiento"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/image:scale-105"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5 rounded-xl" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Columna de texto (md: 5/12) */}
          <motion.div
            className="md:col-span-5"
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.25 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="block w-[3px] sm:w-[4px] md:w-[5px] h-16 sm:h-16 md:h-20 bg-[#c14421] rounded-full" />
              <div>
                <p className="text-[11px] tracking-widest sm:text-sm text-[#c14421] uppercase mb-2">
                  Nosotros
                </p>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase text-[#1e1e1e] leading-tight">
                  Nuestro comienzo
                </h3>
              </div>
            </div>

            <p className="text-gray-800 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Somos un espacio preparado para celebrar momentos especiales:
              reuniones, cumpleaños y eventos privados. Contamos con áreas
              verdes, quincho equipado, espacios interiores y exteriores, y un
              entorno natural que invita a disfrutar.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
