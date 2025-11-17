import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

type GItem = { src: string; title: string };

const IMAGES: GItem[] = [
  { src: "/img/foto8.webp", title: "" },
  { src: "/img/foto18.webp", title: "" },
  { src: "/img/foto3.webp", title: "" },
  { src: "/img/foto15.webp", title: "" },
  { src: "/img/foto9.webp", title: "" },
  { src: "/img/foto2.webp", title: "" },
  { src: "/img/piscina.webp", title: "" },
  { src: "/img/foto1.webp", title: "" },
  { src: "/img/foto14.webp", title: "" },
  { src: "/img/foto6.webp", title: "" },
];

export default function Galeria() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<number>(0);

  const total = IMAGES.length;
  const item = useMemo(() => IMAGES[index] ?? IMAGES[0], [index]);

  const openAt = (i: number) => { setIndex(i); setOpen(true); };
  const close = () => setOpen(false);
  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section id="galeria" className="py-14 bg-[#e5d0ac]">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Título con línea vertical (con efecto on-scroll) */}
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.25 }}
        >
          <span className="block w-[3px] sm:w-[4px] md:w-[5px] h-16 sm:h-16 md:h-20 bg-[#c14421] rounded-full" />
          <div>
            <p className="text-[11px] tracking-widest sm:text-sm text-[#c14421] uppercase mb-1">
              Nuestra
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase text-[#1e1e1e]">
              Galería
            </h2>
          </div>
        </motion.div>

        {/* Mosaico: diseño intacto, solo cambio a whileInView */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {IMAGES.map((g, i) => (
            <motion.button
              key={i}
              onClick={() => openAt(i)}
              className={`relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition group
                ${i % 7 === 0 ? "col-span-2 row-span-2" : ""}
              `}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
              aria-label={`Abrir imagen: ${g.title}`}
            >
              <img
                src={g.src}
                alt={g.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition" />
              <span className="absolute bottom-3 left-3 text-white font-medium drop-shadow">
                {g.title}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div
            className="relative max-w-[92vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              key={item.src}
              src={item.src}
              alt={item.title}
              className="max-h-[90vh] rounded-xl shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />

            {/* Botones con tu diseño actual */}
            <button
              onClick={prev}
              aria-label="Anterior"
              className="
                inline-flex items-center justify-center
                absolute left-2 sm:left-4 top-1/2 -translate-y-1/2
                h-9 w-9 sm:h-10 sm:w-10 rounded-full
                bg-white/80 backdrop-blur-md
                text-[#c14421] hover:bg-[#c14421] hover:text-white
                shadow-md transition transform hover:scale-105 active:scale-95
              "
            >
              <FaChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <button
              onClick={next}
              aria-label="Siguiente"
              className="
                inline-flex items-center justify-center
                absolute right-2 sm:right-4 top-1/2 -translate-y-1/2
                h-9 w-9 sm:h-10 sm:w-10 rounded-full
                bg-white/80 backdrop-blur-md
                text-[#c14421] hover:bg-[#c14421] hover:text-white
                shadow-md transition transform hover:scale-105 active:scale-95
              "
            >
              <FaChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <button
              onClick={close}
              aria-label="Cerrar"
              className="
                inline-flex items-center justify-center
                absolute -top-10 right-0 sm:-top-12
                h-9 w-9 sm:h-10 sm:w-10 rounded-full
                bg-white/80 backdrop-blur-md
                text-[#c14421] hover:bg-[#c14421] hover:text-white
                shadow-md transition transform hover:scale-105 active:scale-95
              "
            >
              <FaTimes className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {index + 1} / {total}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
