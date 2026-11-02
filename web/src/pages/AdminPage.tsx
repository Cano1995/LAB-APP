import { aDMA, hoyLocal } from "@/lib/fecha";
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRetardo } from "@/lib/hooks";
import { api, type AccesoAdmin, type UsuarioAdmin } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import BarraHerramientas from "@/components/BarraHerramientas";
import { Alert, Badge, Button, Checkbox, EmptyState, Input, SearchInput, Select, Spinner } from "@/components/ui";
import { cn, mismos } from "@/lib/utils";
import ConfiguracionTab from "@/pages/ConfiguracionTab";

type Pestana = "usuarios" | "grupos" | "pantallas" | "conexiones" | "configuracion";
const PESTANAS: { id: Pestana; texto: string }[] = [
  { id: "usuarios", texto: "Usuarios" },
  { id: "grupos", texto: "Grupos" },
  { id: "pantallas", texto: "Permisos por pantalla" },
  { id: "conexiones", texto: "Conexiones" },
  { id: "configuracion", texto: "Configuración" },
];

const hora = (iso: string | null) => (iso ? `${aDMA(iso.slice(0, 10))} ${iso.slice(11, 16)}` : "—");

// Administración del GATEC (GAtec_Senha) en SOLO CONSULTA: no se modifican usuarios, grupos ni permisos, y nunca se muestran contraseñas.
export default function AdminPage() {
  const [pestana, setPestana] = useState<Pestana>("usuarios");
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Administración" }]} />
      <BarraHerramientas titulo="Usuarios, grupos y permisos" detalle="Usuarios y permisos en solo consulta (sin contraseñas); la configuración de marca sí se edita">
        <div role="tablist" aria-label="Secciones" className="flex gap-1">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              role="tab"
              type="button"
              aria-selected={pestana === p.id}
              onClick={() => setPestana(p.id)}
              className={cn("rounded-md px-3 py-1.5 text-[13px] font-medium", pestana === p.id ? "bg-brand-100 text-ink" : "text-slate-600 hover:bg-slate-100")}
            >
              {p.texto}
            </button>
          ))}
        </div>
      </BarraHerramientas>
      <div className="min-h-0 flex-1">
        {pestana === "usuarios" && <Usuarios />}
        {pestana === "grupos" && <Grupos />}
        {pestana === "pantallas" && <Pantallas />}
        {pestana === "conexiones" && <Conexiones />}
        {pestana === "configuracion" && <ConfiguracionTab />}
      </div>
    </div>
  );
}

function Nivel({ a }: { a: AccesoAdmin | null | undefined }) {
  if (!a) return <span className="text-muted">—</span>;
  if (a.codigo === 1) return <Badge tone="success">Total</Badge>;
  if (a.codigo === 3) return <Badge tone="info">Parcial</Badge>;
  return <Badge tone="danger">Sin acceso</Badge>;
}

function EstadoUsuario({ u }: { u: UsuarioAdmin }) {
  return (
    <span className="flex flex-wrap gap-1">
      {u.activo ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>}
      {u.master && <Badge tone="warning">Administrador</Badge>}
      {u.bloqueado && <Badge tone="danger">Bloqueado</Badge>}
    </span>
  );
}

function Maestro<T>({ lista, vacio, children, cargando, error }: { lista: T[] | undefined; vacio: string; children: React.ReactNode; cargando: boolean; error: unknown }) {
  return (
    <>
      {cargando && <div className="p-4"><Spinner className="text-slate-400" /></div>}
      {error ? <Alert>{(error as Error).message}</Alert> : null}
      {lista && lista.length === 0 && <EmptyState>{vacio}</EmptyState>}
      {children}
    </>
  );
}

// ---------- Usuarios ----------
function Usuarios() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("activos");
  const [id, setId] = useState<number | null>(null);
  const qEnviada = useRetardo(q);
  const lista = useQuery({ queryKey: ["admin-usuarios", qEnviada, estado], queryFn: () => api.admin.usuarios(qEnviada.trim(), estado), placeholderData: keepPreviousData });
  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-80 shrink-0 flex-col border-r border-line bg-surface">
        <div className="shrink-0 space-y-2 border-b border-line p-3">
          <SearchInput compact value={q} onChange={(e) => setQ(e.target.value)} placeholder="Usuario o nombre…" />
          <Select compact aria-label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="activos">Activos</option><option value="inactivos">Inactivos</option><option value="todos">Todos</option>
          </Select>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <Maestro lista={lista.data?.usuarios} vacio="Sin usuarios que coincidan." cargando={lista.isLoading} error={lista.error}>
            <ul>
              {lista.data?.usuarios.map((u) => (
                <li key={u.id}>
                  <button type="button" onClick={() => setId(u.id)} aria-current={u.id === id ? "true" : undefined}
                    className={cn("flex w-full flex-col rounded-md px-2.5 py-1.5 text-left", u.id === id ? "bg-brand-100 shadow-[inset_2px_0_0_rgb(var(--success))]" : "hover:bg-slate-100")}>
                    <span className="truncate text-[13px] text-ink">{u.usuario}{!u.activo && <span className="text-muted"> (inactivo)</span>}</span>
                    <span className="truncate text-xs text-muted">{u.nombre ?? "—"}{u.grupos ? ` · ${u.grupos}` : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
            {lista.data?.truncado && <p className="p-2 text-xs text-muted">Se muestran los primeros 500; use el buscador.</p>}
          </Maestro>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto bg-canvas p-4">
        {id === null ? <EmptyState>Seleccione un usuario.</EmptyState> : <DetalleUsuario id={id} />}
      </main>
    </div>
  );
}

function DetalleUsuario({ id }: { id: number }) {
  const r = useQuery({ queryKey: ["admin-usuario", id], queryFn: () => api.admin.usuario(id) });
  const [f, setF] = useState("");
  const [soloConAcceso, setSoloConAcceso] = useState(true);
  const permisos = useMemo(() => {
    const t = f.trim().toLowerCase();
    return (r.data?.permisos ?? []).filter((p) => (!soloConAcceso || p.efectivo?.codigo !== 2) && (!t || p.titulo.toLowerCase().includes(t) || p.objeto.toLowerCase().includes(t) || String(p.idForm).includes(t)));
  }, [r.data, f, soloConAcceso]);
  if (r.isLoading) return <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>;
  if (r.error) return <Alert>{(r.error as Error).message}</Alert>;
  const d = r.data!;
  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[16px] font-semibold text-ink">{d.usuario}</h2>
          <EstadoUsuario u={d as unknown as UsuarioAdmin} />
        </div>
        <p className="mt-1 text-[13px] text-muted">{d.nombre ?? "—"}{d.ramal ? ` · interno ${d.ramal}` : ""} · ID {d.id}</p>
        <p className="mt-2 text-[13px] text-ink">Grupos: {d.grupos.length ? d.grupos.map((g) => g.nombre).join(", ") : <span className="text-muted">ninguno</span>}</p>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
          <h3 className="panel-title">Permisos efectivos ({permisos.length} de {d.permisos.length})</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Checkbox label="Ocultar «sin acceso»" checked={soloConAcceso} onChange={(e) => setSoloConAcceso(e.target.checked)} />
            <SearchInput compact className="w-60" value={f} onChange={(e) => setF(e.target.value)} placeholder="Filtrar pantallas…" />
          </div>
        </div>
        <div className="max-h-[28rem] overflow-auto">
          <table className="data-table w-auto min-w-full">
            <thead><tr><th>Código</th><th>Módulo</th><th>Pantalla</th><th>Directo</th><th>Por grupo</th><th>Efectivo</th></tr></thead>
            <tbody>
              {permisos.map((p) => (
                <tr key={p.idForm}>
                  <td className="tabular-nums text-muted">{p.idForm}</td><td className="tabular-nums">{p.modulo}</td>
                  <td><span className="block max-w-80 truncate" title={p.objeto}>{p.titulo}</span></td>
                  <td><Nivel a={p.directo} /></td><td><Nivel a={p.grupo} /></td><td><Nivel a={p.efectivo} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 pb-3 pt-2 text-xs text-muted">El permiso directo del usuario pisa a los de grupo; entre varios grupos manda el más restrictivo (mismo criterio que el ingreso a esta aplicación).</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel overflow-hidden">
          <h3 className="panel-title px-4 pt-3">Últimos cambios de permisos ({d.historial.length})</h3>
          {d.historial.length === 0 ? <p className="px-4 py-3 text-[13px] text-muted">Sin cambios registrados.</p> : (
            <table className="data-table"><thead><tr><th>Fecha</th><th>Pantalla</th><th>Acceso</th><th>Por</th></tr></thead>
              <tbody>{d.historial.map((h, i) => <tr key={i}><td className="tabular-nums">{hora(h.fecha)}</td><td><span className="block max-w-56 truncate">{h.titulo ?? h.idForm}</span></td><td><Nivel a={h.acceso} /></td><td>{h.responsable ?? ""}</td></tr>)}</tbody></table>
          )}
        </section>
        <section className="panel overflow-hidden">
          <h3 className="panel-title px-4 pt-3">Últimas conexiones ({d.conexiones.length})</h3>
          {d.conexiones.length === 0 ? <p className="px-4 py-3 text-[13px] text-muted">Sin conexiones registradas.</p> : (
            <table className="data-table"><thead><tr><th>Inicio</th><th>Fin</th><th className="text-right">Módulo</th><th>Equipo</th></tr></thead>
              <tbody>{d.conexiones.map((c, i) => <tr key={i}><td className="tabular-nums">{hora(c.inicio)}</td><td className="tabular-nums">{hora(c.fin)}</td><td className="text-right tabular-nums">{c.modulo}</td><td>{c.equipo ?? ""}</td></tr>)}</tbody></table>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------- Grupos ----------
function Grupos() {
  const [id, setId] = useState<number | null>(null);
  const lista = useQuery({ queryKey: ["admin-grupos"], queryFn: () => api.admin.grupos() });
  const det = useQuery({ queryKey: ["admin-grupo", id], queryFn: () => api.admin.grupo(id!), enabled: id !== null });
  return (
    <div className="flex h-full min-h-0">
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-line bg-surface p-2">
        <Maestro lista={lista.data?.grupos} vacio="Sin grupos." cargando={lista.isLoading} error={lista.error}>
          <ul>
            {lista.data?.grupos.map((g) => (
              <li key={g.id}>
                <button type="button" onClick={() => setId(g.id)} aria-current={g.id === id ? "true" : undefined}
                  className={cn("flex w-full flex-col rounded-md px-2.5 py-1.5 text-left", g.id === id ? "bg-brand-100 shadow-[inset_2px_0_0_rgb(var(--success))]" : "hover:bg-slate-100")}>
                  <span className="truncate text-[13px] text-ink">{g.nombre}</span>
                  <span className="text-xs text-muted">{g.miembros} miembro(s) · {g.pantallas} pantalla(s)</span>
                </button>
              </li>
            ))}
          </ul>
        </Maestro>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto bg-canvas p-4">
        {id === null && <EmptyState>Seleccione un grupo.</EmptyState>}
        {det.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
        {det.error && <Alert>{(det.error as Error).message}</Alert>}
        {det.data && (
          <div className="space-y-4">
            <h2 className="text-[16px] font-semibold text-ink">{det.data.nombre}</h2>
            <section className="panel overflow-hidden">
              <h3 className="panel-title px-4 pt-3">Miembros ({det.data.miembros.length})</h3>
              <table className="data-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Estado</th></tr></thead>
                <tbody>{det.data.miembros.map((m) => <tr key={m.id}><td>{m.usuario}</td><td>{m.nombre ?? ""}</td><td><EstadoUsuario u={m} /></td></tr>)}</tbody></table>
            </section>
            <section className="panel overflow-hidden">
              <h3 className="panel-title px-4 pt-3">Permisos del grupo ({det.data.permisos.length})</h3>
              <div className="max-h-96 overflow-auto">
                <table className="data-table"><thead><tr><th>Código</th><th>Módulo</th><th>Pantalla</th><th>Acceso</th></tr></thead>
                  <tbody>{det.data.permisos.map((p) => <tr key={p.idForm}><td className="tabular-nums text-muted">{p.idForm}</td><td className="tabular-nums">{p.modulo}</td><td>{p.titulo}</td><td><Nivel a={p.acceso} /></td></tr>)}</tbody></table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

// ---------- Permisos por pantalla ----------
function Pantallas() {
  const [q, setQ] = useState("");
  const [id, setId] = useState<number | null>(null);
  const qEnviada = useRetardo(q.trim());
  const lista = useQuery({ queryKey: ["admin-pantallas", qEnviada], queryFn: () => api.admin.pantallas(qEnviada), enabled: qEnviada.length >= 2, placeholderData: keepPreviousData });
  const det = useQuery({ queryKey: ["admin-permisos-pantalla", id], queryFn: () => api.admin.permisosPantalla(id!), enabled: id !== null });
  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-80 shrink-0 flex-col border-r border-line bg-surface">
        <div className="shrink-0 border-b border-line p-3">
          <SearchInput compact value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o código de pantalla…" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {q.trim().length < 2 && <p className="p-2 text-[13px] text-muted">Escriba al menos 2 caracteres (por ejemplo «sonda» o «8420»).</p>}
          <Maestro lista={q.trim().length >= 2 ? lista.data?.pantallas : undefined} vacio="Sin pantallas que coincidan." cargando={lista.isFetching} error={lista.error}>
            <ul>
              {lista.data?.pantallas.map((p) => (
                <li key={p.idForm}>
                  <button type="button" onClick={() => setId(p.idForm)} aria-current={p.idForm === id ? "true" : undefined}
                    className={cn("flex w-full flex-col rounded-md px-2.5 py-1.5 text-left", p.idForm === id ? "bg-brand-100 shadow-[inset_2px_0_0_rgb(var(--success))]" : "hover:bg-slate-100")}>
                    <span className="truncate text-[13px] text-ink">{p.titulo}</span>
                    <span className="truncate text-xs text-muted">#{p.idForm} · módulo {p.modulo} · {p.objeto}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Maestro>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto bg-canvas p-4">
        {id === null && <EmptyState>Busque y elija una pantalla para ver quién tiene acceso.</EmptyState>}
        {det.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
        {det.error && <Alert>{(det.error as Error).message}</Alert>}
        {det.data && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[16px] font-semibold text-ink">{det.data.pantalla.titulo}</h2>
              <p className="text-[13px] text-muted">#{det.data.pantalla.idForm} · módulo {det.data.pantalla.modulo} · {det.data.pantalla.objeto}</p>
            </div>
            <section className="panel overflow-hidden">
              <h3 className="panel-title px-4 pt-3">Grupos ({det.data.grupos.length})</h3>
              {det.data.grupos.length === 0 ? <p className="px-4 py-3 text-[13px] text-muted">Ningún grupo.</p> : (
                <table className="data-table"><thead><tr><th>Grupo</th><th>Acceso</th></tr></thead>
                  <tbody>{det.data.grupos.map((g) => <tr key={g.id}><td>{g.nombre}</td><td><Nivel a={g.acceso} /></td></tr>)}</tbody></table>
              )}
            </section>
            <section className="panel overflow-hidden">
              <h3 className="panel-title px-4 pt-3">Usuarios con permiso efectivo ({det.data.usuarios.length})</h3>
              <div className="max-h-[32rem] overflow-auto">
                <table className="data-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Estado</th><th>Efectivo</th><th>Origen</th></tr></thead>
                  <tbody>{det.data.usuarios.map((u) => <tr key={u.id}><td>{u.usuario}</td><td>{u.nombre ?? ""}</td><td><EstadoUsuario u={u} /></td><td><Nivel a={u.efectivo} /></td><td className="text-muted">{u.origen === "directo" ? "Directo" : "Por grupo"}</td></tr>)}</tbody></table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

// ---------- Conexiones ----------
function Conexiones() {
  const [desde, setDesde] = useState(hoyLocal(-7));
  const [hasta, setHasta] = useState(hoyLocal());
  const [usuario, setUsuario] = useState("");
  const [aplicado, setAplicado] = useState({ desde, hasta, usuario });
  const r = useQuery({ queryKey: ["admin-conexiones", aplicado], queryFn: () => api.admin.conexiones(aplicado.desde, aplicado.hasta, aplicado.usuario.trim()) });
  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-2">
        <label className="flex items-center gap-1.5 text-[13px] text-slate-700">Desde <Input compact type="date" className="w-36" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
        <label className="flex items-center gap-1.5 text-[13px] text-slate-700">Hasta <Input compact type="date" className="w-36" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
        <Input compact className="w-44" placeholder="Usuario" aria-label="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        <Button size="sm" onClick={() => { const nuevo = { desde, hasta, usuario }; if (mismos(nuevo, aplicado)) r.refetch(); else setAplicado(nuevo); }} loading={r.isFetching}>Consultar</Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {r.isLoading && <div className="p-8 text-center"><Spinner className="mx-auto text-slate-400" /></div>}
        {r.error && <Alert>{(r.error as Error).message}</Alert>}
        {r.data && r.data.conexiones.length === 0 && <EmptyState>Sin conexiones en el período.</EmptyState>}
        {r.data && r.data.conexiones.length > 0 && (
          <section className="panel overflow-auto">
            {r.data.truncado && <div className="p-3"><Alert tone="warning">Se muestran las 500 conexiones más recientes; acote el período o el usuario.</Alert></div>}
            <table className="data-table w-auto min-w-full">
              <thead><tr><th>Usuario</th><th className="text-right">Módulo</th><th>Inicio</th><th>Fin</th><th>Equipo</th><th>Usuario del equipo</th></tr></thead>
              <tbody>{r.data.conexiones.map((c, i) => (
                <tr key={i}><td>{c.usuario ?? c.idUsuario}</td><td className="text-right tabular-nums">{c.modulo}</td><td className="tabular-nums">{hora(c.inicio)}</td><td className="tabular-nums">{hora(c.fin)}</td><td>{c.equipo ?? ""}</td><td>{c.usuarioSo ?? ""}</td></tr>
              ))}</tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}
