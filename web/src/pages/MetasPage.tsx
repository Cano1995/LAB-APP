import { aDMA } from "@/lib/fecha";
import { LOCALE } from "@/lib/formato";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type FilaMeta, type PeriodoMeta } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import { Alert, Badge, EmptyState, Input, Select, Spinner } from "@/components/ui";

const PERIODOS: { valor: PeriodoMeta; texto: string }[] = [
  { valor: "diario", texto: "Diario" },
  { valor: "quincenal", texto: "Quincenal (en curso)" },
  { valor: "mensual", texto: "Mensual (en curso)" },
  { valor: "acumulado", texto: "Acumulado de zafra" },
];
const fmt = (n: number | null, dec?: number | null) => (n === null ? "—" : n.toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: dec ?? 2 }));

// Real x Metas (frmRelatoriosMetas): el resultado de cada variable con meta frente a su meta del período.
export default function MetasPage() {
  const [fecha, setFecha] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoMeta>("diario");
  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  const dia = fecha ?? safra.data?.parametros?.FECHA_REAL ?? null;
  const r = useQuery({ queryKey: ["gpi-metas", dia, periodo], queryFn: () => api.gpi.metas(dia!, periodo), enabled: !!dia });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Proceso Industrial (GPI)" }, { label: "Real x Metas" }]} />
      <BarraHerramientas
        titulo="Real x Metas"
        detalle={r.data ? `${r.data.periodo === "diario" || r.data.periodo === "acumulado" ? aDMA(r.data.fecha) : `${aDMA(r.data.desde)} – ${aDMA(r.data.fecha)}`}` : undefined}
      >
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[13px] text-slate-700">
            Fecha
            <Input compact type="date" className="w-36" value={dia ?? ""} onChange={(e) => setFecha(e.target.value || null)} />
          </label>
          <Select compact aria-label="Período" value={periodo} onChange={(e) => setPeriodo(e.target.value as PeriodoMeta)}>
            {PERIODOS.map((p) => <option key={p.valor} value={p.valor}>{p.texto}</option>)}
          </Select>
        </div>
      </BarraHerramientas>

      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
        {r.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
        {r.error && <Alert>{(r.error as Error).message}</Alert>}
        {r.data && r.data.filas.length === 0 && <EmptyState>No hay metas cargadas para esta zafra y fecha (o ninguna de sus variables está habilitada para su usuario).</EmptyState>}
        {r.data && r.data.filas.length > 0 && (
          <section className="panel overflow-auto">
            <table className="data-table w-auto min-w-full">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th className="text-right">Meta</th>
                  <th className="text-right">Real</th>
                  <th className="text-right">Cumplimiento</th>
                  <th>Ideal</th>
                  <th>Estado</th>
                  <th>Vigente desde</th>
                </tr>
              </thead>
              <tbody>{r.data.filas.map((f) => <Fila key={f.variable.id} f={f} />)}</tbody>
            </table>
          </section>
        )}
        {r.data && (
          <p className="mt-3 text-xs text-muted">
            Rige la meta más reciente con vigencia hasta la fecha elegida; una meta en 0 se toma como «sin meta». Quincenal y mensual: suma (variables de tipo suma) o promedio de los días con
            dato desde el inicio del período; la meta es la del período completo, por eso el estado solo se evalúa en el día. Aproximación pendiente de contrastar con el GATEC.
          </p>
        )}
      </div>
    </div>
  );
}

function Fila({ f }: { f: FilaMeta }) {
  const dec = f.variable.decimales;
  return (
    <tr>
      <td title={`${f.variable.planNombre} · #${f.variable.id}${f.obs ? ` · ${f.obs}` : ""}`}>
        <span className="block max-w-72 truncate">{f.variable.analisis || f.variable.nombre}{f.variable.unidad ? <span className="text-muted"> ({f.variable.unidad})</span> : null}</span>
      </td>
      <td className="text-right tabular-nums">{fmt(f.meta, dec)}</td>
      <td className="text-right tabular-nums">{fmt(f.real, dec)}</td>
      <td className="text-right tabular-nums">{f.cumplimiento === null ? "—" : `${Math.round(f.cumplimiento)} %`}</td>
      <td className="text-muted">{f.ideal === "superior" ? "Más es mejor" : "Menos es mejor"}</td>
      <td>
        {f.cumple === true && <Badge tone="success">Cumple</Badge>}
        {f.cumple === false && <Badge tone="danger">No cumple</Badge>}
        {f.cumple === null && <span className="text-muted">—</span>}
      </td>
      <td className="tabular-nums text-muted">{aDMA(f.vigencia)}</td>
    </tr>
  );
}
