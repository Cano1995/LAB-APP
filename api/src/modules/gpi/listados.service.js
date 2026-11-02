// GPI · Listados del menú «Informes» del GATEC (solo lectura): Listado de variables, Falta de digitación y Fuera de especificación.
// Equivalen a frmFilLisVariavel, FrmFilLisDiagnostico y FrmFilLisLancForaEspec. Del VB6 solo se conocen los nombres de los formularios (no hay fuente),
// así que las reglas son una interpretación razonable, por confirmar con un usuario del GATEC (docs/validacion-con-usuarios.md, Parte 5).
// Siempre limitado a las planillas habilitadas para el usuario, como el árbol de análisis.
const { query } = require("../../db");
const { error } = require("../../lib/util");
const { fechaReal } = require("../../lib/validar");
const gpi = require("./gpi.service");

const S = "GATEC_GPI_NEW";
const MAX_FILAS = 5000;
const MAX_DIAS = 62;
const COLUNA_DIA = 99;

const num = (t) => {
  if (t == null || String(t).trim() === "") return null;
  const n = Number(String(t).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const distinto0 = (x) => x != null && Number(x) !== 0; // 0 = «sin límite» en las especificaciones del GPI

function diasEntre(desde, hasta) {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / 86400000) + 1;
}

// Variables (activas o no) de las planillas habilitadas, con su planilla y unidad.
async function variablesHabilitadas({ empr, idUsuario, master }) {
  const tPlan = await gpi.tabla("NO_PLAN", empr);
  if (!tPlan) return [];
  const [r, habilitados] = await Promise.all([
    query(
      `SELECT v.ID_VAR, v.ID_PLAN, v.VAR_ORDEM, v.VAR_NOM_VAR, v.VAR_NOM_ANALI, v.VAR_ORI_DADOS, v.VAR_TIPO_MEDIA, v.VAR_MAS_DEC,
              s.VAR_ESPEC_MIN_VALOR, s.VAR_ESPEC_MAX_VALOR, u.UNI_ABV, TRIM(n.NO_DESC) PLAN, s.VAR_STATUS
         FROM ${S}.GI_LAB_VAR v
         JOIN ${tPlan} n ON n.ID_PLAN = v.ID_PLAN
         LEFT JOIN ${S}.GI_LAB_UNIDADE u ON u.ID_UNIDADE = v.ID_UNIDADE
         LEFT JOIN ${S}.GI_LAB_VAR_STATUS s ON s.ID_VAR = v.ID_VAR AND s.COD_EMPR = :e
        ORDER BY n.NO_DESC, v.VAR_ORDEM, v.ID_VAR`,
      { e: empr }, { maxRows: 100000 },
    ),
    gpi.planesHabilitados(idUsuario, empr, master),
  ]);
  return r.rows.filter((x) => !habilitados || habilitados.has(x.ID_PLAN)).map((x) => ({
    id: x.ID_VAR,
    plan: x.ID_PLAN,
    planNombre: x.PLAN,
    orden: x.VAR_ORDEM,
    nombre: x.VAR_NOM_VAR,
    analisis: x.VAR_NOM_ANALI,
    unidad: x.UNI_ABV,
    calculada: x.VAR_ORI_DADOS === 1,
    tipoMedia: x.VAR_TIPO_MEDIA,
    decimales: x.VAR_MAS_DEC,
    especMin: distinto0(x.VAR_ESPEC_MIN_VALOR) ? x.VAR_ESPEC_MIN_VALOR : null,
    especMax: distinto0(x.VAR_ESPEC_MAX_VALOR) ? x.VAR_ESPEC_MAX_VALOR : null,
    activa: x.VAR_STATUS !== 0,
  }));
}

// Listado de variables: todas las variables con su planilla, tipo, media y especificación.
async function variables({ empr, idUsuario, master, q, plan, tipo, soloActivas }) {
  let filas = await variablesHabilitadas({ empr, idUsuario, master });
  const f = String(q || "").trim().toLowerCase();
  if (f) filas = filas.filter((v) => `${v.id} ${v.nombre} ${v.analisis} ${v.planNombre}`.toLowerCase().includes(f));
  if (plan) filas = filas.filter((v) => v.plan === Number(plan));
  if (tipo === "digitada") filas = filas.filter((v) => !v.calculada);
  if (tipo === "calculada") filas = filas.filter((v) => v.calculada);
  if (soloActivas) filas = filas.filter((v) => v.activa);
  const planillas = [...new Map(filas.map((v) => [v.plan, v.planNombre])).entries()].map(([id, nombre]) => ({ id, nombre }));
  return { total: filas.length, truncado: filas.length > MAX_FILAS, planillas, filas: filas.slice(0, MAX_FILAS) };
}

// Falta de digitación: variables digitadas y activas de cada planilla que no tienen ningún valor ese día.
async function faltaDigitacion({ empr, safra, idUsuario, master, fecha }) {
  fechaReal(fecha, "Fecha");
  const [vars, tLanc, tMov] = await Promise.all([variablesHabilitadas({ empr, idUsuario, master }), gpi.tabla("LANC", empr, safra), gpi.tabla("LANC_MOV", empr, safra)]);
  if (!tLanc || !tMov) return { fecha, aviso: `No hay tablas del GPI para la zafra ${safra}`, planillas: [] };
  const digitadas = vars.filter((v) => !v.calculada && v.activa);
  // Variables con algún valor ese día (cualquier columna).
  const r = await query(
    `SELECT DISTINCT m.ID_VAR FROM ${tLanc} l JOIN ${tMov} m ON m.ID_LANC = l.ID_LANC
      WHERE l.LAN_DATA = TO_DATE(:d, 'YYYY-MM-DD') AND m.MOV_VALOR IS NOT NULL`,
    { d: fecha }, { maxRows: 200000 },
  );
  const conValor = new Set(r.rows.map((x) => x.ID_VAR));
  // Planilla «sin datos» = ninguna de sus variables (ni calculadas) tiene valor ese día: no se usó, no solo le faltan algunas.
  const planesConDatos = new Set(vars.filter((v) => conValor.has(v.id)).map((v) => v.plan));
  const porPlan = new Map();
  for (const v of digitadas) {
    if (!porPlan.has(v.plan)) porPlan.set(v.plan, { id: v.plan, nombre: v.planNombre, sinDatos: !planesConDatos.has(v.plan), digitadas: 0, faltantes: [] });
    const p = porPlan.get(v.plan);
    p.digitadas++;
    if (!conValor.has(v.id)) p.faltantes.push({ id: v.id, orden: v.orden, nombre: v.analisis || v.nombre, unidad: v.unidad });
  }
  const planillas = [...porPlan.values()].filter((p) => p.faltantes.length > 0);
  return {
    fecha,
    planillas,
    planillasConDatos: planesConDatos.size,
  };
}

// Fuera de especificación: resultado del día (col. 99) fuera del mínimo/máximo de la variable, en un rango de fechas.
async function fueraEspecificacion({ empr, safra, idUsuario, master, desde, hasta }) {
  fechaReal(desde, "Fecha inicial");
  fechaReal(hasta, "Fecha final");
  if (hasta < desde) throw error("La fecha final es anterior a la inicial");
  if (diasEntre(desde, hasta) > MAX_DIAS) throw error(`El rango máximo es de ${MAX_DIAS} días`);
  const [vars, tLanc, tMov] = await Promise.all([variablesHabilitadas({ empr, idUsuario, master }), gpi.tabla("LANC", empr, safra), gpi.tabla("LANC_MOV", empr, safra)]);
  if (!tLanc || !tMov) return { desde, hasta, aviso: `No hay tablas del GPI para la zafra ${safra}`, filas: [] };
  const conEspec = new Map(vars.filter((v) => v.activa && (v.especMin != null || v.especMax != null)).map((v) => [v.id, v]));
  const r = await query(
    `SELECT TO_CHAR(l.LAN_DATA, 'YYYY-MM-DD') D, m.ID_VAR, m.MOV_VALOR V
       FROM ${tLanc} l JOIN ${tMov} m ON m.ID_LANC = l.ID_LANC
      WHERE m.MOV_COLUNA = :c AND m.MOV_VALOR IS NOT NULL
        AND l.LAN_DATA BETWEEN TO_DATE(:a, 'YYYY-MM-DD') AND TO_DATE(:b, 'YYYY-MM-DD')`,
    { c: COLUNA_DIA, a: desde, b: hasta }, { maxRows: 500000 },
  );
  const filas = [];
  for (const x of r.rows) {
    const v = conEspec.get(x.ID_VAR);
    const n = v && num(x.V);
    if (!v || n == null) continue;
    const bajo = v.especMin != null && n < Number(v.especMin);
    const alto = v.especMax != null && n > Number(v.especMax);
    if (bajo || alto) {
      filas.push({
        fecha: x.D, plan: v.plan, planNombre: v.planNombre, id: v.id, nombre: v.analisis || v.nombre, unidad: v.unidad,
        valor: x.V, min: v.especMin, max: v.especMax, motivo: bajo ? "bajo" : "alto",
      });
    }
  }
  filas.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.planNombre.localeCompare(b.planNombre) || a.id - b.id));
  return { desde, hasta, total: filas.length, truncado: filas.length > MAX_FILAS, filas: filas.slice(0, MAX_FILAS) };
}

const OPERACION = { I: "Alta", U: "Cambio", D: "Baja" };

function rango(desde, hasta, maxDias) {
  fechaReal(desde, "Fecha inicial");
  fechaReal(hasta, "Fecha final");
  if (hasta < desde) throw error("La fecha final es anterior a la inicial");
  if (maxDias && diasEntre(desde, hasta) > maxDias) throw error(`El rango máximo es de ${maxDias} días`);
}

// Listado de anotaciones (GI_LAB_ANOTACOES): el texto libre de cada planilla por día.
async function anotaciones({ empr, safra, idUsuario, master, desde, hasta, plan }) {
  rango(desde, hasta, 400);
  const tPlan = await gpi.tabla("NO_PLAN", empr);
  if (!tPlan) return { desde, hasta, filas: [] };
  const [r, habilitados] = await Promise.all([
    query(
      `SELECT a.ID_PLAN, TO_CHAR(a.ANO_DATA, 'YYYY-MM-DD') D, a.ANO_TEXTO, TRIM(n.NO_DESC) PLAN
         FROM ${S}.GI_LAB_ANOTACOES a JOIN ${tPlan} n ON n.ID_PLAN = a.ID_PLAN
        WHERE a.COD_EMPR = :e AND a.SAF_ANO_SAFRA = :s AND a.ANO_DATA BETWEEN TO_DATE(:a, 'YYYY-MM-DD') AND TO_DATE(:b, 'YYYY-MM-DD')
        ORDER BY a.ANO_DATA, n.NO_DESC`,
      { e: empr, s: safra, a: desde, b: hasta }, { maxRows: 50000 },
    ),
    gpi.planesHabilitados(idUsuario, empr, master),
  ]);
  let filas = r.rows.filter((x) => !habilitados || habilitados.has(x.ID_PLAN));
  if (plan) filas = filas.filter((x) => x.ID_PLAN === Number(plan));
  const planillas = [...new Map(filas.map((x) => [x.ID_PLAN, x.PLAN])).entries()].map(([id, nombre]) => ({ id, nombre }));
  return {
    desde, hasta, total: filas.length, truncado: filas.length > MAX_FILAS, planillas,
    filas: filas.slice(0, MAX_FILAS).map((x) => ({ fecha: x.D, plan: x.ID_PLAN, planNombre: x.PLAN, texto: x.ANO_TEXTO })),
  };
}

// Histórico de valor (GI_LAB_RESP_LANC_{e}_{s}): bitácora de altas, cambios y bajas de una variable en las fechas de lanzamiento pedidas.
// Se exige una variable (la bitácora tiene cientos de miles de filas por zafra).
async function historicoValor({ empr, safra, idUsuario, master, id, desde, hasta }) {
  rango(desde, hasta, MAX_DIAS);
  const idVar = Number(id);
  if (!Number.isInteger(idVar) || idVar <= 0) throw error("Elija una variable");
  const vars = await variablesHabilitadas({ empr, idUsuario, master });
  const v = vars.find((x) => x.id === idVar);
  if (!v) throw error("Variable no habilitada para su usuario", 403);
  const [tLanc, tResp] = await Promise.all([gpi.tabla("LANC", empr, safra), gpi.tabla("RESP_LANC", empr, safra)]);
  if (!tLanc || !tResp) return { desde, hasta, variable: v, aviso: `No hay bitácora del GPI para la zafra ${safra}`, filas: [] };
  const r = await query(
    `SELECT TO_CHAR(l.LAN_DATA, 'YYYY-MM-DD') D, TO_CHAR(r.LAN_DATA_HORA, 'YYYY-MM-DD"T"HH24:MI:SS') H, r.LAN_USUARIO U, r.MOV_COLUNA C,
            r.LAN_VALOR_ANT V, r.LAN_FLAG F, r.LAN_COMENTA K
       FROM ${tResp} r JOIN ${tLanc} l ON l.ID_LANC = r.ID_LANC
      WHERE r.ID_VAR = :v AND l.LAN_DATA BETWEEN TO_DATE(:a, 'YYYY-MM-DD') AND TO_DATE(:b, 'YYYY-MM-DD')
      ORDER BY l.LAN_DATA, r.LAN_DATA_HORA, r.MOV_COLUNA`,
    { v: idVar, a: desde, b: hasta }, { maxRows: MAX_FILAS + 1 },
  );
  return {
    desde, hasta, variable: { id: v.id, nombre: v.analisis || v.nombre, planNombre: v.planNombre, unidad: v.unidad },
    truncado: r.rows.length > MAX_FILAS,
    filas: r.rows.slice(0, MAX_FILAS).map((x) => ({
      fecha: x.D, hora: x.H, usuario: x.U, columna: x.C, valor: x.V, operacion: OPERACION[x.F] ?? x.F, comentario: x.K,
    })),
  };
}

// Histórico de variables (GI_LAB_RASTREA): quién creó, cambió o borró la definición (fórmula, estado, media…) de una variable.
async function historicoVariables({ empr, idUsuario, master, desde, hasta, id }) {
  rango(desde, hasta, 366);
  const vars = await variablesHabilitadas({ empr, idUsuario, master });
  const porId = new Map(vars.map((x) => [x.id, x]));
  const r = await query(
    `SELECT RAS_USUARIO U, TO_CHAR(RAS_DATA, 'YYYY-MM-DD"T"HH24:MI:SS') H, RAS_ID_VAR V, RAS_FLAG F, RAS_FORMULA FO, RAS_ALT_FORMULA AF, RAS_VAR_STATUS ST
       FROM ${S}.GI_LAB_RASTREA
      WHERE RAS_DATA >= TO_DATE(:a, 'YYYY-MM-DD') AND RAS_DATA < TO_DATE(:b, 'YYYY-MM-DD') + 1 ${id ? "AND RAS_ID_VAR = :v" : ""}
      ORDER BY RAS_DATA DESC`,
    { a: desde, b: hasta, ...(id ? { v: Number(id) } : {}) }, { maxRows: 100000 },
  );
  // Solo variables que el usuario puede ver; las ya borradas no se pueden comprobar y no se muestran.
  const filas = r.rows.filter((x) => porId.has(x.V)).map((x) => {
    const v = porId.get(x.V);
    return {
      hora: x.H, usuario: x.U, id: x.V, nombre: v.analisis || v.nombre, planNombre: v.planNombre, operacion: OPERACION[x.F] ?? (x.F || "—"),
      formula: x.FO || "", formulaAlterada: x.AF || "", activa: x.ST === 1,
    };
  });
  return { desde, hasta, total: filas.length, truncado: filas.length > MAX_FILAS, filas: filas.slice(0, MAX_FILAS) };
}

// Histórico de especificación (GI_LAB_LANC_ESPEC): límites mínimo y máximo vigentes desde cada fecha, por variable.
async function historicoEspecificacion({ empr, idUsuario, master, desde, hasta, id }) {
  rango(desde, hasta, 0);
  const vars = await variablesHabilitadas({ empr, idUsuario, master });
  const porId = new Map(vars.map((x) => [x.id, x]));
  const r = await query(
    `SELECT TO_CHAR(ESP_DATA, 'YYYY-MM-DD') D, ID_VAR V, ESP_MIN_VALOR MN, ESP_MAX_VALOR MX, ESP_MIN_INCLUSIVE MNI, ESP_MAX_INCLUSIVE MXI
       FROM ${S}.GI_LAB_LANC_ESPEC
      WHERE COD_EMPR = :e AND ESP_DATA BETWEEN TO_DATE(:a, 'YYYY-MM-DD') AND TO_DATE(:b, 'YYYY-MM-DD') ${id ? "AND ID_VAR = :v" : ""}
      ORDER BY ESP_DATA DESC, ID_VAR`,
    { e: empr, a: desde, b: hasta, ...(id ? { v: Number(id) } : {}) }, { maxRows: 100000 },
  );
  const filas = r.rows.filter((x) => porId.has(x.V)).map((x) => {
    const v = porId.get(x.V);
    return { desde: x.D, id: x.V, nombre: v.analisis || v.nombre, planNombre: v.planNombre, unidad: v.unidad, min: x.MN, max: x.MX, minInclusive: x.MNI === "S" || x.MNI === 1 || x.MNI === "1", maxInclusive: x.MXI === "S" || x.MXI === 1 || x.MXI === "1" };
  });
  return { desde, hasta, total: filas.length, truncado: filas.length > MAX_FILAS, filas: filas.slice(0, MAX_FILAS) };
}

module.exports = { variables, faltaDigitacion, fueraEspecificacion, anotaciones, historicoValor, historicoVariables, historicoEspecificacion };
