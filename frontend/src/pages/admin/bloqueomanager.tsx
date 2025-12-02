import { useEffect, useState } from "react";
import {
  fetchBloqueos,
  createBloqueo,
  deleteBloqueo,
} from "@/services/admin.api";

type Bloqueo = {
  id: string;
  inicio: string;
  fin: string;
  motivo: string;
  recurso: {
    nombre: string;
    tipo: string;
  };
};

export default function BloqueoManager() {
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [recursoId, setRecursoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = await fetchBloqueos();
    setBloqueos(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!recursoId || !motivo || !inicio || !fin) {
      alert("Completa todos los campos.");
      return;
    }

    setLoading(true);
    try {
      await createBloqueo({ recursoId, motivo, inicio, fin });
      alert("✅ Bloqueo creado exitosamente");
      setMotivo("");
      setInicio("");
      setFin("");
      setRecursoId("");
      await load();
    } catch (error: any) {
      // Extraer mensaje de error del backend
      const errorMessage = error?.response?.data?.message || error?.message || "Error desconocido";
      
      // Si el error menciona reservas solapadas, mostrar alerta específica y detallada
      if (errorMessage.includes("reserva(s) activa(s)") || errorMessage.includes("reserva(s) CONFIRMADA/PAGADA")) {
        // Intentar extraer el número de reservas del mensaje
        const match = errorMessage.match(/existen (\d+) reserva\(s\)/);
        const numReservas = match ? match[1] : "algunas";
        
        alert(
          `❌ NO SE PUEDE BLOQUEAR ESTAS FECHAS\n\n` +
          `El recurso seleccionado tiene ${numReservas} reserva(s) activa(s) en el período especificado.\n\n` +
          `📅 Rango solicitado: ${inicio} hasta ${fin}\n\n` +
          `⚠️ Debes cancelar las reservas existentes (confirmadas, pagadas o pendientes) antes de crear este bloqueo.\n\n` +
          `Consulta la sección "Gestión de Reservas" para ver los detalles.`
        );
      } else {
        // Mostrar error genérico
        alert(`❌ Error al crear bloqueo:\n\n${errorMessage}`);
      }
      console.error("Error creando bloqueo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar bloqueo?")) return;
    await deleteBloqueo(id);
    await load();
  };

  return (
    <div className="space-y-4">
      {/* NOTA INFORMATIVA */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-semibold mb-1">ℹ️ Información sobre bloqueos</p>
        <p>
          No se pueden bloquear fechas que tengan reservas activas (confirmadas, pagadas o pendientes). 
          Si necesitas bloquear un período con reservas existentes, primero debes cancelarlas desde la sección "Gestión de Reservas".
        </p>
      </div>

      {/* FORMULARIO */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <select
          className="border rounded px-2 py-1"
          value={recursoId}
          onChange={(e) => setRecursoId(e.target.value)}
        >
          <option value="">Recurso...</option>
          <option value="QUINCHO">Quincho</option>
          <option value="PISCINA">Piscina</option>
          <option value="CANCHA">Cancha</option>
        </select>

        <input
          type="date"
          className="border rounded px-2 py-1"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
        />

        <input
          type="date"
          className="border rounded px-2 py-1"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
        />

        <input
          className="border rounded px-2 py-1"
          placeholder="Motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </div>

      <button
        onClick={handleCreate}
        disabled={loading}
        className="rounded-full bg-[#c14421] text-white px-4 py-2"
      >
        {loading ? "Guardando..." : "Crear bloqueo"}
      </button>

      {/* LISTADO */}
      <div className="mt-4">
        {bloqueos.length === 0 ? (
          <div className="text-sm text-gray-500">No hay bloqueos</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Recurso</th>
                <th className="py-2">Inicio</th>
                <th className="py-2">Fin</th>
                <th className="py-2">Motivo</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bloqueos.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="py-2">{b.recurso.nombre}</td>
                  <td className="py-2">
                    {new Date(b.inicio).toLocaleDateString("es-CL")}
                  </td>
                  <td className="py-2">
                    {new Date(b.fin).toLocaleDateString("es-CL")}
                  </td>
                  <td className="py-2">{b.motivo}</td>
                  <td className="py-2">
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="text-red-600 text-xs underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
