import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, CheckCircle2, CircleAlert, Info } from "lucide-react";
import { api, type Notificacion } from "@/lib/api";
import { cn } from "@/lib/utils";

const CLAVE = ["notificaciones"];
const ICONO = { info: Info, exito: CheckCircle2, aviso: AlertTriangle, error: CircleAlert } as const;
const COLOR = { info: "text-info", exito: "text-success", aviso: "text-amber-600", error: "text-danger" } as const;

const hace = (iso: string) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  if (min < 1440) return `hace ${Math.round(min / 60)} h`;
  return new Date(iso).toLocaleDateString("es-PY");
};

// Campana con los avisos pendientes del usuario. Consulta cada 2 minutos y al volver a la ventana; si la API falla, se muestra vacía.
export default function NotificationBell() {
  const [abierta, setAbierta] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: CLAVE, queryFn: () => api.notificaciones.listar(), refetchInterval: 120_000, refetchOnWindowFocus: true, retry: false });
  const refrescar = () => qc.invalidateQueries({ queryKey: CLAVE });
  const marcar = useMutation({ mutationFn: (id: number) => api.notificaciones.marcarLeida(id), onSuccess: refrescar });
  const marcarTodas = useMutation({ mutationFn: () => api.notificaciones.marcarTodas(), onSuccess: refrescar });

  useEffect(() => {
    if (!abierta) return;
    const fuera = (e: MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierta(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierta(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", tecla); };
  }, [abierta]);

  const pendientes = data?.pendientes ?? 0;
  const abrir = (n: Notificacion) => {
    if (!n.leida) marcar.mutate(n.id);
    if (n.enlace) { setAbierta(false); navigate(n.enlace); }
  };

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        aria-label={pendientes > 0 ? `Notificaciones (${pendientes} pendientes)` : "Notificaciones"}
        className="relative grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-brand-50 hover:text-ink"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {pendientes > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
            {pendientes > 99 ? "99+" : pendientes}
          </span>
        )}
      </button>

      {abierta && (
        <div role="dialog" aria-label="Notificaciones" className="absolute right-0 top-10 z-40 w-80 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="panel-title">Notificaciones</span>
            {pendientes > 0 && (
              <button type="button" onClick={() => marcarTodas.mutate()} className="text-xs text-link hover:underline">Marcar todas como leídas</button>
            )}
          </div>
          <ul className="max-h-96 divide-y divide-line overflow-y-auto">
            {(data?.notificaciones ?? []).length === 0 && <li className="px-3 py-6 text-center text-xs text-muted">No tiene notificaciones.</li>}
            {(data?.notificaciones ?? []).map((n) => {
              const Icono = ICONO[n.tipo] ?? Info;
              return (
                <li key={n.id}>
                  <button type="button" onClick={() => abrir(n)} className={cn("flex w-full gap-2 px-3 py-2.5 text-left hover:bg-brand-50", !n.leida && "bg-brand-50/60")}>
                    <Icono className={cn("mt-0.5 h-4 w-4 shrink-0", COLOR[n.tipo])} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-[13px] text-ink", !n.leida && "font-semibold")}>{n.titulo}</span>
                      {n.mensaje && <span className="block text-xs text-muted">{n.mensaje}</span>}
                      <span className="block text-[11px] text-muted">{hace(n.fecha)}</span>
                    </span>
                    {!n.leida && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-800" aria-label="Sin leer" />}
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
