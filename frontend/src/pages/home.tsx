// src/pages/Landing.tsx
export default function home() {
  return (
    <>
      {/* INICIO */}
      <section id="inicio" className="pt-24 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold">
              Reserva tu <span className="text-indigo-600">quincho, cancha</span> o{" "}
              <span className="text-indigo-600">piscina</span> en segundos
            </h1>
            <p className="mt-4 text-gray-600">
              Horarios claros y confirmación rápida. Todo desde tu teléfono.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#servicios" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Ver servicios
              </a>
              <a href="#contacto" className="border px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
                Contáctanos
              </a>
            </div>
            <p className="mt-3 text-xs text-gray-500">* Proyecto académico. No emite boletas.</p>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm p-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-indigo-50 border text-indigo-700 font-semibold grid place-items-center h-24">Quincho</div>
              <div className="rounded-xl bg-emerald-50 border text-emerald-700 font-semibold grid place-items-center h-24">Cancha</div>
              <div className="rounded-xl bg-sky-50 border text-sky-700 font-semibold grid place-items-center h-24">Piscina</div>
              <div className="col-span-3 rounded-xl bg-gray-50 border grid place-items-center h-24 text-gray-600">Calendario & reservas</div>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE NOSOTROS */}
      <section id="sobre" className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold">Sobre nosotros</h2>
            <p className="mt-4 text-gray-600">
              Centro de eventos local con espacios para familias y amigos. Este sitio
              mejora la coordinación y la experiencia de reserva sin llamadas ni esperas.
            </p>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="py-20 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center">Servicios</h2>
          <p className="mt-3 text-gray-600 text-center">Elige el espacio ideal para tu evento.</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Quincho", desc: "Parrilla, mesas y área techada.", price: "$25.000 / hora" },
              { title: "Cancha sintética", desc: "Fútbol 5, iluminación nocturna.", price: "$15.000 / hora" },
              { title: "Piscina interior", desc: "Climatizada, con camarines.", price: "$20.000 / hora" },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <span className="text-xs rounded-full bg-indigo-50 text-indigo-700 px-2 py-1">Disponible</span>
                </div>
                <p className="mt-2 text-gray-600">{s.desc}</p>
                <p className="mt-4 font-medium">{s.price}</p>
                <a href="#contacto" className="mt-5 inline-flex rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">
                  Consultar / Reservar
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h2 className="text-3xl font-bold">Contacto</h2>
              <p className="mt-4 text-gray-600">Escríbenos para cotizar o resolver dudas.</p>
              <ul className="mt-6 space-y-2 text-gray-700">
                <li><b>WhatsApp:</b> +56 9 1234 5678</li>
                <li><b>Email:</b> reservas@altobonito.cl</li>
                <li><b>Ubicación:</b> Puerto Montt, Región de Los Lagos</li>
              </ul>
            </div>
            <form onSubmit={(e)=>{e.preventDefault(); alert("Mensaje enviado (demo)");}} className="rounded-2xl border p-6 shadow-sm bg-slate-50">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-sm">Nombre</label><input className="mt-1 w-full rounded-lg border px-3 py-2" required/></div>
                <div><label className="text-sm">Email</label><input type="email" className="mt-1 w-full rounded-lg border px-3 py-2" required/></div>
              </div>
              <div className="mt-4"><label className="text-sm">Mensaje</label><textarea className="mt-1 w-full rounded-lg border px-3 py-2 h-28" required/></div>
              <button className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Enviar</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
