const config = require('../../config');
const { query } = require('../../db');

const A = config.appSchema;
const TIPOS = new Set(['info', 'exito', 'aviso', 'error']);

const aFila = (x) => ({
  id: x.ID,
  fecha: x.FECHA instanceof Date ? x.FECHA.toISOString() : x.FECHA,
  tipo: x.TIPO,
  titulo: x.TITULO,
  mensaje: x.MENSAJE ?? null,
  enlace: x.ENLACE ?? null,
  leida: x.LEIDA_FECHA != null,
});

// Últimas notificaciones del usuario y cantidad de pendientes.
async function listar(idUsuario, limite = 30) {
  const [filas, cuenta] = await Promise.all([
    query(
      `SELECT ID, FECHA, TIPO, TITULO, MENSAJE, ENLACE, LEIDA_FECHA FROM ${A}.LAB_APP_NOTIF
        WHERE ID_USUARIO = :u ORDER BY FECHA DESC, ID DESC FETCH FIRST :n ROWS ONLY`,
      { u: idUsuario, n: limite },
    ),
    query(`SELECT COUNT(*) N FROM ${A}.LAB_APP_NOTIF WHERE ID_USUARIO = :u AND LEIDA_FECHA IS NULL`, { u: idUsuario }),
  ]);
  return { pendientes: cuenta.rows[0].N, notificaciones: filas.rows.map(aFila) };
}

// Marca una (o todas, si no se indica id) como leídas; solo las del propio usuario.
async function marcarLeidas(idUsuario, id) {
  const r = await query(
    `UPDATE ${A}.LAB_APP_NOTIF SET LEIDA_FECHA = SYSTIMESTAMP
      WHERE ID_USUARIO = :u AND LEIDA_FECHA IS NULL ${id != null ? 'AND ID = :id' : ''}`,
    id != null ? { u: idUsuario, id } : { u: idUsuario },
  );
  return r.rowsAffected ?? 0;
}

// Punto de entrada para quien produzca avisos (cierres, variables fuera de límite, etc.): una fila por destinatario.
async function notificar(idsUsuario, { tipo = 'info', titulo, mensaje = null, enlace = null }) {
  if (!titulo) throw new Error('La notificación necesita un título');
  const t = TIPOS.has(tipo) ? tipo : 'info';
  for (const u of [].concat(idsUsuario)) {
    await query(
      `INSERT INTO ${A}.LAB_APP_NOTIF (ID_USUARIO, TIPO, TITULO, MENSAJE, ENLACE) VALUES (:u, :t, :ti, :m, :e)`,
      { u, t, ti: String(titulo).slice(0, 120), m: mensaje && String(mensaje).slice(0, 500), e: enlace && String(enlace).slice(0, 200) },
    );
  }
}

module.exports = { listar, marcarLeidas, notificar };
