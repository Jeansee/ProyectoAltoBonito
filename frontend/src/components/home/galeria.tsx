// src/components/Galeria.tsx
import React, { useEffect, useMemo, useState } from "react";

type GItem = { src: string; title: string };

const IMAGES: GItem[] = [
  { src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800", title: "Quincho" },
  { src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800", title: "Piscina" },
  { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", title: "Cancha" },
  { src: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800", title: "Eventos" },
  { src: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800", title: "Parrilla" },
  { src: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=800", title: "Naturaleza" },
  { src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800", title: "Panorámica" },
  { src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", title: "Celebraciones" },
  // ➕ Nueva imagen añadida
  { src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800", title: "Vista aérea" },
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

  // Teclado + bloqueo scroll
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
    <section id="galeria" className="bg-[#efefef] py-14 sm:py-16">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6">
        <div className="grid items-start gap-10 md:grid-cols-3">
          {/* Texto a la izquierda */}
          <div className="md:col-span-1">
            <p className="text-xs text-gray-500 mb-2">Nuestra</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Galería
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Explora nuestras instalaciones. Haz clic en cualquier imagen para
              ampliarla y navega con las flechas o el teclado.
            </p>
          </div>

          {/* Grid imágenes */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-5 md:gap-6">
            {IMAGES.map((g, i) => (
              <button
                key={g.src + i}
                onClick={() => openAt(i)}
                className="
                  group relative overflow-hidden rounded-2xl bg-white
                  ring-1 ring-black/5 shadow-sm hover:shadow-md transition
                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                "
                aria-label={`Abrir imagen ${i + 1}`}
              >
                <div className="relative w-full aspect-[4/3]">
                  <img
                    src={g.src}
                    alt={g.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          role="dialog" aria-modal="true" onClick={close}
        >
          <div className="relative max-w-[92vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={item.src}
              alt={item.title}
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            />

            {/* Flechas */}
            <button onClick={prev} aria-label="Anterior"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 hover:bg-white text-gray-900 shadow">
              ‹
            </button>
            <button onClick={next} aria-label="Siguiente"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 hover:bg-white text-gray-900 shadow">
              ›
            </button>

            {/* Cerrar */}
            <button onClick={close} aria-label="Cerrar"
              className="absolute -top-10 right-0 sm:-top-12 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 hover:bg-white text-gray-900 shadow">
              ✕
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
