// Validación de entrada común (A13, Sprint 11). Toda entrada del cliente que llega a un SQL pasa por aquí:
// los errores son 400 con un mensaje claro (antes una fecha como 2026-02-30 llegaba a TO_DATE y devolvía 500 con el error de Oracle).

const error400 = (msg) => Object.assign(new Error(msg), { status: 400 });

// Un valor de query/body debe ser un escalar: ?fecha=a&fecha=b llega como arreglo y ?x[y]=1 como objeto.
function escalar(v, nombre) {
  if (Array.isArray(v) || (v !== null && typeof v === "object")) throw error400(`${nombre} inválido`);
  return v;
}

// 'AAAA-MM-DD' que además existe en el calendario (rechaza 2026-02-30, 2026-13-01) y está en un rango razonable.
function fechaReal(f, nombre = "Fecha") {
  escalar(f, nombre);
  const t = String(f ?? "");
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) throw error400(`${nombre} inválida (AAAA-MM-DD)`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const fecha = new Date(Date.UTC(y, mo - 1, d));
  const existe = fecha.getUTCFullYear() === y && fecha.getUTCMonth() === mo - 1 && fecha.getUTCDate() === d;
  if (!existe || y < 1900 || y > 2100) throw error400(`${nombre} inválida (AAAA-MM-DD)`);
  return t;
}

// Entero decimal estricto (rechaza "0x10", "1e3", " ", "1.5") dentro de [min, max].
function entero(v, nombre = "Valor", { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  escalar(v, nombre);
  const t = String(v ?? "").trim();
  if (!/^-?\d+$/.test(t)) throw error400(`${nombre} inválido`);
  const n = Number(t);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw error400(`${nombre} fuera de rango`);
  return n;
}

// Tope de filas pedido por el cliente: vacío → por defecto; si no, entero en [1, max] (0 NO significa «sin tope»).
function limite(v, { defecto, max }) {
  if (v === undefined || v === null || v === "") return defecto;
  return entero(v, "limit", { min: 1, max });
}

// Número decimal estricto (acepta coma o punto; rechaza "0x10", "1e5", "Infinity", " ").
function decimal(v, nombre = "Valor") {
  escalar(v, nombre);
  const t = String(v ?? "").trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(t)) throw error400(`${nombre} debe ser numérico`);
  return Number(t);
}

// Booleano explícito: true/false, 1/0, '1'/'0', 'S'/'N', 'true'/'false'. Cualquier otro valor es un error
// (antes el texto "false" se guardaba como verdadero por ser un string no vacío).
function booleano(v, nombre = "Valor") {
  escalar(v, nombre);
  if (v === true || v === 1) return true;
  if (v === false || v === 0) return false;
  const t = String(v ?? "").trim().toLowerCase();
  if (["1", "s", "si", "sí", "true", "verdadero"].includes(t)) return true;
  if (["0", "n", "no", "false", "falso"].includes(t)) return false;
  throw error400(`${nombre} debe ser verdadero o falso`);
}

// Fecha de HOY en la hora local del servidor (no UTC: en Paraguay, UTC-3, después de las 21:00 UTC ya es «mañana»).
function hoyLocal(desplazarDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + desplazarDias);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

module.exports = { fechaReal, entero, limite, decimal, booleano, escalar, hoyLocal, error400 };
