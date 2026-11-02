import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { Select, Spinner } from "@/components/ui";

// Selector de empresa/zafra (equivale al "Alterar Empresa/Safra" del GATEC viejo).
// Al cambiar de empresa/zafra se descarta TODA la caché de datos: antes solo se invalidaban unas pocas claves y pantallas como Boletines,
// Sonda, Metas o Valores seguían mostrando datos de la zafra anterior bajo el rótulo de la nueva. Además, App reinicia el estado de las
// pantallas (filtros, selecciones) con una clave por empresa/zafra.
export default function ContextoSelector() {
  const { perfil, setContexto } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["contexto-opciones"], queryFn: () => api.contexto.opciones() });

  const cambiar = useMutation({
    mutationFn: ({ cod, safra }: { cod: number; safra: number }) => api.contexto.seleccionar(cod, safra),
    onSuccess: (r) => {
      setContexto(r.contexto);
      qc.clear();
    },
  });

  const ctx = perfil?.contexto;
  const empresas = data?.empresas ?? [];
  const empresaActual = empresas.find((e) => e.cod === ctx?.empresa.cod) ?? empresas[0];

  if (!ctx) return null;

  return (
    <div className="flex items-center gap-3 text-[13px]">
      <span className="flex items-center gap-1.5 text-slate-700" title="Empresa">
        <Building2 className="h-4 w-4 text-slate-500" aria-hidden />
        {ctx.empresa.nombre}
      </span>
      <div className="flex items-center gap-2">
        <Select
          compact
          aria-label="Zafra"
          value={ctx.safra}
          disabled={cambiar.isPending}
          onChange={(e) => cambiar.mutate({ cod: ctx.empresa.cod, safra: Number(e.target.value) })}
        >
          {(empresaActual?.safras ?? [{ anio: ctx.safra, etiqueta: String(ctx.safra) }]).map((s) => (
            <option key={s.anio} value={s.anio}>
              Zafra {s.etiqueta}
            </option>
          ))}
        </Select>
        {cambiar.isPending && <Spinner className="text-link" />}
        {cambiar.error && (
          <span role="alert" className="max-w-56 truncate text-xs text-red-700" title={(cambiar.error as Error).message}>
            No se pudo cambiar la zafra: {(cambiar.error as Error).message}
          </span>
        )}
      </div>
    </div>
  );
}
