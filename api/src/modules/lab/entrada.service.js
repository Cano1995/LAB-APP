// Laboratorio de recepción · Entrada de caña (balanza) en solo consulta (frmPesqEntradaCana).
// Pesadas de INV.BA_MOVIMIENTOS_BASCULA con los mismos filtros que usa el GPI en sus fórmulas Db_Select: movimiento de compra, entrada de caña,
// movimiento válido y con peso de entrada y de salida. Peso neto = bruto − tara + descuentos (kilos de descuento, trash, impureza y cogollo; vienen con signo).
// COD_ACUMULADO agrupa pesadas y análisis de sonda (no es uno a uno: hasta ~60 pesadas y ~80 análisis comparten un acumulado), por eso el análisis se muestra
// como el promedio simple de los análisis completados del acumulado, no como el resultado de ese camión.
const { query, queryOne } = require("../../db");
const { error, trim } = require("../../lib/util");

const MAX_FILAS = 500;
const { fechaReal: fechaValida } = require("../../lib/validar");
const redondear = (x, d = 2) => (x === null || x === undefined ? null : Math.round(Number(x) * 10 ** d) / 10 ** d);

// BUSCA_PARAMETRO es una función PL/SQL: dentro de un SELECT escalar Oracle la evalúa una sola vez; suelta, una por fila (2,8 s en la zafra completa).
const ENTRADA_VALIDA = `b.COD_TIP_MOVIMIENTO = (SELECT BUSCA_PARAMETRO('BA', 'TIPO_MOV_COMPRA') FROM DUAL)
   AND b.TIPO_ENTRADA = (SELECT BUSCA_PARAMETRO('BA', 'TIPO_ENTRADA_CAÑA') FROM DUAL)
   AND NVL(b.MOVIMIENTO, 'S') = 'S' AND b.PESO_ENTRADA > 0 AND b.PESO_SALIDA > 0`;
const NETO = `(b.PESO_BRUTO - b.PESO_TARA + NVL(b.KILOS_DESCUENTO, 0) + NVL(b.KILOS_DESCUENTO_TRASH, 0) + NVL(b.KILOS_DESC_IMPUREZA, 0) + NVL(b.KILOS_DESC_COGOLLO, 0)) / 1000`;

const codEmpr = (empr) => String(empr).padStart(2, "0");

async function ultimoDia({ empr, safra }) {
  const r = await queryOne(
    `SELECT TO_CHAR(TRUNC(MAX(b.FEC_HOR_SALIDA)), 'YYYY-MM-DD') D FROM INV.BA_MOVIMIENTOS_BASCULA b
      WHERE b.COD_EMPRESA = :e AND b.ZAFRA = :z AND ${ENTRADA_VALIDA}`,
    { e: codEmpr(empr), z: String(safra) },
  );
  return r?.D ?? null;
}

async function buscar({ empr, safra, desde, hasta, comprobante, canero }) {
  const ult = await ultimoDia({ empr, safra });
  if (!ult) return { desde: null, hasta: null, resumen: { camiones: 0, toneladas: 0 }, filas: [], truncado: false };
  hasta = hasta || ult;
  desde = desde || hasta;
  fechaValida(desde, "Fecha inicial"); fechaValida(hasta, "Fecha final");
  if (hasta < desde) throw error("La fecha final es anterior a la inicial");

  const where = [`b.COD_EMPRESA = :e`, `b.ZAFRA = :z`, `b.FEC_HOR_SALIDA >= TO_DATE(:d, 'YYYY-MM-DD')`, `b.FEC_HOR_SALIDA < TO_DATE(:h, 'YYYY-MM-DD') + 1`, ENTRADA_VALIDA];
  const binds = { e: codEmpr(empr), z: String(safra), d: desde, h: hasta };
  if (comprobante !== undefined && comprobante !== "") {
    const n = Number(comprobante);
    if (!Number.isInteger(n) || n < 0) throw error("Comprobante inválido");
    where.push("b.NRO_COMPROBANTE = :c"); binds.c = n;
  }
  if (canero !== undefined && String(canero).trim() !== "") {
    where.push("UPPER(p.NOMBRE) LIKE :n");
    binds.n = `%${String(canero).trim().toUpperCase().slice(0, 40)}%`;
  }
  const w = where.join(" AND ");
  const desdeJoin = `FROM INV.BA_MOVIMIENTOS_BASCULA b LEFT JOIN INV.PERSONAS p ON p.COD_PERSONA = b.COD_PERSONA`;

  const [res, filas] = await Promise.all([
    queryOne(`SELECT COUNT(*) CAMIONES, SUM(${NETO}) TN, COUNT(DISTINCT b.COD_PERSONA) CANEROS ${desdeJoin} WHERE ${w}`, binds),
    query(
      `SELECT * FROM (
         SELECT b.NRO_COMPROBANTE, TO_CHAR(b.FEC_HOR_SALIDA, 'YYYY-MM-DD"T"HH24:MI') SALIDA, p.NOMBRE CANERO, b.COD_PERSONA, b.NRO_FINCA, b.PARCELA,
                b.COD_VARIEDAD, b.COD_TIPO_CORTE, ${NETO} TN, b.TIEMPO_CORTE, b.COD_ACUMULADO,
                s.N_ANALISIS, s.BRIX, s.POL, s.ATR
           ${desdeJoin}
           LEFT JOIN (SELECT COD_ACUMULADO, COUNT(*) N_ANALISIS, AVG(PAN_BRIX) BRIX, AVG(PAN_POL_CANA) POL, AVG(PAN_ATR) ATR
                        FROM GATEC_AGR.GA_ANALI_SONDA WHERE COD_EMPR = :ee AND SAF_ANO_SAFRA = :zz AND PAN_BRIX IS NOT NULL AND NVL(COD_MOT_CAN, 0) = 0
                       GROUP BY COD_ACUMULADO) s ON s.COD_ACUMULADO = b.COD_ACUMULADO
          WHERE ${w} ORDER BY b.FEC_HOR_SALIDA DESC, b.NRO_COMPROBANTE DESC) WHERE ROWNUM <= ${MAX_FILAS + 1}`,
      { ...binds, ee: empr, zz: safra }, { maxRows: MAX_FILAS + 1 },
    ),
  ]);

  return {
    desde, hasta, ultimoDia: ult,
    resumen: { camiones: res.CAMIONES, toneladas: redondear(res.TN, 2) ?? 0, caneros: res.CANEROS },
    truncado: filas.rows.length > MAX_FILAS,
    filas: filas.rows.slice(0, MAX_FILAS).map((r) => ({
      comprobante: r.NRO_COMPROBANTE, salida: r.SALIDA, canero: trim(r.CANERO) || null, codCanero: trim(r.COD_PERSONA) || null,
      finca: trim(r.NRO_FINCA) || null, parcela: trim(r.PARCELA) || null, variedad: trim(r.COD_VARIEDAD) || null, tipoCorte: trim(r.COD_TIPO_CORTE) || null,
      toneladas: redondear(r.TN, 3), tiempoCorte: r.TIEMPO_CORTE, acumulado: r.COD_ACUMULADO,
      analisis: r.N_ANALISIS ? { cantidad: r.N_ANALISIS, brix: redondear(r.BRIX), pol: redondear(r.POL), atr: redondear(r.ATR) } : null,
    })),
  };
}

// Camiones y toneladas netas por día de los últimos `dias` días hasta el último con entradas (para el tablero de Inicio). Los días sin entradas no vienen.
async function serieDiaria({ empr, safra, dias = 14 }) {
  const ult = await ultimoDia({ empr, safra });
  if (!ult) return { ultimoDia: null, dias: [] };
  const r = await query(
    `SELECT TO_CHAR(TRUNC(b.FEC_HOR_SALIDA), 'YYYY-MM-DD') D, COUNT(*) CAMIONES, SUM(${NETO}) TN, COUNT(DISTINCT b.COD_PERSONA) CANEROS
       FROM INV.BA_MOVIMIENTOS_BASCULA b
      WHERE b.COD_EMPRESA = :e AND b.ZAFRA = :z
        AND b.FEC_HOR_SALIDA >= TO_DATE(:u, 'YYYY-MM-DD') - :n AND b.FEC_HOR_SALIDA < TO_DATE(:u, 'YYYY-MM-DD') + 1 AND ${ENTRADA_VALIDA}
      GROUP BY TRUNC(b.FEC_HOR_SALIDA) ORDER BY 1`,
    { e: codEmpr(empr), z: String(safra), u: ult, n: dias - 1 },
  );
  return { ultimoDia: ult, dias: r.rows.map((x) => ({ fecha: x.D, camiones: x.CAMIONES, toneladas: redondear(x.TN, 2) ?? 0, caneros: x.CANEROS })) };
}

module.exports = { buscar, serieDiaria };
