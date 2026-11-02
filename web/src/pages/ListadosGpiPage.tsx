import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { aDMA, sumarDias } from "@/lib/fecha";
import { LOCALE } from "@/lib/formato";
import { num } from "@/lib/num";
import { bajarXlsx, type CeldaX } from "@/lib/xlsx";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import { Alert, Badge, Button, Checkbox, EmptyState, Input, SearchInput, Select, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

export type TipoListado = "variables" | "falta-digitacion" | "fuera-especificacion";

const TITULOS: Record<TipoListado, string> = {
  variables: "Listado de variables",
  "falta-digitacion": "Listado de falta de digitación",
  "fuera-especificacion": "Listado fuera de especificación",
};
export const TIPO_MEDIA: Record<number, string> = { 0: "No acumula", 1: "Media", 2: "Media ponderada", 3: "Suma", 4: "Último valor", 5: "Media calculada" };

export const fmt = (t: string | number | null | undefined, dec?: number | null) => {
  const n = typeof t === "number" ? t : num(t);
  return n === null ? "" : n.toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: dec ?? 4 });
};
export const TH = "sticky top-0 z-10 whitespace-nowrap border-b border-line bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-slate-600";
export const TD = "border-b border-slate-100 px-3 py-1.5 text-[13px]";

// Listados del menú «Informes» del GATEC (solo lectura): variables, falta de digitación y fuera de especificación.
// Las reglas son una interpretación de los formularios del GATEC (no hay fuente del VB6): por confirmar con un usuario (docs/validacion-con-usuarios.md, Parte 5).
export default function ListadosGpiPage({ tipo }: { tipo: TipoListado }) {
  const titulo = TITULOS[tipo];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Proceso Industrial (GPI)" }, { label: "Informes" }, { label: titulo }]} />
      {tipo === "variables" && <ListadoVariables titulo={titulo} />}
      {tipo === "falta-digitacion" && <ListadoFalta titulo={titulo} />}
      {tipo === "fuera-especificacion" && <ListadoFuera titulo={titulo} />}
    </div>
  );
}

export function Acciones({ onExcel, deshabilitado }: { onExcel: () => void; deshabilitado: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="secondary" aria-label="Imprimir" title="Imprimir" disabled={deshabilitado} onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden /></Button>
      <Button size="sm" variant="secondary" title="Exportar a Excel" disabled={deshabilitado} onClick={onExcel}><Download className="h-4 w-4" aria-hidden /> Excel</Button>
    </div>
  );
}

const encabezadoX = (textos: string[]): CeldaX[] => textos.map((v) => ({ v, e: { negrita: true, relleno: "gris", alinear: "center" } }));
export const bajar = (nombre: string, hoja: string, enc: string[], filas: (string | number | null)[][], anchos: number[]) =>
  bajarXlsx(nombre, { nombre: hoja, filas: [encabezadoX(enc), ...filas.map((f) => f.map((v): CeldaX => ({ v })))], anchos });

// ---------------------------------------------------------------------------------------------------------------------
function ListadoVariables({ titulo }: { titulo: string }) {
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("");
  const [tipo, setTipo] = useState("");
  const [activas, setActivas] = useState(true);
  const { data, isLoading, error } = useQuery({
    queryKey: ["gpi-lis-variables", q, plan, tipo, activas],
    queryFn: () => api.gpi.listadoVariables({ q, plan: plan ? Number(plan) : undefined, tipo: tipo || undefined, activas }),
  });
  const filas = data?.filas ?? [];
  const excel = () => bajar("listado-de-variables.xlsx", "Variables",
    ["Planilla", "Orden", "Id", "Variable", "Descripción", "Unidad", "Tipo", "Media", "Mínimo", "Máximo", "Activa"],
    filas.map((v) => [v.planNombre, v.orden, v.id, v.nombre, v.analisis, v.unidad ?? "", v.calculada ? "Calculada" : "Digitada", TIPO_MEDIA[v.tipoMedia] ?? "", v.especMin, v.especMax, v.activa ? "Sí" : "No"]),
    [30, 8, 9, 22, 40, 10, 12, 18, 10, 10, 8]);
  return (
    <>
      <BarraHerramientas titulo={titulo} detalle={data ? `${data.total.toLocaleString(LOCALE)} variables` : undefined}>
        <SearchInput compact value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, id o planilla…" className="w-64" />
        <Select compact aria-label="Planilla" value={plan} onChange={(e) => setPlan(e.target.value)} className="w-56">
          <option value="">Todas las planillas</option>
          {(data?.planillas ?? []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </Select>
        <Select compact aria-label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-36">
          <option value="">Todas</option>
          <option value="digitada">Digitadas</option>
          <option value="calculada">Calculadas</option>
        </Select>
        <Checkbox label="Solo activas" checked={activas} onChange={(e) => setActivas(e.target.checked)} />
        <Acciones onExcel={excel} deshabilitado={!filas.length} />
      </BarraHerramientas>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {error && <Alert>{(error as Error).message}</Alert>}
        {isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
        {data?.truncado && <Alert tone="info">Se muestran las primeras {filas.length.toLocaleString(LOCALE)} de {data.total.toLocaleString(LOCALE)}: filtre para ver el resto.</Alert>}
        {data && !filas.length && <EmptyState>Sin variables que coincidan.</EmptyState>}
        {filas.length > 0 && (
          <div className="panel max-w-full overflow-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead><tr>
                <th className={TH}>Planilla</th><th className={cn(TH, "text-right")}>Orden</th><th className={cn(TH, "text-right")}>Id</th><th className={TH}>Descripción</th>
                <th className={TH}>Unidad</th><th className={TH}>Tipo</th><th className={TH}>Media</th><th className={cn(TH, "text-right")}>Mínimo</th><th className={cn(TH, "text-right")}>Máximo</th>
              </tr></thead>
              <tbody>
                {filas.map((v) => (
                  <tr key={v.id} className={cn(v.calculada ? "bg-calc" : "bg-surface", !v.activa && "text-slate-500")}>
                    <td className={TD}>{v.planNombre}</td>
                    <td className={cn(TD, "text-right tabular-nums")}>{v.orden}</td>
                    <td className={cn(TD, "text-right tabular-nums")}>{v.id}</td>
                    <td className={TD}>{v.analisis || v.nombre}{!v.activa && <> <Badge>inactiva</Badge></>}</td>
                    <td className={TD}>{v.unidad}</td>
                    <td className={TD}>{v.calculada ? "Calculada" : "Digitada"}</td>
                    <td className={TD}>{TIPO_MEDIA[v.tipoMedia] ?? ""}</td>
                    <td className={cn(TD, "text-right tabular-nums")}>{fmt(v.especMin)}</td>
                    <td className={cn(TD, "text-right tabular-nums")}>{fmt(v.especMax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
function ListadoFalta({ titulo }: { titulo: string }) {
  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  const [fecha, setFecha] = useState<string | null>(null);
  const [sinDatos, setSinDatos] = useState(false);
  const dia = fecha ?? safra.data?.parametros?.FECHA_REAL ?? null;
  const { data, isLoading, error } = useQuery({ queryKey: ["gpi-lis-falta", dia], queryFn: () => api.gpi.listadoFalta(dia!), enabled: !!dia });
  const planillas = useMemo(() => (data?.planillas ?? []).filter((p) => sinDatos || !p.sinDatos), [data, sinDatos]);
  const totalFaltantes = planillas.reduce((s, p) => s + p.faltantes.length, 0);
  const ocultas = (data?.planillas.length ?? 0) - planillas.length;
  const excel = () => bajar(`falta-de-digitacion-${dia}.xlsx`, "Falta de digitación",
    ["Planilla", "Orden", "Id", "Variable", "Unidad", "Planilla sin datos"],
    planillas.flatMap((p) => p.faltantes.map((v) => [p.nombre, v.orden, v.id, v.nombre, v.unidad ?? "", p.sinDatos ? "Sí" : "No"])),
    [34, 8, 9, 44, 10, 18]);
  return (
    <>
      <BarraHerramientas titulo={titulo} detalle={dia ? `Fecha ${aDMA(dia)}` : undefined}>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="secondary" aria-label="Día anterior" disabled={!dia} onClick={() => dia && setFecha(sumarDias(dia, -1))}>−1</Button>
          <Input compact type="date" aria-label="Fecha" value={dia ?? ""} onChange={(e) => e.target.value && setFecha(e.target.value)} className="w-36" />
          <Button size="sm" variant="secondary" aria-label="Día siguiente" disabled={!dia} onClick={() => dia && setFecha(sumarDias(dia, 1))}>+1</Button>
        </div>
        <Checkbox label="Incluir planillas sin ningún dato" checked={sinDatos} onChange={(e) => setSinDatos(e.target.checked)} />
        <Acciones onExcel={excel} deshabilitado={!totalFaltantes} />
      </BarraHerramientas>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {error && <Alert>{(error as Error).message}</Alert>}
          {data?.aviso && <Alert tone="info">{data.aviso}</Alert>}
          {(isLoading || safra.isLoading) && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
          {data && (
            <p className="text-xs text-muted">
              {totalFaltantes.toLocaleString(LOCALE)} variables digitadas sin valor en {planillas.length} planillas.
              {!sinDatos && ocultas > 0 && ` Se ocultan ${ocultas} planillas sin ningún dato ese día (no se usaron).`}
            </p>
          )}
          {data && !planillas.length && <EmptyState>No falta digitar nada ese día.</EmptyState>}
          {planillas.map((p) => (
            <div key={p.id} className="panel overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-line bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-ink">
                <span>{p.nombre}</span>
                <span className="text-xs font-normal text-muted">{p.sinDatos ? "sin datos · " : ""}{p.faltantes.length} de {p.digitadas} sin valor</span>
              </div>
              <ul>
                {p.faltantes.map((v) => (
                  <li key={v.id} className="flex items-baseline gap-3 border-b border-slate-100 px-3 py-1 text-[13px] last:border-b-0">
                    <span className="w-14 shrink-0 text-right text-xs tabular-nums text-slate-500">{v.orden}</span>
                    <span className="min-w-0 flex-1 truncate">{v.nombre}</span>
                    <span className="shrink-0 text-xs text-slate-500">{v.unidad}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
function ListadoFuera({ titulo }: { titulo: string }) {
  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  const ref = safra.data?.parametros?.FECHA_REAL ?? null;
  const [desde, setDesde] = useState<string | null>(null);
  const [hasta, setHasta] = useState<string | null>(null);
  const h = hasta ?? ref;
  const d = desde ?? (ref ? sumarDias(ref, -6) : null);
  const { data, isLoading, error } = useQuery({ queryKey: ["gpi-lis-fuera", d, h], queryFn: () => api.gpi.listadoFuera(d!, h!), enabled: !!d && !!h && d <= h });
  const filas = data?.filas ?? [];
  const excel = () => bajar(`fuera-de-especificacion-${d}_${h}.xlsx`, "Fuera de especificación",
    ["Fecha", "Planilla", "Id", "Variable", "Unidad", "Valor", "Mínimo", "Máximo", "Motivo"],
    filas.map((f) => [aDMA(f.fecha), f.planNombre, f.id, f.nombre, f.unidad ?? "", num(f.valor) ?? f.valor, f.min, f.max, f.motivo === "bajo" ? "Por debajo del mínimo" : "Por encima del máximo"]),
    [12, 30, 9, 40, 10, 12, 10, 10, 24]);
  return (
    <>
      <BarraHerramientas titulo={titulo} detalle={data && d && h ? `${aDMA(d)} a ${aDMA(h)}` : undefined}>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          Desde <Input compact type="date" aria-label="Desde" value={d ?? ""} onChange={(e) => e.target.value && setDesde(e.target.value)} className="w-36" />
          hasta <Input compact type="date" aria-label="Hasta" value={h ?? ""} onChange={(e) => e.target.value && setHasta(e.target.value)} className="w-36" />
        </div>
        <Acciones onExcel={excel} deshabilitado={!filas.length} />
      </BarraHerramientas>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {error && <Alert>{(error as Error).message}</Alert>}
          {data?.aviso && <Alert tone="info">{data.aviso}</Alert>}
          {d && h && d > h && <Alert>La fecha final es anterior a la inicial.</Alert>}
          {(isLoading || safra.isLoading) && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
          {data?.truncado && <Alert tone="info">Se muestran las primeras {filas.length.toLocaleString(LOCALE)} de {data.total?.toLocaleString(LOCALE)}: acorte el período.</Alert>}
          {data && !filas.length && !data.aviso && <EmptyState>Ningún resultado del día fuera de especificación en ese período.</EmptyState>}
          {filas.length > 0 && (
            <div className="panel max-w-full overflow-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead><tr>
                  <th className={TH}>Fecha</th><th className={TH}>Planilla</th><th className={TH}>Variable</th><th className={TH}>Unidad</th>
                  <th className={cn(TH, "text-right")}>Valor</th><th className={cn(TH, "text-right")}>Mínimo</th><th className={cn(TH, "text-right")}>Máximo</th><th className={TH}>Motivo</th>
                </tr></thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr key={`${f.fecha}|${f.id}|${i}`} className="bg-surface">
                      <td className={cn(TD, "whitespace-nowrap")}>{aDMA(f.fecha)}</td>
                      <td className={TD}>{f.planNombre}</td>
                      <td className={TD}>{f.nombre}</td>
                      <td className={TD}>{f.unidad}</td>
                      <td className={cn(TD, "text-right font-semibold tabular-nums text-red-700")}>{fmt(f.valor)}</td>
                      <td className={cn(TD, "text-right tabular-nums")}>{fmt(f.min)}</td>
                      <td className={cn(TD, "text-right tabular-nums")}>{fmt(f.max)}</td>
                      <td className={TD}>{f.motivo === "bajo" ? "Por debajo del mínimo" : "Por encima del máximo"}</td>
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
