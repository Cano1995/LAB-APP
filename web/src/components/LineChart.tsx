import { LOCALE } from "@/lib/formato";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTema } from "@/lib/tema";

// Gráfico de líneas en SVG (sin dependencias): eje de tiempo, hasta dos ejes de valores, líneas de límite,
// leyenda que muestra/oculta series y tooltip con los valores más cercanos al cursor.

// Paleta categórica: distinguible entre sí y con contraste suficiente sobre blanco (≥ 4,5:1 en todos).
export const PALETA = ["#1A3A8F", "#166534", "#B45309", "#B91C1C", "#6D28D9", "#0E7490", "#475569", "#BE185D"];

export interface SerieGrafico {
  id: string | number;
  label: string;
  unidad?: string | null;
  color: string;
  eje: 1 | 2;
  puntos: { t: number; y: number }[]; // t = milisegundos (hora local tratada como UTC, sin zona)
  limInf?: number | null;
  limSup?: number | null;
  escala?: { min: number; max: number } | null; // rango configurado del eje (el dato fuera de rango lo amplía)
  // Líneas horizontales de referencia (p. ej. línea central y límites de control de una carta CEP).
  referencias?: { y: number; label: string; color: string; punteada?: boolean }[];
  destacados?: number[]; // t de los puntos a resaltar (p. ej. fuera de control)
}

// Las series traen colores pensados para fondo blanco; sobre el tema oscuro se usa su versión clara (mismo matiz, mismo orden).
const EN_OSCURO: Record<string, string> = {
  "#1A3A8F": "#7FA6FF", "#166534": "#4ADE80", "#B45309": "#FBBF24", "#B91C1C": "#F87171", "#6D28D9": "#A78BFA", "#0E7490": "#22D3EE", "#475569": "#94A3B8", "#BE185D": "#F472B6", "#1D4ED8": "#60A5FA",
};
export const tinte = (c: string, tema: string) => (tema === "oscuro" ? EN_OSCURO[c.toUpperCase()] ?? c : c);

/** Para pintar fuera del gráfico (leyendas) el mismo color que usa el gráfico en el tema actual. */
export const usePaleta = () => { const t = useTema(); return (c: string) => tinte(c, t); };

const MARGEN = { sup: 12, izq: 58, der: 16, der2: 58, inf: 28 };

// 'AAAA-MM-DDTHH:MM' → ms (hora local tratada como UTC: sin corrimientos por zona horaria).
// Acepta 'AAAA-MM-DD', 'AAAA-MM-DDTHH:MM' y variantes con segundos, milisegundos o zona; si no reconoce el formato devuelve NaN
// (los puntos sin tiempo válido se descartan más abajo: antes un formato inesperado dejaba el gráfico en blanco).
export const aMs = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(iso);
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), m[4] ? Number(m[4]) : 0, m[5] ? Number(m[5]) : 0) : NaN;
};

const dos = (n: number) => String(n).padStart(2, "0");
const fmtFecha = (ms: number, conHora: boolean) => {
  const d = new Date(ms);
  const f = `${dos(d.getUTCDate())}/${dos(d.getUTCMonth() + 1)}`;
  return conHora ? `${f} ${dos(d.getUTCHours())}:${dos(d.getUTCMinutes())}` : f;
};
const fmtNum = (v: number) => v.toLocaleString(LOCALE, { maximumFractionDigits: 4 });

// Marcas "bonitas" (1, 2, 5 × 10ⁿ) y dominio que las contiene.
function escalaNice(min: number, max: number, n = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { lo: 0, hi: 1, marcas: [0, 0.5, 1] };
  if (min === max) { min -= 1; max += 1; }
  const crudo = (max - min) / n;
  const mag = 10 ** Math.floor(Math.log10(crudo));
  const r = crudo / mag;
  const paso = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / paso) * paso;
  const hi = Math.ceil(max / paso) * paso;
  const marcas: number[] = [];
  for (let v = lo; v <= hi + paso / 2; v += paso) marcas.push(Number(v.toPrecision(12)));
  return { lo, hi, marcas };
}

export default function LineChart({ series: seriesEntrada, alto = 320, className }: { series: SerieGrafico[]; alto?: number; className?: string }) {
  // Los puntos sin tiempo o sin valor finito (p. ej. una fecha en un formato inesperado → NaN) se descartan: antes dejaban el gráfico en blanco sin avisar.
  const tema = useTema();
  const series = useMemo(
    () => seriesEntrada.map((s) => ({
      ...s,
      color: tinte(s.color, tema),
      referencias: s.referencias?.map((r) => ({ ...r, color: tinte(r.color, tema) })),
      puntos: s.puntos.filter((p) => Number.isFinite(p.t) && Number.isFinite(p.y)),
    })),
    [seriesEntrada, tema],
  );
  const descId = useId();
  const cont = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(800);
  const [ocultas, setOcultas] = useState<Set<string | number>>(new Set());
  const [cursor, setCursor] = useState<number | null>(null); // x en píxeles dentro del SVG

  useEffect(() => {
    const el = cont.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAncho(Math.max(320, Math.floor(el.clientWidth))));
    ro.observe(el);
    setAncho(Math.max(320, Math.floor(el.clientWidth)));
    return () => ro.disconnect();
  }, []);

  const visibles = useMemo(() => series.filter((s) => !ocultas.has(s.id) && s.puntos.length > 0), [series, ocultas]);
  const hayEje2 = visibles.some((s) => s.eje === 2);

  const geom = useMemo(() => {
    const ts = visibles.flatMap((s) => s.puntos.map((p) => p.t));
    if (!ts.length) return null;
    let tMin = ts.reduce((a, b) => Math.min(a, b), Infinity);
    let tMax = ts.reduce((a, b) => Math.max(a, b), -Infinity);
    if (tMin === tMax) { tMin -= 3600_000; tMax += 3600_000; }
    const dominio = (eje: 1 | 2) => {
      const ss = visibles.filter((s) => s.eje === eje);
      if (!ss.length) return null;
      const vals = ss.flatMap((s) => [
        ...s.puntos.map((p) => p.y),
        ...(s.limInf != null ? [s.limInf] : []),
        ...(s.limSup != null ? [s.limSup] : []),
        ...(s.referencias ?? []).map((r) => r.y),
        ...(s.escala ? [s.escala.min, s.escala.max] : []),
      ]);
      return escalaNice(vals.reduce((a, b) => Math.min(a, b), Infinity), vals.reduce((a, b) => Math.max(a, b), -Infinity));
    };
    return { tMin, tMax, e1: dominio(1), e2: dominio(2), conHora: tMax - tMin <= 4 * 86400_000 };
  }, [visibles]);

  // Margen lateral: lo que ocupa la etiqueta más larga del eje (≈ 6,5 px por carácter a 11 px) más aire.
  const anchoEtiquetas = (d: { marcas: number[] } | null | undefined) =>
    d ? 16 + 6.5 * Math.max(...d.marcas.map((m) => fmtNum(m).length)) : 0;
  const izq = Math.max(MARGEN.izq, anchoEtiquetas(geom?.e1));
  const der = hayEje2 ? Math.max(MARGEN.der2, anchoEtiquetas(geom?.e2)) : MARGEN.der;
  const w = ancho - izq - der;
  const h = alto - MARGEN.sup - MARGEN.inf;

  const x = (t: number) => (geom ? izq + ((t - geom.tMin) / (geom.tMax - geom.tMin)) * w : 0);
  const yEje = (eje: 1 | 2, v: number) => {
    const d = eje === 1 ? geom?.e1 : geom?.e2;
    if (!d) return 0;
    return MARGEN.sup + h - ((v - d.lo) / (d.hi - d.lo)) * h;
  };

  // Marcas del eje X (≈ 6).
  const marcasX = useMemo(() => {
    if (!geom) return [];
    const n = Math.max(2, Math.min(7, Math.floor(w / 110)));
    return Array.from({ length: n }, (_, i) => geom.tMin + ((geom.tMax - geom.tMin) * i) / (n - 1));
  }, [geom, w]);

  // Tooltip: punto más cercano al cursor en cada serie visible.
  const hover = useMemo(() => {
    if (cursor == null || !geom) return null;
    const t = geom.tMin + ((cursor - izq) / w) * (geom.tMax - geom.tMin);
    const filas = visibles.flatMap((s) => {
      let mejor = s.puntos[0];
      for (const p of s.puntos) if (Math.abs(p.t - t) < Math.abs(mejor.t - t)) mejor = p;
      return Math.abs(mejor.t - t) <= (geom.tMax - geom.tMin) * 0.06 ? [{ s, p: mejor }] : [];
    });
    if (!filas.length) return null;
    const tRef = filas.reduce((a, b) => (Math.abs(b.p.t - t) < Math.abs(a.p.t - t) ? b : a)).p.t;
    return { tRef, filas };
  }, [cursor, geom, visibles, izq, w]);

  // Capa fija: ejes, rejilla, límites, referencias y series. El cursor solo cambia la capa de encima, así que mover el mouse no la recalcula.
  const capaFija = useMemo(() => {
    if (!geom) return null;
    return (
      <>
            {/* Rejilla y eje izquierdo */}
            {geom.e1?.marcas.map((m) => (
              <g key={`g1-${m}`}>
                <line x1={izq} x2={izq + w} y1={yEje(1, m)} y2={yEje(1, m)} className="stroke-line" />
                <text x={izq - 8} y={yEje(1, m)} textAnchor="end" dominantBaseline="middle" fontSize="11" className="fill-muted">
                  {fmtNum(m)}
                </text>
              </g>
            ))}
            {/* Eje derecho */}
            {geom.e2?.marcas.map((m) => (
              <text key={`g2-${m}`} x={izq + w + 8} y={yEje(2, m)} dominantBaseline="middle" fontSize="11" className="fill-muted">
                {fmtNum(m)}
              </text>
            ))}
            {/* Eje X */}
            <line x1={izq} x2={izq + w} y1={MARGEN.sup + h} y2={MARGEN.sup + h} className="stroke-slate-400" />
            {marcasX.map((t, i) => (
              <text key={t} x={x(t)} y={MARGEN.sup + h + 17} textAnchor={i === 0 ? "start" : i === marcasX.length - 1 ? "end" : "middle"} fontSize="11" className="fill-muted">
                {fmtFecha(t, geom.conHora)}
              </text>
            ))}

            {/* Límites */}
            {visibles.flatMap((s) =>
              [["inf", s.limInf], ["sup", s.limSup]].flatMap(([k, v]) =>
                v == null ? [] : [
                  <line key={`${s.id}-${k}`} x1={izq} x2={izq + w} y1={yEje(s.eje, v as number)} y2={yEje(s.eje, v as number)} stroke={s.color} strokeDasharray="5 4" strokeOpacity="0.7" />,
                ],
              ),
            )}

            {/* Referencias (línea central, límites de control y de especificación) */}
            {visibles.flatMap((s) =>
              (s.referencias ?? []).map((r) => (
                <g key={`${s.id}-ref-${r.label}`}>
                  <line x1={izq} x2={izq + w} y1={yEje(s.eje, r.y)} y2={yEje(s.eje, r.y)} stroke={r.color} strokeWidth="1.25" strokeDasharray={r.punteada ? "5 4" : undefined} />
                  <text x={izq + w - 3} y={yEje(s.eje, r.y) - 3} textAnchor="end" fontSize="10" fill={r.color}>{r.label}</text>
                </g>
              )),
            )}

            {/* Series */}
            {visibles.map((s) => {
              const pts = [...s.puntos].sort((a, b) => a.t - b.t);
              const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${yEje(s.eje, p.y).toFixed(1)}`).join(" ");
              return (
                <g key={s.id}>
                  <path d={d} fill="none" stroke={s.color} strokeWidth="1.75" strokeLinejoin="round" />
                  {pts.map((p) => {
                    const marcado = s.destacados?.includes(p.t);
                    if (!marcado && pts.length > 80) return null;
                    return marcado
                      ? <circle key={p.t} cx={x(p.t)} cy={yEje(s.eje, p.y)} r="4" className="fill-danger stroke-surface" strokeWidth="1" />
                      : <circle key={p.t} cx={x(p.t)} cy={yEje(s.eje, p.y)} r="2.5" className="fill-surface" stroke={s.color} strokeWidth="1.5" />;
                  })}
                </g>
              );
            })}

      </>
    );
    // x, yEje y fmt* se derivan de estas dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geom, visibles, ancho, izq, w, h, marcasX]);

  const alternar = (id: string | number) =>
    setOcultas((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  return (
    <div className={className}>
      <div ref={cont} className="relative">
        {!geom ? (
          <div className="grid place-items-center text-[13px] text-muted" style={{ height: alto }}>
            Sin datos para graficar en el período.
          </div>
        ) : (
          <>
            <svg
              width={ancho}
              height={alto}
              role="img"
              aria-label={`Gráfico de ${visibles.map((s) => s.label).join(", ")}`}
              aria-describedby={descId}
              onMouseMove={(e) => setCursor(e.clientX - e.currentTarget.getBoundingClientRect().left)}
              onMouseLeave={() => setCursor(null)}
            >
              {capaFija}

              {/* Cursor */}
              {hover && (
                <g pointerEvents="none">
                  <line x1={x(hover.tRef)} x2={x(hover.tRef)} y1={MARGEN.sup} y2={MARGEN.sup + h} className="stroke-muted" strokeDasharray="3 3" />
                  {hover.filas.map(({ s, p }) => (
                    <circle key={s.id} cx={x(p.t)} cy={yEje(s.eje, p.y)} r="4" fill={s.color} className="stroke-surface" strokeWidth="1.5" />
                  ))}
                </g>
              )}
            </svg>
            {/* El tooltip es solo para mouse: lectores de pantalla y teclado reciben un resumen (cantidad, mínimo, máximo, último y puntos fuera de control). */}
            <p id={descId} className="sr-only">
              {visibles.map((serie) => {
                const pts = serie.puntos;
                if (!pts.length) return null;
                let min = pts[0], max = pts[0], ult = pts[0];
                for (const p of pts) { if (p.y < min.y) min = p; if (p.y > max.y) max = p; if (p.t > ult.t) ult = p; }
                const en = (p: { t: number; y: number }) => `${fmtNum(p.y)} el ${fmtFecha(p.t, geom.conHora)}`;
                const fuera = serie.destacados?.length ? `; ${serie.destacados.length} punto(s) fuera de control` : "";
                return `${serie.label}: ${pts.length} puntos; mínimo ${en(min)}; máximo ${en(max)}; último ${en(ult)}${fuera}. `;
              })}
            </p>

            {hover && (
              <div
                className="pointer-events-none absolute z-10 min-w-40 rounded-md border border-line bg-surface px-2.5 py-2 text-xs shadow-md"
                style={{ left: Math.min(Math.max(x(hover.tRef) + 12, 0), ancho - 190), top: MARGEN.sup }}
              >
                <div className="mb-1 font-semibold text-ink">{fmtFecha(hover.tRef, true)}</div>
                {hover.filas.map(({ s, p }) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="h-0.5 w-3 rounded" style={{ background: s.color }} aria-hidden />
                      {s.label}
                    </span>
                    <span className="tabular-nums text-ink">{fmtNum(p.y)}{s.unidad ? ` ${s.unidad}` : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {series.length > 1 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s) => {
            const off = ocultas.has(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => alternar(s.id)}
                  aria-pressed={!off}
                  className={cn("flex items-center gap-1.5 rounded px-1 py-0.5 text-xs hover:bg-slate-100", off ? "text-slate-500 line-through" : "text-slate-700")}
                >
                  <span className="h-0.5 w-4 rounded" style={{ background: off ? "rgb(var(--slate-300))" : s.color }} aria-hidden />
                  {s.label}
                  {s.unidad ? <span className="text-muted">({s.unidad})</span> : null}
                  {s.eje === 2 && <span className="rounded bg-slate-100 px-1 text-[10px] text-slate-600">eje 2</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
