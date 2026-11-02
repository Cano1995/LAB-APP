import type { ReactNode } from "react";

// Barra superior del área de trabajo: título (y detalle) a la izquierda, controles a la derecha.
export default function BarraHerramientas({ titulo, detalle, children }: { titulo: string; detalle?: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-[3.25rem] shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-2">
      <div className="mr-auto min-w-0">
        <h1 className="truncate text-[15px] font-semibold text-ink">{titulo}</h1>
        {detalle && <p className="truncate text-xs text-muted">{detalle}</p>}
      </div>
      {children}
    </div>
  );
}
