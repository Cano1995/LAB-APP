import { aDMA, sumarDias } from "@/lib/fecha";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Download, FlaskConical, Folder, Lock, Pencil, Printer, Sigma } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { api, ApiError, type CambioCelda, type ConflictoCelda, type LancamentoGpi, type NodoGpi, type VariableGpi } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import { Alert, Badge, Button, Checkbox, EmptyState, Input, SearchInput, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import { bajarXlsx, type CeldaX, type Estilo, type Relleno } from "@/lib/xlsx";

const COLUNA_DIA = "99";
type Ver = { id: boolean; esp: boolean; sem: boolean; acum: boolean };

// Digitación diaria (frmDigBol) en modo consulta: árbol de análisis + grilla del día.
export default function GpiLancamentoPage() {
  const [plan, setPlan] = useState<NodoGpi | null>(null);
  const [fecha, setFecha] = useState<string | null>(null); // null = aún no se eligió: abre en el día actual de digitación
  const [filtroArbol, setFiltroArbol] = useState("");
  const [sucio, setSucio] = useState(false); // hay celdas editadas sin grabar
  const descartar = () => !sucio || window.confirm("Hay cambios sin grabar. ¿Descartarlos?");

  const arbol = useQuery({ queryKey: ["gpi-arbol"], queryFn: () => api.gpi.arbol() });
  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  // Como el GPI viejo: abre en el "día actual de digitación" (PAR_DT_FECHA).
  const data = fecha ?? safra.data?.parametros?.DIA_ACTUAL ?? null;
  // Como el GATEC: −7 muestra 8 días (la fecha y los 7 siguientes) y −1 muestra 2 (la fecha y el siguiente); +7 y +1 al revés (la fecha queda al final); el resto vuelve a un solo día.
  // Botones Id / Esp / Sem / Acum del GATEC: muestran columnas extra, solo lectura.
  const [ver, setVer] = useState({ id: false, esp: false, sem: false, acum: false });
  const [semana, setSemana] = useState(0); // días que se agregan junto a la fecha elegida: >0 a la derecha, <0 a la izquierda
  const setData = (d: string, extra = 0) => { if (descartar()) { setFecha(d); setSemana(extra); } };
  // «fixar data»: con la fecha fija, al cambiar de planilla se conserva; sin fijar, vuelve al día actual de digitación (como el GATEC; por confirmar).
  const [fijarFecha, setFijarFecha] = useState(true);
  const elegirPlan = (n: NodoGpi) => { if (descartar()) { setPlan(n); if (!fijarFecha) { setFecha(null); setSemana(0); } } };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader
        migas={[{ label: "Inicio", to: "/" }, { label: "Proceso Industrial (GPI)" }, { label: "Digitación diaria" }]}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col border-r border-line bg-surface">
          <div className="shrink-0 border-b border-line p-3">
            <h2 className="section-label mb-2">Análisis</h2>
            <SearchInput
              compact
              value={filtroArbol}
              onChange={(e) => setFiltroArbol(e.target.value)}
              placeholder="Buscar análisis…"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {arbol.isLoading && <div className="p-4"><Spinner className="text-slate-400" /></div>}
            {arbol.error && <Alert>{(arbol.error as Error).message}</Alert>}
            {arbol.data && <Arbol nodos={arbol.data.nodos} filtro={filtroArbol} seleccionado={plan?.id} onSelect={elegirPlan} />}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-canvas">
          {!plan && (
            <>
              <BarraTitulo titulo="Digitación diaria" />
              <EmptyState>Seleccione una planilla en el árbol de análisis.</EmptyState>
            </>
          )}
          {plan && data && (
            <Planilla key={`${plan.id}|${data}`} plan={plan} data={data} semana={semana} ver={ver} onVer={setVer} fijarFecha={fijarFecha} onFijarFecha={setFijarFecha} onData={setData} diaActual={safra.data?.parametros?.DIA_ACTUAL ?? null} onSucio={setSucio} />
          )}
          {plan && !data && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
        </main>
      </div>
    </div>
  );
}

// Barra del área de trabajo con la marca de solo consulta al final.
function BarraTitulo({ titulo, detalle, children, editable = false }: { titulo: string; detalle?: string; children?: React.ReactNode; editable?: boolean }) {
  return (
    <BarraHerramientas titulo={titulo} detalle={detalle}>
      {children}
      {editable ? (
        <Badge tone="info"><Pencil className="h-3 w-3" aria-hidden /> Edición habilitada</Badge>
      ) : (
        <Badge tone="warning"><Lock className="h-3 w-3" aria-hidden /> Solo consulta</Badge>
      )}
    </BarraHerramientas>
  );
}

function Arbol({ nodos, filtro, seleccionado, onSelect }: { nodos: NodoGpi[]; filtro: string; seleccionado?: number; onSelect: (n: NodoGpi) => void }) {
  const hijos = useMemo(() => {
    const m = new Map<number | null, NodoGpi[]>();
    for (const n of nodos) {
      if (!n.activo) continue;
      const k = n.padre && nodos.some((p) => p.id === n.padre) ? n.padre : null;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(n);
    }
    return m;
  }, [nodos]);

  const coincide = useMemo(() => {
    if (!filtro.trim()) return null;
    const f = filtro.trim().toLowerCase();
    const ok = new Set<number>();
    const porId = new Map(nodos.map((n) => [n.id, n]));
    for (const n of nodos) {
      if (!n.nombre.toLowerCase().includes(f)) continue;
      for (let x: NodoGpi | undefined = n; x; x = x.padre ? porId.get(x.padre) : undefined) ok.add(x.id);
    }
    return ok;
  }, [filtro, nodos]);

  if (coincide && coincide.size === 0) return <EmptyState>Sin análisis que coincidan.</EmptyState>;
  return <Rama padre={null} hijos={hijos} nivel={0} seleccionado={seleccionado} onSelect={onSelect} visibles={coincide} />;
}

function Rama({
  padre, hijos, nivel, seleccionado, onSelect, visibles,
}: {
  padre: number | null;
  hijos: Map<number | null, NodoGpi[]>;
  nivel: number;
  seleccionado?: number;
  onSelect: (n: NodoGpi) => void;
  visibles: Set<number> | null;
}) {
  const lista = (hijos.get(padre) || []).filter((n) => !visibles || visibles.has(n.id));
  return (
    <ul>
      {lista.map((n) => (
        <NodoItem key={n.id} n={n} hijos={hijos} nivel={nivel} seleccionado={seleccionado} onSelect={onSelect} visibles={visibles} />
      ))}
    </ul>
  );
}

function NodoItem({
  n, hijos, nivel, seleccionado, onSelect, visibles,
}: {
  n: NodoGpi;
  hijos: Map<number | null, NodoGpi[]>;
  nivel: number;
  seleccionado?: number;
  onSelect: (n: NodoGpi) => void;
  visibles: Set<number> | null;
}) {
  const tieneHijos = (hijos.get(n.id) || []).length > 0;
  const [abierto, setAbierto] = useState(false);
  const expandido = abierto || !!visibles;
  const esPlanilla = n.variables > 0;
  const sinAcceso = esPlanilla && !n.habilitado;
  const elegido = seleccionado === n.id;
  return (
    <li>
      <button
        type="button"
        onClick={() => { if (tieneHijos) setAbierto((v) => !v); if (esPlanilla && n.habilitado) onSelect(n); }}
        disabled={!tieneHijos && (!esPlanilla || !n.habilitado)}
        aria-expanded={tieneHijos ? expandido : undefined}
        aria-current={elegido ? "true" : undefined}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-[13px] transition-colors",
          elegido ? "bg-brand-100 font-medium text-ink shadow-[inset_2px_0_0_rgb(var(--link))]" : "text-ink hover:bg-slate-100",
          sinAcceso && "cursor-not-allowed text-slate-500 hover:bg-transparent",
        )}
        style={{ paddingLeft: 8 + nivel * 16 }}
        title={sinAcceso ? "Planilla no habilitada para su usuario" : undefined}
      >
        {tieneHijos ? (
          <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform", expandido && "rotate-90")} aria-hidden />
        ) : <span className="w-3.5 shrink-0" />}
        {esPlanilla
          ? <FlaskConical className={cn("h-3.5 w-3.5 shrink-0", elegido ? "text-link" : "text-slate-500")} aria-hidden />
          : <Folder className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />}
        <span className="min-w-0 flex-1 truncate">{n.nombre}</span>
        {sinAcceso && <Lock className="h-3 w-3 shrink-0" aria-label="Sin acceso" />}
      </button>
      {tieneHijos && expandido && (
        <Rama padre={n.id} hijos={hijos} nivel={nivel + 1} seleccionado={seleccionado} onSelect={onSelect} visibles={visibles} />
      )}
    </li>
  );
}

function Planilla({ plan, data, semana, ver, onVer, fijarFecha, onFijarFecha, onData, diaActual, onSucio }: { plan: NodoGpi; data: string; semana: number; ver: Ver; onVer: (v: Ver) => void; fijarFecha: boolean; onFijarFecha: (f: boolean) => void; onData: (d: string, extra?: number) => void; diaActual: string | null; onSucio: (s: boolean) => void }) {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const { data: l, isLoading, error } = useQuery({
    queryKey: ["gpi-lanc", plan.id, data, ver.acum, ver.sem],
    queryFn: () => api.gpi.lancamento(plan.id, data, { acum: ver.acum, sem: ver.sem }),
  });
  // Edición (Sprint 18): lo digitado vive en `borrador` hasta que se graba; `anterior` de cada celda es lo que se vio al cargar (control de concurrencia).
  const puedeEditar = !!perfil?.funciones?.gpiDigitacion && l?.edicion?.permitida === true;
  // Como en el GATEC original: doble clic (o Enter / F2) sobre una celda blanca la abre para escribir; Enter o salir de la celda la confirma y Esc la cancela.
  const [activa, setActiva] = useState<string | null>(null); // "idVar|col" de la celda que se está escribiendo
  const [borrador, setBorrador] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<{ tono: "success" | "warning"; texto: string } | null>(null);
  const cambiosPendientes = (): CambioCelda[] => {
    if (!l) return [];
    const out: CambioCelda[] = [];
    for (const [k, nuevo] of Object.entries(borrador)) {
      const [idVar, col] = k.split("|").map(Number);
      const anterior = l.valores[idVar]?.[col] ?? null;
      if ((anterior ?? "") !== nuevo.trim()) out.push({ idVar, col, anterior, nuevo });
    }
    return out;
  };
  const pendientes = cambiosPendientes().length;
  // Confirma lo escrito en una celda: si queda igual al valor guardado, deja de ser un cambio pendiente.
  const confirmar = (idVar: number, col: number, texto: string) => {
    const k = `${idVar}|${col}`;
    const original = l?.valores[idVar]?.[col] ?? "";
    setBorrador((b) => { const n = { ...b }; if (texto.trim() === original) delete n[k]; else n[k] = texto; return n; });
    setActiva(null);
  };
  const salirDeEdicion = () => { setActiva(null); setBorrador({}); };
  useEffect(() => { onSucio(pendientes > 0 || activa !== null); }, [pendientes, activa, onSucio]);
  const grabar = useMutation({
    mutationFn: () => api.gpi.grabarLancamento(plan.id, data, cambiosPendientes()),
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ["gpi-lanc", plan.id, data] });
      salirDeEdicion();
      setResultado({
        tono: "success",
        texto: r.cambios === 0 ? "No había cambios para grabar." : `Se grabaron ${r.cambios} celda(s). Las variables calculadas y los acumulados se actualizan al cerrar el día (todavía no desde esta pantalla).`,
      });
    },
    onError: async (e) => {
      if (e instanceof ApiError && e.code === "CONFLICTO") {
        // Otro usuario cambió esas celdas: se recarga y se descartan SOLO las celdas en conflicto del borrador (el resto se conserva).
        const conflictos = (e.extra?.conflictos ?? []) as ConflictoCelda[];
        await qc.invalidateQueries({ queryKey: ["gpi-lanc", plan.id, data] });
        setBorrador((b) => { const n = { ...b }; for (const c of conflictos) delete n[`${c.idVar}|${c.col}`]; return n; });
        setResultado({ tono: "warning", texto: `Otro usuario cambió ${conflictos.length} celda(s) mientras usted editaba. Se muestran sus valores actuales; revíselos y vuelva a grabar lo que corresponda.` });
      }
    },
  });
  const errorGrabar = grabar.error && !(grabar.error instanceof ApiError && grabar.error.code === "CONFLICTO") ? (grabar.error as Error).message : null;
  const [verInactivas, setVerInactivas] = useState(false);
  const [filaElegida, setFilaElegida] = useState<number | null>(null);

  // Como el GATEC: la fecha elegida es la primera columna y le siguen los 6 días siguientes + 1 (8 días en total), solo en consulta.
  const diasIzq = useMemo(() => Array.from({ length: Math.max(-semana, 0) }, (_, i) => sumarDias(data, i + semana)), [data, semana]);
  const diasDer = useMemo(() => Array.from({ length: Math.max(semana, 0) }, (_, i) => sumarDias(data, i + 1)), [data, semana]);
  const diasExtra = useMemo(() => [...diasIzq, ...diasDer], [diasIzq, diasDer]);
  const diasTodos = useMemo(() => [...diasIzq, data, ...diasDer], [diasIzq, diasDer, data]);
  const extras = useQueries({
    queries: diasExtra.map((d) => ({
      queryKey: ["gpi-lanc", plan.id, d],
      queryFn: () => api.gpi.lancamento(plan.id, d),
    })),
  });

  const vars = (l?.variables || []).filter((v) => verInactivas || v.activa);
  // Solo columnas con algún valor, salvo que la planilla tenga pocas (horas): así se ve como el VB6
  // sin 40 columnas vacías de bateladas.
  const cols = useMemo(() => {
    if (!l) return [];
    if (l.columnas.length <= 24) return l.columnas;
    const usadas = new Set(Object.values(l.valores).flatMap((v) => Object.keys(v)));
    const ultima = Math.max(0, ...l.columnas.filter((c) => usadas.has(String(c.col))).map((c) => c.col));
    return l.columnas.filter((c) => c.col <= Math.max(ultima, 1));
  }, [l]);

  // Con una sola columna el resultado del día repite el mismo valor: no se muestra.
  const mostrarDia = (l?.columnas.length ?? 0) > 1;
  const valoresDe = (d: string) => (d === data ? l?.valores : extras[diasExtra.indexOf(d)]?.data?.valores) ?? {};
  // «Excel»: lo que se ve en pantalla (días, Id, Esp, Semanal, Zafra) como libro .xlsx con los colores del GATEC.
  const exportar = () => {
    if (!l) return;
    const aNum = (t: string | number | null | undefined): string | number => {
      if (t == null) return "";
      const n = Number(String(t).trim().replace(",", "."));
      return String(t).trim() !== "" && Number.isFinite(n) && /^-?[\d.,]+$/.test(String(t).trim()) ? n : String(t);
    };
    const gris: Estilo = { negrita: true, relleno: "gris", alinear: "center" };
    const izq = 3 + (ver.id ? 1 : 0) + (ver.esp ? 2 : 0);
    const h1: (CeldaX | null)[] = [{ v: "Análisis", e: gris }, ...Array(izq - 1).fill({ v: "", e: gris })];
    const h2: (CeldaX | null)[] = [{ v: "Orden", e: gris }, { v: "Descripción", e: gris }, { v: "Unidad", e: gris }];
    if (ver.id) h2.push({ v: "Id", e: gris });
    if (ver.esp) h2.push({ v: "Mín.", e: gris }, { v: "Máx.", e: gris });
    const combinadas: [number, number, number, number][] = [[0, 0, 0, izq - 1]];
    for (const d of diasTodos) {
      const rel: Relleno = d === data ? "verde" : "celeste";
      const ini = h2.length;
      for (const c of cols.length ? cols : [{ col: 0, titulo: "" }]) h2.push({ v: c.titulo ?? String(c.col), e: { negrita: true, relleno: rel, alinear: "center" } });
      if (mostrarDia) h2.push({ v: "Día", e: { negrita: true, relleno: rel, alinear: "center" } });
      if (d === data && ver.sem) h2.push({ v: "Semanal", e: { negrita: true, relleno: "violeta", alinear: "center" } });
      if (d === data && ver.acum) h2.push({ v: "Zafra", e: { negrita: true, relleno: "rosa", alinear: "center" } });
      h1.push({ v: aDMA(d), e: { negrita: true, relleno: rel, alinear: "center" } }, ...Array(h2.length - ini - 1).fill({ v: "", e: { relleno: rel } }));
      if (h2.length - ini > 1) combinadas.push([0, ini, 0, h2.length - 1]);
    }
    const filas = vars.map((v) => {
      const e: Estilo | undefined = v.calculada ? { relleno: "amarillo" } : undefined;
      const num: Estilo = { ...e, alinear: "right" };
      const f: CeldaX[] = [{ v: v.orden, e: num }, { v: v.analisis || v.nombre, e }, { v: v.unidad ?? "", e }];
      if (ver.id) f.push({ v: v.id, e: num });
      if (ver.esp) f.push({ v: v.especMin ? aNum(v.especMin) : "", e: num }, { v: v.especMax ? aNum(v.especMax) : "", e: num });
      for (const d of diasTodos) {
        const val = valoresDe(d)[v.id] || {};
        for (const c of cols.length ? cols : [{ col: 0 }]) f.push({ v: cols.length ? aNum(val[String(c.col)]) : "", e: num });
        if (mostrarDia) f.push({ v: aNum(val[COLUNA_DIA]), e: num });
        if (d === data && ver.sem) f.push({ v: aNum(l.semanal?.[v.id]), e: num });
        if (d === data && ver.acum) f.push({ v: aNum(l.acumulado?.[v.id]), e: num });
      }
      return f;
    });
    bajarXlsx(`digitacion-${plan.nombre.replace(/[^\w-]+/g, "_")}-${data}.xlsx`, {
      nombre: plan.nombre,
      filas: [h1, h2, ...filas],
      combinadas,
      anchos: [7, 42, 10, ...Array(Math.max(h2.length - 3, 0)).fill(12)],
    });
  };
  const detalle = l?.configuracion
    ? l.configuracion.divisao === 1
      ? `${l.configuracion.nvezes} ${l.configuracion.nvezes === 1 ? "batelada" : "bateladas"}`
      : `Cada ${l.configuracion.nvezes} h desde ${l.configuracion.ini}`
    : undefined;

  return (
    <>
      <div className="contents print:hidden">
      <BarraTitulo titulo={plan.nombre} detalle={detalle} editable={puedeEditar}>
        {pendientes > 0 && (
          <div className="flex items-center gap-1">
            <Button size="sm" onClick={() => { setResultado(null); grabar.mutate(); }} loading={grabar.isPending}>Grabar ({pendientes})</Button>
            <Button size="sm" variant="secondary" disabled={grabar.isPending} onClick={() => { if (window.confirm("Hay cambios sin grabar. ¿Descartarlos?")) salirDeEdicion(); }}>Descartar</Button>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Input
            compact
            type="date"
            aria-label="Fecha"
            value={data}
            onChange={(e) => e.target.value && onData(e.target.value)}
            className="w-36"
          />
          <Button size="sm" variant="secondary" title="Imprimir" aria-label="Imprimir" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden /></Button>
          <Button size="sm" variant="secondary" title="Exportar a Excel" aria-label="Exportar a Excel" disabled={!l} onClick={exportar}><Download className="h-4 w-4" aria-hidden /> Excel</Button>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Columnas extra">
          {([["id", "Id", "Número de variable"], ["esp", "Esp", "Especificación mínima y máxima"], ["sem", "Sem", "Resultado de los últimos 7 días (provisorio)"], ["acum", "Acum", "Acumulado de la zafra"]] as const).map(([k, t, etiqueta]) => (
            <Button key={k} size="sm" variant={ver[k] ? "primary" : "secondary"} aria-pressed={ver[k]} title={etiqueta} onClick={() => onVer({ ...ver, [k]: !ver[k] })}>{t}</Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {l?.safraGpi?.INICIO && <Button variant="secondary" size="sm" aria-label="Inicio de la zafra" title={`Inicio de la zafra: ${aDMA(l.safraGpi.INICIO.slice(0, 10))}`} disabled={data === l.safraGpi.INICIO.slice(0, 10)} onClick={() => onData(l.safraGpi!.INICIO.slice(0, 10))}>«</Button>}
          {([["−7", -7, "7 días antes"], ["−1", -1, "Día anterior"], ["+1", 1, "Día siguiente"], ["+7", 7, "7 días después"]] as const).map(([t, n, etiqueta]) => (
            <Button key={t} variant="secondary" size="sm" aria-label={etiqueta} title={etiqueta} onClick={() => onData(sumarDias(data, n), n === -7 ? 7 : n === -1 ? 1 : n === 7 ? -7 : n === 1 ? -1 : 0)}>{t}</Button>
          ))}
          {diaActual && <Button variant="secondary" size="sm" aria-label="Día actual de digitación" title={`Día actual de digitación: ${aDMA(diaActual)}`} disabled={data === diaActual} onClick={() => onData(diaActual)}>»</Button>}
          <Button variant={fijarFecha ? "primary" : "secondary"} size="sm" aria-pressed={fijarFecha} title="Fijar fecha: al cambiar de planilla se conserva la fecha; sin fijar vuelve al día actual de digitación" onClick={() => onFijarFecha(!fijarFecha)}>Fijar fecha</Button>
          {diaActual && (
            <Button variant="secondary" size="sm" title={`Día actual de digitación: ${aDMA(diaActual)}`} disabled={data === diaActual} onClick={() => onData(diaActual)}>
              Hoy
            </Button>
          )}
        </div>
        <Checkbox label="Ver inactivas" checked={verInactivas} onChange={(e) => setVerInactivas(e.target.checked)} />
      </BarraTitulo>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 print:hidden">
        <div className="space-y-3">
          {error && <Alert>{(error as Error).message}</Alert>}
          {errorGrabar && <Alert>{errorGrabar}</Alert>}
          {resultado && <Alert tone={resultado.tono}>{resultado.texto}</Alert>}
          {puedeEditar && pendientes === 0 && !resultado && <p className="text-xs text-muted">Doble clic en una celda blanca para editarla (las amarillas son calculadas). Enter confirma, Esc cancela y <strong>Grabar</strong> guarda los cambios.</p>}
          {l && !puedeEditar && perfil?.funciones?.gpiDigitacion && l.edicion?.motivo && <p className="text-xs text-muted">No se puede editar: {l.edicion.motivo}.</p>}
          {l?.aviso && <Alert tone="info">{l.aviso}</Alert>}
          {l && !l.idLanc && !l.aviso && <Alert tone="info">No hay lanzamientos para esta planilla el {aDMA(data)}.</Alert>}

          {isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}

          {l && (
            <div className="panel max-w-full overflow-auto">
              <table className="border-separate border-spacing-0 text-[13px]">
                <thead>
                  <tr>
                    <th rowSpan={2} className={cn(ENC, "sticky left-0 z-30 w-12 min-w-[3rem] text-right")}>Orden</th>
                    <th rowSpan={2} className={cn(ENC, "sticky left-12 z-30 min-w-64 text-left")}>Descripción</th>
                    <th rowSpan={2} className={cn(ENC, "text-left")}>Unid.</th>
                    {ver.id && <th rowSpan={2} className={cn(ENC, "text-right")}>Id</th>}
                    {ver.esp && <><th rowSpan={2} className={cn(ENC, "text-right")}>Mín.</th><th rowSpan={2} className={cn(ENC, "text-right")}>Máx.</th></>}
                    {/* Fecha una sola vez sobre todas las columnas del día, como en el GPI viejo. El día elegido va en verde. */}
                    {diasTodos.map((d) => (
                      <Fragment key={d}>
                        <th colSpan={Math.max(cols.length, 1)} className={cn("sticky top-0 z-20 h-7 whitespace-nowrap border-b border-brand-900 px-3 text-center text-xs font-semibold text-white", d === data ? "bg-emerald-600" : "border-l border-l-brand-900 bg-brand-800")}>
                          {aDMA(d)}
                        </th>
                        {mostrarDia && <th rowSpan={2} className={cn(ENC, "border-l border-line text-right")}>Día</th>}
                        {d === data && ver.sem && <th rowSpan={2} title="Resultado de los 7 días que terminan en esta fecha (provisorio)" className={cn(ENC, "border-l border-line bg-violet-200 text-right text-violet-950 dark:bg-violet-900 dark:text-violet-50")}>Semanal</th>}
                        {d === data && ver.acum && <th rowSpan={2} title="Acumulado de la zafra hasta esta fecha" className={cn(ENC, "border-l border-line bg-pink-200 text-right text-pink-950 dark:bg-pink-900 dark:text-pink-50")}>Zafra</th>}
                      </Fragment>
                    ))}
                  </tr>
                  <tr>
                    {diasTodos.map((d) => (
                      <Fragment key={d}>
                        {cols.map((c) => (
                          <th key={c.col} className="sticky top-7 z-20 h-7 min-w-[4.5rem] whitespace-nowrap border-b border-line bg-brand-100 px-3 text-right text-xs font-semibold tabular-nums text-ink">
                            {c.titulo}
                          </th>
                        ))}
                        {cols.length === 0 && <th className="sticky top-7 z-20 h-7 border-b border-line bg-brand-100" />}
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vars.map((v) => (
                    <Fila
                      key={v.id}
                      v={v}
                      cols={cols}
                      valores={l.valores[v.id] || {}}
                      mostrarDia={mostrarDia}
                      ver={ver}
                      acumulado={l.acumulado?.[v.id]}
                      semanal={l.semanal?.[v.id]}
                      extrasIzq={extras.slice(0, diasIzq.length).map((q) => q.data?.valores[v.id] || {})}
                      extras={extras.slice(diasIzq.length).map((q) => q.data?.valores[v.id] || {})}
                      editable={puedeEditar && !grabar.isPending && !v.calculada && v.activa && [0, 2, 3].includes(v.tipoDig)}
                      borrador={borrador}
                      activa={activa}
                      onActivar={setActiva}
                      onConfirmar={confirmar}
                      elegida={filaElegida === v.id}
                      onElegir={() => setFilaElegida((x) => (x === v.id ? null : v.id))}
                    />
                  ))}
                </tbody>
              </table>
              {vars.length === 0 && <EmptyState>Esta planilla no tiene variables activas.</EmptyState>}
            </div>
          )}
        </div>
      </div>

      {l && (
        <ImpresionPlanilla
          plan={plan} l={l} ver={ver} vars={vars} cols={cols} dias={diasTodos} valoresDe={valoresDe}
          empresa={perfil?.contexto?.empresa.nombre ?? ""} safra={perfil?.contexto?.safra ?? null}
        />
      )}
    </>
  );
}

// Hoja que sale al imprimir (solo visible en papel/PDF): encabezado y tabla como el informe «Consulta de Entradas Diarias» del GATEC.
function ImpresionPlanilla({ plan, l, ver, vars, cols, dias, valoresDe, empresa, safra }: {
  plan: NodoGpi; l: LancamentoGpi; ver: Ver; vars: VariableGpi[]; cols: { col: number; titulo?: string }[]; dias: string[];
  valoresDe: (d: string) => Record<string, Record<string, string>>; empresa: string; safra: number | null;
}) {
  const ahora = new Date();
  const desde = dias[0];
  const hasta = dias[dias.length - 1];
  const inicio = l.safraGpi?.INICIO?.slice(0, 10);
  const diasZafra = inicio ? Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / 86400000) + 1 : null;
  const columnas = cols.length ? cols : [{ col: 0, titulo: "" }];
  const celda = "border border-black px-1.5 py-0.5 text-[11px]";
  const encabezado = cn(celda, "bg-[#A6FFA7] font-semibold");
  const media = (v: VariableGpi) => {
    const xs = dias.map((d) => Number(String(valoresDe(d)[v.id]?.[COLUNA_DIA] ?? "").replace(",", "."))).filter((x, i) => !isNaN(x) && String(valoresDe(dias[i])[v.id]?.[COLUNA_DIA] ?? "").trim() !== "");
    if (!xs.length) return "";
    return String(Number((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(v.decimales ?? 4))).replace(".", ",");
  };
  return (
    <div className="hidden bg-white p-4 text-black print:block">
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-start gap-4 text-xs">
        <div className="font-semibold">{empresa}</div>
        <div className="space-y-1 text-center">
          <div className="bg-[#E0E0E0] px-6 py-0.5 font-semibold">Consulta de Entradas Diarias - {aDMA(desde)} a {aDMA(hasta)}</div>
          <div className="bg-[#E0E0E0] px-6 py-0.5">{diasZafra != null && <>{diasZafra} Días de Zafra -- </>}{dias.length} {dias.length === 1 ? "Día" : "Días"} en el período</div>
        </div>
        <div className="text-right font-semibold">
          {safra != null && <div>ZAFRA: {safra}/{safra + 1}</div>}
          <div>{ahora.toLocaleDateString("es-PY")}</div>
          <div>{ahora.toLocaleTimeString("es-PY")}</div>
        </div>
      </div>
      {dias.length === 1 && <div className="mb-1 text-sm font-semibold">Fecha : <span className="font-normal">{aDMA(desde)}</span></div>}
      <table className="border-collapse">
        <thead>
          <tr><th colSpan={4 + dias.length * columnas.length + 1 + (ver.sem ? 1 : 0) + (ver.acum ? 1 : 0)} className={cn(encabezado, "text-center text-sm")}>({plan.id}) {plan.nombre}</th></tr>
          {dias.length > 1 && (
            <tr>
              <th colSpan={4} className={encabezado} />
              {dias.map((d) => <th key={d} colSpan={columnas.length} className={cn(encabezado, "text-center")}>{aDMA(d)}</th>)}
              <th colSpan={1 + (ver.sem ? 1 : 0) + (ver.acum ? 1 : 0)} className={encabezado} />
            </tr>
          )}
          <tr>
            <th className={cn(encabezado, "text-left")}>Variable</th>
            <th className={cn(encabezado, "text-left")}>Unidad</th>
            <th className={encabezado}>Mínimo</th>
            <th className={encabezado}>Máximo</th>
            {dias.flatMap((d) => columnas.map((c) => <th key={`${d}|${c.col}`} className={cn(encabezado, "text-center")}>{c.titulo}</th>))}
            <th className={encabezado}>Media</th>
            {ver.sem && <th className={cn(celda, "bg-violet-200 font-semibold")}>Semanal</th>}
            {ver.acum && <th className={cn(celda, "bg-pink-200 font-semibold")}>Zafra</th>}
          </tr>
        </thead>
        <tbody>
          {vars.map((v) => (
            <tr key={v.id} className={v.calculada ? "bg-yellow-300" : ""}>
              <td className={cn(celda, "bg-white")}>{v.analisis || v.nombre}</td>
              <td className={cn(celda, "bg-white")}>{v.unidad}</td>
              <td className={cn(celda, "bg-white text-right")}>{v.especMin ? String(v.especMin).replace(".", ",") : ""}</td>
              <td className={cn(celda, "bg-white text-right")}>{v.especMax ? String(v.especMax).replace(".", ",") : ""}</td>
              {dias.flatMap((d) => columnas.map((c) => <td key={`${d}|${c.col}`} className={cn(celda, "text-right tabular-nums", !v.calculada && "bg-white")}>{valoresDe(d)[v.id]?.[String(c.col)] ?? ""}</td>))}
              <td className={cn(celda, "text-right tabular-nums", !v.calculada && "bg-white")}>{media(v)}</td>
              {ver.sem && <td className={cn(celda, "bg-violet-100 text-right tabular-nums")}>{l.semanal?.[v.id] ?? ""}</td>}
              {ver.acum && <td className={cn(celda, "bg-pink-100 text-right tabular-nums")}>{l.acumulado?.[v.id] ?? ""}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Encabezado de columnas fijas: gris neutro, fijo arriba.
const ENC = "sticky top-0 h-14 whitespace-nowrap border-b border-line bg-slate-100 px-3 text-xs font-semibold text-slate-600";

function Fila({
  v, cols, valores, mostrarDia, extras = [], extrasIzq = [], ver, acumulado, semanal, elegida, onElegir, editable = false, borrador = {}, activa = null, onActivar, onConfirmar,
}: {
  v: VariableGpi;
  ver?: Ver;
  acumulado?: string;
  semanal?: string;
  extras?: Record<string, string>[]; // valores de los días siguientes, solo lectura
  extrasIzq?: Record<string, string>[]; // valores de los días anteriores, solo lectura
  cols: { col: number; titulo?: string }[];
  valores: Record<string, string>;
  mostrarDia: boolean;
  elegida: boolean;
  onElegir: () => void;
  editable?: boolean;
  borrador?: Record<string, string>;
  activa?: string | null;
  onActivar?: (k: string | null) => void;
  onConfirmar?: (idVar: number, col: number, texto: string) => void;
}) {
  const fuera = (x?: string) => {
    if (x == null || x === "" || isNaN(Number(x))) return false;
    const n = Number(x);
    return (v.especMin != null && v.especMin !== 0 && n < v.especMin) || (v.especMax != null && v.especMax !== 0 && n > v.especMax);
  };
  const celda = "border-b border-slate-100 px-3 py-1.5";
  const leer = (val: Record<string, string>, i: number) => (
      <Fragment key={i}>
          {cols.map((c) => {
            const x = val[String(c.col)];
            const mal = fuera(x);
            return (
              <td key={c.col} title={mal ? "Fuera de especificación" : undefined} className={cn(celda, "text-right tabular-nums", c === cols[0] &&"border-l border-line", mal && "font-semibold text-red-700")}>
                {x ?? ""}
              </td>
            );
          })}
          {cols.length === 0 && <td className={celda} />}
          {mostrarDia && (
            <td className={cn(celda, "border-l border-line text-right font-semibold tabular-nums", fuera(val[COLUNA_DIA]) && "text-red-700")}>
              {val[COLUNA_DIA] ?? ""}
            </td>
          )}
        </Fragment>
  );
  return (
    // Las variables calculadas (con fórmula) llevan toda la fila en amarillo, como en el GPI viejo;
    // la fila elegida (clic) pasa a verde de selección y conserva la marca lateral de calculada.
    <tr
      tabIndex={0}
      onClick={onElegir}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onElegir(); } }}
      aria-current={elegida ? "true" : undefined}
      className={cn(
        "cursor-default",
        elegida ? "bg-brand-100" : v.calculada ? "bg-calc hover:bg-yellow-200" : "bg-surface hover:bg-slate-50",
        v.activa ? "text-ink" : "text-slate-500",
      )}
    >
      <td className={cn(celda, "sticky left-0 z-10 w-12 min-w-[3rem] bg-inherit text-right text-xs tabular-nums text-slate-600", v.calculada && "shadow-[inset_3px_0_0_#EAB308]")}>
        {v.orden}
      </td>
      <td className={cn(celda, "sticky left-12 z-10 min-w-64 bg-inherit")} title={v.formula || v.analisis}>
        <span className="flex items-center gap-1.5">
          {v.calculada && <Sigma className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-label="Calculada" />}
          <span className="truncate">{v.analisis || v.nombre}</span>
          {!v.activa && <Badge>inactiva</Badge>}
        </span>
      </td>
      <td className={cn(celda, "text-xs text-slate-600")}>{v.unidad}</td>
      {ver?.id && <td className={cn(celda, "text-right text-xs tabular-nums text-slate-600")}>{v.id}</td>}
      {ver?.esp && (
        <>
          <td className={cn(celda, "text-right text-xs tabular-nums text-slate-600")}>{v.especMin ? String(v.especMin).replace(".", ",") : ""}</td>
          <td className={cn(celda, "text-right text-xs tabular-nums text-slate-600")}>{v.especMax ? String(v.especMax).replace(".", ",") : ""}</td>
        </>
      )}
      {extrasIzq.map(leer)}
      {cols.map((c) => {
        const x = valores[String(c.col)];
        const mal = fuera(x);
        if (editable) {
          const k = `${v.id}|${c.col}`;
          const enBorrador = k in borrador;
          const mostrado = enBorrador ? borrador[k] : x ?? "";
          const rotulo = `${v.analisis || v.nombre}, columna ${c.titulo ?? c.col}`;
          if (activa === k) {
            return (
              <td key={c.col} data-celda={k} className={cn(celda, "p-0.5")} onClick={(e) => e.stopPropagation()}>
                <CeldaEditable
                  inicial={mostrado}
                  rotulo={rotulo}
                  decimal={v.tipoDig === 0}
                  hora={v.tipoDig === 3}
                  onConfirmar={(t) => onConfirmar?.(v.id, c.col, t)}
                  onCancelar={() => onActivar?.(null)}
                />
              </td>
            );
          }
          return (
            <td
              key={c.col}
              data-celda={k}
              tabIndex={0}
              role="button"
              aria-label={`${rotulo}: ${mostrado || "vacía"}. Doble clic o Enter para editar`}
              title="Doble clic para editar"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={() => onActivar?.(k)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); onActivar?.(k); } }}
              className={cn(celda, "cursor-cell text-right tabular-nums outline-none hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-600", enBorrador && "bg-brand-100 font-medium text-ink shadow-[inset_0_0_0_1px_#2A55C4]", mal && !enBorrador && "font-semibold text-red-700")}
            >
              {mostrado}
            </td>
          );
        }
        return (
          <td
            key={c.col}
            title={mal ? "Fuera de especificación" : undefined}
            className={cn(celda, "text-right tabular-nums", mal && "font-semibold text-red-700")}
          >
            {x ?? ""}
          </td>
        );
      })}
      {cols.length === 0 && <td className={celda} />}
      {mostrarDia && (
        <td
          title={fuera(valores[COLUNA_DIA]) ? "Fuera de especificación" : undefined}
          className={cn(celda, "border-l border-line text-right font-semibold tabular-nums", fuera(valores[COLUNA_DIA]) && "text-red-700")}
        >
          {valores[COLUNA_DIA] ?? ""}
        </td>
      )}
      {ver?.sem && <td className={cn(celda, "border-l border-line bg-violet-100 text-right font-semibold text-violet-950 dark:bg-violet-950 dark:text-violet-100 tabular-nums")}>{semanal ?? ""}</td>}
      {ver?.acum && <td className={cn(celda, "border-l border-line bg-pink-100 text-right font-semibold text-pink-950 dark:bg-pink-950 dark:text-pink-100 tabular-nums")}>{acumulado ?? ""}</td>}
      {extras.map(leer)}
    </tr>
  );
}

// Campo de una celda mientras se escribe: Enter o salir de la celda confirman, Esc cancela.
function CeldaEditable({ inicial, rotulo, decimal, hora, onConfirmar, onCancelar }: {
  inicial: string; rotulo: string; decimal: boolean; hora: boolean; onConfirmar: (t: string) => void; onCancelar: () => void;
}) {
  const [texto, setTexto] = useState(inicial);
  const [terminada, setTerminada] = useState(false); // evita confirmar dos veces (Enter y luego el blur al desmontarse)
  const cerrar = (confirmar: boolean) => {
    if (terminada) return;
    setTerminada(true);
    if (confirmar) onConfirmar(texto); else onCancelar();
  };
  return (
    <input
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => cerrar(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); cerrar(true); } else if (e.key === "Escape") { e.preventDefault(); cerrar(false); }
      }}
      inputMode={decimal ? "decimal" : "text"}
      placeholder={hora ? "h:mm" : undefined}
      aria-label={rotulo}
      className="h-7 w-full min-w-[4.5rem] rounded border border-brand-800 bg-surface px-1.5 text-right text-[13px] tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-600/30"
    />
  );
}
