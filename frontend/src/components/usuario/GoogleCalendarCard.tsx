import { useEffect, useState } from "react";
import { getGoogleStatus, disconnectGoogle } from "@/services/google.service";

type Props = { userId: string };

export default function GoogleCalendarCard({ userId }: Props) {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setErr(null);
      setLoading(true);
      const s = await getGoogleStatus(userId);
      setConnected(s.connected);
      setEmail(s.email);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "No se pudo consultar el estado de Google Calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

  const startConnect = () => {
    // Lanza el flujo de OAuth con scope de Calendar
    window.location.href = "/api/auth/google/start-calendar";
  };

  const handleDisconnect = async () => {
    try {
      setErr(null);
      setLoading(true);
      await disconnectGoogle(userId);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || "No se pudo desconectar Google Calendar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1e1e1e]">Google Calendar</h3>
          <p className="text-sm text-gray-500">
            {loading
              ? "Cargando estado…"
              : connected
              ? `Conectado${email ? ` como ${email}` : ""}.`
              : "No has conectado Google Calendar."}
          </p>
        </div>

        {!connected ? (
          <button
            onClick={startConnect}
            disabled={loading}
            className="rounded-full bg-[#c14421] px-4 py-2 text-white hover:bg-[#1e1e1e] disabled:opacity-60"
          >
            Conectar con Google Calendar
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="rounded-full border px-4 py-2 text-[#c14421] hover:bg-red-50 disabled:opacity-60"
          >
            Desconectar
          </button>
        )}
      </div>

      {err && (
        <p className="mt-3 text-sm text-red-600">
          {err}
        </p>
      )}
    </div>
  );
}
