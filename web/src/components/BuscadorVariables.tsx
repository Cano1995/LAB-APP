import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRetardo } from "@/lib/hooks";
import { Plus } from "lucide-react";
import { api, type VariableMeta } from "@/lib/api";
import { Alert, EmptyState, SearchInput, Spinner } from "@/components/ui";

export const etiquetaVariable = (v: VariableMeta) => v.analisis || v.nombre;

// Búsqueda de variables activas (solo las de planillas habilitadas para el usuario) con lista para elegir.
export default function BuscadorVariables({ elegidas, onElegir, max }: { elegidas: number[]; onElegir: (v: VariableMeta) => void; max?: number }) {
  const [q, setQ] = useState("");
  const qEnviada = useRetardo(q.trim());
  const busqueda = useQuery({
    queryKey: ["gpi-buscar", qEnviada],
    queryFn: () => api.gpi.buscarVariables(qEnviada),
    enabled: qEnviada.length >= 2,
    placeholderData: keepPreviousData,
  });
  const lleno = max !== undefined && elegidas.length >= max;
  return (
    <div>
      <SearchInput compact value={q} onChange={(e) => setQ(e.target.value)} placeholder="Descripción, nombre, planilla o código…" />
      {q.trim().length >= 2 && (
        <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-line">
          {busqueda.isFetching && <div className="p-3"><Spinner className="text-slate-400" /></div>}
          {busqueda.error && <Alert>{(busqueda.error as Error).message}</Alert>}
          {busqueda.data && busqueda.data.variables.length === 0 && <EmptyState>Sin variables que coincidan.</EmptyState>}
          <ul>
            {busqueda.data?.variables.map((v) => {
              const ya = elegidas.includes(v.id);
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    disabled={ya || lleno}
                    onClick={() => onElegir(v)}
                    className="group flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-brand-50 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-ink">{etiquetaVariable(v)}{v.unidad ? <span className="text-muted"> ({v.unidad})</span> : null}</span>
                      <span className="block truncate text-xs text-muted">{v.planNombre} · #{v.id}</span>
                    </span>
                    {!ya && <Plus className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-link" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
