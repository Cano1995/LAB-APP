// Laboratorio de recepción · Análisis de caña (sonda, Pós-Colheita) en solo consulta.
// GA_ANALI_SONDA (esquema GATEC_AGR): un análisis por comprobante de balanza y acoplado (PK empresa, zafra, NRO_COMPROBANTE, NRO_ACOPLADO).
//   El análisis nace vacío cuando llega la caña y el laboratorio lo completa (PAN_BRIX, PAN_POL_CANA, PAN_FIBRA_CANA, PAN_PUREZA, PAN_AR_CANA, PAN_ATR…).
//   Estados: completa (PAN_BRIX con valor), cancelada (COD_MOT_CAN <> 0, motivo en GA_MOTIV_CANCEL_ANA), acoplado (acoplado 2 o más sin resultado: el análisis es
//   uno por camión y casi nunca se carga en los acoplados) y sin resultado (acoplado 1 sin Brix: sin analizar o aún pendiente; desde 2024 solo ~60% de los camiones tiene resultado).
// GA_ANALI_SONDA_PRIMARIA: lecturas de la sonda primaria (Brix, LS, PBU, pH) del mismo ID_LANC_CONTA.
const { query, queryOne } = require("../../db");
const { error, trim } = require("../../lib/util");

const S = "GATEC_AGR";
const MAX_FILAS = 500;
const ESTADOS = ["todos", "completas", "sinresultado", "acoplados", "canceladas"];

const { fechaReal: fechaValida } = require("../../lib/validar");
const redondear = (x, d = 3) => (x === null || x === undefined ? null : Math.round(Number(x) * 10 ** d) / 10 ** d);

const COMPLETA = "a.PAN_BRIX IS NOT NULL";
const CANCELADA = "NVL(a.COD_MOT_CAN, 0) <> 0";
const FILTRO_ESTADO = {
  todos: "1 = 1",
  completas: `${COMPLETA} AND NOT (${CANCELADA})`,
  sinresultado: `a.PAN_BRIX IS NULL AND NOT (${CANCELADA}) AND a.NRO_ACOPLADO = 1`,
  acoplados: `a.PAN_BRIX IS NULL AND NOT (${CANCELADA}) AND a.NRO_ACOPLADO > 1`,
  canceladas: CANCELADA,
};

// Último día con análisis completados de la zafra (cae en el último con datos si no hay ninguno): fecha por defecto, porque la planta no muele todos los días
// y el último día suele tener solo análisis pendientes.
async function ultimoDia({ empr, safra }) {
  const r = await queryOne(
    `SELECT TO_CHAR(TRUNC(MAX(CASE WHEN PAN_BRIX IS NOT NULL THEN PAN_DT END)), 'YYYY-MM-DD') D, TO_CHAR(TRUNC(MAX(PAN_DT)), 'YYYY-MM-DD') U
       FROM ${S}.GA_ANALI_SONDA WHERE COD_EMPR = :e AND SAF_ANO_SAFRA = :s`,
    { e: empr, s: safra },
  );
  return r?.D ?? r?.U ?? null;
}

async function buscar({ empr, safra, desde, hasta, comprobante, estado = "todos" }) {
  if (!ESTADOS.includes(estado)) throw error("Estado inválido");
  const ult = await ultimoDia({ empr, safra });
  if (!ult) return { desde: null, hasta: null, resumen: { total: 0 }, filas: [], truncado: false };
  hasta = hasta || ult;
  desde = desde || hasta;
  fechaValida(desde, "Fecha inicial"); fechaValida(hasta, "Fecha final");
  if (hasta < desde) throw error("La fecha final es anterior a la inicial");

  const where = [`a.COD_EMPR = :e`, `a.SAF_ANO_SAFRA = :s`, `a.PAN_DT >= TO_DATE(:d, 'YYYY-MM-DD')`, `a.PAN_DT < TO_DATE(:h, 'YYYY-MM-DD') + 1`, FILTRO_ESTADO[estado]];
  const binds = { e: empr, s: safra, d: desde, h: hasta };
  if (comprobante !== undefined && comprobante !== "") {
    const n = Number(comprobante);
    if (!Number.isInteger(n) || n < 0) throw error("Comprobante inválido");
    where.push("a.NRO_COMPROBANTE = :c");
    binds.c = n;
  }
  const w = where.join(" AND ");

  const [res, filas] = await Promise.all([
    queryOne(
      `SELECT COUNT(*) TOTAL,
              SUM(CASE WHEN ${COMPLETA} AND NOT (${CANCELADA}) THEN 1 ELSE 0 END) COMPLETAS,
              SUM(CASE WHEN a.PAN_BRIX IS NULL AND NOT (${CANCELADA}) AND a.NRO_ACOPLADO = 1 THEN 1 ELSE 0 END) SINRESULTADO,
              SUM(CASE WHEN a.PAN_BRIX IS NULL AND NOT (${CANCELADA}) AND a.NRO_ACOPLADO > 1 THEN 1 ELSE 0 END) ACOPLADOS,
              SUM(CASE WHEN ${CANCELADA} THEN 1 ELSE 0 END) CANCELADAS,
              AVG(CASE WHEN ${COMPLETA} THEN a.PAN_BRIX END) BRIX, AVG(CASE WHEN ${COMPLETA} THEN a.PAN_POL_CANA END) POL,
              AVG(CASE WHEN ${COMPLETA} THEN a.PAN_FIBRA_CANA END) FIBRA, AVG(CASE WHEN ${COMPLETA} THEN a.PAN_PUREZA END) PUREZA,
              AVG(CASE WHEN ${COMPLETA} THEN a.PAN_ATR END) ATR
         FROM ${S}.GA_ANALI_SONDA a WHERE ${w}`, binds),
    query(
      `SELECT * FROM (
         SELECT a.ID_LANC_CONTA, TO_CHAR(a.PAN_DT, 'YYYY-MM-DD"T"HH24:MI') FECHA, a.NRO_COMPROBANTE, a.NRO_ACOPLADO,
                a.PAN_BRIX, a.PAN_POL_CANA, a.PAN_FIBRA_CANA, a.PAN_PUREZA, a.PAN_AR_CANA, a.PAN_ATR, a.PAN_PESO_AMOSTRA,
                a.PAN_OPER_DIGIT, a.COD_MOT_CAN, m.DSC_MOT_CAN
           FROM ${S}.GA_ANALI_SONDA a LEFT JOIN ${S}.GA_MOTIV_CANCEL_ANA m ON m.COD_MOT_CAN = a.COD_MOT_CAN
          WHERE ${w} ORDER BY a.PAN_DT DESC, a.ID_LANC_CONTA DESC) WHERE ROWNUM <= ${MAX_FILAS + 1}`, binds, { maxRows: MAX_FILAS + 1 }),
  ]);

  const truncado = filas.rows.length > MAX_FILAS;
  return {
    desde, hasta, ultimoDia: ult, estado,
    resumen: {
      total: res.TOTAL, completas: res.COMPLETAS ?? 0, sinResultado: res.SINRESULTADO ?? 0, acoplados: res.ACOPLADOS ?? 0, canceladas: res.CANCELADAS ?? 0,
      brix: redondear(res.BRIX, 2), pol: redondear(res.POL, 2), fibra: redondear(res.FIBRA, 2), pureza: redondear(res.PUREZA, 2), atr: redondear(res.ATR, 2),
    },
    truncado,
    filas: filas.rows.slice(0, MAX_FILAS).map((r) => ({
      id: r.ID_LANC_CONTA, fecha: r.FECHA, comprobante: r.NRO_COMPROBANTE, acoplado: r.NRO_ACOPLADO,
      brix: redondear(r.PAN_BRIX, 2), pol: redondear(r.PAN_POL_CANA, 2), fibra: redondear(r.PAN_FIBRA_CANA, 2), pureza: redondear(r.PAN_PUREZA, 2),
      ar: redondear(r.PAN_AR_CANA, 3), atr: redondear(r.PAN_ATR, 2), pesoMuestra: r.PAN_PESO_AMOSTRA,
      operador: trim(r.PAN_OPER_DIGIT) || null, motivoCancelacion: r.COD_MOT_CAN ? { codigo: r.COD_MOT_CAN, descripcion: trim(r.DSC_MOT_CAN) || null } : null,
    })),
  };
}

// Todos los campos del análisis y sus lecturas de sonda primaria.
async function detalle({ empr, safra, id }) {
  id = Number(id);
  if (!Number.isInteger(id)) throw error("Análisis inválido");
  const a = await queryOne(
    `SELECT a.*, TO_CHAR(a.PAN_DT, 'YYYY-MM-DD"T"HH24:MI:SS') FECHA, TO_CHAR(a.PAN_DT_DIGIT, 'YYYY-MM-DD') FECHA_DIG, m.DSC_MOT_CAN
       FROM ${S}.GA_ANALI_SONDA a LEFT JOIN ${S}.GA_MOTIV_CANCEL_ANA m ON m.COD_MOT_CAN = a.COD_MOT_CAN
      WHERE a.ID_LANC_CONTA = :i AND a.COD_EMPR = :e AND a.SAF_ANO_SAFRA = :s`,
    { i: id, e: empr, s: safra },
  );
  if (!a) throw error("Análisis inexistente en la empresa y zafra seleccionadas", 404);
  const p = await query(
    `SELECT TO_CHAR(PAN_DT_DIGIT, 'YYYY-MM-DD') FECHA, PAN_BRIX, PAN_LS, PAN_PBU, PAN_PBU_AMOSTRA, PAN_PH, PAN_OPER_DIGIT, PAN_STATUS, PAN_NAO_CONFIRMADA, COD_MOT_CAN
       FROM ${S}.GA_ANALI_SONDA_PRIMARIA WHERE ID_LANC_CONTA = :i`, { i: id }, { maxRows: 50 },
  );
  // Solo las columnas con valor: el registro tiene ~50 campos y la mayoría está vacía.
  const campos = {};
  for (const [k, v] of Object.entries(a)) {
    if (["FECHA", "FECHA_DIG", "DSC_MOT_CAN", "PAN_DT", "PAN_DT_DIGIT", "PAN_HR_DIGIT"].includes(k)) continue;
    if (v instanceof Date) continue; // las columnas DATE se piden con TO_CHAR arriba: un Date crudo se desfasaría de hora al serializarse
    if (v !== null && v !== undefined && v !== "") campos[k] = typeof v === "string" ? v.trim() : v;
  }
  return {
    id, fecha: a.FECHA, fechaDigitacion: a.FECHA_DIG, comprobante: a.NRO_COMPROBANTE, acoplado: a.NRO_ACOPLADO,
    motivoCancelacion: a.COD_MOT_CAN ? { codigo: a.COD_MOT_CAN, descripcion: trim(a.DSC_MOT_CAN) || null } : null,
    campos,
    sondaPrimaria: p.rows.map((x) => ({
      fecha: x.FECHA, brix: x.PAN_BRIX, ls: x.PAN_LS, pbu: x.PAN_PBU, pbuMuestra: x.PAN_PBU_AMOSTRA, ph: x.PAN_PH,
      operador: trim(x.PAN_OPER_DIGIT) || null, estado: x.PAN_STATUS, noConfirmada: x.PAN_NAO_CONFIRMADA === 1,
    })),
  };
}

module.exports = { buscar, detalle };
