import React, { useEffect, useState } from "react";
import { fetchAdminMetrics, fetchRecentReservas } from "@/services/admin.api";
import type { AdminMetrics, RecentReserva } from "@/services/admin.api";

function Card({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white shadow p-5 border border-gray-100">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [rows, setRows] = useState<RecentReserva[]>([]);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const load = async () => {
    const m = await fetchAdminMetrics({ from: from || undefined, to: to || undefined });
    setMetrics(m);
    const r = await fetchRecentReservas(10);
    setRows(r);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    load();
  }, []);

  const reservasPorEstado = metrics?.reservasPorEstado ?? [];
  const reservasPorModalidad = metrics?.reservasPorModalidad ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500">Desde</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Hasta</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button
          onClick={load}
          className="h-8 px-4 rounded-full bg-[#c14421] text-white text-sm font-semibold hover:brightness-110"
        >
          Aplicar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Usuarios" value={metrics?.kpis?.usuarios ?? "—"} />
        <Card title="Reservas" value={metrics?.kpis?.reservas ?? "—"} />
        <Card
          title="Ingresos (CLP)"
          value={(metrics?.kpis?.ingresosCLP ?? 0).toLocaleString("es-CL")}
        />
      </div>

      {/* Distribuciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white shadow p-5 border border-gray-100">
          <div className="font-semibold mb-3">Reservas por estado</div>
          <ul className="text-sm space-y-1">
            {reservasPorEstado.map((x) => (
              <li key={x.estado} className="flex justify-between">
                <span className="uppercase text-gray-600">{x.estado}</span>
                <span className="font-semibold">{x.count}</span>
              </li>
            ))}
            {(reservasPorEstado.length ?? 0) === 0 && (
              <div className="text-gray-400 text-sm">Sin datos</div>
            )}
          </ul>
        </div>

        <div className="rounded-2xl bg-white shadow p-5 border border-gray-100">
          <div className="font-semibold mb-3">Reservas por modalidad</div>
          <ul className="text-sm space-y-1">
            {reservasPorModalidad.map((x) => (
              <li key={x.modalidad} className="flex justify-between">
                <span className="uppercase text-gray-600">{x.modalidad}</span>
                <span className="font-semibold">{x.count}</span>
              </li>
            ))}
            {(reservasPorModalidad.length ?? 0) === 0 && (
              <div className="text-gray-400 text-sm">Sin datos</div>
            )}
          </ul>
        </div>
      </div>

      {/* Tabla últimas reservas */}
      <div className="rounded-2xl bg-white shadow p-5 border border-gray-100">
        <div className="font-semibold mb-3">Últimas reservas</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Cliente</th>
                <th className="py-2 pr-4">Modalidad</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Recursos</th>
                <th className="py-2 pr-4 text-right">Total (CLP)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 pr-4">
                    {new Date(r.fecha).toLocaleString("es-CL")}
                  </td>
                  <td className="py-2 pr-4">
                    {r.cliente ? `${r.cliente.nombre} (${r.cliente.correo})` : "—"}
                  </td>
                  <td className="py-2 pr-4">{r.modalidad}</td>
                  <td className="py-2 pr-4">{r.estado}</td>
                  <td className="py-2 pr-4">
                    {r.recursos.map((x) => x.nombre).join(", ") || "—"}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {r.totalCLP.toLocaleString("es-CL")}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="py-4 text-gray-400" colSpan={6}>
                    No hay reservas recientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
