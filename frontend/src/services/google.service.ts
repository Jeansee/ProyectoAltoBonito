// frontend/src/services/google.service.ts
import api from "./api";

export type GoogleConnStatus = { connected: boolean; email: string | null };

export async function getGoogleStatus(userId: string) {
  const { data } = await api.get<GoogleConnStatus>("/auth/google/status", {
    params: { userId },
  });
  return data;
}

export async function disconnectGoogle(userId: string) {
  const { data } = await api.post<{ ok: true }>("/auth/google/disconnect", { userId });
  return data;
}

// URL para iniciar consentimiento con Calendar (scope calendar.events)
export const GOOGLE_CONNECT_URL = "/api/auth/google/start-calendar";
