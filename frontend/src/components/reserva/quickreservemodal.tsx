// src/components/reservas/QuickReserveModal.tsx
import { createReserva, type CreateReservaRequest } from "@/services/reservas.service";
import { createTbkTransaction } from "@/services/tbk.service";
import { redirectToWebpay } from "@/utils/redirect-to-webpay";
import { useReservaCart } from "@/context/reserva-cart";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  usuarioId: string | null;
};

export default function QuickReserveModal({ isOpen, onClose, usuarioId }: Props) {
  const { cart, total, clearCart } = useReservaCart();
  const [loading, setLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Agregar evento al Calendar (si el usuario conectó Google en otra parte)
  const [addToCalendar, setAddToCalendar] = useState<boolean>(true);

  const handleConfirm = async () => {
    setErrorMsg(null);

    if (!usuarioId) return setErrorMsg("Debes iniciar sesión.");
    if (cart.length === 0) return setErrorMsg("No hay servicios en el carrito.");

    try {
      setLoading(true);

      const payload: CreateReservaRequest = {
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

      const res = await createReserva(payload);
      console.log("✅ Reserva creada:", res);

      setSuccess(true);
      clearCart();
      // onClose?.(); // si quieres cerrar el modal luego de crear sin pagar
    } catch (err: any) {
      console.error("❌ Error al crear reserva:", err);
      setErrorMsg(err?.response?.data?.message || "No se pudo crear la reserva.");
    } finally {
      setLoading(false);
    }
  };

  // Webpay Plus (Transbank): crear reserva -> crear transacción -> POST token_ws en pestaña nueva
  const handlePayWithTBK = async () => {
    setErrorMsg(null);

    if (!usuarioId) return setErrorMsg("Debes iniciar sesión.");
    if (cart.length === 0) return setErrorMsg("No hay servicios en el carrito.");

    try {
      setPayLoading(true);

      // 1) Crear la reserva
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

      // 2) Crear transacción Webpay
      const tx = await createTbkTransaction(reservaId); // { url, token }
      if (!tx?.url || !tx?.token) throw new Error("No se recibió URL/TOKEN de Webpay.");

      // 3) Limpiar carrito y redirigir (pestaña nueva)
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
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-white rounded-3xl shadow-xl w-[520px] p-8">
            <h2 className="text-2xl font-bold mb-4 text-amber-700">Confirmar Reserva</h2>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay servicios agregados.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.recursoId} className="p-4 bg-amber-50 rounded-xl">
                    <h3 className="font-semibold text-amber-800">{item.nombre}</h3>
                    <p className="text-sm text-gray-600">
                      {item.modalidad === "DIA_COMPLETO" ? (
                        <>Día completo — {item.fecha}</>
                      ) : (
                        <>
                          {new Date(item.desde!).toLocaleString()} →{" "}
                          {new Date(item.hasta!).toLocaleString()}
                        </>
                      )}
                    </p>
                    <p className="font-medium text-amber-700 mt-1">
                      ${item.precio.toLocaleString("es-CL")}
                    </p>
                  </div>
                ))}
                <hr className="my-3" />
                <div className="text-right font-semibold text-lg text-amber-800">
                  Total: ${total.toLocaleString("es-CL")}
                </div>

                {/* Checkbox: agregar a Google Calendar */}
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={addToCalendar}
                    onChange={(e) => setAddToCalendar(e.target.checked)}
                  />
                  Agregar a mi Google Calendar
                </label>

                <p className="text-xs text-gray-500">
                  ¿Aún no conectaste Google?{" "}
                  <a href="/api/auth/google/start-calendar" className="text-amber-700 underline">
                    Conectar Calendar
                  </a>
                </p>
              </div>
            )}

            {errorMsg && <p className="text-red-600 mt-3 text-sm">{errorMsg}</p>}
            {success && <p className="text-green-600 mt-3 text-sm">✅ Reserva creada correctamente.</p>}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
                onClick={onClose}
              >
                Cancelar
              </button>

              <button
                disabled={loading || cart.length === 0}
                onClick={handleConfirm}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg shadow transition-all disabled:opacity-60"
              >
                {loading ? "Procesando..." : "Confirmar sin pagar"}
              </button>

              <button
                disabled={payLoading || cart.length === 0}
                onClick={handlePayWithTBK}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg shadow transition-all disabled:opacity-60 flex items-center gap-2"
                title="Paga ahora con Webpay Plus"
              >
                {payLoading ? "Redirigiendo..." : "Pagar con Webpay"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
