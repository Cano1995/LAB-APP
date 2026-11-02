// Pantallas abiertas más recientemente por cada usuario (solo en este navegador): alimentan los «Accesos recientes» del Inicio.
const MAX = 6;
const clave = (idUsuario: number) => `lab_app_recientes_${idUsuario}`;

export function leerRecientes(idUsuario: number): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(clave(idUsuario)) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function registrarReciente(idUsuario: number, ruta: string) {
  try {
    const nuevas = [ruta, ...leerRecientes(idUsuario).filter((r) => r !== ruta)].slice(0, MAX);
    localStorage.setItem(clave(idUsuario), JSON.stringify(nuevas));
  } catch {
    /* sin almacenamiento (ventana privada, datos bloqueados): simplemente no se recuerda */
  }
}
