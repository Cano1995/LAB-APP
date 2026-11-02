import { useState } from "react";
import { BookOpen, Download, FileText, Info } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useMarca } from "@/lib/branding";
import wiki from "@/content/wiki.json";

type Bloque =
  | { t: "p"; x: string }
  | { t: "ul"; items: string[] }
  | { t: "tabla"; cab: string[]; filas: string[][] };

const PDF = "/docs/lab-app-manual.pdf";
const secciones = wiki.secciones as { id: string; titulo: string; bloques: Bloque[] }[];

function Contenido({ b }: { b: Bloque }) {
  if (b.t === "p") return <p className="text-[13px] leading-relaxed text-slate-700">{b.x}</p>;
  if (b.t === "ul") {
    return (
      <ul className="list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-slate-700">
        {b.items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr>{b.cab.map((c) => <th key={c} className="border-b border-line bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{c}</th>)}</tr>
        </thead>
        <tbody>
          {b.filas.map((f) => (
            <tr key={f[0]}>{f.map((c, i) => <td key={i} className={cn("border-b border-slate-100 px-3 py-1.5 align-top text-slate-700", i === 0 && "font-medium text-ink")}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// «Acerca de»: qué es la aplicación, el manual en PDF y la wiki de cómo funciona (el contenido vive en content/wiki.json
// y el mismo archivo genera el PDF con tools/generar-manual-pdf.js).
export default function AcercaPage() {
  const marca = useMarca();
  const [vista, setVista] = useState<"wiki" | "acerca">("wiki");
  const [activa, setActiva] = useState(secciones[0].id);
  const sec = secciones.find((s) => s.id === activa) ?? secciones[0];

  const pestana = (id: "wiki" | "acerca", texto: string, Icono: typeof Info) => (
    <button
      type="button"
      onClick={() => setVista(id)}
      aria-pressed={vista === id}
      className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px]", vista === id ? "bg-brand-100 font-medium text-link" : "text-slate-700 hover:bg-brand-50")}
    >
      <Icono className="h-4 w-4" aria-hidden /> {texto}
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader migas={[{ label: "Inicio", to: "/" }, { label: "Acerca de" }]} />
      <main className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="page-title">Acerca de {marca.nombre}</h1>
            <a href={PDF} download>
              <Button><Download className="h-4 w-4" aria-hidden /> Descargar documentación (PDF)</Button>
            </a>
          </div>

          <div className="flex gap-1">
            {pestana("wiki", "Wiki: cómo funciona", BookOpen)}
            {pestana("acerca", "Acerca de", Info)}
          </div>

          {vista === "acerca" ? (
            <div className="panel space-y-3 p-5">
              <h2 className="text-base font-semibold text-ink">{marca.nombre}</h2>
              <p className="text-[13px] leading-relaxed text-slate-700">
                {marca.descripcion || "Sistema de laboratorio: proceso industrial, análisis, catálogos y administración."}{marca.empresa && ` ${marca.empresa}${marca.pais ? ` (${marca.pais})` : ""}.`} Versión de la documentación: {wiki.version}.
              </p>
              <a href={PDF} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-link underline">
                <FileText className="h-4 w-4" aria-hidden /> Abrir el manual en PDF
              </a>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
              <nav aria-label="Temas de la wiki" className="panel h-fit p-2">
                {secciones.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiva(s.id)}
                    aria-current={s.id === activa}
                    className={cn("block w-full rounded-md px-2.5 py-1.5 text-left text-[13px]", s.id === activa ? "bg-brand-100 font-medium text-link" : "text-slate-700 hover:bg-brand-50")}
                  >
                    {s.titulo}
                  </button>
                ))}
              </nav>
              <article className="panel space-y-3 p-5">
                <h2 className="text-base font-semibold text-ink">{sec.titulo}</h2>
                {sec.bloques.map((b, i) => <Contenido key={i} b={b} />)}
              </article>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
