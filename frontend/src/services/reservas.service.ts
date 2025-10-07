import api from './api';

export type Modalidad = 'POR_HORA' | 'DIA_COMPLETO' | 'BLOQUE';

export interface ReservaItem {
  recursoId: string;
  modalidad: Modalidad;
  desde?: string;  // ISO
  hasta?: string;  // ISO
  fecha?: string;  // YYYY-MM-DD
  turnoId?: string;
}

export interface CreateReservaRequest {
  usuarioId: string;
  modalidad?: Modalidad; // informativa
  items: ReservaItem[];
}

export async function createReserva(payload: CreateReservaRequest) {
  const { data } = await api.post('/reservas', payload);
  return data;
}
