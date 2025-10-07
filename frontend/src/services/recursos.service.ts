import api from "./api";

export type TipoRecurso = 'QUINCHO' | 'PISCINA' | 'CANCHA';
const TIPOS_VALIDOS: TipoRecurso[] = ['QUINCHO','PISCINA','CANCHA'];

export interface RecursoListItem {
  id: string;
  nombre: string;
  tipo: TipoRecurso;
  descripcion?: string | null;
  activo: boolean;
  capacidad: number;
  ubicacion?: string | null;
  precioHoraCLP?: number | null;
  precioDiaCLP?: number | null;
  precioBaseCLP?: number | null;
  tiempoMinimo: number;
  tiempoMaximo: number;
  diasAnticipacion: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListResponse {
  items: RecursoListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function listRecursos(params: {
  tipo?: string;
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  sort?: 'nombre_asc' | 'nombre_desc' | 'precioHora_asc' | 'precioHora_desc' | 'precioDia_asc' | 'precioDia_desc';
}) {
  const p: any = { ...params };
  if (p.tipo) {
    const t = String(p.tipo).toUpperCase();
    if (!TIPOS_VALIDOS.includes(t as TipoRecurso)) delete p.tipo;
    else p.tipo = t;
  }
  const { data } = await api.get<ListResponse>('/recursos', { params: p });
  return data;
}

export async function getRecurso(id: string) {
  const { data } = await api.get(`/recursos/${id}`);
  return data;
}

// ✅ Slots por hora/bloque (libres/ocupados) para una fecha
export async function getRecursoSlots(recursoId: string, fecha: string, step = 60) {
  const { data } = await api.get(`/recursos/${recursoId}/slots`, { params: { fecha, step } });
  return data as {
    fecha: string;
    step: number;
    slots: { inicio: string; fin: string; busy: boolean }[];
  };
}

// ✅ Disponibilidad por día (para calendario de “Día completo”)
export async function getRecursoAvailability(
  recursoId: string,
  from: string, // YYYY-MM-DD
  to: string,   // YYYY-MM-DD
  mode: 'DIA_COMPLETO' | 'POR_HORA' | 'BLOQUE' = 'DIA_COMPLETO'
) {
  const { data } = await api.get(`/recursos/${recursoId}/availability`, {
    params: { from, to, mode },
  });
  return data as {
    from: string;
    to: string;
    mode: string;
    days: { date: string; available: boolean }[];
  };
}
