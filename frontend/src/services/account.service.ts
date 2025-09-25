import api from './api';
import type { User } from './auth.service';

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean }> {
  const { data } = await api.post('/account/change-password', payload);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get('/account/me');
  return data;
}

export async function updateProfile(payload: {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  whatsapp?: string | null;
}): Promise<User> {
  const { data } = await api.patch('/account/profile', payload);
  return data;
}
