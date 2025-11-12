// src/services/reservas.service.ts
import api from "./api";

export type ModalidadReserva = "POR_HORA" | "DIA_COMPLETO" | "BLOQUE";

export type CreateReservaItem = {
  recursoId: string;
  modalidad: ModalidadReserva;
  // POR_HORA / BLOQUE
  desde?: string; // ISO
  hasta?: string; // ISO
  // DIA_COMPLETO
  fecha?: string; // YYYY-MM-DD
};

export type CreateReservaRequest = {
  usuarioId: string;
  items: CreateReservaItem[];
  addToCalendar?: boolean;
  // opcional si quieres forzar una modalidad para toda la reserva
  modalidad?: ModalidadReserva;
};

// ⇨ crear reserva
export async function createReserva(payload: CreateReservaRequest) {
  const { data } = await api.post("/reservas", payload);
  return data; // debería traer { id, ... }
}

// ========== Mis reservas (para el perfil) ==========
export type MisReservasItem = {
  id: string;
  estado: "PENDIENTE" | "CONFIRMADA" | "PAGADA" | "CANCELADA";
  modalidad: ModalidadReserva;
  inicio: string;
  fin: string;
  montoTotalCLP: number;
  montoAbonoCLP: number;
  recursos: {
    id: string;
    recursoId: string;
    nombre: string;
    tipo: "QUINCHO" | "PISCINA" | "CANCHA";
    precioFinalCLP: number;
  }[];
  ultimoPago: null | {
    id: string;
    estado: string;
    montoCLP: number;
    metodoPago: "TRANSBANK" | string;
    tbkAuthorizationCode?: string | null;
    tbkBuyOrder?: string | null;
    createdAt: string;
  };
};

export async function fetchMisReservas(userId?: string): Promise<MisReservasItem[]> {
  const url = userId ? `/reservas/mias?userId=${encodeURIComponent(userId)}` : '/reservas/mias';
  const { data } = await api.get(url);
  return data;
}
