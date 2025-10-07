import axios from "axios";

function resolveBaseURL() {
  const envUrl = import.meta.env.VITE_API_URL;
  let base = envUrl || "/api";
  // Fuerza proxy en dev aunque hayan dejado localhost:3000
  if (import.meta.env.DEV && /^https?:\/\/localhost:3000/i.test(base)) {
    console.warn("⚠️ VITE_API_URL apunta a localhost:3000 en dev. Forzando '/api'.");
    base = "/api";
  }
  return base;
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 👀 confirma en consola que sea "/api"
console.log("🔗 API baseURL =>", (api.defaults as any).baseURL);

export default api;
