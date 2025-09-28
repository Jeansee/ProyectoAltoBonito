import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Tipo = "QUINCHO" | "PISCINA" | "CANCHA";
type Modalidad = "POR_HORA" | "DIA_COMPLETO" | "BLOQUE";

export default function QuickReserveModal({
  open, onClose, defaultTipo
}: { open: boolean; onClose: ()=>void; defaultTipo: Tipo; }) {
  const navigate = useNavigate();
  const [modalidad, setModalidad] = useState<Modalidad>("POR_HORA");
  const [fecha, setFecha] = useState<string>("");
  const [hora, setHora] = useState<string>("19:00");

  if (!open) return null;

  const go = () => {
    const params = new URLSearchParams({
      tipo: defaultTipo,
      modalidad,
      fecha,
      activo: "true",
    });
    if (modalidad === "POR_HORA" && hora) params.set("hora", hora);
    onClose();
    navigate(`/recursos?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold">Reservar {defaultTipo.toLowerCase()}</h3>

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-300">Modalidad</span>
            <select value={modalidad} onChange={e=>setModalidad(e.target.value as Modalidad)}
                    className="mt-1 w-full border rounded-xl px-3 py-2 bg-transparent">
              <option value="POR_HORA">Por hora</option>
              <option value="DIA_COMPLETO">Día completo</option>
              <option value="BLOQUE">Turno</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-300">Fecha</span>
            <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
                   className="mt-1 w-full border rounded-xl px-3 py-2 bg-transparent"/>
          </label>

          {modalidad === "POR_HORA" && (
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-300">Hora</span>
              <input type="time" value={hora} onChange={e=>setHora(e.target.value)}
                     className="mt-1 w-full border rounded-xl px-3 py-2 bg-transparent"/>
            </label>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="px-3 py-2 rounded-xl border" onClick={onClose}>Cancelar</button>
          <button
            disabled={!fecha}
            className="px-3 py-2 rounded-xl border bg-gray-900 text-white dark:bg-white dark:text-black disabled:opacity-50"
            onClick={go}
          >
            Buscar disponibilidad
          </button>
        </div>
      </div>
    </div>
  );
}
