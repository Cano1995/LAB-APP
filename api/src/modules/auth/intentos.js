// Intentos de ingreso con reserva ATÓMICA (A2, Sprint 11).
//
// El login valida la contraseña abriendo una conexión con el usuario de Oracle del GATEC, y los perfiles de Oracle bloquean la cuenta
// tras pocos fallos (p. ej. 3 intentos → 30 días). Para no provocar ese bloqueo, la app corta antes: tras MAX_FALLOS intentos seguidos
// no consulta a Oracle durante ESPERA_MIN minutos.
//
// Antes se leía el estado, se consultaba a Oracle y RECIÉN DESPUÉS se registraba el fallo: con pedidos en ráfaga todos pasaban el
// chequeo antes de que se anotara el primer fallo y cada uno llegaba a Oracle. Ahora el intento se RESERVA (se cuenta) antes de ir a
// Oracle, con un único UPDATE condicional que Oracle serializa por fila: como máximo MAX_FALLOS intentos pueden estar en vuelo a la vez.
//   · éxito              → exito(): reinicia el contador.
//   · contraseña mala    → el intento ya quedó contado.
//   · falla ajena al usuario (base caída, cuenta vencida…) → liberar(): devuelve el intento reservado.
const { query, queryOne } = require('../../db');
const config = require('../../config');

const A = config.appSchema; // esquema propio de la app (LAB_APP_AUTH)
const MAX_FALLOS = 2;
const ESPERA_MIN = 15;

// Crea la fila del usuario si no existe (dos pedidos simultáneos pueden competir: el perdedor recibe ORA-00001 y se ignora).
async function asegurarFila(idUsuario) {
  try {
    await query(
      `MERGE INTO ${A}.LAB_APP_AUTH a
        USING (SELECT :id ID_USUARIO FROM dual) x ON (a.ID_USUARIO = x.ID_USUARIO)
        WHEN NOT MATCHED THEN INSERT (ID_USUARIO, INTENTOS_FALLIDOS, BLOQUEADO, FECHA_ACTUALIZ) VALUES (:id, 0, 0, SYSDATE)`,
      { id: idUsuario },
    );
  } catch (e) {
    if (!/ORA-00001/.test(e.message)) throw e;
  }
}

async function estado(idUsuario) {
  return queryOne(
    `SELECT BLOQUEADO, INTENTOS_FALLIDOS, ROUND((BLOQ_HASTA - SYSDATE) * 1440) MIN_RESTANTES
       FROM ${A}.LAB_APP_AUTH WHERE ID_USUARIO = :id`,
    { id: idUsuario },
  );
}

// Reserva un intento. { ok: true } si se puede consultar a Oracle; si no, { ok: false, bloqueado, minutos }.
async function reservar(idUsuario) {
  await asegurarFila(idUsuario);
  // Si la espera ya venció, el contador arranca de cero. Al llegar a MAX_FALLOS se abre la espera.
  const ACTUAL = `(CASE WHEN BLOQ_HASTA IS NOT NULL AND BLOQ_HASTA <= SYSDATE THEN 0 ELSE INTENTOS_FALLIDOS END)`;
  const r = await query(
    `UPDATE ${A}.LAB_APP_AUTH SET
        INTENTOS_FALLIDOS = ${ACTUAL} + 1,
        BLOQ_HASTA = CASE WHEN ${ACTUAL} + 1 >= :max THEN SYSDATE + :espera / 1440 ELSE NULL END,
        FECHA_ACTUALIZ = SYSDATE
      WHERE ID_USUARIO = :id AND BLOQUEADO = 0 AND (BLOQ_HASTA IS NULL OR BLOQ_HASTA <= SYSDATE)`,
    { id: idUsuario, max: MAX_FALLOS, espera: ESPERA_MIN },
  );
  if (r.rowsAffected === 1) return { ok: true };
  const e = await estado(idUsuario);
  return { ok: false, bloqueado: e?.BLOQUEADO === 1, minutos: Math.max(1, e?.MIN_RESTANTES || ESPERA_MIN) };
}

// Ingreso correcto: reinicia el contador.
async function exito(idUsuario) {
  await query(
    `UPDATE ${A}.LAB_APP_AUTH SET INTENTOS_FALLIDOS = 0, BLOQ_HASTA = NULL, ULTIMO_LOGIN = SYSDATE, FECHA_ACTUALIZ = SYSDATE WHERE ID_USUARIO = :id`,
    { id: idUsuario },
  );
}

// El fallo no fue culpa del usuario (base caída, cuenta vencida o bloqueada en Oracle): devuelve el intento reservado.
async function liberar(idUsuario) {
  await query(
    `UPDATE ${A}.LAB_APP_AUTH SET
        INTENTOS_FALLIDOS = GREATEST(INTENTOS_FALLIDOS - 1, 0),
        BLOQ_HASTA = CASE WHEN INTENTOS_FALLIDOS - 1 < :max THEN NULL ELSE BLOQ_HASTA END,
        FECHA_ACTUALIZ = SYSDATE
      WHERE ID_USUARIO = :id`,
    { id: idUsuario, max: MAX_FALLOS },
  );
}

module.exports = { reservar, exito, liberar, estado, MAX_FALLOS, ESPERA_MIN };
