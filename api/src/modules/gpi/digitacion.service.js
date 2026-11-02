// GPI · Digitación diaria (ESCRITURA). Graba los valores que el usuario digita en las columnas de una planilla (GI_LAB_LANC_MOV_{e}_{s}).
//
// ALCANCE de esta primera versión (Sprint 18):
//   - Solo variables DIGITADAS (VAR_ORI_DADOS = 0), activas, de tipo numérico (0), texto (2) u hora (3), en un día ABIERTO (posterior al último cierre).
//   - Se guardan los valores digitados y el resultado del día (col. 99) de cada variable tocada, con la regla verificada contra el VB6 (reglas.agregarDia +
//     aTextoGuardado: 100 % exacto en variables digitadas de media 1, 2, 3 y 4; las de media 0 no llevan col. 99).
//   - NO se recalculan las variables calculadas que dependen de lo digitado, ni los acumulados: eso lo hace el cierre del día y está pendiente de definir
//     (docs/analisis/gpi-cierre.md). La respuesta lo avisa (`calculadasDesactualizadas`).
//
// GARANTÍAS: una sola transacción (todo o nada); bloqueo del día mientras se graba; control de concurrencia optimista (cada celda trae el valor que el cliente
// vio, `anterior`: si ya cambió, se rechaza todo con 409); el valor se normaliza con la misma regla que usa el VB6 para guardar; auditoría de cada fila.
const { oracledb, query, transaccion } = require("../../db");
const { error } = require("../../lib/util");
const { fechaReal, decimal, escalar } = require("../../lib/validar");
const auditoria = require("../../lib/auditoria");
const gpi = require("./gpi.service");
const { aTextoGuardado, agregarDia, MAX_LARGO_VALOR } = require("./formula/reglas");
const { esNulo } = require("./formula/evaluador");

const S = "GATEC_GPI_NEW";
const MAX_CAMBIOS = 500;
const COL_MAX = 98; // la col. 99 es el resultado del día y no se digita
const TIPOS_SOPORTADOS = new Set([0, 2, 3]); // numérico, texto, hora. El tipo 4 (notación «168E8») y el 1 no tienen regla verificada
const conflicto = (msg, extra = {}) => Object.assign(error(msg, 409), extra);

// ---------- Reglas puras (sin base de datos; probadas en api/test/digitacion.test.js) ----------

// Día editable: posterior al último cierre, dentro de la zafra y no posterior al día de digitación actual.
function diaEditable(param, data) {
  if (!param) return { ok: false, motivo: "No hay parámetros de la zafra del GPI" };
  if (param.ENCERRADA === 1 || param.ENCERRADA === "S") return { ok: false, motivo: "La zafra del GPI está encerrada" };
  if (param.INICIO && data < param.INICIO) return { ok: false, motivo: "La fecha es anterior al inicio de la zafra" };
  if (param.FIM && data > param.FIM) return { ok: false, motivo: "La fecha es posterior al fin de la zafra" };
  if (param.FECHA_REAL && data <= param.FECHA_REAL) return { ok: false, motivo: `El día ${data} ya está cerrado (último cierre: ${param.FECHA_REAL})` };
  if (param.DIA_ACTUAL && data > param.DIA_ACTUAL) return { ok: false, motivo: `Solo se puede digitar hasta el día actual de digitación (${param.DIA_ACTUAL})` };
  return { ok: true };
}

// Texto digitado → texto que se guarda (null = borrar). Lanza 400 con un mensaje que nombra la variable.
function normalizarValor(v, texto) {
  const rotulo = `${v.nombre} (#${v.id})`;
  escalar(texto, `Valor de ${rotulo}`);
  if (texto === null || texto === undefined) return null;
  const t = String(texto).trim();
  if (t === "") return null;
  if (v.tipoDig === 3) {
    const m = /^(\d{1,3}):([0-5]\d)$/.exec(t);
    if (!m) throw error(`${rotulo}: la hora debe ser h:mm (por ejemplo 8:30)`);
    return `${Number(m[1])}:${m[2]}`;
  }
  if (v.tipoDig === 2) {
    if (t.length > MAX_LARGO_VALOR) throw error(`${rotulo}: el texto no puede pasar de ${MAX_LARGO_VALOR} caracteres`);
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f]/.test(t)) throw error(`${rotulo}: el texto tiene caracteres no permitidos`);
    return t;
  }
  const n = decimal(t, `Valor de ${rotulo}`);
  const guardado = aTextoGuardado({ VAR_TIPO_DIG: 0, VAR_MAS_DEC: v.masDec }, n);
  if (v.masInt > 0) {
    const enteros = guardado.replace("-", "").split(".")[0].length;
    if (enteros > v.masInt) throw error(`${rotulo}: el valor tiene más de ${v.masInt} dígitos enteros`);
  }
  return guardado;
}

// Valida la forma de la lista de cambios (sin consultar la base).
function validarCambios(cambios, columnasValidas) {
  if (!Array.isArray(cambios) || !cambios.length) throw error("No hay cambios para grabar");
  if (cambios.length > MAX_CAMBIOS) throw error(`Demasiados cambios en un pedido (máximo ${MAX_CAMBIOS})`);
  const vistos = new Set();
  return cambios.map((c, i) => {
    if (!c || typeof c !== "object") throw error(`Cambio ${i + 1} inválido`);
    const idVar = Number(c.idVar), col = Number(c.col);
    if (!Number.isInteger(idVar) || idVar <= 0) throw error(`Cambio ${i + 1}: variable inválida`);
    if (!Number.isInteger(col) || col < 1 || col > COL_MAX) throw error(`Cambio ${i + 1}: columna inválida`);
    if (!columnasValidas.has(col)) throw error(`Cambio ${i + 1}: la columna ${col} no existe en esta planilla`);
    const k = `${idVar}|${col}`;
    if (vistos.has(k)) throw error(`La celda variable ${idVar}, columna ${col} aparece dos veces`);
    vistos.add(k);
    escalar(c.anterior, "anterior"); escalar(c.nuevo, "nuevo");
    return { idVar, col, anterior: esNulo(c.anterior) ? null : String(c.anterior).trim(), nuevo: c.nuevo };
  });
}

/**
 * Calcula qué hay que escribir. `variables`: Map(id → { id, nombre, tipoDig, tipoMedia, masInt, masDec, digitada, activa }); `actuales`: Map("idVar|col" → texto)
 * con lo que hay hoy en la base (incluida la col. 99). Devuelve { conflictos, operaciones } sin tocar nada.
 */
function planificar({ variables, actuales, cambios }) {
  const conflictos = [], operaciones = [];
  const nuevos = new Map(); // "idVar|col" → texto final de las columnas digitadas
  const tocadas = new Set();
  for (const c of cambios) {
    const v = variables.get(c.idVar);
    if (!v) throw error(`La variable ${c.idVar} no pertenece a esta planilla`);
    if (!v.digitada) throw error(`${v.nombre} (#${v.id}) es una variable calculada: no se digita`);
    if (!v.activa) throw error(`${v.nombre} (#${v.id}) está inactiva`);
    if (!TIPOS_SOPORTADOS.has(v.tipoDig)) throw error(`${v.nombre} (#${v.id}): este tipo de digitación (${v.tipoDig}) todavía no se puede grabar desde la app`);
    const k = `${c.idVar}|${c.col}`;
    const actual = actuales.has(k) ? actuales.get(k) : null;
    if ((actual ?? null) !== (c.anterior ?? null)) { conflictos.push({ idVar: c.idVar, col: c.col, actual: actual ?? null }); continue; }
    const despues = normalizarValor(v, c.nuevo);
    if ((actual ?? null) === despues) continue; // sin cambio real
    operaciones.push({ tipo: actual === null ? "insertar" : despues === null ? "borrar" : "actualizar", idVar: c.idVar, col: c.col, antes: actual, despues, derivada: false });
    nuevos.set(k, despues);
    tocadas.add(c.idVar);
  }
  if (conflictos.length) return { conflictos, operaciones: [] };

  // Resultado del día (col. 99) de cada variable tocada, con la regla verificada (reglas.agregarDia + aTextoGuardado).
  for (const idVar of tocadas) {
    const v = variables.get(idVar);
    const cols = [];
    for (const [k, texto] of actuales) { const [i, c] = k.split("|").map(Number); if (i === idVar && c !== 99) cols.push([c, texto]); }
    for (const [k, texto] of nuevos) {
      const [, c] = k.split("|").map(Number);
      const ix = cols.findIndex(([cc]) => cc === c);
      if (texto === null) { if (ix >= 0) cols.splice(ix, 1); } else if (ix >= 0) cols[ix][1] = texto; else cols.push([c, texto]);
    }
    const vb = { VAR_TIPO_DIG: v.tipoDig, VAR_TIPO_MEDIA: v.tipoMedia, VAR_MAS_DEC: v.masDec };
    const actual99 = actuales.has(`${idVar}|99`) ? actuales.get(`${idVar}|99`) : null;
    let dia99 = null;
    if (cols.length) dia99 = aTextoGuardado(vb, agregarDia(vb, cols.map(([, t]) => t)), { dia: true });
    // Las variables sin agregación (media 0) no llevan col. 99: solo se mantiene si ya existía.
    if (!v.tipoMedia && actual99 === null) continue;
    if ((actual99 ?? null) === dia99) continue;
    operaciones.push({ tipo: actual99 === null ? "insertar" : dia99 === null ? "borrar" : "actualizar", idVar, col: 99, antes: actual99, despues: dia99, derivada: true });
  }
  return { conflictos: [], operaciones };
}

// ---------- Acceso a la base ----------

async function cargarVariables(idPlan, empr, ids) {
  const binds = { p: idPlan, e: empr };
  ids.forEach((id, i) => { binds[`v${i}`] = id; });
  const r = await query(
    `SELECT v.ID_VAR, v.VAR_NOM_VAR, v.VAR_TIPO_DIG, v.VAR_TIPO_MEDIA, v.VAR_MAS_INT, v.VAR_MAS_DEC, v.VAR_ORI_DADOS, s.VAR_STATUS
       FROM ${S}.GI_LAB_VAR v LEFT JOIN ${S}.GI_LAB_VAR_STATUS s ON s.ID_VAR = v.ID_VAR AND s.COD_EMPR = :e
      WHERE v.ID_PLAN = :p AND v.ID_VAR IN (${ids.map((_, i) => `:v${i}`).join(",")})`,
    binds, { maxRows: MAX_CAMBIOS },
  );
  return new Map(r.rows.map((x) => [x.ID_VAR, {
    id: x.ID_VAR, nombre: String(x.VAR_NOM_VAR || "").trim(), tipoDig: x.VAR_TIPO_DIG, tipoMedia: x.VAR_TIPO_MEDIA, masInt: x.VAR_MAS_INT, masDec: x.VAR_MAS_DEC,
    digitada: x.VAR_ORI_DADOS === 0, activa: x.VAR_STATUS === 1,
  }]));
}

async function grabar({ empr, safra, idPlan, data, cambios, usuario }) {
  fechaReal(data, "Fecha");
  const [tLanc, tMov, conf, param] = await Promise.all([gpi.tabla("LANC", empr, safra), gpi.tabla("LANC_MOV", empr, safra), gpi.configuracion(empr, idPlan), gpi.parametrosSafra(empr, safra)]);
  if (!tLanc || !tMov) throw error(`No hay tablas del GPI para la zafra ${safra}`);
  if (!conf || !conf.activa) throw error("La planilla no tiene columnas activas");
  const dia = diaEditable(param, data);
  if (!dia.ok) throw error(dia.motivo, 409);

  const columnasValidas = new Set(gpi.columnas(conf).map((c) => c.col));
  const lista = validarCambios(cambios, columnasValidas);
  const variables = await cargarVariables(idPlan, empr, [...new Set(lista.map((c) => c.idVar))]);

  return transaccion(async (cn) => {
    // Bloquea el día de la planilla mientras se graba (otro grabado de la app espera; si tarda más de 10 s se rechaza).
    let lanc;
    try {
      lanc = (await cn.execute(`SELECT ID_LANC FROM ${tLanc} WHERE ID_PLAN = :p AND LAN_DATA = TO_DATE(:d, 'YYYY-MM-DD') FOR UPDATE WAIT 10`, { p: idPlan, d: data })).rows?.[0];
    } catch (e) {
      if (/ORA-30006/.test(e.message)) throw conflicto("El día está siendo modificado por otro usuario; intente de nuevo en unos segundos");
      throw e;
    }
    let idLanc = lanc?.ID_LANC;
    const actuales = new Map();
    if (idLanc) {
      const r = await cn.execute(`SELECT ID_VAR, MOV_COLUNA, MOV_VALOR FROM ${tMov} WHERE ID_LANC = :l`, { l: idLanc }, { maxRows: 100000 });
      for (const m of r.rows) actuales.set(`${m.ID_VAR}|${m.MOV_COLUNA}`, String(m.MOV_VALOR).trim());
    }
    const plan = planificar({ variables, actuales, cambios: lista });
    if (plan.conflictos.length) throw conflicto("Otro usuario cambió estos valores mientras usted los editaba; recargue y vuelva a intentar", { code: "CONFLICTO", conflictos: plan.conflictos });
    if (!plan.operaciones.length) return { ok: true, idLanc: idLanc ?? null, cambios: 0, filas: [], calculadasDesactualizadas: false };

    if (!idLanc) {
      const ins = await cn.execute(
        `INSERT INTO ${tLanc} (ID_LANC, LAN_DATA, ID_PLAN) VALUES (${S}.GAS_LAB_ID_LANC.NEXTVAL, TO_DATE(:d, 'YYYY-MM-DD'), :p) RETURNING ID_LANC INTO :id`,
        { d: data, p: idPlan, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      );
      idLanc = ins.outBinds.id[0];
    }
    for (const op of plan.operaciones) {
      const b = { v: op.idVar, c: op.col, l: idLanc };
      if (op.tipo === "insertar") await cn.execute(`INSERT INTO ${tMov} (ID_VAR, MOV_COLUNA, ID_LANC, MOV_VALOR) VALUES (:v, :c, :l, :x)`, { ...b, x: op.despues });
      else if (op.tipo === "actualizar") await cn.execute(`UPDATE ${tMov} SET MOV_VALOR = :x WHERE ID_VAR = :v AND MOV_COLUNA = :c AND ID_LANC = :l`, { ...b, x: op.despues });
      else await cn.execute(`DELETE FROM ${tMov} WHERE ID_VAR = :v AND MOV_COLUNA = :c AND ID_LANC = :l`, b);
    }
    await auditoria.registrar(cn, usuario, plan.operaciones.map((op) => ({
      accion: `GPI_DIG_${op.tipo.toUpperCase()}${op.derivada ? "_DIA" : ""}`, tabla: tMov.split(".")[1], clave: `lanc=${idLanc} var=${op.idVar} col=${op.col}`, antes: op.antes, despues: op.despues,
    })), `empresa ${empr} · zafra ${safra} · planilla ${idPlan} · ${data}`);
    return {
      ok: true, idLanc, cambios: plan.operaciones.filter((o) => !o.derivada).length,
      filas: plan.operaciones.map((o) => ({ idVar: o.idVar, col: o.col, valor: o.despues, derivada: o.derivada })),
      // Las variables calculadas que dependen de lo digitado y los acumulados se recalculan en el cierre del día (aún no replicado).
      calculadasDesactualizadas: true,
    };
  });
}

// Qué puede hacer la pantalla con esta planilla y este día (la usa el front para mostrar u ocultar «Editar»).
async function estadoEdicion({ empr, safra, data }) {
  const param = await gpi.parametrosSafra(empr, safra);
  return diaEditable(param, data);
}

module.exports = { grabar, estadoEdicion, planificar, normalizarValor, validarCambios, diaEditable, MAX_CAMBIOS };
