import { sumarDias } from "@/lib/fecha";
import { LOCALE } from "@/lib/formato";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { api, type SerieSupervisorio, type SupervisorioResumen } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import LineChart, { aMs, PALETA, type SerieGrafico } from "@/components/LineChart";
import { Alert, Button, Checkbox, EmptyState, Input, SearchInput, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

// Supervisorio (frmCockipit) en consulta: un gráfico por variable del panel, con su escala y sus límites.
export default function SupervisorioPage() {
  const [params] = useSearchParams();
  const [codigo, setCodigo] = useState<string | null>(params.get("codigo"));
  const [filtro, setFiltro] = useState("");
  const [desde, setDesde] = useState<string | null>(null);
  const [hasta, setHasta] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);

  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  const lista = useQuery({ queryKey: ["gpi-supervisorios"], queryFn: () => api.gpi.supervisorios() });

  // Por defecto: tres días terminando en el día actual de digitación.
  const hastaEf = hasta ?? safra.data?.parametros?.DIA_ACTUAL ?? null;
  const desdeEf = desde ?? (hastaEf ? sumarDias(hastaEf, -2) : null);
  const actual = lista.data?.supervisorios.find((s) => s.codigo === codigo) ?? null;

  const serie = useQuery({
    queryKey: ["gpi-sup-serie", codigo, desdeEf, hastaEf],
    queryFn: () => api.gpi.serieSupervisorio(codigo!, desdeEf!, hastaEf!),
    enabled: !!codigo && !!desdeEf && !!hastaEf && desdeEf <= hastaEf,
    // Como el cockpit original: se refresca cada SUP_TEMPO minutos, solo si el usuario lo pide.
    refetchInterval: auto && actual ? actual.minutos * 60_000 : false,
  });

  const filtrados = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    return (lista.data?.supervisorios ?? []).filter((s) => !f || s.descripcion.toLowerCase().includes(f) || s.codigo.includes(f));
  }, [lista.data, filtro]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Proceso Industrial (GPI)" }, { label: "Supervisorio" }]} />

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col border-r border-line bg-surface">
          <div className="shrink-0 border-b border-line p-3">
            <h2 className="section-label mb-2">Paneles</h2>
            <SearchInput compact value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar panel…" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {lista.isLoading && <div className="p-4"><Spinner className="text-slate-400" /></div>}
            {lista.error && <Alert>{(lista.error as Error).message}</Alert>}
            {lista.data && filtrados.length === 0 && <EmptyState>Sin paneles que coincidan.</EmptyState>}
            <ul>
              {filtrados.map((s) => (
                <ItemPanel key={s.codigo} s={s} elegido={s.codigo === codigo} onClick={() => setCodigo(s.codigo)} />
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-canvas">
          <BarraHerramientas
            titulo={actual?.descripcion ?? "Supervisorio"}
            detalle={actual ? `Código ${actual.codigo} · ${actual.variables} variable(s) · actualiza cada ${actual.minutos} min` : undefined}
          >
            {actual && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-[13px] text-slate-700">
                  Desde
                  <Input compact type="date" className="w-36" value={desdeEf ?? ""} onChange={(e) => setDesde(e.target.value || null)} />
                </label>
                <label className="flex items-center gap-1.5 text-[13px] text-slate-700">
                  Hasta
                  <Input compact type="date" className="w-36" value={hastaEf ?? ""} onChange={(e) => setHasta(e.target.value || null)} />
                </label>
                <Button variant="secondary" size="sm" loading={serie.isFetching} onClick={() => serie.refetch()}>
                  <RefreshCw className="h-4 w-4" aria-hidden /> Actualizar
                </Button>
                <Checkbox label={`Auto (${actual.minutos} min)`} checked={auto} onChange={(e) => setAuto(e.target.checked)} />
              </div>
            )}
          </BarraHerramientas>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            {!actual && <EmptyState>Seleccione un panel de la lista.</EmptyState>}
            {actual && desdeEf && hastaEf && desdeEf > hastaEf && <Alert>La fecha final es anterior a la inicial.</Alert>}
            {serie.error && <Alert>{(serie.error as Error).message}</Alert>}
            {serie.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
            {serie.data && (
              <div className="grid gap-4 xl:grid-cols-2">
                {serie.data.series.map((s, i) => <PanelVariable key={s.id} s={s} color={PALETA[i % PALETA.length]} />)}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ItemPanel({ s, elegido, onClick }: { s: SupervisorioResumen; elegido: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={elegido ? "true" : undefined}
        className={cn(
          "flex w-full flex-col rounded-md px-2.5 py-1.5 text-left transition-colors",
          elegido ? "bg-brand-100 shadow-[inset_2px_0_0_rgb(var(--link))]" : "hover:bg-slate-100",
        )}
      >
        <span className={cn("truncate text-[13px]", elegido ? "font-medium text-ink" : "text-ink")}>{s.descripcion}</span>
        <span className="text-xs text-muted">#{s.codigo} · {s.variables} variable(s)</span>
      </button>
    </li>
  );
}

function PanelVariable({ s, color }: { s: SerieSupervisorio; color: string }) {
  const grafico: SerieGrafico = {
    id: s.id,
    label: s.descripcion,
    unidad: s.unidad,
    color,
    eje: 1,
    puntos: s.puntos.map((p) => ({ t: aMs(p.t), y: p.y })),
    limInf: s.limiteInf,
    limSup: s.limiteSup,
    escala: s.min != null && s.max != null ? { min: s.min, max: s.max } : null,
  };
  const ultimo = s.puntos[s.puntos.length - 1];
  const fuera = ultimo && ((s.limiteInf != null && ultimo.y < s.limiteInf) || (s.limiteSup != null && ultimo.y > s.limiteSup));
  return (
    <section className="panel p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="panel-title truncate">{s.descripcion}</h2>
          <p className="text-xs text-muted">
            {s.unidad ? `${s.unidad} · ` : ""}
            {s.limiteInf != null || s.limiteSup != null ? `límites ${s.limiteInf ?? "—"} a ${s.limiteSup ?? "—"}` : "sin límites"}
            {s.porHoras === false ? " · por batelada (resultado del día)" : ""}
          </p>
        </div>
        {ultimo && (
          <span className={cn("shrink-0 rounded px-2 py-0.5 text-sm font-semibold tabular-nums", fuera ? "bg-red-50 text-red-700" : "bg-slate-100 text-ink")} title={fuera ? "Último valor fuera de límites" : "Último valor"}>
            {ultimo.y.toLocaleString(LOCALE, { maximumFractionDigits: 4 })}
          </span>
        )}
      </div>
      {!s.habilitada
        ? <p className="py-3 text-[13px] text-muted">La variable no está habilitada para su usuario.</p>
        : s.puntos.length === 0
          ? <p className="py-3 text-[13px] text-muted">Sin datos en el período.</p>
          : <LineChart series={[grafico]} alto={220} />}
    </section>
  );
}
