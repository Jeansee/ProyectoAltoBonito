import { useEffect, useMemo, useRef, useState } from "react";
import { getRecursoAvailability, getRecursoSlots } from "@/services/recursos.service";

type Mode = "POR_HORA" | "BLOQUE" | "DIA_COMPLETO";

export interface SlotPickerValue {
  fecha: string;         // YYYY-MM-DD
  desde?: string;        // ISO
  hasta?: string;        // ISO
}

// helpers
function fmt24(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}
function firstDayOfMonthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; // YYYY-MM
}
function monthBoundsUTC(keyYYYYMM: string) {
  const [y, m] = keyYYYYMM.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const last = new Date(Date.UTC(y, m, 0, 0, 0, 0, 0));
  return { first, last };
}

export default function SlotPicker({
  recursoId,
  mode,
  step = 60,
  value,
  onChange,
}: {
  recursoId: string;
  mode: Mode;
  step?: number;
  value: SlotPickerValue;
  onChange: (v: SlotPickerValue) => void;
}) {
  // --- fecha base estable
  const todayStr = useMemo(() => ymd(new Date()), []);
  const fecha: string = value?.fecha ?? todayStr; // <- asegura string

  // ==== HORA/BLOQUE ====
  const [slots, setSlots] = useState<{ inicio: string; fin: string; busy: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (mode === "DIA_COMPLETO") return;
    let alive = true;
    (async () => {
      try {
        setLoadingSlots(true);
        const res = await getRecursoSlots(recursoId, fecha, step);
        if (!alive) return;
        setSlots(res.slots);
      } finally {
        if (alive) setLoadingSlots(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [recursoId, fecha, step, mode]);

  const libres = useMemo(() => slots.filter((s) => !s.busy), [slots]);

  function clickSlot(idx: number) {
    const s = libres[idx];
    if (!s) return;

    if (mode === "POR_HORA") {
      onChange({ fecha, desde: s.inicio, hasta: s.fin });
    } else if (mode === "BLOQUE") {
      const currentDesde = value?.desde;
      const currentHasta = value?.hasta;

      if (!currentDesde || (currentDesde && currentHasta)) {
        onChange({ fecha, desde: s.inicio, hasta: undefined });
      } else {
        const startIdx = libres.findIndex((x) => x.inicio === currentDesde);
        const endIdx = idx;
        if (startIdx === -1 || endIdx < startIdx) {
          onChange({ fecha, desde: s.inicio, hasta: undefined });
          return;
        }
        const contiguo = libres.slice(startIdx, endIdx + 1);
        let ok = true;
        for (let k = 0; k < contiguo.length - 1; k++) {
          if (contiguo[k].fin !== contiguo[k + 1].inicio) {
            ok = false;
            break;
          }
        }
        if (!ok) {
          onChange({ fecha, desde: s.inicio, hasta: undefined });
          return;
        }
        onChange({ fecha, desde: contiguo[0].inicio, hasta: contiguo[contiguo.length - 1].fin });
      }
    }
  }

  function handleFechaChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ fecha: e.target.value as string }); // <- explicita string
  }

  // ==== DÍA COMPLETO ====
  const initialMonthKey = useMemo(() => {
    const d = new Date(`${fecha}T00:00:00.000Z`);
    return firstDayOfMonthKey(d);
  }, [fecha]);

  const [monthKey, setMonthKey] = useState(initialMonthKey);
  const [monthDays, setMonthDays] = useState<{ date: string; available: boolean }[]>([]);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const cacheRef = useRef<Map<string, { date: string; available: boolean }[]>>(new Map());

  useEffect(() => {
    if (mode !== "DIA_COMPLETO") return;
    let alive = true;

    const cached = cacheRef.current.get(monthKey);
    if (cached) {
      setMonthDays(cached);
      return;
    }

    const { first, last } = monthBoundsUTC(monthKey);
    const from = ymd(first);
    const to = ymd(last);

    (async () => {
      try {
        setLoadingMonth(true);
        const res = await getRecursoAvailability(recursoId, from, to, "DIA_COMPLETO");
        if (!alive) return;
        cacheRef.current.set(monthKey, res.days);
        setMonthDays(res.days);
      } finally {
        if (alive) setLoadingMonth(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [recursoId, monthKey, mode]);

  const monthGrid = useMemo(() => {
    if (monthDays.length === 0) return [];
    const { first } = monthBoundsUTC(monthKey);
    const startW = first.getUTCDay();
    const daysInMonth = monthDays.length;

    const cells: { ymd?: string; available?: boolean }[] = [];
    for (let i = 0; i < startW; i++) cells.push({});
    for (let i = 0; i < daysInMonth; i++) {
      cells.push({
        ymd: monthDays[i].date,
        available: monthDays[i].available,
      });
    }
    while (cells.length % 7 !== 0) cells.push({});
    return cells;
  }, [monthDays, monthKey]);

  function nextMonth() {
    const [Y, M] = monthKey.split("-").map(Number);
    const d = new Date(Date.UTC(Y, M - 1, 1));
    d.setUTCMonth(d.getUTCMonth() + 1);
    setMonthKey(firstDayOfMonthKey(d));
  }
  function prevMonth() {
    const [Y, M] = monthKey.split("-").map(Number);
    const d = new Date(Date.UTC(Y, M - 1, 1));
    d.setUTCMonth(d.getUTCMonth() - 1);
    setMonthKey(firstDayOfMonthKey(d));
  }

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
      {mode !== "DIA_COMPLETO" && (
        <>
          <label className="block text-sm text-gray-600 mb-2">Fecha</label>
          <input
            type="date"
            className="px-3 py-2 rounded-lg border w-full mb-4"
            value={fecha}
            min={todayStr}
            onChange={handleFechaChange}
          />
        </>
      )}

      {mode === "DIA_COMPLETO" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <button className="px-2 py-1 rounded border text-sm hover:bg-amber-100" onClick={prevMonth}>◀</button>
            <div className="font-semibold text-amber-800">{monthKey}</div>
            <button className="px-2 py-1 rounded border text-sm hover:bg-amber-100" onClick={nextMonth}>▶</button>
          </div>

          {loadingMonth ? (
            <p className="text-sm text-gray-600">Cargando disponibilidad…</p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
                <div className="text-center">Dom</div>
                <div className="text-center">Lun</div>
                <div className="text-center">Mar</div>
                <div className="text-center">Mié</div>
                <div className="text-center">Jue</div>
                <div className="text-center">Vie</div>
                <div className="text-center">Sáb</div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthGrid.map((c, i) => {
                  if (!c.ymd) return <div key={i} className="h-10" />;

                  const isPast = c.ymd < todayStr;
                  const selected = value.fecha === c.ymd;
                  const disabled = isPast || !c.available;

                  return (
                    <button
                      key={c.ymd}
                      disabled={disabled}
                      onClick={() => onChange({ fecha: c.ymd!, desde: undefined, hasta: undefined })} // <- !
                      className={`h-10 rounded-lg border text-sm transition
                        ${disabled
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : selected
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white text-amber-900 border-amber-200 hover:bg-amber-100"
                        }`}
                      title={c.available ? "Disponible" : "No disponible"}
                    >
                      {Number(c.ymd.slice(8, 10))}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {mode !== "DIA_COMPLETO" && (
        <>
          {loadingSlots ? (
            <p className="text-sm text-gray-600">Cargando horarios…</p>
          ) : libres.length === 0 ? (
            <p className="text-sm text-gray-600">Sin horarios configurados o disponibles.</p>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-2">Horarios disponibles ({libres.length} libres)</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {libres.map((s, idx) => {
                  const active =
                    (value.desde && value.hasta && s.inicio >= value.desde && s.fin <= value.hasta) ||
                    (value.desde && !value.hasta && s.inicio === value.desde);

                  return (
                    <button
                      key={s.inicio}
                      onClick={() => clickSlot(idx)}
                      className={`text-sm px-3 py-2 rounded-lg border transition ${
                        active
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white hover:bg-amber-100 border-amber-200 text-amber-900"
                      }`}
                      title={`${fmt24(s.inicio)} – ${fmt24(s.fin)}`}
                    >
                      {fmt24(s.inicio)} – {fmt24(s.fin)}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
