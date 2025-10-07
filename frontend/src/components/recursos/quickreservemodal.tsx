import { motion, AnimatePresence } from "framer-motion";

interface QuickReserveModalProps {
  recurso: any;
  onClose: () => void;
}

export default function QuickReserveModal({ recurso, onClose }: QuickReserveModalProps) {
  if (!recurso) return null;

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
          >
            ✕
          </button>

          <h2 className="text-xl font-semibold mb-2">{recurso.nombre}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {recurso.descripcion}
          </p>

          <div className="text-sm space-y-1 mb-4">
            <div><b>Tipo:</b> {recurso.tipo}</div>
            <div><b>Capacidad:</b> {recurso.capacidad}</div>
            {recurso.ubicacion && <div><b>Ubicación:</b> {recurso.ubicacion}</div>}
            {recurso.precioHoraCLP && (
              <div>Por hora: <b>${recurso.precioHoraCLP.toLocaleString("es-CL")}</b></div>
            )}
            {recurso.precioDiaCLP && (
              <div>Día completo: <b>${recurso.precioDiaCLP.toLocaleString("es-CL")}</b></div>
            )}
          </div>

          <button
            onClick={() => alert(`Reserva iniciada para ${recurso.nombre}`)}
            className="w-full bg-amber-600 text-white py-2 rounded-xl hover:bg-amber-700 transition"
          >
            Reservar ahora
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
