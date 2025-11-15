// src/components/usuario/MisReservas.tsx
import React, { useEffect, useState } from 'react';
import { fetchMisReservas, type MisReservasItem } from '@/services/reservas.service';
import { useAuth } from '@/context/AuthContext';

function fmtCLP(n: number) {
  return n.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });
}

function fmtRango(inicioISO: string, finISO: string) {
  const i = new Date(inicioISO);
  const f = new Date(finISO);
  const optsFecha: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };
  const optsHora: Intl.DateTimeFormatOptions = { timeStyle: 'short' };
  return `${i.toLocaleDateString('es-CL', optsFecha)} — ${i.toLocaleTimeString(
    'es-CL',
    optsHora
  )} a ${f.toLocaleTimeString('es-CL', optsHora)}`;
}

function modalidadLabel(m: MisReservasItem['modalidad']) {
  switch (m) {
    case 'DIA_COMPLETO':
      return 'Día completo';
    case 'BLOQUE':
      return 'Turno/Bloque';
    default:
      return 'Por hora';
  }
}

function tipoLabel(t: 'QUINCHO' | 'PISCINA' | 'CANCHA') {
  switch (t) {
    case 'QUINCHO':
      return 'Quincho';
    case 'PISCINA':
      return 'Piscina';
    case 'CANCHA':
      return 'Cancha';
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
    return (
      <div className="p-6 text-sm text-gray-600">
        Debes iniciar sesión para ver tus reservas.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-600">
        Cargando reservas…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
        {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-600">
        No tienes reservas confirmadas aún.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-5">
      {data.map((r) => (
        <div
          key={r.id}
          className="rounded-2xl bg-[#ffb26a]/25 border border-[#c14421]/30"
        >
          <div className="p-4 md:p-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Izquierda: estado, fecha, recursos */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    r.estado === 'PAGADA'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-white text-[#c14421] border border-[#c14421]/30'
                  }`}
                >
                  {r.estado === 'PAGADA' ? 'Pagada' : 'Confirmada'}
                </span>
                <span className="text-xs text-[#1e1e1e] font-bold">
                  {modalidadLabel(r.modalidad)}
                </span>
              </div>

              <div className="text-sm text-gray-700">
                {fmtRango(r.inicio, r.fin)}
              </div>

              <div className="mt-1 flex flex-wrap gap-2">
                {r.recursos.map((rr) => (
                  <span
                    key={rr.id}
                    className="text-xs px-2.5 py-1 rounded-full bg-white text-[#c14421] border border-[#c14421]/30 font-medium"
                  >
                    {tipoLabel(rr.tipo)}
                  </span>
                ))}
              </div>
            </div>

            {/* Derecha: monto total */}
            <div className="text-right mt-1 md:mt-0">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Total reserva
              </div>
              <div className="text-lg font-bold" style={{ color: '#1e1e1e' }}>
                {fmtCLP(r.montoTotalCLP)}
              </div>
              {/* 👇 Se eliminó Cod. Aut. y Orden, como pediste */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
