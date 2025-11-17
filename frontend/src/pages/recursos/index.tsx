// src/pages/recursos/detail/index.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { listRecursos, type RecursoListItem } from "@/services/recursos.service";
import { motion } from "framer-motion";
import { useReservaCart } from "@/context/reserva-cart";
import { useAuth } from "@/context/AuthContext";
import QuickReserveModal from "@/components/reserva/quickreservemodal";
import SlotPicker, { type SlotPickerValue } from "@/components/reserva/slotpicker";
import { FaCheckCircle } from "react-icons/fa"; // react-icons para equipamiento

type Modalidad = "POR_HORA" | "DIA_COMPLETO" | "BLOQUE";

export default function RecursoDetailPage() {
  const [searchParams] = useSearchParams();
  const { tipo: tipoParam } = useParams();

  // ---- state base
  const [recurso, setRecurso] = useState<RecursoListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const tipo = (tipoParam || searchParams.get("tipo") || "").toUpperCase();

  // carrito / auth
  const { addToCart, clearCart } = useReservaCart();
  const { user } = useAuth();
  const usuarioId = user?.id ?? null;

  // selector de modalidad
  const [mode, setMode] = useState<Modalidad>("POR_HORA");
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [pickerValue, setPickerValue] = useState<SlotPickerValue>({ fecha: today });

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ---- effects
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFetchError(null);
    (async () => {
      try {
        if (!tipo) {
          if (alive) setRecurso(null);
          return;
        }
        const res = await listRecursos({ tipo: tipo as any });
        if (!alive) return;
        setRecurso(res.items?.[0] ?? null);
      } catch (_e) {
        if (alive) setFetchError("No pudimos cargar este servicio.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tipo]);

  // si cambia la modalidad, resetea selección
  useEffect(() => {
    setPickerValue({ fecha: today });
  }, [mode, today]);

  // ⚠️ Hooks SIEMPRE antes de cualquier return condicional:
  const computedPrice = useMemo(() => {
    if (!recurso) return 0;

    if (mode === "DIA_COMPLETO") {
      return recurso.precioDiaCLP ?? recurso.precioBaseCLP ?? 0;
    }

    if (mode === "POR_HORA" || mode === "BLOQUE") {
      const p = recurso.precioHoraCLP ?? recurso.precioBaseCLP ?? 0;
      if (pickerValue.desde && pickerValue.hasta) {
        const diff =
          new Date(pickerValue.hasta).getTime() -
          new Date(pickerValue.desde).getTime();
        const hours = Math.max(1, Math.ceil(diff / 3600000));
        return p * hours;
      }
      return p; // placeholder 1h
    }

    return 0;
  }, [recurso, mode, pickerValue.desde, pickerValue.hasta]);

  // ---- render guards
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#fff6ec] via-white to-[#ffe9d3] text-[#c14421]">
        <div className="animate-pulse text-lg">Cargando recurso...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-gradient-to-br from-[#fff6ec] via-white to-[#ffe9d3] text-gray-700">
        <p>{fetchError}</p>
        <small className="text-gray-500">
          Revisa ?tipo=QUINCHO|PISCINA|CANCHA
        </small>
      </div>
    );
  }

  if (!recurso) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#fff6ec] via-white to-[#ffe9d3] text-gray-600">
        No se encontró información del recurso.
      </div>
    );
  }

  // ✅ En este punto recurso NO es null
  const r = recurso as RecursoListItem;

  // imagen por tipo
  const imageSrc =
    r.tipo === "QUINCHO"
      ? "/img/quincho.webp"
      : r.tipo === "PISCINA"
      ? "/img/foto19.webp"
      : "/img/cancha.webp";

  // Equipamiento según tipo, en varias líneas
  const equipamientoItems: string[] =
    r.tipo === "QUINCHO"
      ? [
          "Parrilla habilitada para asados.",
          "Sector techado para resguardarse del clima.",
          "Mesón de apoyo para preparación y servicio.",
          "Mesas y sillas según disponibilidad.",
        ]
      : r.tipo === "PISCINA"
      ? [
          "Piscina exterior para uso recreativo.",
          "Áreas de descanso alrededor de la piscina.",
          "Acceso a baños y/o camarines según disponibilidad.",
          "Entorno ideal para tardes de verano y reuniones.",
        ]
      : [
          "Cancha de pasto sintético en buen estado.",
          "Arcos y demarcación reglamentaria.",
          "Acceso a baños y/o camarines según disponibilidad.",
          "Espacio ideal para partidos amistosos o campeonatos.",
        ];

  function handleReservaClick() {
    if (!usuarioId) {
      alert("Debes iniciar sesión para reservar.");
      return;
    }

    // Validaciones simples de selección según modalidad
    if (mode === "DIA_COMPLETO") {
      if (!pickerValue.fecha) {
        alert("Selecciona una fecha.");
        return;
      }
    } else {
      if (!pickerValue.desde || !pickerValue.hasta || !pickerValue.fecha) {
        alert("Selecciona fecha y rango horario.");
        return;
      }
    }

    clearCart();
    addToCart({
      recursoId: r.id,
      nombre: r.nombre,
      modalidad: mode,
      fecha: pickerValue.fecha,
      desde: pickerValue.desde,
      hasta: pickerValue.hasta,
      precio: computedPrice,
    });
    setIsModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff6ec] via-white to-[#ffe9d3] text-gray-800">
      {/* 🧡 APARTADO SUPERIOR: SIN CAMBIOS */}
      <div className="relative w-full h-[440px] overflow-hidden rounded-b-[3rem] shadow-lg">
        <motion.img
          src={imageSrc}
          alt={r.nombre}
          className="object-cover w-full h-full brightness-90 scale-105"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          onError={(e: any) => (e.currentTarget.src = "/images/fallback.jpg")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-10 left-10">
          <motion.h1
            className="text-4xl font-extrabold text-white drop-shadow-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {r.nombre}
          </motion.h1>
          <p className="text-[#c14421] text-lg mt-1 tracking-wide uppercase font-semibold">
            {r.tipo}
          </p>
        </div>
      </div>

      {/* 👇 APARTADO INFERIOR */}
      <motion.div
        className="max-w-6xl mx-auto px-6 py-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
          {/* Columna izquierda: detalles / equipamiento */}
          <motion.section
            className="space-y-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <motion.div
              whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="rounded-2xl border border-amber-100 bg-white px-5 py-5 shadow-md"
            >
              <h2
                className="text-xl font-extrabold mb-2"
                style={{ color: "#1e1e1e" }}
              >
                Detalles del espacio
              </h2>
              <p className="text-sm leading-relaxed text-gray-700">
                {r.descripcion ??
                  "Un espacio ideal para tus celebraciones y reuniones."}
              </p>

              <div className="mt-5 grid gap-3 text-xs text-gray-700 sm:grid-cols-2">
                <div className="rounded-xl bg-[#ffb26a]/25 px-3 py-2 border border-[#c14421]/30">
                  <div
                    className="text-[11px] uppercase tracking-wide"
                    style={{ color: "#c14421" }}
                  >
                    Tipo
                  </div>
                  <div className="font-semibold text-[#1e1e1e] text-sm">{r.tipo}</div>
                </div>
                <div className="rounded-xl bg-[#ffb26a]/25 px-3 py-2 border border-[#c14421]/30">
                  <div
                    className="text-[11px] uppercase tracking-wide"
                    style={{ color: "#c14421" }}
                  >
                    Capacidad
                  </div>
                  <div className="font-semibold text-[#1e1e1e] text-sm">
                    {r.capacidad ?? "-"} personas
                  </div>
                </div>
              </div>

              {/* Equipamiento más llamativo con react-icons ✅ */}
              <div className="mt-6 rounded-2xl bg-[#ffb26a]/25 px-4 py-4 border border-[#c14421]/30">
                <div
                  className="text-[11px] uppercase tracking-wide mb-2 py-2"
                  style={{ color: "#c14421" }}
                >
                  Equipamiento
                </div>
                <ul className="space-y-1.5 text-sm text-[#1e1e1e]">
                  {equipamientoItems.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 leading-relaxed"
                    >
                      <FaCheckCircle
                        className="mt-[2px] text-[#c14421]"
                        size={14}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.section>

          {/* Columna derecha: tarjeta con SlotPicker y CTA */}
          <motion.aside
            className="space-y-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div
              whileHover={{ y: -4, boxShadow: "0 22px 45px rgba(0,0,0,0.18)" }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="rounded-2xl bg-white px-5 py-5 shadow-lg"
            >
              <div className="space-y-2 mb-4">
                <h3
                  className="text-xl text-[#1e1e1e] font-extrabold"
                >
                  ¿Cómo quieres reservar?
                </h3>
                <p className="text-sm text-gray-500">
                  Elige modalidad y revisa la disponibilidad del día.
                </p>
                <div className="inline-flex flex-wrap gap-3 pt-4">
                  {(
                    ["POR_HORA", "BLOQUE", "DIA_COMPLETO"] as Modalidad[]
                  ).map((m) => (
                    <motion.button
                      key={m}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setMode(m)}
                      className={`px-4 py-1.5 rounded-full border text-xs font-medium transition ${
                        mode === m
                          ? "text-white shadow-sm"
                          : "bg-white text-[#1e1e1e] border border-[#c14421]/30 hover:bg-[#ffb26a]/25"
                      }`}
                      style={
                        mode === m
                          ? {
                              backgroundColor: "#c14421",
                              borderColor: "#c14421",
                            }
                          : {}
                      }
                    >
                      {m === "POR_HORA" && "Por hora"}
                      {m === "BLOQUE" && "Bloque (rango)"}
                      {m === "DIA_COMPLETO" && "Día completo"}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.div
                className="rounded-2xl bg-[#ffb26a]/25 p-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                <SlotPicker
                  recursoId={r.id}
                  mode={mode}
                  step={60}
                  value={pickerValue}
                  onChange={setPickerValue}
                />
              </motion.div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#ffb26a]/25 px-4 py-3 border border-[#c14421]/30">
                <div className="text-[11px] uppercase tracking-wide font-semibold text-[#c14421]">
                  Total
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-[#1e1e1e]">
                    ${computedPrice.toLocaleString("es-CL")}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <motion.button
                  whileHover={{
                    scale: 1.02,
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleReservaClick}
                  className="w-full text-sm font-semibold px-6 py-3 rounded-full flex items-center justify-center gap-1.5 text-white"
                  style={{ background: "#c14421" }}
                >
                  Reservar
                </motion.button>
                {!usuarioId && (
                  <p className="mt-2 text-[11px] text-gray-500 text-center">
                    Debes iniciar sesión para completar la reserva.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.aside>
        </div>
      </motion.div>

      <QuickReserveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        usuarioId={usuarioId}
      />
    </div>
  );
}
