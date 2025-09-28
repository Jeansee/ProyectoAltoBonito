import type { RecursoListItem } from "@/services/recursos.service";

export default function RecursosGrid({ items, onClick }: {
  items: RecursoListItem[];
  onClick?: (id: string) => void;
}) {
  if (!items.length) {
    return <div className="text-center text-sm text-gray-500 py-10">No hay recursos que coincidan con tu búsqueda.</div>;
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(r => (
        <div key={r.id} className="rounded-2xl shadow p-4 bg-white dark:bg-neutral-900 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{r.nombre}</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-neutral-800">
              {r.tipo}
            </span>
          </div>
          {r.descripcion && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{r.descripcion}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span>Capacidad: <b>{r.capacidad}</b></span>
            {r.ubicacion && <span>• {r.ubicacion}</span>}
          </div>
          <div className="mt-3 text-sm">
            {typeof r.precioHoraCLP === 'number' && <div>Por hora: <b>${r.precioHoraCLP.toLocaleString('es-CL')}</b></div>}
            {typeof r.precioDiaCLP === 'number' && <div>Día completo: <b>${r.precioDiaCLP.toLocaleString('es-CL')}</b></div>}
          </div>
          <button
            onClick={() => onClick?.(r.id)}
            className="mt-4 w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            Ver detalle
          </button>
        </div>
      ))}
    </div>
  );
}
