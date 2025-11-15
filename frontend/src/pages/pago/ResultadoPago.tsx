import { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

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
      message:
        "Estamos esperando la confirmación del pago. Si ya pagaste, actualiza esta página en unos segundos.",
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
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-[#fff6ec] via-white to-[#ffe9d3] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#c14421]/30 shadow-[0_18px_45px_rgba(0,0,0,0.18)] px-7 py-7">
        {/* Logo arriba a la izquierda */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-20 w-20 rounded-2xl bg-white flex items-center justify-center">
            <img
              src="/img/logo.webp" // ajusta esta ruta según tu proyecto
              alt="Logo"
              className="h-20 w-20 object-contain"
            />
          </div>
        </div>

        {/* Contenido */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icono de estado */}
          <div className="flex items-center justify-center">
            {info.ok ? (
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#ffb26a]/25 border border-[#c14421]/30">
                <FaCheckCircle className="text-[#c14421]" size={26} />
              </div>
            ) : (
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border border-red-200">
                <FaTimesCircle className="text-red-600" size={26} />
              </div>
            )}
          </div>

          {/* Título y mensaje */}
          <div className="space-y-2">
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: "#1e1e1e" }}
            >
              {info.title}
            </h1>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              {info.message}
            </p>
          </div>

          {/* Tips según resultado */}
          {info.ok ? (
            <div className="mt-2 rounded-2xl bg-[#ffb26a]/25 border border-[#c14421]/30 px-4 py-3 text-xs text-gray-600 text-left w-full">
              <p className="font-semibold mb-1" style={{ color: "#1e1e1e" }}>
                ¿Qué puedes hacer ahora?
              </p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Revisa el detalle de tu reserva en el apartado “Mis reservas”.</li>
                <li>Verifica tu correo para confirmar que recibiste el comprobante.</li>
              </ul>
            </div>
          ) : (
            <div className="mt-2 rounded-2xl bg-[#ffb26a]/25 border border-[#c14421]/30 px-4 py-3 text-xs text-gray-600 text-left w-full">
              <p className="font-semibold mb-1" style={{ color: "#1e1e1e" }}>
                ¿Necesitas ayuda?
              </p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Intenta nuevamente desde el botón “Ir al inicio”.</li>
                <li>
                  Si el cobro se realizó pero no ves tu reserva, contáctanos con el
                  comprobante de pago.
                </li>
              </ul>
            </div>
          )}

          {/* Botones */}
          <div className="mt-4 flex flex-wrap justify-center gap-3 w-full">
            <Link
              to="/"
              className="px-5 py-2 rounded-full border border-[#c14421]/30 text-sm font-medium hover:bg-[#ffb26a]/25 transition"
              style={{ color: "#1e1e1e" }}
            >
              Ir al inicio
            </Link>
            <Link
              to="/usuario/reservas"
              className="px-5 py-2 rounded-full text-sm font-semibold text-white shadow-md hover:shadow-lg transition"
              style={{ backgroundColor: "#c14421" }}
            >
              Ver mis reservas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
