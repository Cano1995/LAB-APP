import { useSyncExternalStore } from "react";

// Menú lateral oculto/visible. Se recuerda en el navegador; si no hay almacenamiento, vale solo para la sesión.
const CLAVE = "lab-app-menu-oculto";
const oyentes = new Set<() => void>();
let oculto = false;
try { oculto = localStorage.getItem(CLAVE) === "1"; } catch { /* sin almacenamiento */ }

const suscribir = (f: () => void) => { oyentes.add(f); return () => { oyentes.delete(f); }; };

export function alternarMenu() {
  oculto = !oculto;
  try { localStorage.setItem(CLAVE, oculto ? "1" : "0"); } catch { /* sin almacenamiento */ }
  oyentes.forEach((f) => f());
}

export const useMenuOculto = () => useSyncExternalStore(suscribir, () => oculto);
