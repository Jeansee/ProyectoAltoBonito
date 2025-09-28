import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RecursosGrid from "@/components/recursos/recursosgrid";
import { listRecursos } from "@/services/recursos.service";
import type { ListResponse, TipoRecurso } from "@/services/recursos.service";

export default function RecursosPage() {
  const navigate = useNavigate();
  const { search: qs } = useLocation();
  const query = useMemo(() => new URLSearchParams(qs), [qs]);

  const tipoFromUrl = (query.get("tipo") as TipoRecurso | null) ?? undefined;
  const [tipo, setTipo] = useState<TipoRecurso | undefined>(tipoFromUrl);
  const [text, setText] = useState(query.get("q") ?? "");
  const [sort, setSort] = useState<'nombre_asc'|'nombre_desc'|'precioHora_asc'|'precioHora_desc'|'precioDia_asc'|'precioDia_desc'>(query.get("sort") as any || 'nombre_asc');
  const [page, setPage] = useState(Number(query.get("page") || 1));
  const [resp, setResp] = useState<ListResponse | null>(null);
  const limit = 12;

  // Sincroniza URL con filtros
  useEffect(() => {
    const params = new URLSearchParams();
    if (tipo) params.set("tipo", tipo);
    if (text.trim()) params.set("q", text.trim());
    if (sort !== "nombre_asc") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    params.set("activo", "true");
    navigate({ pathname: "/recursos", search: params.toString() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, text, sort, page]);

  const fetchData = async () => {
    const data = await listRecursos({
      tipo, search: text.trim() || undefined, page, limit, sort, activo: true
    });
    setResp(data);
    window.scrollTo({ top: 0 });
  };
  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [tipo, sort, page]);

  const onSearch = () => { setPage(1); fetchData(); };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Catálogo de recursos</h1>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["QUINCHO","PISCINA","CANCHA"] as TipoRecurso[]).map(t => (
          <button key={t}
            onClick={() => { setPage(1); setTipo(tipo === t ? undefined : t); }}
            className={`px-3 py-1.5 rounded-xl border text-sm ${tipo===t ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : ''}`}
            aria-pressed={tipo===t}
          >
            {t}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSearch()}
            placeholder="Buscar por nombre..."
            className="px-3 py-2 rounded-xl border text-sm w-56 bg-transparent"
          />
          <button onClick={onSearch} className="px-3 py-2 rounded-xl border text-sm">Buscar</button>
          <select value={sort} onChange={e => { setPage(1); setSort(e.target.value as any); }}
                  className="px-3 py-2 rounded-xl border text-sm bg-transparent">
            <option value="nombre_asc">Nombre (A→Z)</option>
            <option value="nombre_desc">Nombre (Z→A)</option>
            <option value="precioHora_asc">Hora ↑</option>
            <option value="precioHora_desc">Hora ↓</option>
            <option value="precioDia_asc">Día ↑</option>
            <option value="precioDia_desc">Día ↓</option>
          </select>
        </div>
      </div>

      <RecursosGrid
        items={resp?.items || []}
        onClick={(id) => navigate(`/recursos/${id}`)}
      />

      {resp && resp.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)}
                  className="px-3 py-1.5 rounded-xl border text-sm disabled:opacity-50">Anterior</button>
          <span className="text-sm">Página {page} de {resp.pages}</span>
          <button disabled={page>=resp.pages} onClick={()=>setPage(p=>p+1)}
                  className="px-3 py-1.5 rounded-xl border text-sm disabled:opacity-50">Siguiente</button>
        </div>
      )}
    </div>
  );
}
