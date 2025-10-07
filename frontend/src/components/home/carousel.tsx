import React, { useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import s from "./home.module.css";

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
        relative not-prose isolate mx-auto w-full
        h-[60vh] sm:h-[70vh] md:h-[600px]
        bg-[#e5d0ac] overflow-hidden
        -mt-16 sm:-mt-16 md:-mt-16 lg:-mt-16 xl:-mt-16 2xl:-mt-16
      "
      aria-label="Image slider"

      id="inicio"
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
        <div className="absolute left-8 sm:left-10 md:left-12 top-1/2 -translate-y-1/2 z-20">
          <div className="flex items-start gap-4">
            {/* Línea vertical decorativa */}
            <span
              className="block w-[3px] sm:w-[4px] md:w-[5px]
                        h-28 sm:h-36 md:h-44
                        rounded-full
                        bg-[#c14421]"
              aria-hidden
            />
            <div className="max-w-sm text-white">
              {/* Subtítulo (antes decía “Bienvenido a”) */}
              <p className="text-[11px] sm:text-sm tracking-widest uppercase text-white/90 mb-1">
                Bienvenido a
              </p>

              {/* Título principal */}
              <h3 className="text-[28px] sm:text-[34px] md:text-[48px] font-extrabold uppercase drop-shadow">
                Quincho Alto Bonito
              </h3>
            </div>
          </div>
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

        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-20">
          <button
            onClick={prev}
            aria-label="Anterior"
            className="
              inline-flex items-center justify-center
              h-9 w-9 sm:h-10 sm:w-10 rounded-full
              bg-white/80 backdrop-blur-md
              text-[#c14421] hover:bg-[#c14421] hover:text-white
              shadow-md transition transform hover:scale-105 active:scale-95
            "
          >
            <FaChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>

          <button
            onClick={next}
            aria-label="Siguiente"
            className="
              inline-flex items-center justify-center
              h-9 w-9 sm:h-10 sm:w-10 rounded-full
              bg-white/80 backdrop-blur-md
              text-[#c14421] hover:bg-[#c14421] hover:text-white
              shadow-md transition transform hover:scale-105 active:scale-95
            "
          >
            <FaChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>

      <div
        className="pointer-events-none absolute inset-0 bg-black/15 md:bg-black/25"
        aria-hidden
      />
    </section>
  );
}
