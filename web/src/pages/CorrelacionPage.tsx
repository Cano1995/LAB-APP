import { aDMA, sumarDias } from "@/lib/fecha";
import { LOCALE } from "@/lib/formato";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { api, type CorrelacionGpi, type VariableMeta } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import BuscadorVariables, { etiquetaVariable } from "@/components/BuscadorVariables";
import { Alert, Button, EmptyState, Field, IconButton, Input, Spinner } from "@/components/ui";

const MAX_VARIABLES = 12;


// Correlación de Pearson entre los resultados diarios de las variables elegidas (frmCorrelacionaVar).
export default function CorrelacionPage() {
  const [elegidas, setElegidas] = useState<VariableMeta[]>([]);
  const [desde, setDesde] = useState<string | null>(null);
  const [hasta, setHasta] = useState<string | null>(null);
  const [consulta, setConsulta] = useState<{ ids: number[]; desde: string; hasta: string } | null>(null);

  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  const hastaEf = hasta ?? safra.data?.parametros?.FECHA_REAL ?? null;
  const desdeEf = desde ?? (hastaEf ? sumarDias(hastaEf, -59) : null);
  const rangoValido = !!desdeEf && !!hastaEf && desdeEf <= hastaEf;

  const resultado = useQuery({
    queryKey: ["gpi-correlacion", consulta],
    queryFn: () => api.gpi.correlacion(consulta!.ids, consulta!.desde, consulta!.hasta),
    enabled: !!consulta,
  });

  const agregar = (v: VariableMeta) => setElegidas((x) => (x.some((y) => y.id === v.id) || x.length >= MAX_VARIABLES ? x : [...x, v]));
  const calcular = () => {
    if (elegidas.length >= 2 && rangoValido) setConsulta({ ids: elegidas.map((v) => v.id), desde: desdeEf!, hasta: hastaEf! });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Proceso Industrial (GPI)" }, { label: "Correlación" }]} />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface p-3">
          <div>
            <h2 className="section-label mb-1.5">Agregar variables</h2>
            <BuscadorVariables elegidas={elegidas.map((v) => v.id)} onElegir={agregar} max={MAX_VARIABLES} />
          </div>
          <div>
            <h2 className="section-label mb-2">Variables elegidas ({elegidas.length}/{MAX_VARIABLES})</h2>
            {elegidas.length === 0 && <p className="text-[13px] text-muted">Elija al menos dos variables.</p>}
            <ul className="space-y-1">
              {elegidas.map((v, i) => (
                <li key={v.id} className="flex items-center gap-2 rounded-md border border-line px-2 py-1.5">
                  <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-ink">{etiquetaVariable(v)}</span>
                    <span className="block truncate text-xs text-muted">{v.planNombre}{v.unidad ? ` · ${v.unidad}` : ""}</span>
                  </span>
                  <IconButton label="Quitar" className="h-7 w-7" onClick={() => setElegidas((x) => x.filter((y) => y.id !== v.id))}>
                    <X className="h-4 w-4" />
                  </IconButton>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h2 className="section-label">Período</h2>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Desde"><Input compact type="date" value={desdeEf ?? ""} onChange={(e) => setDesde(e.target.value || null)} /></Field>
              <Field label="Hasta"><Input compact type="date" value={hastaEf ?? ""} onChange={(e) => setHasta(e.target.value || null)} /></Field>
            </div>
            <Button size="sm" onClick={calcular} disabled={elegidas.length < 2 || !rangoValido} loading={resultado.isFetching}>Calcular</Button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-canvas">
          <BarraHerramientas
            titulo="Correlación entre variables"
            detalle={resultado.data ? `${aDMA(resultado.data.desde)} – ${aDMA(resultado.data.hasta)} · ${resultado.data.dias} día(s) con datos` : undefined}
          />
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {!consulta && <EmptyState>Elija variables y un período, y presione Calcular.</EmptyState>}
            {desdeEf && hastaEf && desdeEf > hastaEf && <Alert>La fecha final es anterior a la inicial.</Alert>}
            {resultado.error && <Alert>{(resultado.error as Error).message}</Alert>}
            {resultado.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
            {resultado.data && <Matriz r={resultado.data} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Intensidad del color según |r|: verde si es directa, rojo si es inversa.
function fondo(r: number | null) {
  if (r === null) return undefined;
  const a = Math.min(1, Math.abs(r)) * 0.35; // fondo suave: el texto oscuro debe mantener contraste AA (≥ 4,5) sobre el color más intenso
  return r >= 0 ? `rgba(22,101,52,${a})` : `rgba(185,28,28,${a})`;
}
const intensidad = (r: number) => {
  const a = Math.abs(r);
  return a >= 0.8 ? "muy fuerte" : a >= 0.6 ? "fuerte" : a >= 0.4 ? "moderada" : a >= 0.2 ? "débil" : "muy débil";
};

function Matriz({ r }: { r: CorrelacionGpi }) {
  if (r.aviso && !r.matriz.length) return <Alert tone="warning">{r.aviso}</Alert>;
  const nombre = (v: VariableMeta) => etiquetaVariable(v);
  return (
    <div className="space-y-3">
      {r.aviso && <Alert tone="warning">{r.aviso}</Alert>}
      <section className="panel overflow-x-auto">
        <table className="data-table w-auto min-w-full">
          <thead>
            <tr>
              <th />
              {r.variables.map((v, j) => (
                <th key={v.id} className="text-right"><span className="ml-auto block max-w-40 truncate" title={nombre(v)}>{j + 1}. {nombre(v)}</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.variables.map((v, i) => (
              <tr key={v.id}>
                <th className="text-left font-medium"><span className="block max-w-56 truncate" title={nombre(v)}>{i + 1}. {nombre(v)}</span></th>
                {r.matriz[i].map((c, j) => (
                  <td
                    key={j}
                    className="text-right tabular-nums text-ink"
                    style={{ background: i === j ? undefined : fondo(c.r) }}
                    title={c.r === null ? "Sin pares suficientes (mínimo 3)" : `r = ${c.r} · ${intensidad(c.r)} · ${c.n} pares`}
                  >
                    {i === j ? <span className="text-muted">—</span> : c.r === null ? <span className="text-slate-700">s/d</span> : c.r.toLocaleString(LOCALE, { minimumFractionDigits: 3 })}
                    {i !== j && <span className="block text-[11px] text-slate-700">n={c.n}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="text-xs text-muted">
        Coeficiente de Pearson sobre los días en que ambas variables tienen resultado (mínimo 3 pares). Verde: relación directa; rojo: inversa.
        El GATEC viejo no guarda estos resultados, por lo que no se pudo contrastar contra su pantalla.
      </p>
    </div>
  );
}
