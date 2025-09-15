import React, { useRef, useState } from "react";
import s from "../pages/home.module.css";

type Slide = { image: string; title: string; description: string };

const INITIAL: Slide[] = [
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    title: "Switzerland",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ab, eum!",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    title: "Finland",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ab, eum!",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    title: "Iceland",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ab, eum!",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    title: "Australia",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ab, eum!",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    title: "Netherland",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ab, eum!",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    title: "Ireland",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ab, eum!",
  },
];

export default function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>(INITIAL);
  const [animating, setAnimating] = useState(false);
  const [prevMain, setPrevMain] = useState<Slide | null>(null);
  const tRef = useRef<number | null>(null);

  const MAIN_INDEX = 1;
  const main = slides[MAIN_INDEX];

  const endAnim = () => {
    if (tRef.current) {
      window.clearTimeout(tRef.current);
      tRef.current = null;
    }
    setAnimating(false);
    setPrevMain(null);
  };

  const startAnim = (newSlides: Slide[]) => {
    setPrevMain(main);
    setAnimating(true);
    setSlides(newSlides);
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(endAnim, 520);
  };

  const next = () => startAnim([...slides.slice(1), slides[0]]);
  const prev = () =>
    startAnim([slides[slides.length - 1], ...slides.slice(0, slides.length - 1)]);

  // ===== Posiciones usando variables CSS responsivas =====
  const styleForIndex = (i: number): React.CSSProperties => {
    if (i === 0 || i === 1) {
      return {
        left: 0,
        top: 0,
        transform: "translate(0, 0)",
        width: "100%",
        height: "100%",
        borderRadius: "0",
      };
    }
    if (i === 2) return { left: "var(--stack-left)" };
    if (i === 3) return { left: "calc(var(--stack-left) + var(--gap))" };
    if (i === 4) return { left: "calc(var(--stack-left) + calc(var(--gap) * 2))" };
    return { left: "calc(var(--stack-left) + calc(var(--gap) * 3))", opacity: 0 };
  };

  return (
    <section
      className="
        relative mx-auto w-full max-w-[1200px]
        h-[60vh] sm:h-[70vh] md:h-[600px]
        bg-[#f5f5f5] shadow-[0_30px_50px_#dbdbdb]
        overflow-hidden rounded-none md:rounded-xl
      "
      aria-label="Image slider"
    >
      {/* Fondos animados */}
      {animating && prevMain && (
        <div
          className={`absolute inset-0 ${s.bgExit}`}
          style={{
            backgroundImage: `url(${prevMain.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 0,
          }}
          aria-hidden
        />
      )}
      <div
        key={main.image}
        className={`absolute inset-0 ${animating ? s.bgEnter : ""}`}
        style={{
          backgroundImage: `url(${main.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
        aria-hidden
      />

      {/* Texto fijo a la izquierda */}
      <div className="absolute left-8 sm:left-10 md:left-12 top-1/2 -translate-y-1/2 max-w-sm text-white z-20">
        <p className="text-[11px] sm:text-xs mb-2">Bienvenido a</p>
        <h3 className="text-[28px] sm:text-[34px] md:text-[48px] font-extrabold uppercase drop-shadow">
          Quincho Alto Bonito
        </h3>
        <button className="mt-6 rounded-full bg-white px-5 py-2 font-semibold text-blue-600 shadow hover:shadow-lg transition">
          Button
        </button>
      </div>

      {/* Tarjetas a la derecha */}
      <div className="absolute inset-0">
        {slides.map((sl, idx) => {
          const isFull = idx === 0 || idx === 1;
          return (
            <div
              key={`${sl.image}-${idx}`}
              className="
                absolute top-1/2 inline-block -translate-y-1/2
                rounded-[20px] shadow-[0_30px_50px_#505050]
                transition-all duration-500 ease-in-out
                overflow-hidden
              "
              style={{ width: 200, height: 300, ...styleForIndex(idx) }}
            >
              {!isFull && (
                <div
                  className="absolute inset-0 bg-center bg-cover"
                  style={{ backgroundImage: `url(${sl.image})` }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Controles */}
      <div className="absolute bottom-5 left-0 right-0 text-center z-20">
        <button
          onClick={prev}
          className="mx-1 h-9 w-10 rounded-md border border-black hover:bg-gray-400 hover:text-white transition"
          aria-label="Anterior"
        >
          ‹
        </button>
        <button
          onClick={next}
          className="mx-1 h-9 w-10 rounded-md border border-black hover:bg-gray-400 hover:text-white transition"
          aria-label="Siguiente"
        >
          ›
        </button>
      </div>

      {/* Overlay oscuro */}
      <div
        className="pointer-events-none absolute inset-0 bg-black/15 md:bg-black/25"
        aria-hidden
      />
    </section>
  );
}
