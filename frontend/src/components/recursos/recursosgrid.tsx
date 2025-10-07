import { motion } from "framer-motion";
import type { RecursoListItem } from "@/services/recursos.service";

export default function RecursosGrid({
  items,
  onClick,
}: {
  items: RecursoListItem[];
  onClick?: (id: string) => void;
}) {
  if (!items.length) {
    return (
      <div className="text-center text-sm text-gray-500 py-20">
        No se encontraron recursos disponibles.
      </div>
    );
  }

  return (
    <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 py-10">
      {items.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="relative rounded-3xl overflow-hidden shadow-xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 hover:shadow-2xl transition-all duration-300 group"
        >
          {/* Imagen superior */}
          <div className="relative h-56 overflow-hidden">
            <img
              src={
                r.tipo === "QUINCHO"
                  ? "/images/quincho.jpg"
                  : r.tipo === "PISCINA"
                  ? "/images/piscina.jpg"
                  : "/images/cancha.jpg"
              }
              alt={r.nombre}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>

            <span className="absolute top-3 left-3 text-xs font-semibold bg-white/90 text-gray-700 px-3 py-1 rounded-full shadow">
              {r.tipo}
            </span>

            <div className="absolute bottom-3 left-3 text-white drop-shadow">
              <h3 className="text-lg font-semibold">{r.nombre}</h3>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-5 flex flex-col justify-between h-[230px]">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                {r.descripcion ?? "Espacio ideal para tus reuniones y eventos."}
              </p>

              <div className="mt-3 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    Capacidad:
                  </span>{" "}
                  {r.capacidad} personas
                </p>
                {r.ubicacion && (
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      Ubicación:
                    </span>{" "}
                    {r.ubicacion}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-neutral-800 pt-3 flex justify-between items-center mt-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Desde</p>
                <p className="text-lg font-semibold text-amber-600">
                  ${r.precioHoraCLP?.toLocaleString("es-CL")}{" "}
                  <span className="text-sm font-normal text-gray-400">
                    / hora
                  </span>
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => onClick?.(r.id)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Reservar
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
