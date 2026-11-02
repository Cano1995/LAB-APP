import { aDMA } from "@/lib/fecha";
import { LOCALE } from "@/lib/formato";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { api, type CepGpi, type VariableMeta } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import BuscadorVariables, { etiquetaVariable } from "@/components/BuscadorVariables";
import LineChart, { aMs, type SerieGrafico } from "@/components/LineChart";
import { Alert, Button, Dato, EmptyState, Field, IconButton, Input, Select, Spinner } from "@/components/ui";
import { mismos } from "@/lib/utils";

const fmt = (n: number | null | undefined, d = 3) => (n === null || n === undefined ? "—" : n.toLocaleString(LOCALE, { maximumFractionDigits: d }));

interface Consulta { id: number; hasta: string; muestras: number; tam: number; lse: string; lie: string }

// Control estadístico del proceso (FrmCEP) en consulta: carta X̄–R (o individuales) de los últimos N resultados diarios.
export default function CepPage() {
  const [params] = useSearchParams();
  const [variable, setVariable] = useState<VariableMeta | null>(null);
  const [hasta, setHasta] = useState<string | null>(params.get("hasta"));
  const [muestras, setMuestras] = useState(params.get("muestras") ?? "30");
  const [tam, setTam] = useState(params.get("tam") ?? "1");
  const [lse, setLse] = useState(params.get("lse") ?? "");
  const [lie, setLie] = useState(params.get("lie") ?? "");
  const [consulta, setConsulta] = useState<Consulta | null>(null);

  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  const hastaEf = hasta ?? safra.data?.parametros?.FECHA_REAL ?? null;

  // Enlace desde el panel: ?id=…&lse=…&lie=…&muestras=…
  const idUrl = Number(params.get("id")) || null;
  const desdeUrl = useQuery({
    queryKey: ["gpi-var-ids", idUrl],
    queryFn: () => api.gpi.variablesPorIds([idUrl!]),
    enabled: !!idUrl,
  });
  useEffect(() => {
    const v = desdeUrl.data?.variables[0];
    if (v) setVariable((x) => x ?? v);
  }, [desdeUrl.data]);

  const n = Number(muestras);
  const valido = !!variable && !!hastaEf && Number.isInteger(n) && n >= 4 && n <= 400;
  const resultado = useQuery({
    queryKey: ["gpi-cep", consulta],
    queryFn: () => api.gpi.cep(consulta!),
    enabled: !!consulta,
  });

  const calcular = () => {
    if (!valido) return;
    const nueva = { id: variable!.id, hasta: hastaEf!, muestras: n, tam: Number(tam), lse, lie };
    if (mismos(nueva, consulta)) resultado.refetch(); else setConsulta(nueva); // mismos filtros: react-query no consultaría de nuevo
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Proceso Industrial (GPI)" }, { label: "Control estadístico (CEP)" }]} />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface p-3">
          <div>
            <h2 className="section-label mb-1.5">Variable</h2>
            {variable && (
              <div className="mb-2 flex items-center gap-2 rounded-md border border-line px-2 py-1.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">{etiquetaVariable(variable)}</span>
                  <span className="block truncate text-xs text-muted">{variable.planNombre}{variable.unidad ? ` · ${variable.unidad}` : ""}</span>
                </span>
                <IconButton label="Quitar" className="h-7 w-7" onClick={() => setVariable(null)}><X className="h-4 w-4" /></IconButton>
              </div>
            )}
            <BuscadorVariables elegidas={variable ? [variable.id] : []} onElegir={setVariable} max={1} />
          </div>

          <div className="space-y-3">
            <h2 className="section-label">Parámetros</h2>
            <Field label="Último día">
              <Input compact type="date" value={hastaEf ?? ""} onChange={(e) => setHasta(e.target.value || null)} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Muestras (días)" hint="4 a 400">
                <Input compact inputMode="numeric" value={muestras} onChange={(e) => setMuestras(e.target.value)} />
              </Field>
              <Field label="Subgrupo">
                <Select compact value={tam} onChange={(e) => setTam(e.target.value)}>
                  <option value="1">1 (individuales)</option>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => <option key={k} value={k}>{k}</option>)}
                </Select>
              </Field>
              <Field label="Límite inferior (LIE)">
                <Input compact inputMode="decimal" value={lie} onChange={(e) => setLie(e.target.value)} />
              </Field>
              <Field label="Límite superior (LSE)">
                <Input compact inputMode="decimal" value={lse} onChange={(e) => setLse(e.target.value)} />
              </Field>
            </div>
            <Button size="sm" onClick={calcular} disabled={!valido} loading={resultado.isFetching}>Calcular</Button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-canvas">
          <BarraHerramientas
            titulo="Control estadístico del proceso"
            detalle={resultado.data ? `${etiquetaVariable(resultado.data.variable)} · últimas ${resultado.data.serie.length} muestras hasta ${aDMA(resultado.data.hasta)}` : undefined}
          />
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {!consulta && <EmptyState>Elija una variable y presione Calcular.</EmptyState>}
            {resultado.error && <Alert>{(resultado.error as Error).message}</Alert>}
            {resultado.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
            {resultado.data && <Carta r={resultado.data} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Carta({ r }: { r: CepGpi }) {
  const c = r.carta;
  const graficos = useMemo(() => {
    if (c.error || !c.x || !c.r) return null;
    const tam = c.tam ?? 1;
    const ult = r.serie.length - 1;
    // Fecha de cada punto: individuales → su día; subgrupos → el último día del subgrupo; rango móvil → el día del segundo punto.
    const fx = c.x.puntos.map((_, i) => r.serie[Math.min(ult, tam === 1 ? i : i * tam + tam - 1)].fecha);
    const fr = c.r.puntos.map((_, i) => r.serie[Math.min(ult, tam === 1 ? i + 1 : i * tam + tam - 1)].fecha);
    const pts = (xs: (number | null)[], fs: string[]) => xs.flatMap((y, i) => (y === null ? [] : [{ t: aMs(fs[i]), y }]));
    const refX = [
      { y: c.x.lc!, label: "LC", color: "#166534" },
      { y: c.x.lcs!, label: "LCS", color: "#B91C1C", punteada: true },
      { y: c.x.lci!, label: "LCI", color: "#B91C1C", punteada: true },
      ...(r.lse !== null ? [{ y: r.lse, label: "LSE", color: "#B45309" }] : []),
      ...(r.lie !== null ? [{ y: r.lie, label: "LIE", color: "#B45309" }] : []),
    ];
    const x: SerieGrafico = {
      id: "x", label: tam === 1 ? "Valores individuales" : "Media de subgrupo (X̄)", unidad: r.variable.unidad, color: "#1D4ED8", eje: 1,
      puntos: pts(c.x.puntos, fx), referencias: refX, destacados: c.x.fuera.map((i) => aMs(fx[i])),
    };
    const rg: SerieGrafico = {
      id: "r", label: tam === 1 ? "Rango móvil" : "Rango (R)", unidad: r.variable.unidad, color: "#6D28D9", eje: 1,
      puntos: pts(c.r.puntos, fr),
      referencias: [
        { y: c.r.lc!, label: "R̄", color: "#166534" },
        { y: c.r.lcs!, label: "LCS", color: "#B91C1C", punteada: true },
      ],
    };
    return { x, rg };
  }, [r, c]);

  if (c.error) return <Alert tone="warning">{c.error} (hay {c.n} muestras con valor; pruebe con más días o un subgrupo menor).</Alert>;
  const fuera = c.x?.fuera.length ?? 0;
  const cap = c.capacidad;
  return (
    <div className="space-y-4">
      <section className="panel grid grid-cols-2 gap-x-6 gap-y-3 p-4 sm:grid-cols-4 lg:grid-cols-6">
        <Dato t="Muestras" v={String(c.n)} />
        <Dato t="Media" v={fmt(c.media)} />
        <Dato t="Desvío" v={fmt(c.desvio)} />
        <Dato t="σ dentro de subgrupos" v={fmt(c.sigma)} />
        <Dato t="Mínimo / máximo" v={`${fmt(c.min)} / ${fmt(c.max)}`} />
        <Dato t="Puntos fuera de control" v={String(fuera)} alerta={fuera > 0} />
        {cap && <>
          {cap.cp !== undefined && <Dato t="Cp" v={fmt(cap.cp)} />}
          {cap.cpl !== undefined && <Dato t="Cpl" v={fmt(cap.cpl)} />}
          {cap.cpu !== undefined && <Dato t="Cpu" v={fmt(cap.cpu)} />}
          {cap.cpk !== undefined && <Dato t="Cpk" v={fmt(cap.cpk)} alerta={cap.cpk !== null && cap.cpk < 1} />}
        </>}
      </section>
      {graficos && (
        <>
          <section className="panel p-4">
            <h2 className="panel-title mb-2">{graficos.x.label}{r.variable.unidad ? ` (${r.variable.unidad})` : ""}</h2>
            <LineChart series={[graficos.x]} alto={280} />
          </section>
          <section className="panel p-4">
            <h2 className="panel-title mb-2">{graficos.rg.label}</h2>
            <LineChart series={[graficos.rg]} alto={200} />
          </section>
        </>
      )}
      <p className="text-xs text-muted">
        Carta X̄–R: LC = media de las medias, LCS/LCI = LC ± A₂·R̄; capacidad con σ = R̄/d₂ (constantes estándar de control de calidad).
        Se usan los resultados diarios de la variable. El GATEC viejo no guarda estos resultados, por lo que no se pudo contrastar contra su pantalla.
      </p>
    </div>
  );
}

