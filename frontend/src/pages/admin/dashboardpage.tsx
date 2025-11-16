// frontend/src/pages/admin/dashboardpage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminMetrics,
  fetchRecentReservas,
  cancelReservaAdmin,
} from "@/services/admin.api";
import type { AdminMetrics, RecentReserva } from "@/services/admin.api";
import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";

const ACCENT = "#c14421";
const ARENA = "#fad4b6ff";
const PAGE_SIZE = 5;

/* ------------------------------- UI helpers ------------------------------- */

function formatMonthLabel(month: string) {
  // month = "YYYY-MM"
  const [y, m] = month.split("-");
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleDateString("es-CL", { year: "numeric", month: "short" });
}

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
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#ffb26a]/25" />
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffb26a] to-[#c14421] text-white shadow">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {title}
          </div>
          <div className="mt-1 text-3xl font-extrabold text-gray-900">
            {value}
          </div>
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

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "ok" | "warn" | "muted" | "danger";
}) {
  const cls =
    tone === "ok"
      ? "bg-green-100 text-green-700"
      : tone === "warn"
      ? "bg-amber-100 text-amber-700"
      : tone === "danger"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
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

  // 👇 nuevos filtros
  const [tipoRecurso, setTipoRecurso] = useState<string>("");
  const [modalidad, setModalidad] = useState<string>("");

  const [loadingKPI, setLoadingKPI] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 👇 nuevo: para saber qué reserva se está cancelando
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // paginación últimas reservas
  const [page, setPage] = useState<number>(1);

  const reservasPorModalidad = metrics?.reservasPorModalidad ?? [];
  const recursoMes = metrics?.recursoMes ?? [];
  const reservasPorDiaSemana = metrics?.reservasPorDiaSemana ?? [];
  const reservasPorFranja = metrics?.reservasPorFranja ?? [];
  const clientesNR = metrics?.clientesNuevosVsRecurrentes;

  const totalModalidad = useMemo(
    () => reservasPorModalidad.reduce((acc, x) => acc + (x.count || 0), 0),
    [reservasPorModalidad]
  );

  const topByReservas = useMemo(() => {
    const list = [...recursoMes];
    list.sort(
      (a, b) => b.reservas - a.reservas || b.month.localeCompare(a.month)
    );
    return list.slice(0, 5);
  }, [recursoMes]);

  const topByIngresos = useMemo(() => {
    const list = [...recursoMes];
    list.sort(
      (a, b) => b.ingresosCLP - a.ingresosCLP || b.month.localeCompare(a.month)
    );
    return list.slice(0, 5);
  }, [recursoMes]);

  // Totales para normalizar barras de días y franjas
  const totalPorDiaSemana = useMemo(
    () => reservasPorDiaSemana.reduce((acc, x) => acc + (x.count || 0), 0),
    [reservasPorDiaSemana]
  );
  const totalPorFranja = useMemo(
    () => reservasPorFranja.reduce((acc, x) => acc + (x.count || 0), 0),
    [reservasPorFranja]
  );

  const totalClientesSegmentados = useMemo(() => {
    if (!clientesNR) return 0;
    return (
      (clientesNR.nuevos.clientes ?? 0) +
      (clientesNR.recurrentes.clientes ?? 0)
    );
  }, [clientesNR]);

  // paginación: calcular filas visibles
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
    [rows.length]
  );

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  const currentStartIndex = (page - 1) * PAGE_SIZE;
  const currentEndIndex = Math.min(currentStartIndex + PAGE_SIZE, rows.length);

  const load = async (opts?: { ignoreFilters?: boolean }) => {
    setRefreshing(true);
    setLoadingKPI(true);
    setLoadingTable(true);
    try {
      let fromParam: string | undefined;
      let toParam: string | undefined;
      let tipoRecursoParam: string | undefined;
      let modalidadParam: string | undefined;

      if (!opts?.ignoreFilters) {
        fromParam = from || undefined;
        toParam = to || undefined;
        tipoRecursoParam = tipoRecurso || undefined;
        modalidadParam = modalidad || undefined;
      }

      const m = await fetchAdminMetrics({
        from: fromParam,
        to: toParam,
        tipoRecurso: tipoRecursoParam as any,
        modalidad: modalidadParam as any,
      });
      setMetrics(m);

      const r = await fetchRecentReservas(50);
      setRows(r);
      setPage(1);
    } finally {
      setLoadingKPI(false);
      setLoadingTable(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // primera carga: sin filtros
    // eslint-disable-next-line react-hooks/exhaustive-deps
    load({ ignoreFilters: true });
  }, []);

  const handlePrevPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setPage((p) => Math.min(totalPages, p + 1));
  };

  const handleApply = () => {
    load({ ignoreFilters: false });
  };

  const handleRefresh = () => {
    setFrom("");
    setTo("");
    setTipoRecurso(""); // reset recurso
    setModalidad(""); // reset modalidad
    load({ ignoreFilters: true });
  };

  // 👇 nuevo: cancelar reserva
  const handleCancel = async (id: string) => {
    const ok = window.confirm(
      "¿Seguro que deseas cancelar esta reserva? Esta acción liberará el horario."
    );
    if (!ok) return;

    try {
      setCancellingId(id);
      await cancelReservaAdmin(id);
      // recargamos respetando los filtros actuales
      await load({ ignoreFilters: false });
    } catch (err) {
      console.error(err);
      alert("No se pudo cancelar la reserva. Inténtalo nuevamente.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header / filtros */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffb26a]/25 text-[#c14421]">
              <FiFilter />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Filtros</div>
              <div className="text-xs text-gray-500">
                Rango de fechas para las métricas
              </div>
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

            {/* Nuevo: filtro por tipo de recurso */}
            <div>
              <label className="block text-xs text-gray-500">Recurso</label>
              <select
                className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#c14421]"
                value={tipoRecurso}
                onChange={(e) => setTipoRecurso(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="QUINCHO">Quincho</option>
                <option value="PISCINA">Piscina</option>
                <option value="CANCHA">Cancha</option>
              </select>
            </div>

            {/* Nuevo: filtro por modalidad */}
            <div>
              <label className="block text-xs text-gray-500">Modalidad</label>
              <select
                className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#c14421]"
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="POR_HORA">Por hora</option>
                <option value="BLOQUE">Bloque</option>
                <option value="DIA_COMPLETO">Día completo</option>
              </select>
            </div>

            <button
              onClick={handleApply}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#c14421] px-4 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Aplicar
            </button>

            <button
              onClick={handleRefresh}
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
            hint={
              metrics?.kpis?.variacionIngresosPct != null
                ? `Δ ${metrics.kpis.variacionIngresosPct}% vs período`
                : undefined
            }
          />
        </div>
      )}

      {/* Distribuciones: clientes nuevos vs recurrentes / modalidad */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Clientes nuevos vs recurrentes */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow">
          <div className="mb-1 text-base font-semibold text-gray-900">
            Clientes nuevos vs recurrentes
          </div>

          {!clientesNR || totalClientesSegmentados === 0 ? (
            <div className="text-sm text-gray-400">Sin datos</div>
          ) : (
            <div className="space-y-3">
              <ProgressRow
                label="Clientes nuevos"
                value={clientesNR.nuevos.clientes}
                total={totalClientesSegmentados}
                color={ACCENT}
              />
              <ProgressRow
                label="Clientes recurrentes"
                value={clientesNR.recurrentes.clientes}
                total={totalClientesSegmentados}
                color={ARENA}
              />
              <div className="mt-2 text-xs text-gray-500">
                Reservas de nuevos:{" "}
                <span className="font-semibold">
                  {clientesNR.nuevos.reservas}
                </span>{" "}
                · Reservas de recurrentes:{" "}
                <span className="font-semibold">
                  {clientesNR.recurrentes.reservas}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Reservas por modalidad */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow">
          <div className="mb-3 text-base font-semibold text-gray-900">
            Reservas por modalidad
          </div>
          <div className="space-y-3">
            {reservasPorModalidad.length > 0 ? (
              reservasPorModalidad.map((x) => (
                <ProgressRow
                  key={x.modalidad}
                  label={x.modalidad}
                  value={x.count}
                  total={totalModalidad}
                  color={ACCENT}
                />
              ))
            ) : (
              <div className="text-sm text-gray-400">Sin datos</div>
            )}
          </div>
        </div>
      </div>

      {/* Ocupancia & ingresos por recurso/mes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Ocupancia */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow">
          <div className="mb-3 text-base font-semibold text-gray-900">
            Ocupancia mes por recurso
          </div>
          {topByReservas.length === 0 ? (
            <div className="text-sm text-gray-400">Sin datos</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1 pr-4">Mes</th>
                    <th className="py-1 pr-4">Recurso</th>
                    <th className="py-1 pr-4 text-right">Reservas</th>
                  </tr>
                </thead>
                <tbody>
                  {topByReservas.map((row) => (
                    <tr
                      key={`${row.recursoId}-${row.month}`}
                      className="border-t"
                    >
                      <td className="py-1.5 pr-4">
                        {formatMonthLabel(row.month)}
                      </td>
                      <td className="py-1.5 pr-4">{row.recursoTipo}</td>
                      <td className="py-1.5 pr-4 text-right font-semibold">
                        {row.reservas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ingresos */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow">
          <div className="mb-3 text-base font-semibold text-gray-900">
            Ingresos mes por recurso
          </div>
          {topByIngresos.length === 0 ? (
            <div className="text-sm text-gray-400">Sin datos</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1 pr-4">Mes</th>
                    <th className="py-1 pr-4">Recurso</th>
                    <th className="py-1 pr-4 text-right">Ingresos (CLP)</th>
                  </tr>
                </thead>
                <tbody>
                  {topByIngresos.map((row) => (
                    <tr
                      key={`${row.recursoId}-${row.month}`}
                      className="border-t"
                    >
                      <td className="py-1.5 pr-4">
                        {formatMonthLabel(row.month)}
                      </td>
                      <td className="py-1.5 pr-4">{row.recursoTipo}</td>
                      <td className="py-1.5 pr-4 text-right font-semibold">
                        {row.ingresosCLP.toLocaleString("es-CL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Días y franjas pico */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Días de la semana */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow">
          <div className="mb-3 text-base font-semibold text-gray-900">
            Reservas por día de la semana
          </div>
          {reservasPorDiaSemana.length === 0 ? (
            <div className="text-sm text-gray-400">Sin datos</div>
          ) : (
            <div className="space-y-3">
              {reservasPorDiaSemana.map((d) => (
                <ProgressRow
                  key={d.dia}
                  label={d.label}
                  value={d.count}
                  total={totalPorDiaSemana}
                  color={ACCENT}
                />
              ))}
            </div>
          )}
        </div>

        {/* Franjas horarias */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow">
          <div className="mb-3 text-base font-semibold text-gray-900">
            Reservas por franja horaria
          </div>
          {reservasPorFranja.length === 0 ? (
            <div className="text-sm text-gray-400">Sin datos</div>
          ) : (
            <div className="space-y-3">
              {reservasPorFranja.map((f) => (
                <ProgressRow
                  key={f.id}
                  label={f.label}
                  value={f.count}
                  total={totalPorFranja}
                  color={ARENA}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabla últimas reservas con paginación */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow">
        <div className="mb-3 text-base font-semibold text-gray-900">
          Últimas reservas
        </div>

        {loadingTable ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded bg-gray-100"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-6 text-center text-gray-400">
            No hay reservas recientes
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Inicio</th>
                    <th className="py-2 pr-4">Término</th>
                    <th className="py-2 pr-4">Cliente</th>
                    <th className="py-2 pr-4">Modalidad</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4">Recursos</th>
                    <th className="py-2 pr-4 text-right">Total (CLP)</th>
                    {/* nuevo encabezado de columna */}
                    <th className="py-2 pr-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t transition hover:bg-gray-50"
                    >
                      <td className="py-2 pr-4">
                        {new Date(r.inicio).toLocaleString("es-CL")}
                      </td>
                      <td className="py-2 pr-4">
                        {new Date(r.fin).toLocaleString("es-CL")}
                      </td>
                      <td className="py-2 pr-4">
                        {r.cliente
                          ? `${r.cliente.nombre} (${r.cliente.correo})`
                          : "—"}
                      </td>
                      <td className="py-2 pr-4">{r.modalidad}</td>
                      <td className="py-2 pr-4">
                        <Chip
                          tone={
                            r.estado === "PAGADA"
                              ? "ok"
                              : r.estado === "CONFIRMADA"
                              ? "ok"
                              : r.estado === "PENDIENTE"
                              ? "muted"
                              : "danger"
                          }
                        >
                          {r.estado}
                        </Chip>
                      </td>
                      <td className="py-2 pr-4">
                        {r.recursos.map((x) => x.nombre).join(", ") || "—"}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {r.totalCLP.toLocaleString("es-CL")}
                      </td>
                      {/* nuevo botón Cancelar */}
                      <td className="py-2 pr-4 text-right">
                        {r.estado === "CONFIRMADA" || r.estado === "PAGADA" ? (
                          <button
                            onClick={() => handleCancel(r.id)}
                            disabled={cancellingId === r.id}
                            className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {cancellingId === r.id
                              ? "Cancelando..."
                              : "Cancelar"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length > PAGE_SIZE && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>
                  Mostrando {currentStartIndex + 1}–{currentEndIndex} de{" "}
                  {rows.length} reservas
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="rounded-full border px-3 py-1 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span>
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                    className="rounded-full border px-3 py-1 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
