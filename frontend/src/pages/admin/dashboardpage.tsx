import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminMetrics, fetchRecentReservas } from "@/services/admin.api";
import type { AdminMetrics, RecentReserva } from "@/services/admin.api";
import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";

const ACCENT = "#c14421";
const ARENA = "#e5d0ac";
const CARBON = "#1e1e1e";

/* ------------------------------- UI helpers ------------------------------- */

function KPI({
  title,
  value,
  icon,
  hint,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#e5d0ac]/30" />
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffb26a] to-[#c14421] text-white shadow">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {title}
          </div>
          <div className="mt-1 text-3xl font-extrabold text-gray-900">{value}</div>
          {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow border border-gray-100 animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
      <div className="h-8 w-32 bg-gray-200 rounded" />
      <div className="h-3 w-20 bg-gray-200 rounded mt-3" />
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  color = ACCENT,
}: {
  label: string;
  value: number;
  total: number;
  color?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone: "ok" | "warn" | "muted" | "danger" }) {
  const cls =
    tone === "ok"
      ? "bg-green-100 text-green-700"
      : tone === "warn"
      ? "bg-amber-100 text-amber-700"
      : tone === "danger"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

/* --------------------------------- Page ---------------------------------- */

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [rows, setRows] = useState<RecentReserva[]>([]);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const [loadingKPI, setLoadingKPI] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reservasPorEstado = metrics?.reservasPorEstado ?? [];
  const reservasPorModalidad = metrics?.reservasPorModalidad ?? [];

  const totalEstados = useMemo(
    () => reservasPorEstado.reduce((acc, x) => acc + (x.count || 0), 0),
    [reservasPorEstado]
  );
  const totalModalidad = useMemo(
    () => reservasPorModalidad.reduce((acc, x) => acc + (x.count || 0), 0),
    [reservasPorModalidad]
  );

  const load = async () => {
    setRefreshing(true);
    setLoadingKPI(true);
    setLoadingTable(true);
    try {
      const m = await fetchAdminMetrics({ from: from || undefined, to: to || undefined });
      setMetrics(m);
      const r = await fetchRecentReservas(10);
      setRows(r);
    } finally {
      setLoadingKPI(false);
      setLoadingTable(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // primera carga
    // eslint-disable-next-line react-hooks/exhaustive-deps
    load();
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header / filtros */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5d0ac]/40 text-[#c14421]">
              <FiFilter />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Filtros</div>
              <div className="text-xs text-gray-500">Rango de fechas para las métricas</div>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500">Desde</label>
              <input
                type="date"
                className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#c14421]"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Hasta</label>
              <input
                type="date"
                className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#c14421]"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <button
              onClick={load}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#c14421] px-4 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Aplicar
            </button>

            <button
              onClick={load}
              disabled={refreshing}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {loadingKPI ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KPI
            title="Usuarios"
            value={metrics?.kpis?.usuarios ?? "—"}
            icon={<FiUsers />}
            hint={undefined}
          />
          <KPI
            title="Reservas"
            value={metrics?.kpis?.reservas ?? "—"}
            icon={<FiCalendar />}
            hint={undefined}
          />
          <KPI
            title="Ingresos (CLP)"
            value={(metrics?.kpis?.ingresosCLP ?? 0).toLocaleString("es-CL")}
            icon={<FiDollarSign />}
            hint={metrics?.kpis?.variacionIngresosPct != null ? `Δ ${metrics.kpis.variacionIngresosPct}% vs período` : undefined}
          />
        </div>
      )}

      {/* Distribuciones */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow">
          <div className="mb-3 text-base font-semibold text-gray-900">Reservas por estado</div>
          <div className="space-y-3">
            {reservasPorEstado.length > 0 ? (
              reservasPorEstado.map((x) => (
                <ProgressRow key={x.estado} label={x.estado} value={x.count} total={totalEstados} color={ACCENT} />
              ))
            ) : (
              <div className="text-sm text-gray-400">Sin datos</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow">
          <div className="mb-3 text-base font-semibold text-gray-900">Reservas por modalidad</div>
          <div className="space-y-3">
            {reservasPorModalidad.length > 0 ? (
              reservasPorModalidad.map((x) => (
                <ProgressRow key={x.modalidad} label={x.modalidad} value={x.count} total={totalModalidad} color={ARENA} />
              ))
            ) : (
              <div className="text-sm text-gray-400">Sin datos</div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla últimas reservas */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow">
        <div className="mb-3 text-base font-semibold text-gray-900">Últimas reservas</div>

        {loadingTable ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white">
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
                  <tr key={r.id} className="border-t transition hover:bg-gray-50">
                    <td className="py-2 pr-4">{new Date(r.fecha).toLocaleString("es-CL")}</td>
                    <td className="py-2 pr-4">
                      {r.cliente ? `${r.cliente.nombre} (${r.cliente.correo})` : "—"}
                    </td>
                    <td className="py-2 pr-4">{r.modalidad}</td>
                    <td className="py-2 pr-4">
                      <Chip
                        tone={
                          r.estado === "PAGADA"
                            ? "ok"
                            : r.estado === "CONFIRMADA"
                            ? "warn"
                            : r.estado === "PENDIENTE"
                            ? "muted"
                            : "danger"
                        }
                      >
                        {r.estado}
                      </Chip>
                    </td>
                    <td className="py-2 pr-4">{r.recursos.map((x) => x.nombre).join(", ") || "—"}</td>
                    <td className="py-2 pr-4 text-right">{r.totalCLP.toLocaleString("es-CL")}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-gray-400" colSpan={6}>
                      No hay reservas recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
