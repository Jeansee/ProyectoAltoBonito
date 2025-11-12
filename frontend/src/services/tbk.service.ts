// src/services/tbk.service.ts
import api from "./api";

export type CreateTbkTxResponse = { url: string; token: string };

/**
 * Crea la transacción Webpay en el backend.
 * Intenta /tbk/tx y, si no existe (404), cae a /tbk/create (alias opcional).
 */
export async function createTbkTransaction(
  reservaId: string
): Promise<CreateTbkTxResponse> {
  try {
    const r = await api.post<CreateTbkTxResponse>("/tbk/tx", { reservaId });
    return r.data;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      const r2 = await api.post<CreateTbkTxResponse>("/tbk/create", { reservaId });
      return r2.data;
    }
    throw e;
  }
}
