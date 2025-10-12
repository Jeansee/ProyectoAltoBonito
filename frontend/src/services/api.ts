// frontend/src/services/api.ts
import axios from "axios";

const API_ORIGIN =
  (import.meta as any).env?.VITE_API_URL ||
  window.location.origin ||                 // fallback
  "http://localhost:3000";

// Asegura que el baseURL termine en /api
const baseURL = `${API_ORIGIN.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true, // ok si algún día usas cookies; con Authorization también funciona
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
console.log("🔗 API baseURL =>", api.defaults.baseURL);

export default api;
