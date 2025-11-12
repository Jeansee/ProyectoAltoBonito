import { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function mapStatus(status?: string, resp?: string) {
  // status: AUTHORIZED | FAILED | INITIALIZED | null
  // resp: 0 (aprobado), !=0 (rechazado) – en integración
  const s = (status || "").toUpperCase();
  const r = typeof resp === "string" ? Number(resp) : NaN;

  if (s === "AUTHORIZED" && r === 0) {
    return {
      ok: true,
      title: "¡Pago realizado con éxito!",
      message: "Tu reserva ha sido confirmada. Te enviamos el detalle a tu correo.",
    };
  }

  if (s === "INITIALIZED") {
    return {
      ok: false,
      title: "Pago en proceso",
      message: "Estamos esperando la confirmación del pago. Si ya pagaste, actualiza esta página en unos segundos.",
    };
  }

  // Cancelación: nuestro backend redirige como ?status=CANCELED
  if (s === "CANCELED") {
    return {
      ok: false,
      title: "Pago cancelado",
      message: "Cancelaste el pago antes de autorizarlo.",
    };
  }

  return {
    ok: false,
    title: "Pago rechazado",
    message:
      r && !Number.isNaN(r)
        ? `Transacción rechazada (código ${r}).`
        : "La transacción no pudo ser autorizada.",
  };
}

export default function ResultadoPago() {
  const q = useQuery();
  const status = q.get("status") || undefined;
  const resp = q.get("resp") || undefined;
  const tokenWs = q.get("token_ws") || undefined;

  const info = mapStatus(status, resp);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-4">
          {info.ok ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <span className="text-green-600 text-lg">✓</span>
            </span>
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <span className="text-red-600 text-lg">!</span>
            </span>
          )}
          <h1 className="text-2xl font-bold text-amber-800">{info.title}</h1>
        </div>

        <p className="text-gray-700 mb-6">{info.message}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-gray-500">Estado</div>
            <div className="font-semibold">{status ?? "—"}</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-gray-500">Código respuesta</div>
            <div className="font-semibold">{resp ?? "—"}</div>
          </div>
        </div>

        {tokenWs && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 break-all text-xs text-gray-600">
            <div className="text-gray-500">token_ws</div>
            <div className="font-mono">{tokenWs}</div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Ir al inicio
          </Link>
          <Link
            to="/usuario/reservas"
            className="px-5 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow"
          >
            Ver mis reservas
          </Link>
        </div>

        {info.ok ? (
          <p className="mt-4 text-xs text-gray-500">
            * Si no ves tu reserva confirmada, actualiza la página o vuelve a entrar a “Mis reservas”.
          </p>
        ) : null}
      </div>
    </div>
  );
}
