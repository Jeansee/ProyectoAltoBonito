// src/services/auth.service.ts
import api from "./api";

export type User = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: string;
};

export type LoginPayload = { correo: string; password: string };

export type RegisterPayload = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  password: string;
  whatsapp?: string;
};

export type ChangePasswordPayload = { currentPassword: string; newPassword: string };

export type UpdateProfilePayload = {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  whatsapp?: string | null;
};

export async function loginUser(payload: LoginPayload): Promise<{ user: User; token: string }> {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<{ user: User; token: string }> {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<{ ok: boolean }> {
  const { data } = await api.post("/auth/change-password", payload);
  return data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<{ user: User; token: string }> {
  const { data } = await api.patch("/auth/profile", payload);
  return data;
}

export async function fetchMe(): Promise<{ user: User; token: string }> {
  const { data } = await api.get("/auth/me");
  return data;
}
