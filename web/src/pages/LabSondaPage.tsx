import { aDMA } from "@/lib/fecha";
import { LOCALE } from "@/lib/formato";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type EstadoSonda, type FilaSonda, type SondaGpi } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import { Alert, Badge, Button, Dato, EmptyState, Input, Modal, Select, Spinner } from "@/components/ui";
import { mismos } from "@/lib/utils";

const hora = (iso: string) => `${aDMA(iso.slice(0, 10))} ${iso.slice(11, 16)}`;
const fmt = (n: number | null | undefined, d = 2) => (n === null || n === undefined ? "—" : n.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d }));

const ESTADOS: { valor: EstadoSonda; texto: string }[] = [
  { valor: "todos", texto: "Todos" },
  { valor: "completas", texto: "Completas" },
  { valor: "sinresultado", texto: "Sin resultado" },
  { valor: "acoplados", texto: "Acoplados" },
  { valor: "canceladas", texto: "Canceladas" },
];

// Nombres de los campos de GA_ANALI_SONDA que el laboratorio reconoce; el resto se muestra con su código.
const ROTULOS: Record<string, string> = {
  PAN_BRIX: "Brix", PAN_LS: "Lectura sacarimétrica (LS)", PAN_PBU: "PBU", PAN_POL_CALDO: "Pol del caldo", PAN_PESO_AMOSTRA: "Peso de la muestra (g)",
  PAN_CLARIF: "Clarificante", PAN_FIBRA_CANA: "Fibra % caña", PAN_PUREZA: "Pureza", PAN_POL_CANA: "Pol % caña", PAN_AR_CANA: "AR % caña",
  PAN_ATR: "ATR (kg/t)", PAN_AGIO: "Ágio", PAN_AR_CALDO: "AR del caldo", PAN_PH: "pH", PAN_OPER_DIGIT: "Operador", PAN_NUMER: "Número",
  ID_LANC_CONTA: "ID de análisis", NRO_COMPROBANTE: "Comprobante", NRO_ACOPLADO: "Acoplado", COD_ACUMULADO: "Código de acumulado",
  COD_EMPR: "Empresa", SAF_ANO_SAFRA: "Zafra",
};

interface Filtros { desde: string | null; hasta: string | null; comprobante: string; estado: EstadoSonda }

// Análisis de caña (sonda, Pós-Colheita) en consulta: un análisis por comprobante de balanza y acoplado.
export default function LabSondaPage() {
  const [f, setF] = useState<Filtros>({ desde: null, hasta: null, comprobante: "", estado: "todos" });
  const [aplicado, setAplicado] = useState<Filtros>(f);
  const [detalle, setDetalle] = useState<number | null>(null);

  const r = useQuery({
    queryKey: ["lab-sonda", aplicado],
    queryFn: () => api.lab.sonda({ desde: aplicado.desde ?? undefined, hasta: aplicado.hasta ?? undefined, comprobante: aplicado.comprobante.trim() || undefined, estado: aplicado.estado }),
  });
  const desdeEf = f.desde ?? r.data?.desde ?? "";
  const hastaEf = f.hasta ?? r.data?.hasta ?? "";

  // Con los mismos filtros react-query no ve ningún cambio en la clave y no consulta: se fuerza el refresco.
  const consultar = () => {
    const nuevo = { ...f, desde: f.desde ?? r.data?.desde ?? null, hasta: f.hasta ?? r.data?.hasta ?? null };
    if (mismos(nuevo, aplicado)) r.refetch(); else setAplicado(nuevo);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Laboratorio de recepción" }, { label: "Análisis de caña (sonda)" }]} />
      <BarraHerramientas
        titulo="Análisis de caña (sonda)"
        detalle={r.data?.desde ? `${aDMA(r.data.desde)}${r.data.hasta !== r.data.desde ? ` – ${aDMA(r.data.hasta!)}` : ""}` : undefined}
      >
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[13px] text-slate-700">
            Desde
            <Input compact type="date" className="w-36" value={desdeEf} onChange={(e) => setF({ ...f, desde: e.target.value || null })} />
          </label>
          <label className="flex items-center gap-1.5 text-[13px] text-slate-700">
            Hasta
            <Input compact type="date" className="w-36" value={hastaEf} onChange={(e) => setF({ ...f, hasta: e.target.value || null })} />
          </label>
          <Input compact inputMode="numeric" className="w-32" placeholder="Comprobante" aria-label="Comprobante" value={f.comprobante} onChange={(e) => setF({ ...f, comprobante: e.target.value })} />
          <Select compact aria-label="Estado" value={f.estado} onChange={(e) => setF({ ...f, estado: e.target.value as EstadoSonda })}>
            {ESTADOS.map((e) => <option key={e.valor} value={e.valor}>{e.texto}</option>)}
          </Select>
          <Button size="sm" onClick={consultar} loading={r.isFetching}>Consultar</Button>
        </div>
      </BarraHerramientas>

      <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
        {r.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
        {r.error && <Alert>{(r.error as Error).message}</Alert>}
        {r.data && r.data.resumen.total === 0 && <EmptyState>No hay análisis con esos filtros.</EmptyState>}
        {r.data && r.data.resumen.total > 0 && <Contenido d={r.data} onDetalle={setDetalle} />}
      </div>

      {detalle !== null && <Detalle id={detalle} onClose={() => setDetalle(null)} />}
    </div>
  );
}

function Contenido({ d, onDetalle }: { d: SondaGpi; onDetalle: (id: number) => void }) {
  const s = d.resumen;
  return (
    <div className="space-y-4">
      <section className="panel grid grid-cols-2 gap-x-6 gap-y-3 p-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9">
        <Dato t="Análisis" v={String(s.total)} />
        <Dato t="Completas" v={String(s.completas ?? 0)} />
        <Dato t="Sin resultado" v={String(s.sinResultado ?? 0)} />
        <Dato t="Acoplados" v={String(s.acoplados ?? 0)} />
        <Dato t="Canceladas" v={String(s.canceladas ?? 0)} alerta={(s.canceladas ?? 0) > 0} />
        <Dato t="Brix prom." v={fmt(s.brix)} />
        <Dato t="Pol % caña prom." v={fmt(s.pol)} />
        <Dato t="Fibra % prom." v={fmt(s.fibra)} />
        <Dato t="ATR prom. (kg/t)" v={fmt(s.atr)} />
      </section>

      {d.truncado && <Alert tone="warning">Se muestran los 500 análisis más recientes; acote las fechas o el estado para ver el resto. El resumen cuenta todos.</Alert>}

      <section className="panel overflow-auto">
        <table className="data-table w-auto min-w-full">
          <thead>
            <tr>
              <th>Fecha y hora</th><th className="text-right">Comprobante</th><th className="text-right">Acopl.</th>
              <th className="text-right">Brix</th><th className="text-right">Pol % caña</th><th className="text-right">Fibra %</th>
              <th className="text-right">Pureza</th><th className="text-right">AR % caña</th><th className="text-right">ATR</th>
              <th>Operador</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {d.filas.map((x) => <Fila key={x.id} x={x} onClick={() => onDetalle(x.id)} />)}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Fila({ x, onClick }: { x: FilaSonda; onClick: () => void }) {
  const completa = x.brix !== null;
  return (
    // El clic en cualquier parte de la fila abre el detalle (mouse); el teclado y los lectores de pantalla usan el botón de la primera celda.
    <tr className="cursor-pointer hover:bg-brand-50" onClick={onClick}>
      <td className="tabular-nums">
        <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} aria-label={`Ver el análisis ${x.id} del comprobante ${x.comprobante}`} className="rounded text-left hover:underline">
          {hora(x.fecha)}
        </button>
      </td>
      <td className="text-right tabular-nums">{x.comprobante}</td>
      <td className="text-right tabular-nums">{x.acoplado}</td>
      <td className="text-right tabular-nums">{fmt(x.brix)}</td>
      <td className="text-right tabular-nums">{fmt(x.pol)}</td>
      <td className="text-right tabular-nums">{fmt(x.fibra)}</td>
      <td className="text-right tabular-nums">{fmt(x.pureza)}</td>
      <td className="text-right tabular-nums">{fmt(x.ar, 3)}</td>
      <td className="text-right tabular-nums">{fmt(x.atr)}</td>
      <td>{x.operador ?? ""}</td>
      <td>
        {x.motivoCancelacion
          ? <Badge tone="danger" title={x.motivoCancelacion.descripcion ?? undefined}>Cancelada</Badge>
          : completa ? <Badge tone="success">Completa</Badge> : x.acoplado > 1 ? <span className="text-muted" title="Se analiza un resultado por camión: ver el acoplado 1">Acoplado</span> : <Badge tone="warning">Sin resultado</Badge>}
      </td>
    </tr>
  );
}

function Detalle({ id, onClose }: { id: number; onClose: () => void }) {
  const r = useQuery({ queryKey: ["lab-sonda-detalle", id], queryFn: () => api.lab.sondaDetalle(id) });
  return (
    <Modal title={`Análisis ${id}`} onClose={onClose} size="lg">
      {r.isLoading && <div className="p-6 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
      {r.error && <Alert>{(r.error as Error).message}</Alert>}
      {r.data && (
        <div className="space-y-4">
          <p className="text-[13px] text-muted">
            {hora(r.data.fecha)} · comprobante {r.data.comprobante}, acoplado {r.data.acoplado}
            {r.data.fechaDigitacion ? ` · digitado el ${aDMA(r.data.fechaDigitacion)}` : ""}
          </p>
          {r.data.motivoCancelacion && <Alert tone="warning">Cancelado: {r.data.motivoCancelacion.descripcion ?? `motivo ${r.data.motivoCancelacion.codigo}`}</Alert>}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {Object.entries(r.data.campos).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted">{ROTULOS[k] ?? k}</dt>
                <dd className="text-[13px] tabular-nums text-ink">{typeof v === "number" ? v.toLocaleString(LOCALE, { maximumFractionDigits: 4 }) : v}</dd>
              </div>
            ))}
          </dl>
          {r.data.sondaPrimaria.length > 0 && (
            <section>
              <h3 className="section-label mb-1.5">Lecturas de la sonda primaria</h3>
              <table className="data-table">
                <thead><tr><th>Fecha</th><th className="text-right">Brix</th><th className="text-right">LS</th><th className="text-right">PBU</th><th className="text-right">pH</th><th>Operador</th></tr></thead>
                <tbody>
                  {r.data.sondaPrimaria.map((p, i) => (
                    <tr key={i}>
                      <td>{p.fecha ? aDMA(p.fecha) : ""}</td><td className="text-right tabular-nums">{fmt(p.brix)}</td><td className="text-right tabular-nums">{fmt(p.ls)}</td>
                      <td className="text-right tabular-nums">{fmt(p.pbu)}</td><td className="text-right tabular-nums">{fmt(p.ph)}</td><td>{p.operador ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
