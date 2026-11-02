import { Link } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { alternarMenu, useMenuOculto } from "@/lib/menuLateral";
import { useAuth } from "@/auth/AuthContext";
import ContextoSelector from "@/components/ContextoSelector";
import NotificationBell from "@/components/NotificationBell";
import TemaToggle from "@/components/TemaToggle";
import { Button } from "@/components/ui";
import { useMarca } from "@/lib/branding";
import { cn } from "@/lib/utils";

export interface Miga {
  label: string;
  to?: string;
}

// Barra superior de cada pantalla: empresa/zafra y notificaciones. La marca, el menú y el usuario viven en el menú lateral.
export default function AppHeader(_props: { migas?: Miga[] }) {
  const { logout } = useAuth();
  const oculto = useMenuOculto();
  const marca = useMarca();

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-4 border-b border-line bg-surface px-4">
      {oculto && (
        <button
          type="button"
          onClick={alternarMenu}
          aria-label="Mostrar el menú"
          title="Mostrar el menú"
          className="hidden h-8 w-8 shrink-0 place-items-center rounded-md text-muted hover:bg-brand-50 hover:text-ink md:grid"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      )}

      <Link to="/" className="flex shrink-0 items-center gap-2 rounded-md font-semibold text-ink md:hidden">
        <img src={marca.img.emblema} alt="" className={cn("h-7 w-auto", marca.emblemaDeFabrica && "dark:brightness-0 dark:invert")} />
        {marca.nombre_corto}
      </Link>

      <div className="min-w-0 flex-1" />

      <div className="flex shrink-0 items-center gap-3">
        <ContextoSelector />
        <span aria-hidden className="h-5 w-px bg-line" />
        <TemaToggle />
        <NotificationBell />
        <Button variant="ghost" size="sm" onClick={logout} className="md:hidden">
          <LogOut className="h-4 w-4" aria-hidden /> Salir
        </Button>
      </div>
    </header>
  );
}
