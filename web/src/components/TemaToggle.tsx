import { Moon, Sun } from "lucide-react";
import { fijarTema, useTema } from "@/lib/tema";

// Interruptor claro/oscuro (como el de la app móvil).
export default function TemaToggle() {
  const tema = useTema();
  const aOscuro = tema === "claro";
  return (
    <button
      type="button"
      onClick={() => fijarTema(aOscuro ? "oscuro" : "claro")}
      aria-label={aOscuro ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
      title={aOscuro ? "Tema oscuro" : "Tema claro"}
      className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-brand-50 hover:text-ink"
    >
      {aOscuro ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
    </button>
  );
}
