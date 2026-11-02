import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Home, Info, LogOut, Menu, ShieldCheck } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Badge, SearchInput } from "@/components/ui";
import { api } from "@/lib/api";
import { alternarMenu, useMenuOculto } from "@/lib/menuLateral";
import { MENU_GPI, MODULO_GPI, PANTALLAS, pantallasDeExe, puedeVer, type Pantalla } from "@/lib/pantallas";
import { cn, moduloLabel } from "@/lib/utils";
import { useMarca } from "@/lib/branding";

// `pendiente`: opción del GATEC que todavía no se recreó (se muestra en gris, sin enlace).
interface Enlace { to: string; titulo: string; pendiente?: boolean; hijos?: Enlace[] }

// Todas las rutas reales debajo de un enlace (para saber si la pantalla actual está dentro de un submenú).
const rutas = (e: Enlace): string[] => (e.hijos ? e.hijos.flatMap(rutas) : e.pendiente ? [] : [e.to]);
// Deja solo los enlaces que coinciden con el texto (un submenú se queda si coincide él o alguno de sus hijos).
const filtrarEnlaces = (es: Enlace[], coincide: (t: string) => boolean): Enlace[] =>
  es.flatMap((e) => {
    if (!e.hijos) return coincide(e.titulo) ? [e] : [];
    const h = filtrarEnlaces(e.hijos, coincide);
    return h.length || coincide(e.titulo) ? [{ ...e, hijos: h.length ? h : e.hijos }] : [];
  });

interface Grupo {
  id: string;
  titulo: string;
  /** Secciones (un programa del GATEC cada una) con sus enlaces. */
  secciones: { titulo: string | null; enlaces: Enlace[]; desplegable?: boolean }[];
}

// Sin tildes ni mayúsculas, para que «analisis» encuentre «Análisis».
const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const BRILLO = "dark:shadow-[0_0_16px_rgb(var(--brand-800)/0.4)]"; // resplandor del ítem activo (solo tema oscuro)

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  cn("block truncate rounded-md px-2.5 py-1.5 text-[13px]", isActive ? `bg-brand-100 font-medium text-link ${BRILLO}` : "text-slate-700 hover:bg-brand-50");

// Menú lateral: las carpetas raíz del menú del GATEC son los módulos; dentro, las pantallas de cada programa que ya recreamos.
// Más las tablas maestras agrupadas por módulo. Solo se listan opciones que el usuario puede abrir.
export default function Sidebar() {
  const { perfil, logout } = useAuth();
  const marca = useMarca();
  const { pathname } = useLocation();
  const { data: menu } = useQuery({ queryKey: ["menu"], queryFn: () => api.menu() });
  const { data: maestras } = useQuery({ queryKey: ["maestras"], queryFn: () => api.maestras.listar() });
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const [filtro, setFiltro] = useState("");
  const buscador = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const oculto = useMenuOculto();

  // «/» o Ctrl+K enfocan el buscador (salvo que ya se esté escribiendo en otro campo).
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const escribiendo = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !escribiendo)) { e.preventDefault(); buscador.current?.focus(); }
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, []);

  const grupos = useMemo<Grupo[]>(() => {
    if (!perfil) return [];
    const visibles: Pantalla[] = PANTALLAS.filter((p) => puedeVer(perfil, p));
    const res: Grupo[] = [];
    const tablasGpi: Enlace[] = (maestras?.recursos ?? []).filter((r) => r.modulo === MODULO_GPI).map((r) => ({ to: `/maestras/${r.nombre}`, titulo: r.titulo }));
    // El programa del GPI se muestra con la barra de menús del GATEC viejo (Entrada diaria, Movimientos, Cierre…).
    const seccionesGpi = () => MENU_GPI.map((m) => ({
      titulo: m.titulo,
      desplegable: true,
      enlaces: [
        ...(m.items ?? []).flatMap(function conv(it): Enlace[] {
          if ("submenu" in it) return [{ to: `#sub-${m.titulo}-${it.submenu}`, titulo: it.submenu, hijos: it.items.flatMap(conv) }];
          if ("pendiente" in it) return [{ to: `#pendiente-${m.titulo}-${it.pendiente}`, titulo: it.pendiente, pendiente: true }];
          const v = visibles.find((x) => x.to === it.to);
          return v ? [{ to: v.to, titulo: it.titulo ?? v.titulo }] : [];
        }),
        ...(m.pantallas ?? []).flatMap((to) => visibles.filter((v) => v.to === to).map((v) => ({ to: v.to, titulo: v.titulo }))),
        ...(m.tablas ? tablasGpi : []),
        ...(m.pendientes ?? []).map((t) => ({ to: `#pendiente-${m.titulo}-${t}`, titulo: t, pendiente: true })),
      ] as Enlace[],
    })).filter((x) => x.enlaces.length > 0);
    for (const raiz of menu?.carpetas.filter((c) => c.padre === null) ?? []) {
      const ids = new Set<number>();
      const rec = (id: number) => { ids.add(id); menu!.carpetas.filter((c) => c.padre === id).forEach((c) => rec(c.id)); };
      rec(raiz.id);
      const secciones = menu!.programas
        .filter((p) => ids.has(p.carpeta))
        .flatMap((p) => {
          const hay = pantallasDeExe(p.exe, visibles);
          if (!hay.length) return [];
          if (p.exe.toLowerCase() === "gatec_gpi.exe") return seccionesGpi();
          return [{ titulo: p.nombre, enlaces: hay.map((e): Enlace => ({ to: e.to, titulo: e.titulo })) }];
        });
      if (secciones.length) res.push({ id: `c${raiz.id}`, titulo: raiz.nombre, secciones });
    }
    const porModulo = new Map<number, { to: string; titulo: string }[]>();
    for (const r of maestras?.recursos ?? []) {
      if (r.modulo === MODULO_GPI) continue; // los catálogos del GPI van en «Tablas» del menú del GPI
      if (!porModulo.has(r.modulo)) porModulo.set(r.modulo, []);
      porModulo.get(r.modulo)!.push({ to: `/maestras/${r.nombre}`, titulo: r.titulo });
    }
    if (porModulo.size) {
      res.push({
        id: "maestras",
        titulo: "Tablas maestras",
        secciones: [...porModulo.entries()].sort((a, b) => a[0] - b[0]).map(([m, enlaces]) => ({ titulo: moduloLabel(m), enlaces })),
      });
    }
    return res;
  }, [perfil, menu, maestras]);

  const q = norm(filtro.trim());
  // Con texto en el buscador: solo las opciones que coinciden (por su título, su programa o su módulo), con los módulos abiertos.
  const visibles = useMemo(() => {
    if (!q) return grupos;
    return grupos
      .map((g) => ({
        ...g,
        secciones: g.secciones
          .map((s) => ({ ...s, enlaces: filtrarEnlaces(s.enlaces, (t) => norm(`${t} ${s.titulo ?? ""} ${g.titulo}`).includes(q)) }))
          .filter((s) => s.enlaces.length > 0),
      }))
      .filter((g) => g.secciones.length > 0);
  }, [grupos, q]);

  // Enlaces de una sección; un enlace con `hijos` es un submenú que se despliega (p. ej. «Parada» dentro de Movimientos).
  const renderEnlaces = (es: Enlace[], clave: string): React.ReactNode => es.map((e) => {
    if (e.hijos) {
      const k = `${clave}|${e.titulo}`;
      const abierto = !!q || (manual[k] ?? e.hijos.flatMap(rutas).some((r) => pathname.startsWith(r)));
      return (
        <div key={e.to}>
          <button type="button" aria-expanded={abierto} onClick={() => setManual((m) => ({ ...m, [k]: !abierto }))}
            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] text-slate-700 hover:bg-brand-50">
            <span className="truncate">{e.titulo}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform", abierto && "rotate-180")} aria-hidden />
          </button>
          {abierto && <div className="ml-3 border-l border-line pl-2">{renderEnlaces(e.hijos, k)}</div>}
        </div>
      );
    }
    return e.pendiente
      ? <span key={e.to} title={`${e.titulo}: todavía no está en esta versión`} className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-slate-400 dark:text-slate-500"><span className="min-w-0 truncate">{e.titulo}</span><span className="shrink-0 text-[9px] uppercase tracking-wide">Pend.</span></span>
      : <NavLink key={e.to} to={e.to} title={e.titulo} className={claseEnlace}>{e.titulo}</NavLink>;
  });

  if (!perfil) return null;
  const primero = visibles.flatMap((g) => g.secciones.flatMap((s) => s.enlaces.flatMap(rutas))).map((to) => ({ to }))[0];
  // Abierto = lo que el usuario eligió; si no eligió, el grupo de la pantalla actual. Buscando, todo lo encontrado queda abierto.
  const abierto = (g: Grupo) => !!q || (manual[g.id] ?? g.secciones.some((s) => s.enlaces.some((e) => pathname.startsWith(e.to))));

  return (
    <aside className={cn("hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-gradient-to-b from-surface to-brand-50", !oculto && "md:flex")}>
      <div className="flex h-12 shrink-0 items-center border-b border-line pr-2">
        <NavLink to="/" className="flex min-w-0 flex-1 items-center gap-2 px-4 font-semibold text-ink">
          <img src={marca.img.emblema} alt="" className={cn("h-7 w-auto", marca.emblemaDeFabrica && "dark:brightness-0 dark:invert")} />
          <span className="truncate">{marca.nombre_corto}</span>
        </NavLink>
        <button type="button" onClick={alternarMenu} aria-label="Ocultar el menú" title="Ocultar el menú" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted hover:bg-brand-50 hover:text-ink">
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="shrink-0 px-2 pt-3">
        <SearchInput
          ref={buscador}
          compact
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setFiltro(""); e.currentTarget.blur(); }
            if (e.key === "Enter" && primero) { navigate(primero.to); setFiltro(""); e.currentTarget.blur(); }
          }}
          placeholder="Buscar pantalla…  ( / )"
          aria-label="Buscar en el menú"
        />
      </div>

      <nav aria-label="Menú principal" className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        <NavLink to="/" end className={({ isActive }) => cn("mb-1 flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium", isActive ? `bg-brand-100 text-link ${BRILLO}` : "text-slate-700 hover:bg-brand-50")}>
          <Home className="h-4 w-4" aria-hidden /> Inicio
        </NavLink>

        {q && visibles.length === 0 && <p className="px-2.5 py-3 text-xs text-muted">Sin opciones que coincidan con «{filtro.trim()}».</p>}

        {visibles.map((g) => {
          const abiertoG = abierto(g);
          return (
            <div key={g.id} className="mb-0.5">
              <button
                type="button"
                aria-expanded={abiertoG}
                onClick={() => setManual((m) => ({ ...m, [g.id]: !abiertoG }))}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px] font-medium text-ink hover:bg-brand-50"
              >
                <span className="truncate">{g.titulo}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", abiertoG && "rotate-180")} aria-hidden />
              </button>
              {abiertoG && (
                <div className="ml-3 border-l border-line pl-2">
                  {g.secciones.map((s) => {
                    const claveS = `${g.id}|${s.titulo}`;
                    // Los menús del GPI se despliegan (como en la barra del GATEC); abre solo el de la pantalla actual, o todos al buscar.
                    const abiertoS = !s.desplegable || !!q || (manual[claveS] ?? s.enlaces.flatMap(rutas).some((r) => pathname.startsWith(r)));
                    return (
                    <div key={s.titulo ?? "-"} className="pb-1">
                      {s.titulo && (s.desplegable ? (
                        <button
                          type="button"
                          aria-expanded={abiertoS}
                          onClick={() => setManual((m) => ({ ...m, [claveS]: !abiertoS }))}
                          className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium text-ink hover:bg-brand-50"
                        >
                          <span className="truncate">{s.titulo}</span>
                          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform", abiertoS && "rotate-180")} aria-hidden />
                        </button>
                      ) : <div className="section-label px-2.5 pb-0.5 pt-2">{s.titulo}</div>)}
                      {abiertoS && <div className={s.desplegable ? "ml-3 border-l border-line pl-2" : undefined}>{renderEnlaces(s.enlaces, claveS)}</div>}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-line px-2 pt-2">
        <NavLink to="/acerca" className={({ isActive }) => cn("flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium", isActive ? `bg-brand-100 text-link ${BRILLO}` : "text-slate-700 hover:bg-brand-50")}>
          <Info className="h-4 w-4" aria-hidden /> Acerca de
        </NavLink>
      </div>

      <div className="flex shrink-0 items-center gap-2 p-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-800 text-[11px] font-bold text-white" aria-hidden>
          {perfil.nombre.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-medium text-ink">{perfil.nombre}</div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            {perfil.usuario}
            {perfil.master && <Badge tone="brand"><ShieldCheck className="h-3 w-3" aria-hidden /> master</Badge>}
          </div>
        </div>
        <button type="button" onClick={logout} aria-label="Salir" title="Salir" className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-brand-50 hover:text-danger">
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </aside>
  );
}
