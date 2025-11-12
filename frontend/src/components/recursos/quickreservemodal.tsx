import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";

type Modalidad = "POR_HORA" | "DIA_COMPLETO" | "BLOQUE";

interface QuickReserveModalProps {
  recurso: {
    id: string;
    nombre: string;
    descripcion?: string | null;
    tipo: "QUINCHO" | "PISCINA" | "CANCHA";
    capacidad: number;
    ubicacion?: string | null;
    precioHoraCLP?: number | null;
    precioDiaCLP?: number | null;
  } | null;
  onClose: () => void;
  defaultInicioISO?: string; // "2025-11-06T19:00"
  defaultFinISO?: string;    // "2025-11-06T22:00"
  defaultModalidad?: Modalidad;
}

const fmt = (n?: number | null) =>
  typeof n === "number"
    ? new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }).format(n)
    : "-";

/** Convierte "YYYY-MM-DDTHH:mm" (input local) a ISO UTC */
function toIsoFromLocal(value: string) {
  // value viene sin zona. Creamos fecha local y exportamos a ISO.
  const d = new Date(value.replace(" ", "T"));
  return new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      0,
      0
    )
  ).toISOString();
}

export default function QuickReserveModal({
  recurso,
  onClose,
  defaultInicioISO,
  defaultFinISO,
  defaultModalidad = "POR_HORA",
}: QuickReserveModalProps) {
  if (!recurso) return null;

  // Estados de selección
  const [modalidad, setModalidad] = useState<Modalidad>(defaultModalidad);
  const [inicio, setInicio] = useState<string>(defaultInicioISO ?? "");
  const [fin, setFin] = useState<string>(defaultFinISO ?? "");
  const [fechaDia, setFechaDia] = useState<string>(""); // para DIA_COMPLETO
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Ayuda visual para el precio de referencia
  const precioReferencia = useMemo(() => {
    if (modalidad === "DIA_COMPLETO") return fmt(recurso.precioDiaCLP ?? recurso.precioHoraCLP ?? 0);
    return fmt(recurso.precioHoraCLP ?? recurso.precioDiaCLP ?? 0);
  }, [modalidad, recurso]);

  const reservarYIrAPago = async () => {
    setErr(null);
    try {
      setLoading(true);

      // Validaciones mínimas por modalidad
      if (modalidad === "DIA_COMPLETO") {
        if (!fechaDia) {
          setErr("Selecciona la fecha (día completo).");
          setLoading(false);
          return;
        }
      } else {
        if (!inicio || !fin) {
          setErr("Selecciona inicio y fin.");
          setLoading(false);
          return;
        }
      }

      // 1) Crear reserva con el formato que espera tu backend (DTO CreateReserva)
      const items =
        modalidad === "DIA_COMPLETO"
          ? [
              {
                recursoId: recurso.id,
                modalidad,
                fecha: fechaDia, // "YYYY-MM-DD"
              },
            ]
          : [
              {
                recursoId: recurso.id,
                modalidad,
                desde: toIsoFromLocal(inicio),
                hasta: toIsoFromLocal(fin),
              },
            ];

      const reservaPayload = {
        modalidad,            // el servicio también guarda modalidad global
        addToCalendar: true,  // opcional
        items,
      };

      const r1 = await api.post("/reservas", reservaPayload);
      const reservaId: string | undefined = r1.data?.id;
      if (!reservaId) throw new Error("No se obtuvo el id de la reserva.");

      // 2) Crear preferencia en backend (usa token secreto allí)
      const r2 = await api.post("/mp/preference", { reservaId });
      const pref = r2.data;

      const payUrl =
        pref?.init_point ||
        pref?.sandbox_init_point ||
        pref?.point_of_interaction?.transaction_data?.ticket_url;

      if (!payUrl) throw new Error("No se recibió una URL de pago de Mercado Pago.");

      // 3) Redirigir
      window.location.href = payUrl;
    } catch (e: any) {
      console.error(e);
      setErr(e?.response?.data?.message || e?.message || "Error iniciando el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6 max-w-md w-full relative"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            aria-label="Cerrar"
          >
            ✕
          </button>

          <h2 className="text-xl font-semibold mb-2">{recurso.nombre}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {recurso.descripcion || "Reserva rápida del recurso seleccionado."}
          </p>

          <div className="text-sm space-y-1 mb-4">
            <div><b>Tipo:</b> {recurso.tipo}</div>
            <div><b>Capacidad:</b> {recurso.capacidad}</div>
            {recurso.ubicacion && <div><b>Ubicación:</b> {recurso.ubicacion}</div>}
            <div><b>Precio ref.:</b> {precioReferencia}</div>
          </div>

          {/* Modalidad */}
          <label className="block text-sm font-medium mb-1">Modalidad</label>
          <select
            className="w-full mb-3 rounded-lg border border-gray-300 bg-white dark:bg-neutral-800 p-2"
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value as Modalidad)}
          >
            <option value="POR_HORA">Por hora</option>
            <option value="BLOQUE">Bloque (rango)</option>
            <option value="DIA_COMPLETO">Día completo</option>
          </select>

          {/* Fechas/horas según modalidad */}
          {modalidad === "DIA_COMPLETO" ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Fecha (día completo)</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 bg-white dark:bg-neutral-800 p-2"
                value={fechaDia}
                onChange={(e) => setFechaDia(e.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Inicio</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-gray-300 bg-white dark:bg-neutral-800 p-2"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fin</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-gray-300 bg-white dark:bg-neutral-800 p-2"
                  value={fin}
                  onChange={(e) => setFin(e.target.value)}
                />
              </div>
            </div>
          )}

          {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

          <button
            disabled={loading}
            onClick={reservarYIrAPago}
            className="w-full bg-amber-600 text-white py-2 rounded-xl hover:bg-amber-700 transition disabled:opacity-60"
          >
            {loading ? "Procesando…" : "Confirmar y pagar"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
