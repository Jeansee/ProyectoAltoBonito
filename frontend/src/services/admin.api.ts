// frontend/src/services/admin.api.ts
import api from "./api";

export type AdminMetrics = {
  range: { from: string | null; to: string | null };
  kpis: {
    usuarios: number;
    reservas: number;
    ingresosCLP: number;
    variacionIngresosPct?: number;
  };
  // 👇 quitamos reservasPorEstado porque ya no se usa ni se envía
  reservasPorModalidad: { modalidad: string; count: number }[];
  recursoMes: {
    recursoId: string;
    recursoNombre: string;
    recursoTipo: string;
    month: string; // "YYYY-MM"
    reservas: number;
    ingresosCLP: number;
  }[];
  reservasPorDiaSemana: {
    dia: number;   // 0..6
    label: string; // "Dom", "Lun", ...
    count: number;
  }[];
  reservasPorFranja: {
    id: string;    // "06-12", "12-18", "18-24"
    label: string; // "06:00–12:00", etc.
    count: number;
  }[];
  clientesNuevosVsRecurrentes: {
    nuevos: { clientes: number; reservas: number };
    recurrentes: { clientes: number; reservas: number };
  };
};

export async function fetchAdminMetrics(params?: {
  from?: string;
  to?: string;
  tipoRecurso?: string;
  modalidad?: string;
}) {
  const { data } = await api.get<AdminMetrics>("/admin/metrics", { params });
  return data;
}

export type RecentReserva = {
  id: string;
  fecha: string; // createdAt
  inicio: string;
  fin: string;
  estado: string;
  modalidad: string;
  cliente: { id: string; nombre: string; correo: string } | null;
  recursos: {
    id: string;
    nombre: string;
    tipo: string;
    precioFinalCLP: number;
  }[];
  totalCLP: number;
};

/**
 * Trae las últimas reservas globales (ordenadas por inicio DESC, luego createdAt DESC).
 * Usaremos un límite más alto (50) para poder paginar en el frontend.
 */
export async function fetchRecentReservas(limit = 50) {
  const { data } = await api.get<RecentReserva[]>("/admin/recent-reservas", {
    params: { limit },
  });
  return data;
}

// 👇 NUEVO: cancelar reserva como admin
export async function cancelReservaAdmin(id: string) {
  const { data } = await api.patch(`/admin/reservas/${id}/cancel`);
  return data;
}
