// src/components/reservas/QuickReserveModal.tsx
import { createReserva, type CreateReservaRequest } from "@/services/reservas.service";
import { createTbkTransaction } from "@/services/tbk.service";
import { redirectToWebpay } from "@/utils/redirect-to-webpay";
import { useReservaCart } from "@/context/reserva-cart";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FaTimes, FaRegCalendarCheck, FaCreditCard } from "react-icons/fa";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  usuarioId: string | null;
};

export default function QuickReserveModal({ isOpen, onClose, usuarioId }: Props) {
  const { cart, clearCart } = useReservaCart();
  const [payLoading, setPayLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addToCalendar, setAddToCalendar] = useState<boolean>(true);

  const handlePayWithTBK = async () => {
    setErrorMsg(null);

    if (!usuarioId) return setErrorMsg("Debes iniciar sesión.");
    if (cart.length === 0) return setErrorMsg("No hay servicios en el carrito.");

    try {
      setPayLoading(true);

      const reservaReq: CreateReservaRequest = {
        usuarioId,
        items: cart.map((c) => ({
          recursoId: c.recursoId,
          modalidad: c.modalidad,
          desde: c.desde,
          hasta: c.hasta,
          fecha: c.fecha,
        })),
        addToCalendar,
      };

      const reserva = await createReserva(reservaReq);
      const reservaId: string = (reserva as any)?.id || (reserva as any)?.data?.id;
      if (!reservaId) throw new Error("No se recibió el ID de la reserva desde el backend.");

      const tx = await createTbkTransaction(reservaId); // { url, token }
      if (!tx?.url || !tx?.token) throw new Error("No se recibió URL/TOKEN de Webpay.");

      clearCart();
      redirectToWebpay(tx.url, tx.token);
    } catch (err: any) {
      console.error("❌ Error al pagar con Webpay:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "No se pudo iniciar el pago.");
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#e5d0ac] px-6 py-5"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[#1e1e1e]">
                  Confirmar reserva
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Revisa el detalle de tu reserva antes de continuar con el pago.
                </p>
              </div>
              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-[#1e1e1e] hover:bg-gray-50 transition"
                aria-label="Cerrar"
              >
                <FaTimes size={12} />
              </button>
            </div>

            {/* Contenido */}
            {cart.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                No hay servicios agregados al carrito.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.recursoId}
                      className="rounded-2xl border border-[#c14421]/30 bg-[#ffb26a]/25 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-sm text-[#1e1e1e]">
                          {item.nombre}
                        </h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/80 border border-[#c14421]/30 text-[#c14421] font-medium">
                          {item.modalidad === "DIA_COMPLETO" ? "Día completo" : "Por horario"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {item.modalidad === "DIA_COMPLETO" ? (
                          <>Fecha: {item.fecha}</>
                        ) : (
                          <>
                            {new Date(item.desde!).toLocaleString()}
                            {" → "}
                            {new Date(item.hasta!).toLocaleString()}
                          </>
                        )}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#c14421]">
                        <span className="text-[11px] uppercase tracking-wide text-[#1e1e1e] mr-1">
                          Total:
                        </span>
                        ${item.precio.toLocaleString("es-CL")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Checkbox: agregar a Google Calendar */}
                <div className="mt-2 rounded-2xl border border-[#c14421]/30 bg-[#ffb26a]/25 px-3 py-3">
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <span
                      className={`relative inline-flex h-4 w-8 items-center rounded-full border transition ${
                        addToCalendar
                          ? "bg-[#c14421] border-[#c14421]"
                          : "bg-gray-200 border-gray-300"
                      }`}
                    >
                      <span
                        className={`h-3 w-3 rounded-full bg-white shadow transform transition ${
                          addToCalendar ? "translate-x-4" : "translate-x-1"
                        }`}
                      />
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={addToCalendar}
                        onChange={(e) => setAddToCalendar(e.target.checked)}
                      />
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#1e1e1e]">
                      <FaRegCalendarCheck className="text-[#c14421]" size={12} />
                      Agregar a mi Google Calendar
                    </span>
                  </label>

                  <p className="mt-2 text-[11px] text-gray-500">
                    ¿Aún no conectaste Google?{" "}
                    <a
                      href="/api/auth/google/start-calendar"
                      className="font-medium text-[#c14421] underline underline-offset-2"
                    >
                      Conectar Calendar
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Mensajes de estado */}
            {errorMsg && (
              <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMsg}
              </p>
            )}

            {success && (
              <p className="mt-3 rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-xs text-green-700">
                ✅ Reserva creada correctamente.
              </p>
            )}

            {/* Footer / Acciones */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                className="px-4 py-2 text-sm font-medium rounded-full border border-gray-200 text-gray-600 hover:text-[#1e1e1e] hover:bg-gray-50 transition"
                onClick={onClose}
              >
                Cancelar
              </button>

              <button
                disabled={payLoading || cart.length === 0}
                onClick={handlePayWithTBK}
                className="inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold text-white shadow-md transition disabled:opacity-60"
                style={{ backgroundColor: "#c14421" }}
                title="Paga ahora con Webpay Plus"
              >
                <FaCreditCard size={14} />
                {payLoading ? "Redirigiendo..." : "Pagar con Webpay"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
