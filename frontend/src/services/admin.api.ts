import api from "./api";

export type AdminMetrics = {
  range: { from: string | null; to: string | null };
  kpis: { usuarios: number; reservas: number; ingresosCLP: number };
  reservasPorEstado: { estado: string; count: number }[];
  reservasPorModalidad: { modalidad: string; count: number }[];
};

export async function fetchAdminMetrics(params?: { from?: string; to?: string }) {
  const { data } = await api.get<AdminMetrics>("/admin/metrics", { params });
  return data;
}

export type RecentReserva = {
  id: string;
  fecha: string;
  inicio: string;
  fin: string;
  estado: string;
  modalidad: string;
  cliente: { id: string; nombre: string; correo: string } | null;
  recursos: { id: string; nombre: string; tipo: string; precioFinalCLP: number }[];
  totalCLP: number;
};

export async function fetchRecentReservas(limit = 10) {
  const { data } = await api.get<RecentReserva[]>("/admin/recent-reservas", { params: { limit } });
  return data;
}
