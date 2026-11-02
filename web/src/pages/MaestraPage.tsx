import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRetardo } from "@/lib/hooks";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { api, type Columna, type Fila } from "@/lib/api";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  FormActions,
  IconButton,
  Input,
  Modal,
  SearchInput,
} from "@/components/ui";
import AppHeader from "@/components/AppHeader";
import { cn } from "@/lib/utils";

export default function MaestraPage() {
  const { recurso = "" } = useParams();
  const qc = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<Fila | null>(null);
  const [creando, setCreando] = useState(false);
  const [aBorrar, setABorrar] = useState<Fila | null>(null);

  const busquedaEnviada = useRetardo(busqueda);
  const { data, isLoading, error } = useQuery({
    queryKey: ["maestra", recurso, busquedaEnviada],
    queryFn: () => api.maestras.tabla(recurso, busquedaEnviada || undefined),
    placeholderData: (previo, consultaPrevia) => (consultaPrevia?.queryKey[1] === recurso ? previo : undefined),
  });

  const meta = data?.recurso;
  const filas = data?.filas ?? [];
  const pkCols = useMemo(() => meta?.columnas.filter((c) => c.pk) ?? [], [meta]);
  const idDe = (f: Fila) => pkCols.map((c) => String(f[c.col] ?? "")).join("~");
  const colsLista = pkPrimero(meta?.columnas.filter((c) => c.lista) ?? meta?.columnas ?? []);
  const puedeEditar = !!meta && meta.nivel >= 2;
  const puedeBorrar = !!meta && meta.nivel >= 3;

  const invalidar = () => qc.invalidateQueries({ queryKey: ["maestra", recurso] });
  const mBorrar = useMutation({
    mutationFn: (f: Fila) => api.maestras.eliminar(recurso, idDe(f)),
    onSuccess: () => { setABorrar(null); invalidar(); },
  });

  return (
    <div className="min-h-full">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: meta?.titulo ?? recurso }]} />

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="page-title">{meta?.titulo ?? recurso}</h1>
          {meta && !puedeEditar && (
            <Badge tone="warning">
              <Lock className="h-3 w-3" aria-hidden /> Solo consulta
            </Badge>
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <SearchInput
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar…"
            className="w-72"
          />
          {puedeEditar && (
            <Button onClick={() => setCreando(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Nuevo
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-3">
            <Alert>{error instanceof Error ? error.message : "Error al cargar"}</Alert>
          </div>
        )}

        <div className="panel overflow-hidden">
          <div className="max-h-[calc(100vh-16rem)] overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {colsLista.map((c) => (
                    <th key={c.col} className={cn(aDerecha(c) && "text-right", esCodigo(c) && "w-28")}>{c.label}</th>
                  ))}
                  {(puedeEditar || puedeBorrar) && <th className="w-px"><span className="sr-only">Acciones</span></th>}
                </tr>
              </thead>
              <tbody>
                {isLoading && <FilasEsqueleto columnas={colsLista.length || 3} />}
                {filas.map((f) => (
                  <tr key={idDe(f)} className="hover:bg-slate-50">
                    {colsLista.map((c) => (
                      <td key={c.col} className={cn(c.tipo === "numero" && "tabular-nums", aDerecha(c) && "text-right")}>{formatear(f[c.col], c)}</td>
                    ))}
                    {(puedeEditar || puedeBorrar) && (
                      <td className="py-1">
                        <div className="flex justify-end gap-0.5">
                          {puedeEditar && (
                            <IconButton label="Editar" className="h-7 w-7" onClick={() => setEditando(f)}>
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                          )}
                          {puedeBorrar && (
                            <IconButton label="Eliminar" tone="danger" className="h-7 w-7" onClick={() => setABorrar(f)}>
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && filas.length === 0 && (
              <EmptyState>{busqueda ? `Sin resultados para «${busqueda}».` : "Sin registros."}</EmptyState>
            )}
          </div>
          {meta && (
            <div className="border-t border-line bg-slate-50 px-4 py-2 text-xs text-muted">
              {filas.length} registro(s)
            </div>
          )}
        </div>
      </main>

      {(creando || editando) && meta && (
        <FormModal
          recurso={recurso}
          columnas={meta.columnas}
          registro={editando}
          idDe={idDe}
          onClose={() => { setCreando(false); setEditando(null); }}
          onSaved={() => { setCreando(false); setEditando(null); invalidar(); }}
        />
      )}

      {aBorrar && (
        <Modal title="Eliminar registro" size="sm" onClose={() => setABorrar(null)}>
          <p className="text-sm text-slate-700">¿Eliminar este registro? Esta acción no se puede deshacer.</p>
          {mBorrar.error && <div className="mt-3"><Alert>{(mBorrar.error as Error).message}</Alert></div>}
          <FormActions>
            <Button variant="secondary" onClick={() => setABorrar(null)}>Cancelar</Button>
            <Button variant="danger" loading={mBorrar.isPending} onClick={() => mBorrar.mutate(aBorrar)}>
              Eliminar
            </Button>
          </FormActions>
        </Modal>
      )}
    </div>
  );
}

// Las columnas de clave (código) primero, como en el GATEC viejo; el resto conserva el orden de la tabla.
function pkPrimero(cols: Columna[]) {
  return [...cols.filter((c) => c.pk), ...cols.filter((c) => !c.pk)];
}

// Códigos (clave numérica): identificadores, a la izquierda y angostos. Cantidades (numéricos que no son clave): a la derecha.
const esCodigo = (c: Columna) => c.tipo === "numero" && !!c.pk;
const aDerecha = (c: Columna) => c.tipo === "numero" && !c.pk;

function formatear(v: Fila[string], c: Columna) {
  if (v === null || v === undefined || v === "") return <span className="text-slate-400">—</span>;
  if (c.tipo === "bool") return v ? "Sí" : "No";
  return String(v);
}

// Filas de carga: mantienen la altura de la tabla mientras llegan los datos.
function FilasEsqueleto({ columnas }: { columnas: number }) {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <tr key={i} aria-hidden>
          {Array.from({ length: columnas }, (_, j) => (
            <td key={j}>
              <div className={cn("h-3.5 animate-pulse rounded bg-slate-200", j === 0 ? "w-12" : "w-3/4")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function FormModal({
  recurso, columnas, registro, idDe, onClose, onSaved,
}: {
  recurso: string;
  columnas: Columna[];
  registro: Fila | null;
  idDe: (f: Fila) => string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const esEdicion = !!registro;
  const [valores, setValores] = useState<Fila>(() => {
    const init: Fila = {};
    for (const c of columnas) init[c.col] = registro ? registro[c.col] : c.tipo === "bool" ? false : "";
    return init;
  });

  const guardar = useMutation({
    mutationFn: () =>
      esEdicion
        ? api.maestras.actualizar(recurso, idDe(registro!), valores)
        : api.maestras.crear(recurso, valores),
    onSuccess: onSaved,
  });

  const set = (col: string, v: Fila[string]) => setValores((p) => ({ ...p, [col]: v }));
  const campos = pkPrimero(columnas.filter((c) => !c.scope));

  return (
    <Modal title={esEdicion ? "Editar registro" : "Nuevo registro"} size={campos.length > 6 ? "lg" : "md"} onClose={onClose} cierreBloqueado={guardar.isPending}>
      <form onSubmit={(e) => { e.preventDefault(); guardar.mutate(); }}>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
          {campos.map((c) => {
            const bloqueado = esEdicion && c.pk; // la PK no se edita
            if (c.tipo === "bool") {
              return (
                <Checkbox
                  key={c.col}
                  label={c.label}
                  checked={!!valores[c.col]}
                  onChange={(e) => set(c.col, e.target.checked)}
                  className="sm:col-span-2"
                />
              );
            }
            const tipoInput = c.tipo === "numero" ? "number" : c.tipo === "fecha" ? "date" : c.tipo === "hora" ? "time" : c.tipo === "fechahora" ? "datetime-local" : "text";
            const valor = c.tipo === "fecha" ? String(valores[c.col] ?? "").slice(0, 10)
              : c.tipo === "fechahora" ? String(valores[c.col] ?? "").replace(" ", "T")
              : (valores[c.col] ?? "");
            const ancho = c.tipo === "texto" && (c.len ?? 0) > 60 ? "sm:col-span-2" : undefined;
            return (
              <Field
                key={c.col}
                label={c.label}
                required={c.req}
                hint={bloqueado ? "Clave: no se puede modificar." : undefined}
                className={ancho}
              >
                <Input
                  value={valor as string | number}
                  onChange={(e) => set(c.col, e.target.value)}
                  type={tipoInput}
                  maxLength={c.tipo === "texto" ? c.len : undefined}
                  disabled={bloqueado}
                  aria-required={c.req || undefined}
                />
              </Field>
            );
          })}
        </div>

        {guardar.error && <div className="mt-4"><Alert>{(guardar.error as Error).message}</Alert></div>}

        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={guardar.isPending}>Guardar</Button>
        </FormActions>
      </form>
    </Modal>
  );
}
