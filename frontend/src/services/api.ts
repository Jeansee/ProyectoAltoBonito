// frontend/src/services/api.ts
import axios from "axios";

// Normaliza la base según cómo definas VITE_API_URL
function resolveBaseURL(): string {
  const raw = (import.meta as any).env?.VITE_API_URL as string | undefined;

  // 1) Si es un path (empieza con "/"), úsalo tal cual (ya incluye /api en nuestro compose)
  if (raw && raw.startsWith("/")) {
    return raw; // ej: "/api"
  }

  // 2) Si es absoluta (http/https), asegúrate que termine en /api
  if (raw && /^https?:\/\//i.test(raw)) {
    const base = raw.replace(/\/$/, "");
    return base.endsWith("/api") ? base : `${base}/api`;
  }

  // 3) Fallback: origin del navegador + /api
  return `${window.location.origin.replace(/\/$/, "")}/api`;
}

const baseURL = resolveBaseURL();

const api = axios.create({
  baseURL,
  withCredentials: true, // déjalo true si podrías usar cookies; con Bearer igual funciona
});

// Adjunta Authorization si hay token
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${t}`;
  }
  return config;
});

// Log útil
console.log("🔗 API baseURL =>", baseURL);

export default api;
