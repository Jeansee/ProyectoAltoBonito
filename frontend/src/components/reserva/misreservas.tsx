// src/components/usuario/MisReservas.tsx
import React, { useEffect, useState } from 'react';
import { fetchMisReservas, type MisReservasItem } from '@/services/reservas.service';
import { useAuth } from '@/context/AuthContext';

function fmtCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function fmtRango(inicioISO: string, finISO: string) {
  const i = new Date(inicioISO);
  const f = new Date(finISO);
  const optsFecha: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };
  const optsHora: Intl.DateTimeFormatOptions = { timeStyle: 'short' };
  return `${i.toLocaleDateString('es-CL', optsFecha)} — ${i.toLocaleTimeString('es-CL', optsHora)} a ${f.toLocaleTimeString('es-CL', optsHora)}`;
}

function modalidadLabel(m: MisReservasItem['modalidad']) {
  switch (m) {
    case 'DIA_COMPLETO': return 'Día completo';
    case 'BLOQUE': return 'Turno/Bloque';
    default: return 'Por hora';
  }
}

function tipoLabel(t: 'QUINCHO' | 'PISCINA' | 'CANCHA') {
  switch (t) {
    case 'QUINCHO': return 'Quincho';
    case 'PISCINA': return 'Piscina';
    case 'CANCHA': return 'Cancha';
  }
}

export default function MisReservas() {
  const { user } = useAuth();
  const [data, setData] = useState<MisReservasItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetchMisReservas(user?.id); // pasa ?userId= mientras el backend no lea req.user
        setData(r);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'No se pudieron cargar tus reservas.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  if (!user?.id) {
    return <div className="p-6 text-sm text-gray-600">Debes iniciar sesión para ver tus reservas.</div>;
  }

  if (loading) return <div className="p-6 text-sm text-gray-600">Cargando reservas…</div>;
  if (error) return <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</div>;
  if (!data || data.length === 0) return <div className="p-6 text-sm text-gray-600">No tienes reservas confirmadas aún.</div>;

  return (
    <div className="p-6 md:p-8 space-y-5">
      {data.map((r) => (
        <div key={r.id} className="rounded-2xl border border-gray-100 shadow-sm bg-white/90">
          <div className="p-4 md:p-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    r.estado === 'PAGADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {r.estado === 'PAGADA' ? 'Pagada' : 'Confirmada'}
                </span>
                <span className="text-xs text-gray-500">{modalidadLabel(r.modalidad)}</span>
              </div>
              <div className="mt-1 text-sm text-gray-700">{fmtRango(r.inicio, r.fin)}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {r.recursos.map((rr) => (
                  <span key={rr.id} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {tipoLabel(rr.tipo)} — {rr.nombre}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-[#1e1e1e]">{fmtCLP(r.montoTotalCLP)}</div>
              {r.ultimoPago?.tbkAuthorizationCode && (
                <div className="text-xs text-gray-500">Cod. Aut.: {r.ultimoPago.tbkAuthorizationCode}</div>
              )}
              {!r.ultimoPago?.tbkAuthorizationCode && r.ultimoPago?.tbkBuyOrder && (
                <div className="text-xs text-gray-500">Orden: {r.ultimoPago.tbkBuyOrder}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
