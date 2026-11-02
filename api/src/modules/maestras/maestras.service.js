// CRUD genérico sobre una tabla maestra descrita en recursos.js.
const { query, queryOne } = require("../../db");
const { fechaReal, decimal, booleano } = require("../../lib/validar");

// Un booleano vacío o nulo es «falso» (columna sin valor); cualquier otro texto debe ser un valor explícito.
// Antes el texto "false" o "0" se guardaba como verdadero por ser un string no vacío.
const aBool = (v) => (v === null || v === undefined || v === "" ? false : booleano(v));
const intenta = (fn) => { try { fn(); return true; } catch { return false; } };

const esTexto = (c) => c.tipo === "texto";
const pkCols = (r) => r.columnas.filter((c) => c.pk);
const scopeCols = (r) => r.columnas.filter((c) => c.scope);

// Formatea el valor de scope según el tipo de columna. Solo las CHAR (ancho fijo)
// se rellenan con ceros a la izquierda (ej. COD_EMPR CHAR(2) → '01'); VARCHAR2 no.
function valorScope(col, valor) {
  if (col.tipo !== "texto") return Number(valor);
  const s = String(valor);
  return col.fixedLen ? s.padStart(col.fixedLen, "0") : s;
}

// WHERE + binds del scope empresa/zafra para recursos scopados.
function scopeFiltro(recurso, context) {
  if (!recurso.scoped) return { sql: "", binds: {} };
  const binds = {};
  const sql = scopeCols(recurso)
    .map((c) => {
      const v = c.col === "COD_EMPR" ? context.empresa.cod : context.safra;
      binds[`sc_${c.col}`] = valorScope(c, v);
      return esTexto(c) ? `RTRIM(${c.col}) = :sc_${c.col}` : `${c.col} = :sc_${c.col}`;
    })
    .join(" AND ");
  return { sql, binds };
}

// Fechas, horas y números viajan como texto y se convierten en Oracle (TO_CHAR/TO_DATE/
// TO_NUMBER), sin pasar por Date ni por double de JS: así no interviene la zona horaria
// (que corría el día), ni el desfase histórico LMT de 1899 (que rompía las horas con la
// convención VB6), ni el redondeo binario (0,8533 se leía como 0.8533000000000001 y se
// habría guardado así). El pool fija NLS_NUMERIC_CHARACTERS = '.,' (ver db.js).
const FMT_FECHA = "YYYY-MM-DD";
const FMT_HORA = "HH24:MI";
const FMT_FECHAHORA = "YYYY-MM-DD HH24:MI";
// Convención VB6: una hora sola se guarda sobre la fecha cero 30/12/1899.
const FECHA_CERO_VB6 = "1899-12-30";

function selectCol(c) {
  if (c.tipo === "fecha") return `TO_CHAR(${c.col}, '${FMT_FECHA}') AS ${c.col}`;
  if (c.tipo === "hora") return `TO_CHAR(${c.col}, '${FMT_HORA}') AS ${c.col}`;
  if (c.tipo === "fechahora") return `TO_CHAR(${c.col}, '${FMT_FECHAHORA}') AS ${c.col}`;
  if (c.tipo === "numero") return `TO_CHAR(${c.col}, 'TM9') AS ${c.col}`;
  return c.col;
}
const selectCols = (recurso) => recurso.columnas.map(selectCol).join(", ");

function bindExpr(c, nombre) {
  if (c.tipo === "fecha") return `TO_DATE(:${nombre}, '${FMT_FECHA}')`;
  if (c.tipo === "fechahora") return `TO_DATE(REPLACE(:${nombre}, 'T', ' '), '${FMT_FECHAHORA}')`;
  if (c.tipo === "hora") return `TO_DATE(NVL2(:${nombre}, '${FECHA_CERO_VB6} ' || :${nombre}, NULL), 'YYYY-MM-DD ${FMT_HORA}')`;
  if (c.tipo === "numero") return `TO_NUMBER(:${nombre})`;
  return `:${nombre}`;
}

// Convierte un valor de BD a JSON amigable: CHAR viene con espacios → trim.
function salida(row, recurso) {
  const out = {};
  for (const c of recurso.columnas) {
    let v = row[c.col];
    if (typeof v === "string") v = v.replace(/\s+$/, "");
    if (c.tipo === "bool") v = c.sn ? v === "S" : v === 1 || v === "1" || v === true;
    // TM9 omite el cero inicial: ".5" → "0.5", "-.5" → "-0.5".
    if (c.tipo === "numero" && typeof v === "string") v = v.replace(/^(-?)\./, "$10.");
    out[c.col] = v ?? null;
  }
  return out;
}

// WHERE por PK. Para PK de texto usa RTRIM (columnas CHAR con padding); para fecha, TRUNC
// (el VB6 pudo haber guardado la hora).
function wherePk(recurso) {
  return pkCols(recurso)
    .map((c) => {
      if (esTexto(c)) return `RTRIM(${c.col}) = :pk_${c.col}`;
      if (c.tipo === "fecha") return `TRUNC(${c.col}) = ${bindExpr(c, `pk_${c.col}`)}`;
      if (c.tipo === "fechahora") return `TRUNC(${c.col}, 'MI') = ${bindExpr(c, `pk_${c.col}`)}`;
      return `${c.col} = ${bindExpr(c, `pk_${c.col}`)}`;
    })
    .join(" AND ");
}
// WHERE de UN registro: la PK que manda el cliente MÁS el filtro de empresa/zafra del contexto del usuario.
// Sin el filtro, un usuario podía leer, editar o borrar (y hasta reasignar de empresa) un registro de otra empresa/zafra
// con solo conocer su clave. En recursos no scopados no agrega nada.
function whereRegistro(recurso, idParts, context) {
  const scope = scopeFiltro(recurso, context || { empresa: {}, safra: null });
  return {
    sql: scope.sql ? `${wherePk(recurso)} AND ${scope.sql}` : wherePk(recurso),
    binds: { ...bindsPk(recurso, idParts), ...scope.binds },
  };
}
function bindsPk(recurso, idParts) {
  const b = {};
  pkCols(recurso).forEach((c, i) => {
    const v = String(idParts[i]).trimEnd();
    b[`pk_${c.col}`] = v;
  });
  return b;
}

function valorEntrada(c, v) {
  if (c.tipo === "bool" && c.sn) return aBool(v) ? "S" : "N";
  if (v === "" || v === undefined) v = null;
  if (v === null) return null;
  if (c.tipo === "numero") return String(v).trim();
  if (c.tipo === "bool") return aBool(v) ? 1 : 0;
  if (c.tipo === "fecha") return String(v).slice(0, 10);
  if (c.tipo === "fechahora") return String(v).replace("T", " ").slice(0, 16);
  if (c.tipo === "hora") return String(v).slice(0, 5).padStart(5, "0");
  // Solo espacios finales: hay datos del VB6 con espacios al inicio (ej. COD_DIVI4) que no se deben alterar.
  return String(v).trimEnd();
}

function validar(recurso, data, { parcial = false } = {}) {
  const errores = [];
  for (const c of recurso.columnas) {
    const presente = data[c.col] !== undefined;
    if (!parcial && c.req && (data[c.col] === undefined || data[c.col] === "" || data[c.col] === null)) {
      errores.push(`${c.label} es obligatorio`);
    }
    if (presente && esTexto(c) && c.len && data[c.col] && String(data[c.col]).length > c.len) {
      errores.push(`${c.label} supera ${c.len} caracteres`);
    }
    if (presente && c.tipo === "numero" && data[c.col] !== null && data[c.col] !== "" && !intenta(() => decimal(data[c.col], c.label))) {
      errores.push(`${c.label} debe ser numérico`);
    }
    if (presente && c.enteros !== undefined && data[c.col] !== null && data[c.col] !== "" &&
        Math.abs(Math.trunc(Number(data[c.col]))) >= 10 ** c.enteros) {
      errores.push(`${c.label} admite hasta ${c.enteros} dígito(s) enteros`);
    }
    if (presente && c.tipo === "hora" && data[c.col] && !/^([01]\d|2[0-3]):[0-5]\d/.test(String(data[c.col]).padStart(5, "0"))) {
      errores.push(`${c.label} debe ser una hora (HH:MM)`);
    }
    if (presente && c.tipo === "fechahora" && data[c.col] && !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(String(data[c.col]))) {
      errores.push(`${c.label} debe ser fecha y hora (AAAA-MM-DD HH:MM)`);
    }
    if (presente && c.tipo === "fecha" && data[c.col] && !intenta(() => fechaReal(String(data[c.col]).slice(0, 10), c.label))) {
      errores.push(`${c.label} debe ser una fecha válida (AAAA-MM-DD)`);
    }
    if (presente && c.tipo === "bool" && !intenta(() => aBool(data[c.col]))) {
      errores.push(`${c.label} debe ser verdadero o falso`);
    }
  }
  return errores;
}

const LIMITE_MAESTRAS = 5000;
async function listar(recurso, { q, limit = LIMITE_MAESTRAS, context } = {}) {
  let sql = `SELECT ${selectCols(recurso)} FROM ${recurso.esquema}.${recurso.tabla}`;
  const binds = {};
  const condiciones = [];

  const scope = scopeFiltro(recurso, context || { empresa: {}, safra: null });
  if (scope.sql) { condiciones.push(scope.sql); Object.assign(binds, scope.binds); }

  if (q) {
    const textos = recurso.columnas.filter((c) => esTexto(c) && !c.scope);
    if (textos.length) {
      condiciones.push("(" + textos.map((c) => `UPPER(${c.col}) LIKE :q`).join(" OR ") + ")");
      binds.q = `%${String(q).toUpperCase()}%`;
    }
  }
  if (condiciones.length) sql += " WHERE " + condiciones.join(" AND ");
  if (recurso.orden) sql += ` ORDER BY ${recurso.orden}`;
  const r = await query(sql, binds, { maxRows: limit });
  return r.rows.map((row) => salida(row, recurso));
}

async function obtener(recurso, idParts, context) {
  const w = whereRegistro(recurso, idParts, context);
  const row = await queryOne(`SELECT ${selectCols(recurso)} FROM ${recurso.esquema}.${recurso.tabla} WHERE ${w.sql}`, w.binds);
  return row ? salida(row, recurso) : null;
}

async function crear(recurso, data, context) {
  // Completa empresa/zafra desde el contexto en recursos scopados.
  if (recurso.scoped && context) {
    for (const c of scopeCols(recurso)) {
      data[c.col] = valorScope(c, c.col === "COD_EMPR" ? context.empresa.cod : context.safra);
    }
  }
  const errores = validar(recurso, data);
  if (errores.length) return { error: errores.join("; ") };

  // Rechaza duplicado de PK.
  const idParts = pkCols(recurso).map((c) => data[c.col]);
  if (idParts.every((v) => v !== undefined && v !== null && v !== "")) {
    const existe = await obtener(recurso, idParts, context);
    if (existe) return { error: "Ya existe un registro con esa clave" };
  }

  const cols = [];
  const valores = [];
  const binds = {};
  for (const c of recurso.columnas) {
    if (data[c.col] !== undefined) {
      cols.push(c.col);
      valores.push(bindExpr(c, c.col));
      binds[c.col] = valorEntrada(c, data[c.col]);
    }
  }
  try {
    await query(
      `INSERT INTO ${recurso.esquema}.${recurso.tabla} (${cols.join(", ")}) VALUES (${valores.join(", ")})`,
      binds,
    );
  } catch (e) {
    const msg = errorIntegridad(e);
    if (msg) return { error: msg };
    throw e;
  }
  return { ok: true, registro: await obtener(recurso, idParts, context) };
}

// Traduce errores de integridad de Oracle a un mensaje para el usuario (o null si no es uno).
function errorIntegridad(e) {
  if (/ORA-00001/.test(e.message)) return "Ya existe un registro con esa clave";
  if (/ORA-02291/.test(e.message)) return "Un código ingresado no existe en la tabla relacionada";
  if (/ORA-01400/.test(e.message)) return "Falta un dato obligatorio";
  if (/ORA-01438|ORA-12899/.test(e.message)) return "Un valor excede el tamaño permitido";
  if (/ORA-01722|ORA-01426/.test(e.message)) return "Un valor numérico no es válido";
  if (/ORA-018(43|47|58|61)/.test(e.message)) return "Una fecha o una hora no es válida";
  return null;
}

// Las tablas sin PK declarada tienen filas duplicadas históricas (ej. GA_DIVI2_2, zafra 2006).
// Si la clave lógica coincide con más de una fila, no se edita ni borra: afectaría a todas.
async function contarPorPk(recurso, idParts, context) {
  const w = whereRegistro(recurso, idParts, context);
  const r = await queryOne(`SELECT COUNT(*) N FROM ${recurso.esquema}.${recurso.tabla} WHERE ${w.sql}`, w.binds);
  return r.N;
}
const ERROR_DUPLICADO = (n) =>
  `La clave de este registro está repetida en la base (${n} filas); no se modifica para no afectar a las demás`;

async function actualizar(recurso, idParts, data, context) {
  const actual = await obtener(recurso, idParts, context);
  if (!actual) return { error: "No existe el registro", notFound: true };
  const n = await contarPorPk(recurso, idParts, context);
  if (n > 1) return { error: ERROR_DUPLICADO(n) };
  const errores = validar(recurso, data, { parcial: true });
  if (errores.length) return { error: errores.join("; ") };

  const sets = [];
  const w = whereRegistro(recurso, idParts, context);
  const binds = { ...w.binds };
  for (const c of recurso.columnas) {
    if (c.pk) continue; // la PK no se modifica
    if (c.scope) continue; // empresa y zafra tampoco: reasignar un registro a otra empresa/zafra no es una edición
    if (data[c.col] === undefined) continue;
    // Solo se escriben las columnas que cambiaron: un guardado sin cambios no toca la fila
    // (defensa ante cualquier diferencia de representación entre lo leído y lo reenviado).
    const nuevo = valorEntrada(c, data[c.col]);
    if (nuevo === valorEntrada(c, actual[c.col])) continue;
    sets.push(`${c.col} = ${bindExpr(c, c.col)}`);
    binds[c.col] = nuevo;
  }
  if (!sets.length) return { ok: true, registro: actual };
  let r;
  try {
    r = await query(`UPDATE ${recurso.esquema}.${recurso.tabla} SET ${sets.join(", ")} WHERE ${w.sql}`, binds);
  } catch (e) {
    const msg = errorIntegridad(e);
    if (msg) return { error: msg };
    throw e;
  }
  if (!r.rowsAffected) return { error: "No se actualizó ninguna fila" };
  return { ok: true, registro: await obtener(recurso, idParts, context) };
}

async function eliminar(recurso, idParts, context) {
  const actual = await obtener(recurso, idParts, context);
  if (!actual) return { error: "No existe el registro", notFound: true };
  const n = await contarPorPk(recurso, idParts, context);
  if (n > 1) return { error: ERROR_DUPLICADO(n) };
  const w = whereRegistro(recurso, idParts, context);
  try {
    const r = await query(`DELETE FROM ${recurso.esquema}.${recurso.tabla} WHERE ${w.sql}`, w.binds);
    if (!r.rowsAffected) return { error: "No se eliminó ninguna fila" };
    return { ok: true };
  } catch (e) {
    if (/ORA-02292/.test(e.message)) return { error: "No se puede eliminar: tiene registros relacionados" };
    throw e;
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, pkCols, LIMITE_MAESTRAS };
