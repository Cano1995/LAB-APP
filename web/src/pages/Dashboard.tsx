import { useMemo, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, Clock } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Alert, EmptyState } from "@/components/ui";
import AppHeader from "@/components/AppHeader";
import BarrasDiarias from "@/components/BarrasDiarias";
import { api } from "@/lib/api";
import { aDMA } from "@/lib/fecha";
import { LOCALE } from "@/lib/formato";
import { PANTALLAS, pantallaDe, puedeVer } from "@/lib/pantallas";
import { leerRecientes } from "@/lib/recientes";

const nf = (n: number | null | undefined, d = 0) => (n === null || n === undefined ? "—" : n.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d }));

// Pantallas que se sugieren cuando el usuario todavía no abrió ninguna.
const SUGERIDAS = ["/gpi/lancamento", "/gpi/valores", "/gpi/supervisorio", "/lab/entrada-cana", "/lab/sonda", "/gpi/boletines"];

export default function Dashboard() {
  const { perfil } = useAuth();
  const denegado = (useLocation().state as { denegado?: string } | null)?.denegado;
  const { data, isLoading, isError } = useQuery({ queryKey: ["inicio"], queryFn: () => api.inicio(), staleTime: 60_000 });
  const { data: opciones } = useQuery({ queryKey: ["contexto-opciones"], queryFn: () => api.contexto.opciones() });
  const { data: avisos } = useQuery({ queryKey: ["notificaciones"], queryFn: () => api.notificaciones.listar(), retry: false });

  const accesos = useMemo(() => {
    if (!perfil) return { recientes: false, items: [] as { to: string; titulo: string; detalle: string }[] };
    const permitidas = (ruta: string) => { const p = pantallaDe(ruta); return p && puedeVer(perfil, p) ? p : null; };
    const recientes = leerRecientes(perfil.id).map(permitidas).filter((p): p is NonNullable<typeof p> => !!p);
    const base = recientes.length ? recientes : SUGERIDAS.map(permitidas).filter((p): p is NonNullable<typeof p> => !!p);
    const items = (base.length ? base : PANTALLAS.filter((p) => puedeVer(perfil, p)).slice(0, 6)).map((p) => ({ to: p.to, titulo: p.titulo, detalle: p.detalle }));
    return { recientes: recientes.length > 0, items };
  }, [perfil]);

  if (!perfil) return null;
  const ctx = perfil.contexto;
  const nombre = perfil.nombre.split(/\s+/)[0];
  const bal = data?.balanza;
  const ultimo = bal?.dias.find((d) => d.fecha === bal.ultimoDia);
  const an = data?.analisis;

  return (
    <div className="fondo-inicio min-h-full">
      <AppHeader migas={[{ label: "Inicio" }]} />

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6">
          <h1 className="page-title">Hola, {nombre}</h1>
          <p className="mt-0.5 text-[13px] text-muted">
            {ctx ? `${ctx.empresa.nombre} · Zafra ${opciones?.empresas.find((e) => e.cod === ctx.empresa.cod)?.safras.find((z) => z.anio === ctx.safra)?.etiqueta ?? ctx.safra}` : "Seleccione empresa y zafra"}
            {perfil.grupos.length > 0 && ` · grupos: ${perfil.grupos.map((g) => g.nombre).join(", ")}`}
          </p>
        </div>

        {denegado && <div className="mb-4"><Alert tone="warning">No tiene permiso para abrir «{denegado}».</Alert></div>}
        {isError && <div className="mb-4"><Alert>No se pudieron cargar los indicadores. Reintente en un momento.</Alert></div>}

        {data?.lab && (
          <>
            <section aria-label="Indicadores" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Indicador titulo="Camiones" valor={nf(ultimo?.camiones)} nota={bal?.ultimoDia ? `Balanza · ${aDMA(bal.ultimoDia)}` : "Sin entradas"} cargando={isLoading} sinDatos={bal === null} />
              <Indicador titulo="Caña recibida" valor={nf(ultimo?.toneladas, 1)} unidad="t" nota={ultimo ? `${nf(ultimo.caneros)} cañeros` : "Toneladas netas"} cargando={isLoading} sinDatos={bal === null} />
              <Indicador titulo="Análisis completados" valor={nf(an?.completas)} unidad={an ? `de ${nf(an.total)}` : undefined} nota={an?.fecha ? `Sonda · ${aDMA(an.fecha)}` : "Sonda"} cargando={isLoading} sinDatos={an === null} />
              <Indicador titulo="Pol de caña" valor={nf(an?.pol, 2)} unidad="%" nota={an ? `Brix ${nf(an.brix, 2)} · ATR ${nf(an.atr, 1)}` : "Promedio del día"} cargando={isLoading} sinDatos={an === null} />
            </section>

            <Panel titulo="Caña recibida por día" derecha={<Link to="/lab/entrada-cana" className="flex items-center gap-1 text-xs text-link hover:underline">Ver entrada de caña <ArrowRight className="h-3 w-3" aria-hidden /></Link>} clase="mt-5">
              <div className="p-4">
                {isLoading && <div className="h-44 animate-pulse rounded bg-slate-100" aria-busy="true" />}
                {bal === null && <EmptyState>No se pudo leer la balanza.</EmptyState>}
                {bal && !bal.ultimoDia && <EmptyState>Todavía no hay entradas de caña en esta zafra.</EmptyState>}
                {bal?.ultimoDia && (
                  <BarrasDiarias
                    hasta={bal.ultimoDia}
                    cantidad={14}
                    unidad="t"
                    titulo="Toneladas netas de caña recibidas por día, últimos 14 días"
                    dias={bal.dias.map((d) => ({ fecha: d.fecha, valor: d.toneladas, detalle: `${nf(d.camiones)} camiones · ${nf(d.caneros)} cañeros` }))}
                  />
                )}
              </div>
            </Panel>
          </>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <Panel titulo={accesos.recientes ? "Accesos recientes" : "Accesos sugeridos"} icono={<Clock className="h-4 w-4 text-muted" aria-hidden />} clase="lg:col-span-2">
            {accesos.items.length === 0 ? (
              <EmptyState>No hay pantallas habilitadas para su usuario.</EmptyState>
            ) : (
              <div className="grid gap-x-2 p-2 sm:grid-cols-2">
                {accesos.items.map((e) => (
                  <Link key={e.to} to={e.to} className="group flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-brand-50">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink">{e.titulo}</span>
                      <span className="block truncate text-xs text-muted">{e.detalle}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-link" aria-hidden />
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel titulo="Notificaciones" icono={<Bell className="h-4 w-4 text-muted" aria-hidden />} derecha={avisos && avisos.pendientes > 0 ? <span className="text-xs text-muted">{avisos.pendientes} sin leer</span> : undefined}>
            {!avisos || avisos.notificaciones.length === 0 ? (
              <EmptyState>Sin notificaciones.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {avisos.notificaciones.slice(0, 5).map((n) => (
                  <li key={n.id} className="px-4 py-2.5">
                    <div className={n.leida ? "text-[13px] text-ink" : "text-[13px] font-semibold text-ink"}>{n.titulo}</div>
                    {n.mensaje && <div className="text-xs text-muted">{n.mensaje}</div>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </main>
    </div>
  );
}

function Panel({ titulo, icono, derecha, clase, children }: { titulo: string; icono?: ReactNode; derecha?: ReactNode; clase?: string; children: ReactNode }) {
  return (
    <section className={`panel-vidrio overflow-hidden ${clase ?? ""}`}>
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2 className="panel-title flex items-center gap-1.5">{icono}{titulo}</h2>
        {derecha}
      </div>
      {children}
    </section>
  );
}

function Indicador({ titulo, valor, unidad, nota, cargando, sinDatos }: { titulo: string; valor: string; unidad?: string; nota: string; cargando: boolean; sinDatos: boolean }) {
  return (
    <div className="panel-vidrio p-4">
      <div className="section-label">{titulo}</div>
      {cargando ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-slate-100" aria-busy="true" />
      ) : (
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold tabular-nums text-ink">{sinDatos ? "—" : valor}</span>
          {!sinDatos && unidad && <span className="text-sm text-muted">{unidad}</span>}
        </div>
      )}
      <div className="mt-0.5 text-xs text-muted">{sinDatos ? "No disponible" : nota}</div>
    </div>
  );
}
