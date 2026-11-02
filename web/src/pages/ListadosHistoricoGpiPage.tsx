import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type VariableMeta } from "@/lib/api";
import { aDMA, sumarDias } from "@/lib/fecha";
import { LOCALE } from "@/lib/formato";
import { num } from "@/lib/num";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import BuscadorVariables, { etiquetaVariable } from "@/components/BuscadorVariables";
import { Alert, Badge, Button, EmptyState, Input, Select, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Acciones, bajar, fmt, TD, TH } from "@/pages/ListadosGpiPage";

export type TipoHistorico = "anotaciones" | "historico-valor" | "historico-variables" | "historico-especificacion";

const TITULOS: Record<TipoHistorico, string> = {
  anotaciones: "Listado de anotaciones",
  "historico-valor": "Listado del histórico de valor",
  "historico-variables": "Listado del histórico de variables",
  "historico-especificacion": "Listado del histórico de especificación",
};

// Listados del menú «Informes» que leen bitácoras y textos (solo lectura): anotaciones y los tres históricos.
// Las reglas son una interpretación de los formularios del GATEC (no hay fuente del VB6): por confirmar con un usuario (docs/validacion-con-usuarios.md, Parte 5).
export default function ListadosHistoricoGpiPage({ tipo }: { tipo: TipoHistorico }) {
  const titulo = TITULOS[tipo];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Proceso Industrial (GPI)" }, { label: "Informes" }, { label: titulo }]} />
      {tipo === "anotaciones" && <Anotaciones titulo={titulo} />}
      {tipo === "historico-valor" && <HistoricoValor titulo={titulo} />}
      {tipo === "historico-variables" && <HistoricoVariables titulo={titulo} />}
      {tipo === "historico-especificacion" && <HistoricoEspecificacion titulo={titulo} />}
    </div>
  );
}

// Período con valores por defecto: los últimos `dias` hasta la fecha real de la zafra.
function usePeriodo(dias: number) {
  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  const ref = safra.data?.parametros?.FECHA_REAL ?? null;
  const [desde, setDesde] = useState<string | null>(null);
  const [hasta, setHasta] = useState<string | null>(null);
  const h = hasta ?? ref;
  const d = desde ?? (ref ? sumarDias(ref, -dias) : null);
  const ok = !!d && !!h && d <= h;
  return { d, h, ok, setDesde, setHasta, cargando: safra.isLoading };
}

function CamposPeriodo({ p }: { p: ReturnType<typeof usePeriodo> }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted">
      Desde <Input compact type="date" aria-label="Desde" value={p.d ?? ""} onChange={(e) => e.target.value && p.setDesde(e.target.value)} className="w-36" />
      hasta <Input compact type="date" aria-label="Hasta" value={p.h ?? ""} onChange={(e) => e.target.value && p.setHasta(e.target.value)} className="w-36" />
    </div>
  );
}

function Estado({ cargando, error, aviso, truncado, total, mostradas, vacio }: { cargando: boolean; error: unknown; aviso?: string; truncado?: boolean; total?: number; mostradas: number; vacio: string | false }) {
  return (
    <>
      {!!error && <Alert>{(error as Error).message}</Alert>}
      {aviso && <Alert tone="info">{aviso}</Alert>}
      {cargando && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
      {truncado && <Alert tone="info">Se muestran las primeras {mostradas.toLocaleString(LOCALE)}{total ? ` de ${total.toLocaleString(LOCALE)}` : ""}: acorte el período o filtre.</Alert>}
      {vacio && <EmptyState>{vacio}</EmptyState>}
    </>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
function Anotaciones({ titulo }: { titulo: string }) {
  const p = usePeriodo(6);
  const [plan, setPlan] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["gpi-lis-anot", p.d, p.h, plan],
    queryFn: () => api.gpi.listadoAnotaciones(p.d!, p.h!, plan ? Number(plan) : undefined),
    enabled: p.ok,
  });
  const filas = data?.filas ?? [];
  const excel = () => bajar(`anotaciones-${p.d}_${p.h}.xlsx`, "Anotaciones", ["Fecha", "Planilla", "Anotación"], filas.map((f) => [aDMA(f.fecha), f.planNombre, f.texto]), [12, 32, 120]);
  return (
    <>
      <BarraHerramientas titulo={titulo} detalle={data ? `${data.total.toLocaleString(LOCALE)} anotaciones` : undefined}>
        <CamposPeriodo p={p} />
        <Select compact aria-label="Planilla" value={plan} onChange={(e) => setPlan(e.target.value)} className="w-56">
          <option value="">Todas las planillas</option>
          {(data?.planillas ?? []).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
        </Select>
        <Acciones onExcel={excel} deshabilitado={!filas.length} />
      </BarraHerramientas>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="space-y-3">
          <Estado cargando={isLoading || p.cargando} error={error} truncado={data?.truncado} total={data?.total} mostradas={filas.length} vacio={!!data && !filas.length && "Sin anotaciones en ese período."} />
          {filas.map((f, i) => (
            <div key={`${f.fecha}|${f.plan}|${i}`} className="panel overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-line bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-ink">
                <span>{f.planNombre}</span><span className="text-xs font-normal text-muted">{aDMA(f.fecha)}</span>
              </div>
              <p className="whitespace-pre-wrap px-3 py-2 text-[13px]">{f.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
function SelectorVariable({ variable, onElegir, onQuitar, opcional }: { variable: VariableMeta | null; onElegir: (v: VariableMeta) => void; onQuitar: () => void; opcional?: boolean }) {
  return (
    <details className="panel p-3" open={!variable}>
      <summary className="cursor-pointer text-[13px] font-medium text-ink">
        Variable: {variable ? <><span className="font-semibold">{etiquetaVariable(variable)}</span> <span className="text-muted">· {variable.planNombre} · #{variable.id}</span></> : <span className="text-muted">{opcional ? "todas (elija una para filtrar)" : "elija una"}</span>}
      </summary>
      <div className="mt-2 max-w-xl space-y-2">
        <BuscadorVariables elegidas={variable ? [variable.id] : []} onElegir={onElegir} max={1} />
        {variable && <Button size="sm" variant="secondary" onClick={onQuitar}>Quitar variable</Button>}
      </div>
    </details>
  );
}

function HistoricoValor({ titulo }: { titulo: string }) {
  const p = usePeriodo(6);
  const [variable, setVariable] = useState<VariableMeta | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["gpi-lis-hval", variable?.id, p.d, p.h],
    queryFn: () => api.gpi.listadoHistoricoValor(variable!.id, p.d!, p.h!),
    enabled: p.ok && !!variable,
  });
  const filas = data?.filas ?? [];
  const excel = () => bajar(`historico-de-valor-${variable?.id}-${p.d}_${p.h}.xlsx`, "Histórico de valor",
    ["Fecha del lanzamiento", "Fecha y hora del registro", "Usuario", "Columna", "Valor registrado", "Operación", "Comentario"],
    filas.map((f) => [aDMA(f.fecha), f.hora.replace("T", " "), f.usuario, f.columna, num(f.valor) ?? f.valor, f.operacion, f.comentario ?? ""]), [16, 22, 14, 9, 16, 12, 40]);
  return (
    <>
      <BarraHerramientas titulo={titulo} detalle={data ? `${filas.length.toLocaleString(LOCALE)} registros` : undefined}>
        <CamposPeriodo p={p} />
        <Acciones onExcel={excel} deshabilitado={!filas.length} />
      </BarraHerramientas>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="space-y-3">
          <SelectorVariable variable={variable} onElegir={setVariable} onQuitar={() => setVariable(null)} />
          <Estado cargando={isLoading || p.cargando} error={error} aviso={data?.aviso} truncado={data?.truncado} mostradas={filas.length}
            vacio={!variable ? "Elija una variable para ver su histórico." : !!data && !filas.length && "Sin registros de esa variable en ese período."} />
          {filas.length > 0 && (
            <div className="panel max-w-full overflow-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead><tr>
                  <th className={TH}>Lanzamiento</th><th className={TH}>Registro</th><th className={TH}>Usuario</th><th className={cn(TH, "text-right")}>Columna</th>
                  <th className={cn(TH, "text-right")}>Valor</th><th className={TH}>Operación</th><th className={TH}>Comentario</th>
                </tr></thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr key={i} className="bg-surface">
                      <td className={cn(TD, "whitespace-nowrap")}>{aDMA(f.fecha)}</td>
                      <td className={cn(TD, "whitespace-nowrap tabular-nums")}>{aDMA(f.hora.slice(0, 10))} {f.hora.slice(11, 16)}</td>
                      <td className={TD}>{f.usuario}</td>
                      <td className={cn(TD, "text-right tabular-nums")}>{f.columna}</td>
                      <td className={cn(TD, "text-right tabular-nums")}>{fmt(f.valor) || f.valor}</td>
                      <td className={TD}><Badge tone={f.operacion === "Baja" ? "danger" : f.operacion === "Cambio" ? "warning" : "neutral"}>{f.operacion}</Badge></td>
                      <td className={TD}>{f.comentario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
function HistoricoVariables({ titulo }: { titulo: string }) {
  const p = usePeriodo(30);
  const [variable, setVariable] = useState<VariableMeta | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["gpi-lis-hvar", variable?.id, p.d, p.h],
    queryFn: () => api.gpi.listadoHistoricoVariables(p.d!, p.h!, variable?.id),
    enabled: p.ok,
  });
  const filas = data?.filas ?? [];
  const excel = () => bajar(`historico-de-variables-${p.d}_${p.h}.xlsx`, "Histórico de variables",
    ["Fecha y hora", "Usuario", "Id", "Variable", "Planilla", "Operación", "Fórmula", "Fórmula alterada"],
    filas.map((f) => [f.hora.replace("T", " "), f.usuario, f.id, f.nombre, f.planNombre, f.operacion, f.formula, f.formulaAlterada]), [20, 14, 9, 36, 30, 12, 60, 60]);
  return (
    <>
      <BarraHerramientas titulo={titulo} detalle={data ? `${data.total.toLocaleString(LOCALE)} cambios` : undefined}>
        <CamposPeriodo p={p} />
        <Acciones onExcel={excel} deshabilitado={!filas.length} />
      </BarraHerramientas>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="space-y-3">
          <SelectorVariable variable={variable} onElegir={setVariable} onQuitar={() => setVariable(null)} opcional />
          <Estado cargando={isLoading || p.cargando} error={error} truncado={data?.truncado} total={data?.total} mostradas={filas.length} vacio={!!data && !filas.length && "Sin cambios de variables en ese período."} />
          {filas.length > 0 && (
            <div className="panel max-w-full overflow-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead><tr>
                  <th className={TH}>Fecha y hora</th><th className={TH}>Usuario</th><th className={cn(TH, "text-right")}>Id</th><th className={TH}>Variable</th>
                  <th className={TH}>Planilla</th><th className={TH}>Operación</th><th className={TH}>Fórmula</th>
                </tr></thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr key={i} className="bg-surface align-top">
                      <td className={cn(TD, "whitespace-nowrap tabular-nums")}>{aDMA(f.hora.slice(0, 10))} {f.hora.slice(11, 16)}</td>
                      <td className={TD}>{f.usuario}</td>
                      <td className={cn(TD, "text-right tabular-nums")}>{f.id}</td>
                      <td className={TD}>{f.nombre}{!f.activa && <> <Badge>inactiva</Badge></>}</td>
                      <td className={TD}>{f.planNombre}</td>
                      <td className={TD}>{f.operacion}</td>
                      <td className={cn(TD, "max-w-[28rem] break-words font-mono text-xs")}>{f.formula}{f.formulaAlterada && <div className="text-muted">→ {f.formulaAlterada}</div>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
function HistoricoEspecificacion({ titulo }: { titulo: string }) {
  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  const ref = safra.data?.parametros?.FECHA_REAL ?? null;
  const [desde, setDesde] = useState("2015-01-01");
  const [hasta, setHasta] = useState<string | null>(null);
  const h = hasta ?? ref;
  const [variable, setVariable] = useState<VariableMeta | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["gpi-lis-hesp", variable?.id, desde, h],
    queryFn: () => api.gpi.listadoHistoricoEspecificacion(desde, h!, variable?.id),
    enabled: !!h && desde <= h,
  });
  const filas = data?.filas ?? [];
  const excel = () => bajar(`historico-de-especificacion-${desde}_${h}.xlsx`, "Histórico de especificación",
    ["Vigente desde", "Id", "Variable", "Planilla", "Unidad", "Mínimo", "Máximo"],
    filas.map((f) => [aDMA(f.desde), f.id, f.nombre, f.planNombre, f.unidad ?? "", num(f.min) ?? f.min, num(f.max) ?? f.max]), [14, 9, 36, 30, 10, 12, 12]);
  return (
    <>
      <BarraHerramientas titulo={titulo} detalle={data ? `${data.total.toLocaleString(LOCALE)} límites` : undefined}>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          Desde <Input compact type="date" aria-label="Desde" value={desde} onChange={(e) => e.target.value && setDesde(e.target.value)} className="w-36" />
          hasta <Input compact type="date" aria-label="Hasta" value={h ?? ""} onChange={(e) => e.target.value && setHasta(e.target.value)} className="w-36" />
        </div>
        <Acciones onExcel={excel} deshabilitado={!filas.length} />
      </BarraHerramientas>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="space-y-3">
          <SelectorVariable variable={variable} onElegir={setVariable} onQuitar={() => setVariable(null)} opcional />
          <Estado cargando={isLoading || safra.isLoading} error={error} truncado={data?.truncado} total={data?.total} mostradas={filas.length} vacio={!!data && !filas.length && "Sin cambios de especificación en ese período."} />
          {filas.length > 0 && (
            <div className="panel max-w-full overflow-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead><tr>
                  <th className={TH}>Vigente desde</th><th className={cn(TH, "text-right")}>Id</th><th className={TH}>Variable</th><th className={TH}>Planilla</th>
                  <th className={TH}>Unidad</th><th className={cn(TH, "text-right")}>Mínimo</th><th className={cn(TH, "text-right")}>Máximo</th>
                </tr></thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr key={i} className="bg-surface">
                      <td className={cn(TD, "whitespace-nowrap")}>{aDMA(f.desde)}</td>
                      <td className={cn(TD, "text-right tabular-nums")}>{f.id}</td>
                      <td className={TD}>{f.nombre}</td>
                      <td className={TD}>{f.planNombre}</td>
                      <td className={TD}>{f.unidad}</td>
                      <td className={cn(TD, "text-right tabular-nums")}>{fmt(f.min)}</td>
                      <td className={cn(TD, "text-right tabular-nums")}>{fmt(f.max)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
