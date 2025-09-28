import api from "./api";

export type TipoRecurso = 'QUINCHO' | 'PISCINA' | 'CANCHA';

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
  tipo?: TipoRecurso;
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  sort?: 'nombre_asc' | 'nombre_desc' | 'precioHora_asc' | 'precioHora_desc' | 'precioDia_asc' | 'precioDia_desc';
}) {
  const { data } = await api.get<ListResponse>('/recursos', { params });
  return data;
}

export async function getRecurso(id: string) {
  const { data } = await api.get(`/recursos/${id}`);
  return data;
}
