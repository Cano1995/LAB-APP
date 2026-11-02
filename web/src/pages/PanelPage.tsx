import { aDMA } from "@/lib/fecha";
import { num } from "@/lib/num";
import { LOCALE } from "@/lib/formato";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type EspecificacionVar, type PanelGpi, type VariableMeta } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import { Alert, Badge, EmptyState, Input, Spinner } from "@/components/ui";

const etiqueta = (v: VariableMeta) => v.analisis || v.nombre;
const fmt = (s: string | undefined) => (s === undefined || s === "" ? "—" : (num(s) ?? s).toLocaleString(LOCALE, { maximumFractionDigits: 4 }));

// Estado de un valor frente a su especificación (los extremos pueden ser inclusivos o exclusivos).
function estado(v: number | null, e: EspecificacionVar | null): "ok" | "fuera" | "sin" {
  if (v === null || !e || (e.min === null && e.max === null)) return "sin";
  const bajo = e.min !== null && (e.minIncl ? v < e.min : v <= e.min);
  const alto = e.max !== null && (e.maxIncl ? v > e.max : v >= e.max);
  return bajo || alto ? "fuera" : "ok";
}

// Panel de información (frmPainel) en consulta: lo que cada usuario dejó configurado en el GATEC viejo.
export default function PanelPage() {
  const [fecha, setFecha] = useState<string | null>(null);
  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  const dia = fecha ?? safra.data?.parametros?.DIA_ACTUAL ?? null;

  const panel = useQuery({ queryKey: ["gpi-panel", dia], queryFn: () => api.gpi.panel(dia ?? undefined), enabled: !!dia });
  const refresco = panel.data?.preferencias ? Math.max(10, panel.data.preferencias.segundosActualiza) * 1000 : false;

  const ids = useMemo(() => {
    const p = panel.data;
    return p ? [...new Set([...p.variables, ...p.fueraEspecificacion].map((v) => v.id))].slice(0, 30) : [];
  }, [panel.data]);
  const diario = useQuery({
    queryKey: ["gpi-panel-diario", ids, dia],
    queryFn: () => api.gpi.valores(ids, dia!, dia!, false),
    enabled: ids.length > 0 && !!dia,
    refetchInterval: refresco,
  });
  const acum = useQuery({
    queryKey: ["gpi-panel-acum", ids, dia],
    queryFn: () => api.gpi.valores(ids, dia!, dia!, true),
    enabled: ids.length > 0 && !!dia,
    refetchInterval: refresco,
  });
  const valorDe = (r: typeof diario.data, id: number) => r?.filas[0]?.valores[String(id)];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Proceso Industrial (GPI)" }, { label: "Panel de información" }]} />
      <BarraHerramientas
        titulo="Panel de información"
        detalle={dia ? `Día ${aDMA(dia)}${refresco ? ` · se actualiza cada ${refresco / 1000} s` : ""}` : undefined}
      >
        <label className="flex items-center gap-1.5 text-[13px] text-slate-700">
          Fecha
          <Input compact type="date" className="w-36" value={dia ?? ""} onChange={(e) => setFecha(e.target.value || null)} />
        </label>
      </BarraHerramientas>

      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
        {panel.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
        {panel.error && <Alert>{(panel.error as Error).message}</Alert>}
        {(diario.error || acum.error) && (
          <div className="mb-4"><Alert>No se pudieron cargar los valores del día y el acumulado: {((diario.error || acum.error) as Error).message}</Alert></div>
        )}
        {panel.data && !panel.data.configurado && (
          <EmptyState>Su usuario no tiene un panel configurado en el GATEC. Se arma desde el panel del sistema viejo; aquí se ve en solo consulta.</EmptyState>
        )}
        {panel.data?.configurado && <Contenido p={panel.data} dia={dia!} diario={diario.data} acum={acum.data} valorDe={valorDe} cargando={diario.isLoading || acum.isLoading} />}
      </div>
    </div>
  );
}

type Respuesta = Awaited<ReturnType<typeof api.gpi.valores>>;

function Contenido({ p, dia, diario, acum, valorDe, cargando }: {
  p: PanelGpi; dia: string; diario?: Respuesta; acum?: Respuesta; valorDe: (r: Respuesta | undefined, id: number) => string | undefined; cargando: boolean;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {p.variables.length > 0 && (
        <section className="panel overflow-hidden">
          <h2 className="panel-title px-4 pt-3">Variables ({p.variables.length})</h2>
          <table className="data-table">
            <thead><tr><th>Variable</th><th className="text-right">Día</th><th className="text-right">Acumulado de zafra</th></tr></thead>
            <tbody>
              {p.variables.map((v) => (
                <tr key={v.id}>
                  <td><span className="block truncate" title={`${v.planNombre} · #${v.id}`}>{etiqueta(v)}{v.unidad && <span className="text-muted"> ({v.unidad})</span>}</span></td>
                  <td className="text-right tabular-nums">{cargando ? "…" : fmt(valorDe(diario, v.id))}</td>
                  <td className="text-right tabular-nums">{cargando ? "…" : fmt(valorDe(acum, v.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {p.fueraEspecificacion.length > 0 && (
        <section className="panel overflow-hidden">
          <h2 className="panel-title px-4 pt-3">Seguimiento de especificación ({p.fueraEspecificacion.length})</h2>
          <table className="data-table">
            <thead><tr><th>Variable</th><th className="text-right">Día</th><th className="text-right">Especificación</th><th>Estado</th></tr></thead>
            <tbody>
              {p.fueraEspecificacion.map((v) => {
                const val = num(valorDe(diario, v.id));
                const e = v.especificacion;
                const est = estado(val, e);
                return (
                  <tr key={v.id}>
                    <td><span className="block truncate" title={`${v.planNombre} · #${v.id}`}>{etiqueta(v)}</span></td>
                    <td className="text-right tabular-nums">{cargando ? "…" : fmt(valorDe(diario, v.id))}</td>
                    <td className="text-right tabular-nums text-muted">{e ? `${e.min ?? "—"} a ${e.max ?? "—"}` : "—"}</td>
                    <td>{est === "fuera" ? <Badge tone="danger">Fuera</Badge> : est === "ok" ? <Badge tone="success">Dentro</Badge> : <span className="text-muted">s/d</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {p.cep.length > 0 && (
        <section className="panel overflow-hidden">
          <h2 className="panel-title px-4 pt-3">Gráficos CEP ({p.cep.length})</h2>
          <ul className="divide-y divide-line">
            {p.cep.map((c) => (
              <li key={c.variable.id}>
                <Link
                  to={`/gpi/cep?id=${c.variable.id}&hasta=${dia}&muestras=${c.muestras ?? 30}${c.lse !== null ? `&lse=${c.lse}` : ""}${c.lie !== null ? `&lie=${c.lie}` : ""}`}
                  className="flex items-center justify-between gap-3 px-4 py-2 text-[13px] hover:bg-brand-50"
                >
                  <span className="min-w-0 truncate text-ink">{etiqueta(c.variable)}</span>
                  <span className="shrink-0 text-xs text-muted">{c.lie ?? "—"} a {c.lse ?? "—"} · {c.muestras ?? "—"} muestras</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.diagnostico.length > 0 && (
        <section className="panel overflow-hidden">
          <h2 className="panel-title px-4 pt-3">Diagnóstico ({p.diagnostico.length})</h2>
          <ul className="divide-y divide-line">
            {p.diagnostico.map((v) => <li key={v.id} className="px-4 py-2 text-[13px] text-ink">{etiqueta(v)} <span className="text-xs text-muted">· {v.planNombre}</span></li>)}
          </ul>
          <p className="px-4 pb-3 text-xs text-muted">Reglas de diagnóstico (valores fuera, nulos o repetidos) pendientes de la pantalla de configuración.</p>
        </section>
      )}

      {p.reportes.length > 0 && (
        <section className="panel overflow-hidden">
          <h2 className="panel-title px-4 pt-3">Reportes y consultas ({p.reportes.length})</h2>
          <ul className="divide-y divide-line">
            {p.reportes.map((r) => (
              <li key={`${r.tipo}-${r.codigo}`} className="flex items-center justify-between gap-3 px-4 py-2 text-[13px]">
                {r.tipo === "SU"
                  ? <Link to={`/gpi/supervisorio?codigo=${r.codigo}`} className="min-w-0 truncate text-link hover:underline">{r.titulo ?? `Supervisorio ${r.codigo}`}</Link>
                  : <span className="min-w-0 truncate text-ink">{r.titulo ?? `Código ${r.codigo}`}</span>}
                <span className="shrink-0 text-xs text-muted">{NOMBRE_TIPO[r.tipo] ?? r.tipo}</span>
              </li>
            ))}
          </ul>
          <p className="px-4 pb-3 text-xs text-muted">Los reportes aún no migrados (sprint 6) se listan sin enlace.</p>
        </section>
      )}
    </div>
  );
}

// Tipos de reporte del panel (GI_LAB_PAINEL_REL.PNR_TIPO), inferidos de los nombres de los controles de frmPainel (cmdExcluirRelGeral, Bolet, Supervisorio…).
const NOMBRE_TIPO: Record<string, string> = { SU: "Supervisorio", BO: "Boletín", RG: "Reporte general", RE: "Reporte de empresa", RS: "Reporte resumen", CG: "Consulta gerencial", VS: "Valores de variables" };
