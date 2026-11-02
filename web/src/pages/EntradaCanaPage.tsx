import { aDMA } from "@/lib/fecha";
import { LOCALE } from "@/lib/formato";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type EntradaCanaGpi, type FilaEntrada } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import { Alert, Button, Dato, EmptyState, Input, Spinner } from "@/components/ui";
import { mismos } from "@/lib/utils";

const hora = (iso: string) => `${aDMA(iso.slice(0, 10))} ${iso.slice(11, 16)}`;
const fmt = (n: number | null | undefined, d = 2) => (n === null || n === undefined ? "—" : n.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d }));

interface Filtros { desde: string | null; hasta: string | null; comprobante: string; canero: string }

// Entrada de caña (balanza) en consulta: pesadas de caña con su cañero, origen y el análisis promedio de su acumulado.
export default function EntradaCanaPage() {
  const [f, setF] = useState<Filtros>({ desde: null, hasta: null, comprobante: "", canero: "" });
  const [aplicado, setAplicado] = useState<Filtros>(f);

  const r = useQuery({
    queryKey: ["lab-entrada-cana", aplicado],
    queryFn: () => api.lab.entradaCana({ desde: aplicado.desde ?? undefined, hasta: aplicado.hasta ?? undefined, comprobante: aplicado.comprobante.trim() || undefined, canero: aplicado.canero.trim() || undefined }),
  });
  const desdeEf = f.desde ?? r.data?.desde ?? "";
  const hastaEf = f.hasta ?? r.data?.hasta ?? "";
  // Con los mismos filtros react-query no ve ningún cambio en la clave y no consulta: se fuerza el refresco.
  const consultar = () => {
    const nuevo = { ...f, desde: f.desde ?? r.data?.desde ?? null, hasta: f.hasta ?? r.data?.hasta ?? null };
    if (mismos(nuevo, aplicado)) r.refetch(); else setAplicado(nuevo);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Laboratorio de recepción" }, { label: "Entrada de caña" }]} />
      <BarraHerramientas
        titulo="Entrada de caña"
        detalle={r.data?.desde ? `${aDMA(r.data.desde)}${r.data.hasta !== r.data.desde ? ` – ${aDMA(r.data.hasta!)}` : ""}` : undefined}
      >
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[13px] text-slate-700">
            Desde
            <Input compact type="date" className="w-36" value={desdeEf} onChange={(e) => setF({ ...f, desde: e.target.value || null })} />
          </label>
          <label className="flex items-center gap-1.5 text-[13px] text-slate-700">
            Hasta
            <Input compact type="date" className="w-36" value={hastaEf} onChange={(e) => setF({ ...f, hasta: e.target.value || null })} />
          </label>
          <Input compact inputMode="numeric" className="w-32" placeholder="Comprobante" aria-label="Comprobante" value={f.comprobante} onChange={(e) => setF({ ...f, comprobante: e.target.value })} />
          <Input compact className="w-44" placeholder="Cañero (nombre)" aria-label="Cañero" value={f.canero} onChange={(e) => setF({ ...f, canero: e.target.value })} />
          <Button size="sm" onClick={consultar} loading={r.isFetching}>Consultar</Button>
        </div>
      </BarraHerramientas>

      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
        {r.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
        {r.error && <Alert>{(r.error as Error).message}</Alert>}
        {r.data && r.data.resumen.camiones === 0 && <EmptyState>No hay entradas de caña con esos filtros.</EmptyState>}
        {r.data && r.data.resumen.camiones > 0 && <Contenido d={r.data} />}
      </div>
    </div>
  );
}

function Contenido({ d }: { d: EntradaCanaGpi }) {
  const s = d.resumen;
  return (
    <div className="space-y-4">
      <section className="panel grid grid-cols-2 gap-x-6 gap-y-3 p-4 sm:grid-cols-3">
        <Dato t="Camiones" v={s.camiones.toLocaleString(LOCALE)} />
        <Dato t="Toneladas netas" v={fmt(s.toneladas)} />
        <Dato t="Cañeros" v={String(s.caneros ?? "—")} />
      </section>
      {d.truncado && <Alert tone="warning">Se muestran las 500 pesadas más recientes; acote las fechas o los filtros para ver el resto. El resumen cuenta todas.</Alert>}
      <section className="panel overflow-auto">
        <table className="data-table w-auto min-w-full">
          <thead>
            <tr>
              <th>Salida</th><th className="text-right">Comprobante</th><th>Cañero</th><th>Finca</th><th>Parcela</th><th>Variedad</th><th>Corte</th>
              <th className="text-right">Toneladas</th><th className="text-right">Acumulado</th><th className="text-right">Análisis</th><th className="text-right">Brix</th><th className="text-right">Pol</th><th className="text-right">ATR</th>
            </tr>
          </thead>
          <tbody>{d.filas.map((x) => <Fila key={x.comprobante} x={x} />)}</tbody>
        </table>
      </section>
      <p className="text-xs text-muted">
        Peso neto = bruto − tara + descuentos, con los mismos filtros que usa el GPI (movimiento de compra, entrada de caña, con peso de entrada y salida). El acumulado agrupa
        pesadas y análisis (no es un análisis por camión): Brix, Pol y ATR son el promedio simple de los análisis completados de su acumulado. Estos totales de balanza no coinciden con la
        «caña ingresada» del GPI, que se digita aparte.
      </p>
    </div>
  );
}

function Fila({ x }: { x: FilaEntrada }) {
  return (
    <tr>
      <td className="tabular-nums">{hora(x.salida)}</td>
      <td className="text-right tabular-nums">{x.comprobante}</td>
      <td title={x.codCanero ? `Código ${x.codCanero}` : undefined}><span className="block max-w-56 truncate">{x.canero ?? "—"}</span></td>
      <td>{x.finca ?? ""}</td>
      <td>{x.parcela ?? ""}</td>
      <td>{x.variedad ?? ""}</td>
      <td>{x.tipoCorte ?? ""}</td>
      <td className="text-right tabular-nums">{fmt(x.toneladas)}</td>
      <td className="text-right tabular-nums text-muted">{x.acumulado ?? ""}</td>
      <td className="text-right tabular-nums">{x.analisis ? x.analisis.cantidad : ""}</td>
      <td className="text-right tabular-nums">{x.analisis ? fmt(x.analisis.brix) : ""}</td>
      <td className="text-right tabular-nums">{x.analisis ? fmt(x.analisis.pol) : ""}</td>
      <td className="text-right tabular-nums">{x.analisis ? fmt(x.analisis.atr) : ""}</td>
    </tr>
  );
}

