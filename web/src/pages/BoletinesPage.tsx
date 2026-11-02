import { aDMA } from "@/lib/fecha";
import { num } from "@/lib/num";
import { LOCALE } from "@/lib/formato";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type BoletinGpi, type ItemBoletin } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import { Alert, EmptyState, Input, SearchInput, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

function fmt(s: string | null | undefined, dec?: number | null) {
  const n = num(s);
  if (n === null) return "";
  return n.toLocaleString(LOCALE, { minimumFractionDigits: dec ?? 0, maximumFractionDigits: dec ?? 3 });
}

// Boletines (frmRelResumo): ítems en una o dos columnas con el resultado del día y el acumulado de zafra.
export default function BoletinesPage() {
  const [filtro, setFiltro] = useState("");
  const [idBoletin, setIdBoletin] = useState<number | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);

  const safra = useQuery({ queryKey: ["gpi-safra"], queryFn: () => api.gpi.safra() });
  const lista = useQuery({ queryKey: ["gpi-boletines"], queryFn: () => api.gpi.boletines() });
  const dia = fecha ?? safra.data?.parametros?.FECHA_REAL ?? null;

  const boletin = useQuery({
    queryKey: ["gpi-boletin", idBoletin, dia],
    queryFn: () => api.gpi.boletin(idBoletin!, dia!),
    enabled: !!idBoletin && !!dia,
  });
  const filtrados = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    return (lista.data?.boletines ?? []).filter((b) => !f || b.titulo.toLowerCase().includes(f));
  }, [lista.data, filtro]);
  const actual = lista.data?.boletines.find((b) => b.id === idBoletin) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Proceso Industrial (GPI)" }, { label: "Boletines" }]} />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-72 shrink-0 flex-col border-r border-line bg-surface">
          <div className="shrink-0 border-b border-line p-3">
            <h2 className="section-label mb-2">Boletines</h2>
            <SearchInput compact value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar boletín…" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {lista.isLoading && <div className="p-4"><Spinner className="text-slate-400" /></div>}
            {lista.error && <Alert>{(lista.error as Error).message}</Alert>}
            {lista.data && filtrados.length === 0 && <EmptyState>Sin boletines que coincidan.</EmptyState>}
            <ul>
              {filtrados.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setIdBoletin(b.id)}
                    aria-current={b.id === idBoletin ? "true" : undefined}
                    className={cn("flex w-full flex-col rounded-md px-2.5 py-1.5 text-left transition-colors", b.id === idBoletin ? "bg-brand-100 shadow-[inset_2px_0_0_rgb(var(--success))]" : "hover:bg-slate-100")}
                  >
                    <span className={cn("truncate text-[13px]", b.id === idBoletin ? "font-medium text-ink" : "text-ink")}>{b.titulo}</span>
                    <span className="truncate text-xs text-muted">#{b.id} · {b.variables} variable(s)</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-canvas">
          <BarraHerramientas titulo={actual?.titulo ?? "Boletines"} detalle={actual && dia ? `Día ${aDMA(dia)}` : undefined}>
            {actual && (
              <label className="flex items-center gap-1.5 text-[13px] text-slate-700">
                Fecha
                <Input compact type="date" className="w-36" value={dia ?? ""} onChange={(e) => setFecha(e.target.value || null)} />
              </label>
            )}
          </BarraHerramientas>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {!actual && <EmptyState>Seleccione un boletín de la lista.</EmptyState>}
            {boletin.error && <Alert>{(boletin.error as Error).message}</Alert>}
            {boletin.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
            {boletin.data && <Columnas b={boletin.data} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Columnas({ b }: { b: BoletinGpi }) {
  return (
    <div className={cn("grid gap-4", b.columnas.length > 1 && "xl:grid-cols-2")}>
      {b.columnas.map((items, i) => (
        <section key={i} className="panel overflow-hidden">
          <table className="data-table">
            <thead>
              <tr><th>Concepto</th><th className="text-right">Día</th><th className="text-right">Acumulado de zafra</th></tr>
            </thead>
            <tbody>{items.map((it, j) => <Fila key={j} it={it} />)}</tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

function Fila({ it }: { it: ItemBoletin }) {
  if (it.tipo === "division") return <tr><td colSpan={3} className="bg-slate-100 font-semibold text-ink">{it.texto}</td></tr>;
  if (it.tipo === "subdivision") return <tr><td colSpan={3} className="font-medium text-slate-700">{it.texto}</td></tr>;
  const dec = it.variable?.decimales;
  return (
    <tr>
      <td title={it.variable ? `${it.variable.planNombre} · #${it.variable.id}` : undefined}>
        <span className="block truncate">{it.texto}{it.variable?.unidad ? <span className="text-muted"> ({it.variable.unidad})</span> : null}</span>
      </td>
      {it.habilitada
        ? <><td className="text-right tabular-nums">{fmt(it.dia, dec)}</td><td className="text-right tabular-nums">{fmt(it.acumulado, dec)}</td></>
        : <td colSpan={2} className="text-right text-muted">sin acceso</td>}
    </tr>
  );
}
