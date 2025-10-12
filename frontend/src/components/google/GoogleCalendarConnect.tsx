// frontend/src/components/google/GoogleCalendarConnect.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getGoogleStatus, disconnectGoogle } from "@/services/google.service";

// Base del backend:
// - En dev usamos http://localhost:3000 directo (evita el proxy de Vite)
// - En prod usamos VITE_API_URL o mismo origen
const BACKEND_BASE: string = (import.meta as any).env?.DEV
  ? "http://localhost:3000"
  : (import.meta as any).env?.VITE_API_URL || window.location.origin;

const join = (base: string, path: string) =>
  `${base.replace(/\/+$/, "")}${path}`;

const CONNECT_URL = join(BACKEND_BASE, "/api/auth/google/start-calendar");

export default function GoogleCalendarConnect() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ connected: boolean; email: string | null } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const s = await getGoogleStatus(user.id);
        setStatus(s);
      } catch (e: any) {
        setErr(e?.response?.data?.message || "No se pudo consultar el estado de Google.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const onDisconnect = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      await disconnectGoogle(user.id);
      setStatus({ connected: false, email: null });
    } catch (e: any) {
      setErr(e?.response?.data?.message || "No se pudo desconectar Google.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="rounded-xl border p-4 bg-white">
      <h3 className="text-lg font-semibold mb-2">Google Calendar</h3>
      {loading && <p className="text-sm text-gray-500">Cargando…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      {status?.connected ? (
        <div className="space-y-2">
          <p className="text-sm text-green-700">
            ✅ Conectado como: <b>{status.email}</b>
          </p>
          <button
            onClick={onDisconnect}
            className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
            disabled={loading}
          >
            Desconectar Google
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">No has conectado Google Calendar.</p>
          <a
            href={CONNECT_URL}
            className="inline-block px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
          >
            Conectar con Google Calendar
          </a>
        </div>
      )}
    </div>
  );
}
