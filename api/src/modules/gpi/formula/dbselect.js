// Db_Select: SQL guardado en la fórmula (balanza de caña). Decisión del usuario: se permite.
// El evaluador es síncrono: las consultas se resuelven antes (precargar) y el contexto las sirve de la caché.
//
// SEGURIDAD (Sprint 16, hallazgos M1-M4). El texto SQL viene de la base y NO se confía en él. En vez de buscar palabras prohibidas (lista negra,
// que se evade con literales q'[…]', funciones de paquetes, enlaces de base de datos, etc.) se **tokeniza** y se acepta solo lo que está en una
// LISTA BLANCA: un único SELECT, sin subconsultas, con las tablas y funciones que usan las fórmulas reales (ver TABLAS y FUNCIONES). Lo demás se
// rechaza, y las variables [VAR_EMPR] / [VAR_SAFRA] / [VAR_DATA] se pasan como parámetros (binds), nunca pegadas en el texto.
// Defensa adicional (db.js): transacción de solo lectura, pool aparte, tope de filas y de tiempo; lo ideal sigue siendo un usuario de Oracle con
// solo SELECT sobre estas tablas (T4, requiere un DBA).
const { fechaReal } = require("../../../lib/validar");

// Tablas que consultan las fórmulas de producción (ba_movimientos_bascula, personas y lc_tipos_cañeros), con o sin el esquema INV.
const TABLAS = new Set(["BA_MOVIMIENTOS_BASCULA", "PERSONAS", "LC_TIPOS_CAÑEROS"]);
const ESQUEMAS = new Set(["INV"]);
// Funciones permitidas (agregaciones y conversiones inocuas, más BUSCA_PARAMETRO que usan todas las fórmulas reales para leer parámetros).
const FUNCIONES = new Set(["SUM", "COUNT", "AVG", "MIN", "MAX", "NVL", "ROUND", "TRUNC", "ABS", "TO_DATE", "TO_NUMBER", "BUSCA_PARAMETRO"]);
// Palabras del lenguaje aceptadas. Todo lo demás que sea reservada de Oracle se rechaza (ver RESERVADAS).
const PALABRAS = new Set(["SELECT", "DISTINCT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "BETWEEN", "LIKE", "IS", "NULL", "AS", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER",
  "ON", "GROUP", "BY", "ORDER", "HAVING", "CASE", "WHEN", "THEN", "ELSE", "END", "ASC", "DESC"]);
// Reservadas de Oracle y construcciones peligrosas que NO se aceptan ni como nombre de columna o alias (así «for update», «into» o «connect by» no pasan disfrazados).
const RESERVADAS = new Set(("ACCESS ADD ALL ALTER ANY AUDIT CHAR CHECK CLUSTER COLUMN COMMENT COMPRESS CONNECT CREATE CURRENT DATE DECIMAL DEFAULT DELETE DROP EXCLUSIVE EXISTS FILE FLOAT FOR " +
  "GRANT IDENTIFIED IMMEDIATE INCREMENT INDEX INITIAL INSERT INTEGER INTERSECT INTO LEVEL LOCK LONG MAXEXTENTS MINUS MLSLABEL MODE MODIFY NOAUDIT NOCOMPRESS NOWAIT NUMBER OF OFFLINE " +
  "ONLINE OPTION PCTFREE PRIOR PUBLIC RAW RENAME RESOURCE REVOKE ROW ROWID ROWNUM ROWS SESSION SET SHARE SIZE SMALLINT START SUCCESSFUL SYNONYM SYSDATE TABLE TO TRIGGER UID UNION UNIQUE UPDATE " +
  "USER VALIDATE VALUES VARCHAR VARCHAR2 VIEW WHENEVER WITH FETCH OFFSET PIVOT UNPIVOT SAMPLE EXECUTE EXEC BEGIN DECLARE CALL COMMIT ROLLBACK MERGE TRUNCATE OVER PARTITION MODEL KEEP WITHIN " +
  "CROSS NATURAL FULL USING").split(" "));
const FIN_DE_FROM = new Set(["WHERE", "GROUP", "ORDER", "HAVING"]);
const MAX_LARGO = 4000;
const MAX_TOKENS = 600;

const PLACEHOLDER = /\[VAR_(EMPR|SAFRA|DATA)\]/gi;
const ID_INICIO = /[A-Za-zÑñ_]/;
const ID_RESTO = /[A-Za-zÑñ_0-9$#]/;

const esOp = (x, v) => x?.k === "op" && x.v === v;
const esId = (x, v) => x?.k === "id" && (v === undefined || x.v === v);

// Divide el SQL en tokens. Lanza Error con el motivo ante cualquier carácter o construcción no permitida.
function tokenizar(sql) {
  const t = [];
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'") {
      // Literal de texto: '' escapa una comilla. Los literales q'[…]' y n'…' se rechazan más abajo (identificador pegado a la comilla).
      let j = i + 1;
      for (;;) {
        if (j >= sql.length) throw new Error("literal de texto sin cerrar");
        if (sql[j] === "'") { if (sql[j + 1] === "'") { j += 2; continue; } break; }
        j++;
      }
      t.push({ k: "texto", v: sql.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(sql[i + 1] || ""))) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(sql.slice(i));
      t.push({ k: "num", v: m[0] }); i += m[0].length; continue;
    }
    if (ID_INICIO.test(c)) {
      let j = i + 1;
      while (j < sql.length && ID_RESTO.test(sql[j])) j++;
      if (sql[j] === "'") throw new Error("literal con prefijo (q'…', n'…') no permitido");
      t.push({ k: "id", v: sql.slice(i, j).toUpperCase() }); i = j; continue;
    }
    if (sql.startsWith("--", i) || sql.startsWith("/*", i)) throw new Error("comentarios no permitidos");
    if (sql.startsWith("(+)", i)) { t.push({ k: "op", v: "(+)" }); i += 3; continue; } // marca de unión externa de Oracle
    const dos = sql.slice(i, i + 2);
    if (["<>", "!=", "<=", ">=", "||"].includes(dos)) { t.push({ k: "op", v: dos }); i += 2; continue; }
    if ("+-*/=<>(),.".includes(c)) { t.push({ k: "op", v: c }); i++; continue; }
    // Todo lo demás: ; comillas dobles (identificadores citados), @ (enlaces de base), : y & (parámetros), corchetes, etc.
    throw new Error(`carácter no permitido '${c}'`);
  }
  return t;
}

// Recorre la cláusula FROM («FROM a x, b y», «FROM a JOIN b ON …», con esquema opcional) y comprueba que toda tabla esté en la lista blanca.
// Devuelve las tablas, los nombres que quedan declarados (tablas y alias) y los índices de los tokens que son nombres de tabla.
function revisarFrom(t, desde) {
  const tablas = [], nombres = new Set(), enTabla = new Set();
  let i = desde, espera = true, profundidad = 0;
  for (; i < t.length; i++) {
    const x = t[i];
    if (profundidad === 0 && esId(x) && FIN_DE_FROM.has(x.v)) break;
    if (esOp(x, "(")) { profundidad++; continue; }
    if (esOp(x, ")")) { profundidad--; continue; }
    if (profundidad > 0) continue; // argumentos de funciones dentro de un ON
    if (!espera) {
      if (esOp(x, ",") || esId(x, "JOIN")) espera = true;
      continue;
    }
    // Se espera una tabla: [esquema.]tabla [AS] [alias]
    if (!esId(x) || PALABRAS.has(x.v)) throw new Error("se esperaba el nombre de una tabla");
    let nombre = x.v;
    enTabla.add(i);
    if (esOp(t[i + 1], ".") && esId(t[i + 2])) {
      if (!ESQUEMAS.has(x.v)) throw new Error(`esquema no permitido: ${x.v}`);
      nombre = t[i + 2].v; enTabla.add(i + 1); enTabla.add(i + 2); i += 2;
    }
    if (!TABLAS.has(nombre)) throw new Error(`tabla no permitida: ${nombre}`);
    tablas.push(nombre); nombres.add(nombre);
    if (esId(t[i + 1], "AS")) i++;
    if (esId(t[i + 1]) && !PALABRAS.has(t[i + 1].v)) { nombres.add(t[i + 1].v); i++; }
    espera = false;
  }
  if (!tablas.length) throw new Error("sin tabla en FROM");
  return { tablas, nombres, enTabla };
}

// Valida el SQL (ya con los marcadores [VAR_*] reemplazados por identificadores) contra la lista blanca.
function validar(sql) {
  if (sql.length > MAX_LARGO) throw new Error(`consulta demasiado larga (máximo ${MAX_LARGO} caracteres)`);
  const t = tokenizar(sql);
  if (t.length > MAX_TOKENS) throw new Error("consulta demasiado compleja");
  if (!esId(t[0], "SELECT")) throw new Error("no empieza con SELECT");
  if (t.slice(1).some((x) => esId(x, "SELECT"))) throw new Error("las subconsultas no están permitidas");
  for (const x of t) if (esId(x) && RESERVADAS.has(x.v)) throw new Error(`palabra no permitida: ${x.v}`);
  const iFrom = t.findIndex((x) => esId(x, "FROM"));
  if (iFrom < 0) throw new Error("sin FROM");
  const { tablas, nombres, enTabla } = revisarFrom(t, iFrom + 1);

  let profundidad = 0;
  for (let i = 0; i < t.length; i++) {
    const x = t[i];
    if (esOp(x, "(")) profundidad++;
    else if (esOp(x, ")") && --profundidad < 0) throw new Error("paréntesis desbalanceados");
    if (!esId(x) || PALABRAS.has(x.v) || enTabla.has(i)) continue;
    if (esOp(t[i + 1], "(")) {
      if (!FUNCIONES.has(x.v)) throw new Error(`función no permitida: ${x.v}`);
      continue;
    }
    // alias.columna: el alias debe ser una tabla o alias de este FROM. Un nombre calificado desconocido (dbms_random.value, pkg.funcion sin
    // paréntesis, esquema.paquete.funcion) podría ser una función de paquete.
    if (esOp(t[i + 1], ".")) {
      if (!nombres.has(x.v)) throw new Error(`nombre calificado no permitido: ${x.v}.${t[i + 2]?.v ?? ""}`);
      if (!esId(t[i + 2]) || esOp(t[i + 3], ".") || esOp(t[i + 3], "(")) throw new Error(`referencia no permitida: ${x.v}.${t[i + 2]?.v ?? ""}`);
      i += 2; // la columna ya quedó revisada
    }
  }
  if (profundidad !== 0) throw new Error("paréntesis desbalanceados");
  return { tablas };
}

// Prepara una consulta de la fórmula: valida, reemplaza [VAR_*] por parámetros y devuelve { ok, sql, binds } o { ok: false, motivo }.
function preparar(original, { empr, safra, fecha }) {
  try {
    const texto = String(original).trim().replace(/;\s*$/, "");
    if (/;/.test(texto)) throw new Error("más de una sentencia");
    // Los marcadores se validan como identificadores comunes y recién después se reemplazan.
    validar(texto.replace(PLACEHOLDER, (_m, n) => `PARAM_${n.toUpperCase()}`));
    const binds = {};
    const sql = texto.replace(PLACEHOLDER, (_m, n) => {
      const nombre = n.toUpperCase();
      if (nombre === "EMPR") { binds.empr = entero(empr, "empresa"); return ":empr"; }
      if (nombre === "SAFRA") { binds.safra = entero(safra, "zafra"); return ":safra"; }
      fechaReal(fecha, "fecha");
      binds.fecha = fecha;
      return "TO_DATE(:fecha,'YYYY-MM-DD')";
    });
    return { ok: true, sql, binds };
  } catch (e) {
    return { ok: false, motivo: e.message };
  }
}

function entero(v, nombre) {
  const n = Number(v);
  if (v === "" || v === null || v === undefined || !Number.isInteger(n) || n < 0) throw new Error(`${nombre} inválida`);
  return n;
}

// Textos SQL de todas las llamadas Db_Select del AST.
function sqlsDe(ast, out = new Set()) {
  if (!ast || typeof ast !== "object") return out;
  if (ast.t === "call" && ast.fn === "DB_SELECT" && ast.args[0]?.t === "str") out.add(ast.args[0].v);
  for (const k of Object.keys(ast)) {
    const v = ast[k];
    if (Array.isArray(v)) v.forEach((x) => sqlsDe(x, out));
    else if (v && typeof v === "object") sqlsDe(v, out);
  }
  return out;
}

// ejecutar(sql, binds) → primer valor de la primera fila (o null). Devuelve Map<sqlOriginal, valor|Error>.
async function precargar(ast, params, ejecutar) {
  const cache = new Map();
  for (const original of sqlsDe(ast)) {
    const p = preparar(original, params);
    if (!p.ok) { cache.set(original, new Error(`Db_Select rechazado: ${p.motivo}`)); continue; }
    try { cache.set(original, await ejecutar(p.sql, p.binds)); } catch (e) { cache.set(original, e); }
  }
  return cache;
}

module.exports = { preparar, validar, tokenizar, sqlsDe, precargar, TABLAS, FUNCIONES };
