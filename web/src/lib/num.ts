/** Texto numérico de la API (a veces con coma decimal) → número; vacío o inválido → null. */
export const num = (s: string | null | undefined): number | null => {
  if (s === null || s === undefined || s === "") return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
