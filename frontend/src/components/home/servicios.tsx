import React from "react";

type Service = {
  title: string;
  desc: string;
  icon: React.ReactNode;
};

const services: Service[] = [
  {
    title: "Quincho",
    desc:
      "Espacio techado y equipado para asados y reuniones. Incluye parrilla, mesones y área de descanso.",
    icon: (
      // Icono Quincho (garage/house style)
      <svg viewBox="0 0 24 24" className="w-9 h-9" aria-hidden>
        <path
          fill="currentColor"
          d="M3 10.5 12 4l9 6.5v8a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 18.5v-8Z"
          className="opacity-20"
        />
        <path
          fill="currentColor"
          d="M12 3 2.25 9.75l.9 1.2L12 5.1l8.85 5.85.9-1.2L12 3Zm-6 16h12v-6H6v6Zm2-4h8v2H8v-2Z"
        />
      </svg>
    ),
  },
  {
    title: "Piscina",
    desc:
      "Piscina al aire libre con áreas de descanso. Ideal para días de sol y actividades familiares.",
    icon: (
      // Icono Piscina (olas + persona)
      <svg viewBox="0 0 24 24" className="w-9 h-9" aria-hidden>
        <path
          fill="currentColor"
          d="M7 4a2 2 0 1 1 4 0v1H7V4Zm2 3c-1.66 0-3 1.34-3 3h2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h2c0-1.66-1.34-3-3-3H9Z"
        />
        <path
          fill="currentColor"
          d="M3 15c1.2 0 1.8-.6 2.4-.9c.6-.3 1.2-.3 1.8 0c.6.3 1.2.9 2.4.9s1.8-.6 2.4-.9c.6-.3 1.2-.3 1.8 0c.6.3 1.2.9 2.4.9s1.8-.6 2.4-.9c.6-.3 1.2-.3 1.8 0V17c-.6-.3-1.2-.3-1.8 0c-.6.3-1.2.9-2.4.9s-1.8-.6-2.4-.9c-.6-.3-1.2-.3-1.8 0c-.6.3-1.2.9-2.4.9s-1.8-.6-2.4-.9c-.6-.3-1.2-.3-1.8 0C4.8 17.3 4.2 17.9 3 17.9V15Z"
          className="opacity-80"
        />
      </svg>
    ),
  },
  {
    title: "Cancha",
    desc:
      "Cancha multiuso para fútbol y actividades recreativas. Espacio ideal para grupos y eventos.",
    icon: (
      // Icono balón
      <svg viewBox="0 0 24 24" className="w-9 h-9" aria-hidden>
        <path
          fill="currentColor"
          d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-2.6 3.2L12 4.1l2.6 1.1l.9 2.7l-1.9 1.9H9.6L7.7 8l.9-2.8ZM6 12l1.2-2.4l2.2 2.2v3.1L7.4 16L6 12Zm6 6.9l-2.6-1.1l-.9-2.7l1.9-1.9h4l1.9 1.9l-.9 2.7L12 18.9Zm6-6.9l-1.4 4l-2.9.9v-3.1l2.2-2.2L18 12Zm-6-2.9"
        />
      </svg>
    ),
  },
];

export default function ServicesSection() {
  return (
    <section id="servicios" className="bg-[#efefef] pt-8 sm:pt-3 pb-14 sm:pb-16">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-800">
          A Big Title
        </h2>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((s, i) => (
            <article
              key={i}
              className="
                group relative rounded-xl bg-white shadow-sm ring-1 ring-black/5
                hover:shadow-md transition
                p-6 flex flex-col items-center text-center
              "
            >
              <div className="mb-4 text-gray-700 group-hover:text-indigo-600 transition">
                {s.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{s.title}</h3>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-[28ch]">
                {s.desc}
              </p>

              <button
                className="
                  mt-5 inline-flex items-center rounded-full border border-gray-300
                  px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-50
                  hover:bg-gray-100 hover:border-gray-400 transition
                "
                onClick={() => console.log(`Ver más: ${s.title}`)}
                aria-label={`Ver más sobre ${s.title}`}
              >
                Button
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
