// Auditoría de escrituras: una fila en LAB_APP_AUDIT por cada cambio, en LA MISMA transacción que el cambio (si la escritura se revierte, el registro también).
const config = require("../config");

const A = config.appSchema;
const recortar = (v, n) => (v === null || v === undefined ? null : String(v).slice(0, n));

/**
 * @param cn conexión de db.transaccion
 * @param {{idUsuario:number, usuario:string}} quien
 * @param {{accion:string, tabla:string, clave:string, antes?:*, despues?:*}[]} cambios
 * @param {string} [contexto] p. ej. «empresa 1 · zafra 2026 · planilla 60 · 2026-10-27»
 */
async function registrar(cn, quien, cambios, contexto = null) {
  if (!cambios.length) return;
  await cn.executeMany(
    `INSERT INTO ${A}.LAB_APP_AUDIT (ID_USUARIO, USUARIO, ACCION, TABLA, CLAVE, ANTES, DESPUES, CONTEXTO) VALUES (:u, :n, :a, :t, :k, :b, :d, :c)`,
    cambios.map((x) => ({ u: quien.idUsuario, n: recortar(quien.usuario, 40), a: recortar(x.accion, 30), t: recortar(x.tabla, 60), k: recortar(x.clave, 200), b: recortar(x.antes, 200), d: recortar(x.despues, 200), c: recortar(contexto, 200) })),
    { autoCommit: false },
  );
}

module.exports = { registrar };
