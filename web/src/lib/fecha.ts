// Fechas «AAAA-MM-DD» (las que viajan por la API). Se calculan en UTC para que el cambio de horario o la zona del navegador no corran el día.

/** «2026-10-21» → «21/10/2026». */
export const aDMA = (ymd: string) => ymd.split("-").reverse().join("/");

/** Suma (o resta, con n negativo) días a una fecha «AAAA-MM-DD». */
export function sumarDias(ymd: string, n: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Hoy (+ n días) en la fecha LOCAL del navegador: con toISOString() después de las 21:00 en Paraguay ya sería «mañana». */
export function hoyLocal(dias = 0) {
  const d = new Date();
  return sumarDias(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, dias);
}
