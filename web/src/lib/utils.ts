import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Etiquetas de los módulos GATEC (las tablas de nombres están vacías en la base).
// Se refinará cuando se arme el menú real desde GA_MENU_ARVORE.
export const MODULO_LABEL: Record<number, string> = {
  1: "Básico",
  6: "Laboratorio de recepción (Pre y Pos Cosecha)",
  10: "General",
  15: "Tablas",
  70: "Pre-Zafra",
  90: "Proceso Industrial (GPI)",
  91: "Registros",
  307: "Configuración",
  338: "Otros",
};

/** Compara dos valores por contenido (para saber si «Consultar» repite los mismos filtros). */
export const mismos = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function moduloLabel(n: number) {
  return MODULO_LABEL[n] || `Módulo ${n}`;
}
