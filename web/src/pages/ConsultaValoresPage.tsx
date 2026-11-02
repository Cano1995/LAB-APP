import { aDMA, sumarDias } from "@/lib/fecha";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, X } from "lucide-react";
import { api, type ValoresGpi, type VariableMeta } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import BuscadorVariables from "@/components/BuscadorVariables";
import LineChart, { aMs, PALETA, usePaleta, type SerieGrafico } from "@/components/LineChart";
import { Alert, Button, Checkbox, EmptyState, IconButton, Input, Select, Spinner } from "@/components/ui";
import { cn, mismos } from "@/lib/utils";
import { bajarCsv } from "@/lib/csv";

const MAX_VARIABLES = 30;

const etiqueta = (v: VariableMeta) => v.analisis || v.nombre;

// Valores de variables (FrmPesqVariavel) en consulta: variables elegidas × rango de fechas, resultado diario o acumulado.
export default function ConsultaValoresPage() {
  const tn = usePaleta();
  const [elegidas, setElegidas] = useState<VariableMeta[]>([]);
  const [eje, setEje] = useState<Record<number, 1 | 2>>({});
  const [desde, setDesde] = useState<string | null>(null);
  const [hasta, setHasta] = useState<string | null>(null);
  const [acumulado, setAcumulado] = useState(false);
  const [consulta, setConsulta] = useState<{ ids: number[]; desde: string; hasta: string; acumulado: boolean } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  const guardadas = useQuery({ queryKey: ["gpi-consultas"], queryFn: () => api.gpi.consultas() });

  // Por defecto: los últimos 30 días hasta el último día cerrado.
  const hastaEf = hasta ?? safra.data?.parametros?.FECHA_REAL ?? null;
  const desdeEf = desde ?? (hastaEf ? sumarDias(hastaEf, -29) : null);

  const resultado = useQuery({
    queryKey: ["gpi-valores", consulta],
    queryFn: () => api.gpi.valores(consulta!.ids, consulta!.desde, consulta!.hasta, consulta!.acumulado),
    enabled: !!consulta,
  });

  const agregar = (v: VariableMeta) => {
    if (elegidas.some((x) => x.id === v.id) || elegidas.length >= MAX_VARIABLES) return;
    setElegidas((x) => [...x, v]);
  };
  const quitar = (id: number) => setElegidas((x) => x.filter((v) => v.id !== id));

  async function cargarGuardada(codigo: string) {
    const g = guardadas.data?.consultas.find((c) => String(c.codigo) === codigo);
    if (!g) return;
    const ids = g.variables.slice(0, MAX_VARIABLES);
    try {
      const r = await api.gpi.variablesPorIds(ids);
      setElegidas(r.variables);
      setEje({});
      const avisos: string[] = [];
      if (g.variables.length > MAX_VARIABLES) avisos.push(`La consulta tiene ${g.variables.length} variables; se cargaron las primeras ${MAX_VARIABLES} (el máximo por consulta).`);
      if (r.variables.length < ids.length) avisos.push(`${ids.length - r.variables.length} variable(s) no están habilitadas para su usuario.`);
      setAviso(avisos.length ? avisos.join(" ") : null);
    } catch (e) {
      // Antes era una promesa rechazada sin manejar: el usuario no veía nada y la lista quedaba igual.
      setAviso(`No se pudo cargar la consulta guardada: ${e instanceof Error ? e.message : "error desconocido"}`);
    }
  }

  const consultar = () => {
    if (!elegidas.length || !desdeEf || !hastaEf) return;
    const nueva = { ids: elegidas.map((v) => v.id), desde: desdeEf, hasta: hastaEf, acumulado };
    if (mismos(nueva, consulta)) resultado.refetch(); else setConsulta(nueva); // mismos filtros: react-query no consultaría de nuevo
  };

  const series = useMemo<SerieGrafico[]>(() => {
    const r = resultado.data;
    if (!r) return [];
    return r.variables.map((v, i) => ({
      id: v.id,
      label: etiqueta(v),
      unidad: v.unidad,
      color: PALETA[i % PALETA.length],
      eje: eje[v.id] ?? 1,
      puntos: r.filas.flatMap((f) => {
        const y = Number(String(f.valores[v.id] ?? "").replace(",", "."));
        return f.valores[v.id] != null && f.valores[v.id] !== "" && Number.isFinite(y) ? [{ t: aMs(f.fecha), y }] : [];
      }),
    }));
  }, [resultado.data, eje]);

  const rangoValido = !!desdeEf && !!hastaEf && desdeEf <= hastaEf;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Proceso Industrial (GPI)" }, { label: "Valores de variables" }]} />

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-96 shrink-0 flex-col border-r border-line bg-surface">
          <div className="shrink-0 space-y-3 border-b border-line p-3">
            <div>
              <h2 className="section-label mb-1.5">Consulta guardada</h2>
              <Select
                compact
                aria-label="Consulta guardada"
                className="w-full"
                value=""
                onChange={(e) => e.target.value && cargarGuardada(e.target.value)}
              >
                <option value="">{guardadas.isLoading ? "Cargando…" : `Cargar variables de… (${guardadas.data?.consultas.length ?? 0})`}</option>
                {guardadas.data?.consultas.map((c) => (
                  <option key={c.codigo} value={c.codigo}>{c.descripcion}</option>
                ))}
              </Select>
            </div>
            <div>
              <h2 className="section-label mb-1.5">Agregar variables</h2>
              <BuscadorVariables elegidas={elegidas.map((v) => v.id)} onElegir={agregar} max={MAX_VARIABLES} />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <section className="p-3">
              <h2 className="section-label mb-2">Variables elegidas ({elegidas.length}/{MAX_VARIABLES})</h2>
              {aviso && <div className="mb-2"><Alert tone="warning">{aviso}</Alert></div>}
              {elegidas.length === 0 && <p className="text-[13px] text-muted">Busque una variable o cargue una consulta guardada.</p>}
              <ul className="space-y-1">
                {elegidas.map((v, i) => (
                  <li key={v.id} className="flex items-center gap-2 rounded-md border border-line px-2 py-1.5">
                    <span className="h-0.5 w-4 shrink-0 rounded" style={{ background: tn(PALETA[i % PALETA.length]) }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-ink">{etiqueta(v)}</span>
                      <span className="block truncate text-xs text-muted">{v.planNombre}{v.unidad ? ` · ${v.unidad}` : ""}</span>
                    </span>
                    <span role="group" aria-label={`Eje de ${etiqueta(v)}`} className="flex shrink-0 overflow-hidden rounded border border-control text-xs">
                      {([1, 2] as const).map((e) => (
                        <button
                          key={e}
                          type="button"
                          aria-pressed={(eje[v.id] ?? 1) === e}
                          onClick={() => setEje((x) => ({ ...x, [v.id]: e }))}
                          className={cn("px-1.5 py-0.5", (eje[v.id] ?? 1) === e ? "bg-brand-800 text-white" : "bg-surface text-slate-600 hover:bg-slate-100")}
                        >
                          {e}
                        </button>
                      ))}
                    </span>
                    <IconButton label="Quitar" className="h-7 w-7" onClick={() => quitar(v.id)}>
                      <X className="h-4 w-4" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-canvas">
          <BarraHerramientas titulo="Valores de variables" detalle={consulta ? `${aDMA(consulta.desde)} – ${aDMA(consulta.hasta)}${consulta.acumulado ? " · acumulado de zafra" : " · resultado diario"}` : undefined}>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-[13px] text-slate-700">
                Desde
                <Input compact type="date" className="w-36" value={desdeEf ?? ""} onChange={(e) => setDesde(e.target.value || null)} />
              </label>
              <label className="flex items-center gap-1.5 text-[13px] text-slate-700">
                Hasta
                <Input compact type="date" className="w-36" value={hastaEf ?? ""} onChange={(e) => setHasta(e.target.value || null)} />
              </label>
              <Checkbox label="Acumulado de zafra" checked={acumulado} onChange={(e) => setAcumulado(e.target.checked)} />
              <Button size="sm" onClick={consultar} disabled={!elegidas.length || !rangoValido} loading={resultado.isFetching}>
                Consultar
              </Button>
            </div>
          </BarraHerramientas>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            {!consulta && <EmptyState>Elija variables y un rango de fechas, y presione Consultar.</EmptyState>}
            {desdeEf && hastaEf && desdeEf > hastaEf && <Alert>La fecha final es anterior a la inicial.</Alert>}
            {resultado.error && <Alert>{(resultado.error as Error).message}</Alert>}
            {resultado.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
            {resultado.data && <Resultado r={resultado.data} series={series} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Resultado({ r, series }: { r: ValoresGpi; series: SerieGrafico[] }) {
  return (
    <div className="space-y-4">
      {r.aviso && <Alert tone="info">{r.aviso}</Alert>}
      {r.filas.length > 0 && (
        <>
          <section className="panel p-4">
            <LineChart series={series} />
          </section>

          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h2 className="panel-title">Valores · {r.filas.length} día(s)</h2>
              <Button variant="secondary" size="sm" onClick={() => descargarCsv(r)}>
                <Download className="h-4 w-4" aria-hidden /> Exportar CSV
              </Button>
            </div>
            <div className="max-h-[28rem] overflow-auto">
              <table className="data-table w-auto min-w-full">
                <thead>
                  <tr>
                    <th className="left-0 z-20">Fecha</th>
                    {r.variables.map((v) => (
                      <th key={v.id} className="text-right" title={`${v.planNombre} · #${v.id}`}>
                        <span className="ml-auto block max-w-48 truncate">{etiqueta(v)}</span>
                        {v.unidad && <span className="ml-auto block font-normal text-muted">{v.unidad}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.filas.map((f) => (
                    <tr key={f.fecha} className="bg-surface hover:bg-slate-50">
                      <td className="sticky left-0 bg-inherit tabular-nums">{aDMA(f.fecha)}</td>
                      {r.variables.map((v) => (
                        <td key={v.id} className="text-right tabular-nums">{f.valores[v.id] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// Exporta lo que se ve (separador ";", coma decimal y BOM para que Excel lo abra bien en español).
function descargarCsv(r: ValoresGpi) {
  const encabezado = ["Fecha", ...r.variables.map((v) => `${etiqueta(v)}${v.unidad ? ` (${v.unidad})` : ""}`)];
  const filas = r.filas.map((f) => [aDMA(f.fecha), ...r.variables.map((v) => f.valores[v.id] ?? "")]);
  bajarCsv(`valores-${r.filas[0].fecha}_${r.filas[r.filas.length - 1].fecha}.csv`, [encabezado, ...filas]);
}
