// Shim: Node 20+ quitó util.isDate, que oracledb 5.5 todavía usa al bindear fechas.
const util = require('util');
if (typeof util.isDate !== 'function') util.isDate = (v) => v instanceof Date;

const oracledb = require('oracledb');
const config = require('./config');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.autoCommit = false;

let initialized = false;
let pool;
let poolLectura; // pool aparte para el SQL guardado en las fórmulas (Db_Select): no compite con la aplicación ni la deja sin conexiones

function initClient() {
  if (initialized) return;
  try {
    oracledb.initOracleClient(config.db.libDir ? { libDir: config.db.libDir } : undefined);
  } catch (err) {
    // initOracleClient lanza si ya estaba inicializado; lo ignoramos.
    if (!/already been/i.test(err.message)) throw err;
  }
  initialized = true;
}

function opcionesPool({ poolMin, poolMax }) {
  return {
    user: config.db.user,
    password: config.db.password,
    connectString: config.db.connectString,
    poolMin,
    poolMax,
    poolIncrement: 1,
    poolTimeout: 60,
    stmtCacheSize: 40,
    // La base usa coma decimal (NLS español). Se fija el punto para que las conversiones
    // número↔texto en SQL (TO_CHAR/TO_NUMBER) sean deterministas.
    sessionCallback: (cn, _tag, cb) =>
      cn.execute(`ALTER SESSION SET NLS_NUMERIC_CHARACTERS = '.,'`).then(() => cb(), cb),
  };
}

async function initPool() {
  initClient();
  pool = await oracledb.createPool(opcionesPool({ poolMin: 2, poolMax: 10 }));
  // Salvaguarda: DESA y producción comparten el nombre de servicio BDTEB. Se exige el servidor
  // esperado (DB_HOST_ESPERADO) para que ni la API ni las herramientas toquen otra base por error.
  const r = await query(`SELECT LOWER(SYS_CONTEXT('USERENV','SERVER_HOST')) HOST FROM dual`);
  const host = r.rows[0] && r.rows[0].HOST;
  if (host !== config.db.hostEsperado) {
    await pool.close(0);
    throw new Error(`Base inesperada: servidor '${host}', se esperaba '${config.db.hostEsperado}' (DB_HOST_ESPERADO). No se continúa para no tocar otra base.`);
  }
  return host;
}

// Ejecuta una consulta tomando/devolviendo una conexión del pool.
async function query(sql, binds = {}, opts = {}) {
  const cn = await pool.getConnection();
  try {
    return await cn.execute(sql, binds, { autoCommit: true, ...opts });
  } finally {
    await cn.close();
  }
}

// Ejecuta varias sentencias como UNA transacción: o se confirman todas o ninguna. `fn` recibe la conexión (cn.execute sin autoCommit).
// Cualquier error revierte; una llamada que se cuelga se corta a los 60 s. Para escrituras de la app; las lecturas siguen usando query().
async function transaccion(fn) {
  const cn = await pool.getConnection();
  const corte = setTimeout(() => { cn.break().catch(() => {}); }, 60000);
  try {
    const r = await fn(cn);
    await cn.commit();
    return r;
  } catch (e) {
    try { await cn.rollback(); } catch { /* nada */ }
    throw e;
  } finally {
    clearTimeout(corte);
    await cn.close();
  }
}

// Primera fila o null.
async function queryOne(sql, binds = {}, opts = {}) {
  const r = await query(sql, binds, { ...opts, maxRows: 1 });
  return r.rows && r.rows.length ? r.rows[0] : null;
}

// Consulta de solo lectura (transacción READ ONLY, con tope de tiempo): para SQL guardado en fórmulas (Db_Select).
async function queryLectura(sql, binds = {}) {
  // Pool propio y chico (2 conexiones como máximo), creado la primera vez que se necesita.
  if (!poolLectura) poolLectura = await oracledb.createPool(opcionesPool({ poolMin: 0, poolMax: 2 }));
  const cn = await poolLectura.getConnection();
  // callTimeout pide cliente Oracle 18+; con el 12.1 se corta la llamada con break().
  const corte = setTimeout(() => { cn.break().catch(() => {}); }, 30000);
  try {
    await cn.execute("SET TRANSACTION READ ONLY");
    return await cn.execute(sql, binds, { maxRows: 10 });
  } finally {
    clearTimeout(corte);
    try { await cn.rollback(); } catch { /* nada */ }
    await cn.close();
  }
}

async function closePool() {
  if (poolLectura) await poolLectura.close(5);
  if (pool) await pool.close(10);
}

module.exports = { oracledb, initPool, query, queryOne, queryLectura, transaccion, closePool };
