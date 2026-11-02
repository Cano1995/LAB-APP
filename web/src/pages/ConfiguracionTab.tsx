import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ImagenConfig } from "@/lib/api";
import { QUERY_MARCA, IMAGEN_DEFECTO } from "@/lib/branding";
import { Alert, Button, Field, Input, Spinner } from "@/components/ui";

const ETIQUETAS: Record<string, { label: string; hint?: string }> = {
  nombre: { label: "Nombre de la aplicación", hint: "Título de la pestaña, pantalla de ingreso y «Acerca de»." },
  nombre_corto: { label: "Nombre corto", hint: "Junto al emblema, en el menú lateral." },
  empresa: { label: "Empresa", hint: "Razón social o nombre comercial." },
  lema: { label: "Lema", hint: "Frase breve bajo el logo del ingreso (opcional)." },
  descripcion: { label: "Descripción", hint: "Texto de la pestaña «Acerca de» (opcional)." },
  pais: { label: "País", hint: "Opcional." },
};

const FALLBACK: Record<string, string> = { logo_claro: IMAGEN_DEFECTO.logo_claro, logo_oscuro: IMAGEN_DEFECTO.logo_oscuro, emblema: IMAGEN_DEFECTO.emblema, favicon: IMAGEN_DEFECTO.favicon };

const AYUDA_IMG: Record<string, string> = {
  logo_claro: "Se muestra en la pantalla de ingreso con el tema claro. Ideal: horizontal, fondo transparente.",
  logo_oscuro: "Versión para tema oscuro. Si no se carga, se usa el logo claro.",
  emblema: "Icono cuadrado o compacto junto al nombre del menú. En tema oscuro se muestra tal cual: use uno que se lea sobre fondo oscuro.",
  favicon: "Icono de la pestaña del navegador. PNG, SVG o ICO, cuadrado.",
};

const aBase64 = (f: File) =>
  new Promise<string>((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] ?? "");
    r.onerror = () => mal(new Error("No se pudo leer el archivo"));
    r.readAsDataURL(f);
  });

// Marca de la instalación: nombre de la empresa, textos, logos e iconos. Es lo único de Administración que escribe (queda en la auditoría).
export default function ConfiguracionTab() {
  const qc = useQueryClient();
  const { data, error, isLoading } = useQuery({ queryKey: ["admin-config"], queryFn: api.admin.configuracion });
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);

  useEffect(() => { if (data) setTextos(data.textos); }, [data]);
  const refrescar = () => { qc.invalidateQueries({ queryKey: ["admin-config"] }); qc.invalidateQueries({ queryKey: QUERY_MARCA }); };

  const guardar = useMutation({
    mutationFn: () => api.admin.guardarConfiguracion(textos),
    onSuccess: (r) => { setMsg({ tipo: "success", texto: r.cambios ? "Datos guardados." : "No había cambios." }); refrescar(); },
    onError: (e: Error) => setMsg({ tipo: "error", texto: e.message }),
  });

  if (isLoading) return <div className="p-4"><Spinner className="text-slate-400" /></div>;
  if (error || !data) return <Alert>{(error as Error)?.message ?? "No se pudo cargar la configuración"}</Alert>;
  const sucio = Object.keys(data.textos).some((k) => (textos[k] ?? "") !== data.textos[k]);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-4xl space-y-4">
        {msg && <Alert tone={msg.tipo}>{msg.texto}</Alert>}

        <section className="panel space-y-4 p-5">
          <h2 className="text-base font-semibold text-ink">Datos de la empresa</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.keys(data.campos).map((k) => (
              <Field key={k} label={ETIQUETAS[k]?.label ?? k} required={data.campos[k].obligatorio} hint={ETIQUETAS[k]?.hint} className={k === "descripcion" || k === "lema" ? "sm:col-span-2" : undefined}>
                <Input value={textos[k] ?? ""} maxLength={data.campos[k].max} onChange={(e) => { setMsg(null); setTextos({ ...textos, [k]: e.target.value }); }} />
              </Field>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => guardar.mutate()} disabled={!sucio || guardar.isPending}>{guardar.isPending ? "Guardando…" : "Guardar datos"}</Button>
          </div>
        </section>

        <section className="panel space-y-4 p-5">
          <div>
            <h2 className="text-base font-semibold text-ink">Logos e iconos</h2>
            <p className="text-xs text-muted">PNG, JPG, WEBP o SVG (el favicon también ICO). Sin imagen cargada se usa la de fábrica.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.imagenes.map((img) => <TarjetaImagen key={img.clave} img={img} onCambio={refrescar} onMensaje={setMsg} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

function TarjetaImagen({ img, onCambio, onMensaje }: { img: ImagenConfig; onCambio: () => void; onMensaje: (m: { tipo: "success" | "error"; texto: string } | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const oscuro = img.clave === "logo_oscuro";
  const subir = useMutation({
    mutationFn: async (f: File) => {
      if (f.size > img.max) throw new Error(`«${f.name}» supera el máximo de ${Math.round(img.max / 1000)} KB`);
      return api.admin.subirImagen(img.clave, { mime: f.type, nombre: f.name, datos: await aBase64(f) });
    },
    onSuccess: () => { onMensaje({ tipo: "success", texto: `${img.titulo}: imagen actualizada.` }); onCambio(); },
    onError: (e: Error) => onMensaje({ tipo: "error", texto: `${img.titulo}: ${e.message}` }),
  });
  const quitar = useMutation({
    mutationFn: () => api.admin.quitarImagen(img.clave),
    onSuccess: () => { onMensaje({ tipo: "success", texto: `${img.titulo}: se volvió a la imagen de fábrica.` }); onCambio(); },
    onError: (e: Error) => onMensaje({ tipo: "error", texto: e.message }),
  });
  const ocupado = subir.isPending || quitar.isPending;

  return (
    <div className="space-y-2 rounded-md border border-line p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[13px] font-medium text-ink">{img.titulo}</h3>
        <span className="text-xs text-muted">{img.actual ? `${img.actual.nombre ?? "personalizada"} · ${Math.max(1, Math.round((img.actual.tamano ?? 0) / 1000))} KB` : "de fábrica"}</span>
      </div>
      <div className={`grid h-24 place-items-center rounded-md border border-line ${oscuro ? "bg-slate-800" : "bg-white"}`}>
        <img src={img.actual?.url ?? FALLBACK[img.clave]} alt={img.titulo} className="max-h-20 max-w-full object-contain" />
      </div>
      <p className="text-xs text-muted">{AYUDA_IMG[img.clave]}</p>
      <div className="flex gap-2">
        <input
          ref={input}
          type="file"
          hidden
          accept={img.mimes.join(",") + (img.mimes.includes("image/x-icon") ? ",.ico" : "")}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { onMensaje(null); subir.mutate(f); } }}
        />
        <Button size="sm" variant="secondary" disabled={ocupado} onClick={() => input.current?.click()}>{subir.isPending ? "Subiendo…" : img.actual ? "Reemplazar" : "Cargar imagen"}</Button>
        {img.actual && <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => quitar.mutate()}>Quitar</Button>}
      </div>
    </div>
  );
}
