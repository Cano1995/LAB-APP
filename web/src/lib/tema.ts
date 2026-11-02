import { useSyncExternalStore } from "react";

// Tema claro/oscuro: clase `dark` en <html>. Se recuerda en este navegador; sin elección guardada se usa la del sistema operativo.
// index.html aplica la clase antes de pintar (sin parpadeo); aquí vive el cambio en caliente.
export type Tema = "claro" | "oscuro";
const CLAVE = "lab_app_tema";
const oyentes = new Set<() => void>();

export function temaActual(): Tema {
  return document.documentElement.classList.contains("dark") ? "oscuro" : "claro";
}

export function fijarTema(t: Tema) {
  document.documentElement.classList.toggle("dark", t === "oscuro");
  try { localStorage.setItem(CLAVE, t); } catch { /* sin almacenamiento: vale para esta sesión */ }
  oyentes.forEach((f) => f());
}

export function useTema(): Tema {
  return useSyncExternalStore(
    (f) => { oyentes.add(f); return () => oyentes.delete(f); },
    temaActual,
  );
}
