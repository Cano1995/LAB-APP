import { useId, useState } from "react";
import { LOCALE } from "@/lib/formato";
import { aDMA, sumarDias } from "@/lib/fecha";
import { cn } from "@/lib/utils";

export interface DiaBarra {
  fecha: string; // AAAA-MM-DD
  valor: number;
  detalle?: string;
}

const AN = 1060, AL = 220, MI = 44, MD = 8, MS = 10, MB = 24;
const nf = (n: number, d = 0) => n.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });

// Un número «redondo» por encima del máximo, para que el eje tenga marcas limpias.
function techo(max: number) {
  if (max <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(max));
  const f = max / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

// Barras por día calendario (los días sin dato quedan vacíos). Una sola serie: sin leyenda, el título del panel la nombra.
// Con tooltip por barra y una vista de tabla para lectores de pantalla y para quien prefiere los números.
export default function BarrasDiarias({ dias, hasta, cantidad, unidad, titulo }: { dias: DiaBarra[]; hasta: string; cantidad: number; unidad: string; titulo: string }) {
  const [activa, setActiva] = useState<number | null>(null);
  const [tabla, setTabla] = useState(false);
  const id = useId();
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const serie = Array.from({ length: cantidad }, (_, i) => {
    const f = sumarDias(hasta, i - (cantidad - 1));
    return { fecha: f, dato: porFecha.get(f) };
  });
  const max = techo(Math.max(...dias.map((d) => d.valor), 0));
  const w = (AN - MI - MD) / cantidad;
  const y = (v: number) => MS + (AL - MS - MB) * (1 - v / max);
  const marcas = [0, 0.5, 1].map((f) => f * max);
  const a = activa !== null ? serie[activa] : null;

  if (tabla) {
    return (
      <div>
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full text-[13px]">
            <caption className="sr-only">{titulo}</caption>
            <thead><tr className="text-left text-xs text-muted"><th className="py-1 font-medium">Fecha</th><th className="py-1 text-right font-medium">{unidad}</th><th className="py-1 pl-4 font-medium">Detalle</th></tr></thead>
            <tbody>
              {serie.map(({ fecha, dato }) => (
                <tr key={fecha} className="border-t border-line">
                  <td className="py-1">{aDMA(fecha)}</td>
                  <td className="py-1 text-right tabular-nums">{dato ? nf(dato.valor, 2) : "—"}</td>
                  <td className="py-1 pl-4 text-muted">{dato?.detalle ?? "Sin entradas"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => setTabla(false)} className="mt-2 text-xs text-link hover:underline">Ver gráfico</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${AN} ${AL}`} role="img" aria-labelledby={id} className="h-auto w-full" onMouseLeave={() => setActiva(null)}>
        <title id={id}>{titulo}</title>
        {marcas.map((m) => (
          <g key={m}>
            <line x1={MI} x2={AN - MD} y1={y(m)} y2={y(m)} className="stroke-line" strokeWidth={1} />
            <text x={MI - 6} y={y(m) + 4} textAnchor="end" fontSize={11} className="fill-muted">{nf(m)}</text>
          </g>
        ))}
        {serie.map(({ fecha, dato }, i) => {
          const x = MI + i * w;
          const bw = Math.max(w - 6, 4); // separación de 2 px a cada lado entre barras
          const h = dato ? Math.max(y(0) - y(dato.valor), 2) : 0;
          const bx = x + 3, by = y(0) - h, r = Math.min(4, bw / 2, h);
          return (
            <g key={fecha} onMouseEnter={() => setActiva(i)} onFocus={() => setActiva(i)} onBlur={() => setActiva(null)} tabIndex={dato ? 0 : -1} aria-label={dato ? `${aDMA(fecha)}: ${nf(dato.valor, 2)} ${unidad}` : undefined}>
              <rect x={x} y={0} width={w} height={AL - MB} fill="transparent" />
              {dato && (
                <path
                  d={`M${bx},${y(0)} V${by + r} Q${bx},${by} ${bx + r},${by} H${bx + bw - r} Q${bx + bw},${by} ${bx + bw},${by + r} V${y(0)} Z`}
                  className={activa === i ? "fill-brand-950" : "fill-brand-800"}
                />
              )}
              {(i % 2 === (cantidad - 1) % 2 || cantidad <= 8) && (
                <text x={x + w / 2} y={AL - 8} textAnchor="middle" fontSize={11} className="fill-muted">{fecha.slice(8)}/{fecha.slice(5, 7)}</text>
              )}
            </g>
          );
        })}
      </svg>

      {a && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `${Math.min(Math.max(((MI + (activa! + 0.5) * w) / AN) * 100, 9), 91)}%` }}
          role="status"
        >
          <div className="font-medium text-ink">{aDMA(a.fecha)}</div>
          <div className={cn("tabular-nums", a.dato ? "text-ink" : "text-muted")}>{a.dato ? `${nf(a.dato.valor, 2)} ${unidad}` : "Sin entradas"}</div>
          {a.dato?.detalle && <div className="text-muted">{a.dato.detalle}</div>}
        </div>
      )}
      <button type="button" onClick={() => setTabla(true)} className="mt-1 text-xs text-link hover:underline">Ver tabla</button>
    </div>
  );
}
