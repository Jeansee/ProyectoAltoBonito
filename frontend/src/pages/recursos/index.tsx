// src/pages/recursos/detail/index.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { listRecursos, type RecursoListItem } from "@/services/recursos.service";
import { motion } from "framer-motion";
import { useReservaCart } from "@/context/reserva-cart";
import { useAuth } from "@/context/AuthContext";
import QuickReserveModal from "@/components/reserva/quickreservemodal";
import SlotPicker, { type SlotPickerValue } from "@/components/reserva/slotpicker";

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
  const usuarioId = user?.id;

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
        const diff = new Date(pickerValue.hasta).getTime() - new Date(pickerValue.desde).getTime();
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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 text-amber-900">
        <div className="animate-pulse text-lg">Cargando recurso...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-amber-50 text-gray-700">
        <p>{fetchError}</p>
        <small className="text-gray-500">Revisa ?tipo=QUINCHO|PISCINA|CANCHA</small>
      </div>
    );
  }

  if (!recurso) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-amber-50 text-gray-600">
        No se encontró información del recurso.
      </div>
    );
  }

  // ✅ En este punto recurso NO es null
  const r = recurso as RecursoListItem;

  // imagen por tipo
  const imageSrc =
    r.tipo === "QUINCHO" ? "/images/quincho.jpg" :
    r.tipo === "PISCINA" ? "/images/piscina.jpg" :
    "/images/cancha.jpg";

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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-100/60 to-amber-50 text-gray-800">
      {/* Imagen */}
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
          <p className="text-amber-200 text-lg mt-1 tracking-wide uppercase font-semibold">
            {r.tipo}
          </p>
        </div>
      </div>

      {/* Detalles + selector */}
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-amber-800 mb-3">Detalles del espacio</h2>
          <p className="max-w-2xl mx-auto text-gray-600 text-lg leading-relaxed">
            {r.descripcion ?? "Un espacio ideal para tus celebraciones y reuniones."}
          </p>
        </div>

        {/* Chips de modalidad */}
        <div className="flex items-center justify-center gap-2">
          {(["POR_HORA", "BLOQUE", "DIA_COMPLETO"] as Modalidad[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-full border transition ${
                mode === m
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white text-amber-800 border-amber-300 hover:bg-amber-100"
              }`}
            >
              {m === "POR_HORA" && "Por hora"}
              {m === "BLOQUE" && "Bloque (rango)"}
              {m === "DIA_COMPLETO" && "Día completo"}
            </button>
          ))}
        </div>

        {/* Picker de fecha/horas (usa slots de la BD) */}
        <SlotPicker
          recursoId={r.id}
          mode={mode}
          step={60}
          value={pickerValue}
          onChange={setPickerValue}
        />

        {/* Resumen mini precio */}
        <div className="text-center text-amber-800 font-semibold">
          Estimado: ${computedPrice.toLocaleString("es-CL")}
        </div>

        {/* CTA */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleReservaClick}
            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-lg font-semibold px-10 py-4 rounded-full shadow-lg hover:shadow-amber-400/40 transition-all transform hover:-translate-y-0.5"
          >
            Reservar ahora ✨
          </button>
        </div>
      </div>

      <QuickReserveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        usuarioId={usuarioId}
      />
    </div>
  );
}
