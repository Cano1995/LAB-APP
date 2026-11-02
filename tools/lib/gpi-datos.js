// Carga en memoria de una zafra del GPI y evaluación de fórmulas contra los valores guardados.
// Compartido por las herramientas de validación/análisis del motor (SOLO LECTURA).
const path = require("path");
process.chdir(path.join(__dirname, "..", "..", "api"));
require("../../api/node_modules/dotenv").config();
const db = require("../../api/src/db");
const { parsear } = require("../../api/src/modules/gpi/formula/parser");
const ev = require("../../api/src/modules/gpi/formula/evaluador");
const tablas = require("../../api/src/modules/gpi/formula/tablas");
const reglas = require("../../api/src/modules/gpi/formula/reglas");
const dbsel = require("../../api/src/modules/gpi/formula/dbselect");
const { tolerancia } = require("./tolerancia");
const material = require("../../api/src/modules/gpi/formula/material");

const S = "GATEC_GPI_NEW";
const COL_DIA = 99;
const MAX_DIAS_GETMEDIA = 400; // un promedio de GetMedia no puede abarcar más de una zafra
const { evaluar, aNumero, esNulo, sumarDias, horaDec } = ev;

// Políticas de la semántica no documentada (ver docs/analisis/gpi-motor-formulas.md).
//  flag1 / mediaSinFecha: qué valor devuelven GetAnalise(…,1) y GetMedia sin fecha.
//  nuloComoCero: en aritmética el nulo cuenta como 0.
function politicas(g) {
  return {
    A: { flag1: g.diaDe, mediaSinFecha: g.diaDe },
    U: { flag1: g.ultimo, mediaSinFecha: g.ultimo },
    UN: { flag1: g.ultimo, mediaSinFecha: g.ultimo, nuloComoCero: true },
    // UV: bandera 1 = valor de la misma columna y, si falta, el último disponible.
    UV: { flag1: g.ultimo, mediaSinFecha: g.ultimo, reglasApi: true }, // = api/src/modules/gpi/formula/reglas.js
    // UZ: si NINGUNA referencia (GetAnalise ni GetMedia) tiene valor, el resultado es nulo.
    UZ: { flag1: g.ultimo, mediaSinFecha: g.ultimo, todoNuloEsNulo: true },
  };
}

async function cargar({ hasta, empr = "1", safra = "2026" }) {
  await db.initPool();
  const q = async (sql, b = {}) => (await db.query(sql, b, { maxRows: 5e6 })).rows;
  const E = Number(empr);

  const vars = await q(`SELECT ID_VAR, ID_PLAN, VAR_NOM_VAR, VAR_ORI_DADOS, VAR_TIPO_MEDIA, VAR_ORI_POND, VAR_POND_ZERO, VAR_MAS_DEC, VAR_TIPO_DIG, VAR_FORMULA FROM ${S}.GI_LAB_VAR`);
  const porId = new Map(vars.map((v) => [v.ID_VAR, v]));
  const tabgen = await q(`SELECT GEN_CODIGO, GEN_CAMPO1, GEN_CAMPO2, TO_CHAR(GEN_DATA_VIGENCIA,'YYYY-MM-DD') VIG FROM ${S}.GI_LAB_TAB_GENERICA`);
  const meAlc = await q(`SELECT MEA_INPM, MEA_ME20 FROM ${S}.GI_LAB_TAB_ME_ALCOOL`);
  const densBrix = await q(`SELECT TDB_BRIX, TDB_DENSIDADE FROM ${S}.GI_LAB_TAB_DENS_BRIX`);
  const tqEst = await q(`SELECT * FROM ${S}.GI_LAB_TANQUE_EST WHERE COD_EMPR = :e`, { e: E });
  const tqMed = await q(`SELECT * FROM ${S}.GI_LAB_TANQUE_MED WHERE COD_EMPR = :e`, { e: E });
  const nConvGrau = (await q(`SELECT COUNT(*) N FROM ${S}.GI_LAB_TAB_CONV_GRAU`))[0].N;
  const par = (await q(`SELECT TO_CHAR(PAR_DT_INICIO,'YYYY-MM-DD') I, TO_CHAR(PAR_DT_FIM_SAFRA,'YYYY-MM-DD') F FROM ${S}.GI_LAB_PARAM_USINA WHERE COD_EMPR=:e AND SAF_ANO_SAFRA=:s`, { e: E, s: Number(safra) }))[0];
  const confs = await q(`SELECT c.ID_PLAN, NVL(g.PLC_DIVISAO, c.PLC_DIVISAO) DIVISAO, NVL(g.PLC_NVEZES, c.PLC_NVEZES) NVEZES
      FROM ${S}.GI_LAB_PLAN_CONF_${E} c LEFT JOIN ${S}.GI_LAB_PLAN_CONF_GERAL g ON g.ID_PLAN = c.ID_PLAN AND g.COD_EMPR = ${E}`);
  const conf = new Map(confs.map((c) => [c.ID_PLAN, { divisao: c.DIVISAO, nvezes: c.NVEZES }]));
  // Variables activas: VAR_STATUS = 1 para la empresa y planilla activa. El VB6 no calcula las inactivas.
  const statusVar = new Map((await q(`SELECT ID_VAR, VAR_STATUS FROM ${S}.GI_LAB_VAR_STATUS WHERE COD_EMPR = :e`, { e: E })).map((r) => [r.ID_VAR, r.VAR_STATUS]));
  const statusPlan = new Map((await q(`SELECT ID_PLAN, NO_STATUS FROM ${S}.GI_LAB_NO_PLAN_${E}`)).map((r) => [r.ID_PLAN, r.NO_STATUS]));

  // fecha → idVar → col → texto (toda la zafra hasta el día siguiente a 'hasta').
  const datos = new Map();
  const mov = await q(
    `SELECT TO_CHAR(l.LAN_DATA,'YYYY-MM-DD') D, m.ID_VAR, m.MOV_COLUNA, m.MOV_VALOR
       FROM ${S}.GI_LAB_LANC_${E}_${Number(safra)} l JOIN ${S}.GI_LAB_LANC_MOV_${E}_${Number(safra)} m ON m.ID_LANC = l.ID_LANC
      WHERE l.LAN_DATA <= TO_DATE(:b,'YYYY-MM-DD') + 1`, { b: hasta });
  for (const r of mov) {
    if (!datos.has(r.D)) datos.set(r.D, new Map());
    const dv = datos.get(r.D);
    if (!dv.has(r.ID_VAR)) dv.set(r.ID_VAR, new Map());
    dv.get(r.ID_VAR).set(r.MOV_COLUNA, r.MOV_VALOR);
  }

  // Columnas existentes de cada planilla por día.
  const colsPlan = new Map();
  for (const [fecha, dv] of datos) for (const [id, cols] of dv) {
    const p = porId.get(id)?.ID_PLAN; if (p == null) continue;
    const k = `${fecha}:${p}`; if (!colsPlan.has(k)) colsPlan.set(k, new Set());
    for (const c of cols.keys()) if (c !== COL_DIA) colsPlan.get(k).add(c);
  }

  const asts = new Map();
  for (const v of vars) if (v.VAR_ORI_DADOS === 1 && v.VAR_FORMULA) {
    try { asts.set(v.ID_VAR, parsear(v.VAR_FORMULA)); } catch (e) { asts.set(v.ID_VAR, { error: e.message }); }
  }

  // Historial de fórmulas (GI_LAB_RASTREA). RAS_FORMULA guarda la fórmula ANTERIOR al cambio
  // (en 2.581 de 2.610 variables el último registro difiere de la fórmula actual). La fórmula vigente
  // para el día D es la del primer registro posterior al cierre (fin de D+1); sin registros posteriores, la actual.
  const historial = new Map(); // idVar → [{ d: 'AAAA-MM-DD HH24:MI:SS', formula }]
  for (const r of await q(`SELECT RAS_ID_VAR, TO_CHAR(RAS_DATA,'YYYY-MM-DD HH24:MI:SS') D, RAS_FLAG, RAS_FORMULA
                            FROM ${S}.GI_LAB_RASTREA WHERE RAS_FORMULA IS NOT NULL AND NVL(RAS_FLAG,'U') <> 'I' ORDER BY RAS_ID_VAR, RAS_DATA`)) {
    if (!historial.has(r.RAS_ID_VAR)) historial.set(r.RAS_ID_VAR, []);
    historial.get(r.RAS_ID_VAR).push({ d: r.D, formula: r.RAS_FORMULA });
  }
  // Fecha de creación de cada variable (registro 'I' del historial). Si una variable se creó después
  // de un día, sus valores de ese día se llenaron con un recálculo retroactivo posterior: no sirven
  // para validar (se calcularon con la fórmula del momento del recálculo, desconocido).
  const creada = new Map((await q(`SELECT RAS_ID_VAR, TO_CHAR(MIN(RAS_DATA),'YYYY-MM-DD') D FROM ${S}.GI_LAB_RASTREA WHERE RAS_FLAG = 'I' GROUP BY RAS_ID_VAR`)).map((r) => [r.RAS_ID_VAR, r.D]));
  const astPorTexto = new Map();
  const astDe = (texto) => {
    if (!astPorTexto.has(texto)) { try { astPorTexto.set(texto, parsear(texto)); } catch (e) { astPorTexto.set(texto, { error: e.message }); } }
    return astPorTexto.get(texto);
  };
  const USAR_HISTORIAL = process.env.HISTORIAL !== "0";
  const astVigente = (id, fecha) => {
    if (USAR_HISTORIAL) {
      const h = historial.get(id);
      // Corte al final del día siguiente: el VB6 recalcula el día al cerrarlo (D+1), con la fórmula de ese momento.
      const corte = `${sumarDias(fecha, 1)} 23:59:59`;
      const sig = h && h.find((x) => x.d > corte);
      if (sig) return astDe(sig.formula);
    }
    return asts.get(id);
  };

  // Material en proceso: configuración, densidades y digitación del día (GI_LAB_DIG_MATER_PROCESSO).
  const matCfg = await q(`SELECT MPR_PRODUTO P, MPR_COD_EQP E, MPR_CAPACIDADE CAP, ID_VAR_BRIX B, ID_VAR_POL PL, ID_VAR_GL GL FROM ${S}.GI_LAB_CAD_MATER_PROCESSO WHERE COD_EMPR=${E}`);
  const matDig = new Map();
  for (const r of await q(`SELECT MPR_PRODUTO P, MPR_COD_EQP E, TO_CHAR(MPR_DATA,'YYYY-MM-DD') D, MPR_VALOR V FROM ${S}.GI_LAB_DIG_MATER_PROCESSO WHERE COD_EMPR=${E} AND MPR_DATA >= TO_DATE('${par?.I || safra + "-01-01"}','YYYY-MM-DD') AND MPR_DATA <= TO_DATE('${hasta}','YYYY-MM-DD')`)) matDig.set(`${r.P}|${r.E}|${r.D}`, r.V);
  const matDatos = { cfg: matCfg, dens: densBrix, llenado: (p, e, f) => matDig.get(`${p}|${e}|${f}`) ?? 0, ultimo: (id, f) => (id ? ultimo(f, id) : null) };
  const val = (fecha, id, col) => { const m = datos.get(fecha)?.get(id); return m ? m.get(col) ?? null : null; };
  const primera = (fecha, id) => {
    const m = datos.get(fecha)?.get(id); if (!m) return null;
    const cols = [...m.keys()].filter((c) => c !== COL_DIA && !esNulo(m.get(c))).sort((a, b) => a - b);
    return cols.length ? m.get(cols[0]) : null;
  };
  const diaDe = (fecha, id) => val(fecha, id, COL_DIA) ?? primera(fecha, id);
  const fechas = [...datos.keys()].sort();
  const ultimo = (fecha, id) => {
    for (let i = fechas.length - 1; i >= 0; i--) {
      if (fechas[i] > fecha) continue;
      const x = diaDe(fechas[i], id);
      if (!esNulo(x)) return x;
    }
    return null;
  };

  const g = { db, q, S, COL_DIA, empr: E, safra: Number(safra), vars, porId, datos, colsPlan, asts, conf, par, val, primera, diaDe, ultimo };
  g.POLITICAS = politicas(g);
  g.activa = (id) => reglas.seCalcula(statusVar.get(id), statusPlan.get(porId.get(id)?.ID_PLAN));

  // Evalúa la fórmula de la variable id en (fecha, col) con una política. traza(idRef, valor, flag)
  // permite registrar qué devolvió cada referencia.
  g.historial = historial;
  // Db_Select: resuelve de antemano las consultas de las fórmulas para un día (el evaluador es síncrono).
  const dbCache = new Map();
  // También las versiones históricas de las fórmulas (M17): el valor de un día viejo puede venir de una fórmula que ya no es la vigente.
  const conHistoricas = () => {
    const todas = [...asts.values()];
    if (USAR_HISTORIAL) for (const h of historial.values()) for (const x of h) if (/db_select/i.test(x.formula || "")) todas.push(astDe(x.formula));
    return todas;
  };
  g.precargarDbSelect = async (fecha) => {
    for (const ast of conHistoricas()) {
      if (ast.error) continue;
      const c = await dbsel.precargar(ast, { empr: E, safra, fecha }, async (sql, binds) => {
        const r = await db.queryLectura(sql, binds); const f = r.rows[0]; return f ? Object.values(f)[0] : null;
      });
      for (const [sql, v] of c) dbCache.set(`${fecha}|${sql}`, v);
    }
  };
  g.retroactiva = (id, fecha) => { const c = creada.get(id); return !!c && c > sumarDias(fecha, 1); };
  g.evaluarCelda = (id, fecha, col, pol, traza) => {
    const ast = astVigente(id, fecha);
    if (!ast) throw new Error("sin fórmula");
    if (ast.error) throw new Error("parse: " + ast.error);
    const enDia = col === COL_DIA;
    let refs = 0, refsConValor = 0;
    const anotar = (x) => { refs++; if (!esNulo(x)) refsConValor++; };
    const ctx = {
      fecha,
      inicioSafra: par?.I,
      finSafra: par?.F,
      nuloComoCero: !!pol.nuloComoCero,
      analise: (idRef, flag) => {
        if (pol.analiseCustom) { const y = pol.analiseCustom(idRef, flag); anotar(y); return y; }
        const x = pol.reglasApi
          ? reglas.resolverAnalise({ columna: (i, c) => val(fecha, i, c), dia: (i) => diaDe(fecha, i), ultimo: (i) => ultimo(fecha, i) }, idRef, col, flag)
          : flag === 1 ? pol.flag1(fecha, idRef) : enDia ? diaDe(fecha, idRef) : val(fecha, idRef, col);
        if (traza) traza(idRef, x, flag);
        anotar(x);
        return x;
      },
      media: (idRef, f1, f2, sinFecha) => {
        if (pol.analiseCustom) { const y = pol.analiseCustom(idRef, "media"); anotar(y); return y; }
        let x;
        if (sinFecha) x = pol.mediaSinFecha(fecha, idRef);
        else if (!f2 || f2 === f1) x = diaDe(f1, idRef);
        else {
          // Rango de fechas validado y acotado (M13): una fórmula con fechas absurdas no puede girar indefinidamente.
          const f1v = String(f1), f2v = String(f2);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(f1v) || !/^\d{4}-\d{2}-\d{2}$/.test(f2v)) throw new Error(`GetMedia: fechas inválidas '${f1v}' / '${f2v}'`);
          if ((Date.parse(f2v) - Date.parse(f1v)) / 86400000 > MAX_DIAS_GETMEDIA) throw new Error(`GetMedia: rango mayor a ${MAX_DIAS_GETMEDIA} días`);
          const xs = []; for (let d = f1v; d <= f2v; d = sumarDias(d, 1)) { const y = aNumero(val(d, idRef, COL_DIA)); if (y !== null) xs.push(y); }
          x = xs.length ? xs.reduce((s, y) => s + y, 0) / xs.length : null;
        }
        if (traza) traza(idRef, x, "media");
        anotar(x);
        return x;
      },
      tabGen: (cod, campo, valor) => tablas.tabGen(tabgen, cod, campo, valor, fecha, { aNumero }),
      meAlcool: (tipo, v) => tablas.meAlcool(meAlc, tipo, v),
      densBrix: (tipo, v) => tablas.densBrix(densBrix, tipo, v),
      tanque: (tipo, idT) => tablas.tanque(tqEst, tqMed, tipo, idT),
      convGrau: (t) => (t === null ? null : nConvGrau === 0 ? 1 : null),
      material: (nombre) => material.calcular(nombre, fecha, matDatos),
      // M17: antes una consulta que no se había precargado (p. ej. de una versión histórica de la fórmula) daba nulo en silencio.
      dbSelect: (sql) => { const k = `${fecha}|${sql}`; if (!dbCache.has(k)) throw new Error("Db_Select no precargado para este día"); const r = dbCache.get(k); if (r instanceof Error) throw r; return r ?? null; },
      diasDeSafra: () => (par?.I ? (Date.parse(fecha) - Date.parse(par.I)) / 86400000 : null),
    };
    const res = evaluar(ast, ctx);
    if (pol.todoNuloEsNulo && refs > 0 && refsConValor === 0) return null;
    return res;
  };

  g.coincide = (v, guardado, calculado) => {
    if (esNulo(guardado)) return esNulo(calculado);
    const gN = aNumero(guardado);
    if (gN === null) return String(calculado ?? "").trim() === String(guardado).trim();
    const c = aNumero(calculado);
    if (c === null) return false;
    const dec = v.VAR_MAS_DEC ?? (String(guardado).split(".")[1] || "").length;
    return Math.abs(c - gN) <= tolerancia(dec, gN);
  };
  g.redondear = process.env.REDONDEO === "round" ? tablas.vbRound : tablas.vbFormatRound;
  g.cerrar = () => db.closePool();
  return g;
}

module.exports = { cargar, COL_DIA, aNumero, esNulo, sumarDias, horaDec, tablas, reglas };
