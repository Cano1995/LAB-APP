import { aDMA, sumarDias } from "@/lib/fecha";
import { num } from "@/lib/num";
import { LOCALE } from "@/lib/formato";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { api, type InformeGpi, type LineaInforme } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import { Alert, Button, EmptyState, Input, SearchInput, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import { bajarCsv } from "@/lib/csv";

const aDM = (ymd: string) => ymd.split("-").reverse().slice(0, 2).join("/");
const MAX_DIAS = 31;

// Muestra el valor con los decimales de la variable (los guardados vienen como texto con ceros de relleno).
function fmt(s: string | undefined, dec?: number | null) {
  const n = num(s);
  if (n === null) return s === undefined || s === "" ? "" : s;
  return n.toLocaleString(LOCALE, { minimumFractionDigits: dec ?? 0, maximumFractionDigits: dec ?? 3 });
}

// Informes configurables (GI_LAB_CONF_REL_*): las variables del informe, en su orden, por día.
export default function InformesPage() {
  const [filtro, setFiltro] = useState("");
  const [idInforme, setIdInforme] = useState<number | null>(null);
  const [desde, setDesde] = useState<string | null>(null);
  const [hasta, setHasta] = useState<string | null>(null);

  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  const lista = useQuery({ queryKey: ["gpi-informes"], queryFn: () => api.gpi.informes() });

  // Por defecto: la última semana hasta el último día cerrado.
  const hastaEf = hasta ?? safra.data?.parametros?.FECHA_REAL ?? null;
  const desdeEf = desde ?? (hastaEf ? sumarDias(hastaEf, -6) : null);
  const dias = desdeEf && hastaEf ? Math.round((Date.parse(hastaEf) - Date.parse(desdeEf)) / 86400000) + 1 : 0;
  const rangoValido = dias >= 1 && dias <= MAX_DIAS;

  const informe = useQuery({
    queryKey: ["gpi-informe", idInforme, desdeEf, hastaEf],
    queryFn: () => api.gpi.informe(idInforme!, desdeEf!, hastaEf!),
    enabled: !!idInforme && rangoValido,
  });

  const filtrados = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    return (lista.data?.informes ?? []).filter((i) => !f || i.titulo.toLowerCase().includes(f) || (i.subtitulo ?? "").toLowerCase().includes(f));
  }, [lista.data, filtro]);
  const actual = lista.data?.informes.find((i) => i.id === idInforme) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Proceso Industrial (GPI)" }, { label: "Informes" }]} />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-72 shrink-0 flex-col border-r border-line bg-surface">
          <div className="shrink-0 border-b border-line p-3">
            <h2 className="section-label mb-2">Informes</h2>
            <SearchInput compact value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar informe…" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {lista.isLoading && <div className="p-4"><Spinner className="text-slate-400" /></div>}
            {lista.error && <Alert>{(lista.error as Error).message}</Alert>}
            {lista.data && filtrados.length === 0 && <EmptyState>Sin informes que coincidan.</EmptyState>}
            <ul>
              {filtrados.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => setIdInforme(i.id)}
                    aria-current={i.id === idInforme ? "true" : undefined}
                    className={cn(
                      "flex w-full flex-col rounded-md px-2.5 py-1.5 text-left transition-colors",
                      i.id === idInforme ? "bg-brand-100 shadow-[inset_2px_0_0_rgb(var(--link))]" : "hover:bg-slate-100",
                    )}
                  >
                    <span className={cn("truncate text-[13px]", i.id === idInforme ? "font-medium text-ink" : "text-ink")}>{i.titulo}</span>
                    <span className="truncate text-xs text-muted">#{i.id} · {i.variables} variable(s){i.subtitulo ? ` · ${i.subtitulo}` : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-canvas">
          <BarraHerramientas
            titulo={actual?.titulo ?? "Informes"}
            detalle={actual ? `${actual.subtitulo ? `${actual.subtitulo} · ` : ""}${desdeEf && hastaEf ? `${aDMA(desdeEf)} – ${aDMA(hastaEf)}` : ""}` : undefined}
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
                {informe.data && (
                  <Button variant="secondary" size="sm" onClick={() => exportarCsv(informe.data!)}>
                    <Download className="h-4 w-4" aria-hidden /> Exportar CSV
                  </Button>
                )}
              </div>
            )}
          </BarraHerramientas>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            {!actual && <EmptyState>Seleccione un informe de la lista.</EmptyState>}
            {actual && !rangoValido && <Alert>El rango debe ser de 1 a {MAX_DIAS} días y la fecha final no puede ser anterior a la inicial.</Alert>}
            {informe.error && <Alert>{(informe.error as Error).message}</Alert>}
            {informe.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
            {informe.data && <Grilla r={informe.data} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Grilla({ r }: { r: InformeGpi }) {
  return (
    <section className="panel overflow-auto">
      <table className="data-table w-auto min-w-full">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-slate-50">Variable</th>
            {r.fechas.map((f) => <th key={f} className="text-right tabular-nums">{aDM(f)}</th>)}
          </tr>
        </thead>
        <tbody>
          {r.lineas.map((l) => <Fila key={l.seq} l={l} fechas={r.fechas} />)}
        </tbody>
      </table>
    </section>
  );
}

function Fila({ l, fechas }: { l: LineaInforme; fechas: string[] }) {
  if (l.tipo === "espacio") return <tr aria-hidden><td colSpan={fechas.length + 1} className="h-3 p-0" /></tr>;
  if (l.tipo === "seccion" || l.tipo === "subtitulo") {
    return (
      <tr>
        <td
          colSpan={fechas.length + 1}
          className={cn(l.tipo === "seccion" ? "bg-slate-100 font-semibold text-ink" : "font-medium text-slate-700")}
          style={l.tipo === "seccion" && l.color ? { background: l.color, color: l.colorFuente ?? undefined } : undefined}
        >
          {l.texto}
        </td>
      </tr>
    );
  }
  const dec = l.variable?.decimales;
  return (
    <tr>
      <td className={cn("sticky left-0 bg-surface", l.negrita && "font-semibold")} title={l.variable ? `${l.variable.planNombre} · #${l.variable.id}` : undefined}>
        <span className="block max-w-72 truncate">{l.texto}{l.variable?.unidad ? <span className="text-muted"> ({l.variable.unidad})</span> : null}</span>
      </td>
      {fechas.map((f) => (
        <td key={f} className={cn("text-right tabular-nums", !l.habilitada && "text-muted")}>
          {l.habilitada ? fmt(l.valores?.[f], dec) : f === fechas[0] ? "sin acceso" : ""}
        </td>
      ))}
    </tr>
  );
}

function exportarCsv(r: InformeGpi) {
  const filas: (string | null)[][] = [["Variable", ...r.fechas]];
  for (const l of r.lineas) {
    if (l.tipo === "espacio") continue;
    if (l.tipo !== "variable") { filas.push([l.texto]); continue; }
    filas.push([l.texto, ...r.fechas.map((f) => (l.habilitada ? l.valores?.[f] ?? "" : ""))]);
  }
  bajarCsv(`informe-${r.id}.csv`, filas);
}
