// GPI · Panel de información, CEP y correlación (solo lectura).
//  - Panel (frmPainel): configuración personal del usuario en GI_LAB_PAINEL_* (variables, CEP, reportes, preferencias).
//    PNV_TIPO: V = valores de variables, F = fuera de especificación, D = diagnóstico.
//  - CEP (FrmCEP): carta de control X̄–R (o individuales) de los últimos N resultados diarios de una variable.
//  - Correlación (frmCorrelacionaVar): Pearson entre variables sobre sus resultados diarios.
// No se escribe en GI_LAB_PAINEL_*: son tablas GATEC_* compartidas con el VB6.
const { query, queryOne } = require("../../db");
const { error } = require("../../lib/util");
const consultas = require("./consultas.service");
const est = require("./estadistica");

const S = "GATEC_GPI_NEW";
const MAX_MUESTRAS = 400;
const MAX_CORR_VARS = 12;

const num = (v) => { const n = Number(String(v ?? "").replace(",", ".")); return v === null || v === undefined || v === "" || !Number.isFinite(n) ? null : n; };
const { fechaReal: fechaValida, hoyLocal } = require("../../lib/validar");
function sumarDias(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Panel personal: lo configurado en el VB6 por este usuario, con solo las variables que puede ver.
async function panel({ empr, idUsuario, master, fecha }) {
  if (fecha !== undefined) fechaValida(fecha, "Fecha");
  const [conf, vars, cep, rel] = await Promise.all([
    queryOne(`SELECT PNF_ABRE_INICIO, PNF_TP_ATUALIZA, PNF_DT_PADRAO FROM ${S}.GI_LAB_PAINEL_CONF WHERE ID_USUARIO = :u AND COD_EMPR = :e`, { u: idUsuario, e: empr }),
    query(`SELECT ID_VAR, PNV_TIPO FROM ${S}.GI_LAB_PAINEL_VAR WHERE ID_USUARIO = :u ORDER BY PNV_TIPO, ID_VAR`, { u: idUsuario }, { maxRows: 500 }),
    query(`SELECT ID_VAR, PNC_LSE, PNC_LIE, PNC_NUM_AMOSTRA FROM ${S}.GI_LAB_PAINEL_CEP WHERE ID_USUARIO = :u ORDER BY ID_VAR`, { u: idUsuario }, { maxRows: 200 }),
    query(`SELECT r.COD_REL, r.PNR_TIPO, s.SUP_DESC FROM ${S}.GI_LAB_PAINEL_REL r
             LEFT JOIN ${S}.GI_LAB_SUPERVISORIO s ON s.COD_EMPR = r.COD_EMPR AND r.PNR_TIPO = 'SU' AND TO_CHAR(s.SUP_CODIGO) = TO_CHAR(r.COD_REL)
            WHERE r.ID_USUARIO = :u AND r.COD_EMPR = :e ORDER BY r.PNR_TIPO, r.COD_REL`, { u: idUsuario, e: empr }, { maxRows: 200 }),
  ]);
  const ids = [...new Set([...vars.rows.map((v) => v.ID_VAR), ...cep.rows.map((c) => c.ID_VAR)])];
  const metas = new Map((await consultas.metaVariables({ empr, idUsuario, master, ids })).map((m) => [m.id, m]));
  const porTipo = (t) => vars.rows.filter((v) => v.PNV_TIPO === t && metas.has(v.ID_VAR)).map((v) => metas.get(v.ID_VAR));
  // Especificación vigente (GI_LAB_LANC_ESPEC: la fila más reciente hasta la fecha) de las variables de seguimiento.
  const idsF = porTipo("F").map((v) => v.id);
  const espec = new Map();
  if (idsF.length) {
    const b = Object.fromEntries(idsF.map((id, i) => [`i${i}`, id]));
    const e = await query(
      `SELECT x.ID_VAR, x.ESP_MIN_VALOR, x.ESP_MAX_VALOR, x.ESP_MIN_INCLUSIVE, x.ESP_MAX_INCLUSIVE
         FROM ${S}.GI_LAB_LANC_ESPEC x
         JOIN (SELECT ID_VAR, MAX(ESP_DATA) D FROM ${S}.GI_LAB_LANC_ESPEC
                WHERE COD_EMPR = :e AND ID_VAR IN (${idsF.map((_, i) => `:i${i}`).join(", ")})
                  AND ESP_DATA <= TO_DATE(:f, 'YYYY-MM-DD') GROUP BY ID_VAR) m ON m.ID_VAR = x.ID_VAR AND m.D = x.ESP_DATA
        WHERE x.COD_EMPR = :e`,
      { ...b, e: empr, f: fecha ?? hoyLocal() }, { maxRows: 500 },
    );
    for (const r of e.rows) espec.set(r.ID_VAR, { min: num(r.ESP_MIN_VALOR), max: num(r.ESP_MAX_VALOR), minIncl: r.ESP_MIN_INCLUSIVE === 1, maxIncl: r.ESP_MAX_INCLUSIVE === 1 });
  }
  return {
    configurado: !!(conf || vars.rows.length || cep.rows.length || rel.rows.length),
    preferencias: conf ? { abreAlInicio: conf.PNF_ABRE_INICIO === "S", segundosActualiza: conf.PNF_TP_ATUALIZA, fechaPadron: conf.PNF_DT_PADRAO } : null,
    variables: porTipo("V"),
    fueraEspecificacion: porTipo("F").map((v) => ({ ...v, especificacion: espec.get(v.id) ?? null })),
    diagnostico: porTipo("D"),
    cep: cep.rows.filter((c) => metas.has(c.ID_VAR)).map((c) => ({ variable: metas.get(c.ID_VAR), lse: c.PNC_LSE, lie: c.PNC_LIE, muestras: c.PNC_NUM_AMOSTRA })),
    reportes: rel.rows.map((r) => ({ tipo: r.PNR_TIPO, codigo: r.COD_REL, titulo: r.SUP_DESC ?? null })),
  };
}

// Resultados diarios (col. 99) de una variable hasta `hasta`, los últimos `n` con valor.
async function ultimosValores({ empr, safra, idUsuario, master, id, hasta, n }) {
  const desde = sumarDias(hasta, -399);
  const r = await consultas.valores({ empr, safra, idUsuario, master, ids: [id], desde, hasta, acumulado: false });
  if (!r.variables.length) throw error("Variable no habilitada para su usuario", 403);
  const serie = r.filas.map((f) => ({ fecha: f.fecha, y: num(f.valores[id]) })).filter((p) => p.y !== null).slice(-n);
  return { variable: r.variables[0], serie };
}

async function cep({ empr, safra, idUsuario, master, id, hasta, muestras, tam, lse, lie }) {
  fechaValida(hasta, "Fecha");
  id = Number(id);
  if (!Number.isInteger(id)) throw error("Variable inválida");
  muestras = Math.min(MAX_MUESTRAS, Math.max(4, Math.trunc(Number(muestras)) || 30));
  const { variable, serie } = await ultimosValores({ empr, safra, idUsuario, master, id, hasta, n: muestras });
  const L = (x) => (x === undefined || x === null || x === "" ? null : num(x));
  const carta = est.cartaControl(serie.map((p) => p.y), { tam: Number(tam) || 1, lse: L(lse), lie: L(lie) });
  return { variable, hasta, muestras, lse: L(lse), lie: L(lie), serie, carta };
}

async function correlacion({ empr, safra, idUsuario, master, ids, desde, hasta }) {
  fechaValida(desde, "Fecha inicial"); fechaValida(hasta, "Fecha final");
  ids = consultas.idsDe(ids);
  if (ids.length < 2) throw error("Elija al menos dos variables");
  if (ids.length > MAX_CORR_VARS) throw error(`Máximo ${MAX_CORR_VARS} variables`);
  const r = await consultas.valores({ empr, safra, idUsuario, master, ids, desde, hasta, acumulado: false });
  const vs = r.variables;
  const col = (id) => r.filas.map((f) => num(f.valores[id]));
  const cols = vs.map((v) => col(v.id));
  const matriz = vs.map((_, i) => vs.map((__, j) => (i === j ? { r: 1, n: cols[i].filter((x) => x !== null).length } : est.pearson(cols[i], cols[j]))));
  return { variables: vs, desde, hasta, dias: r.filas.length, matriz, aviso: r.aviso };
}

module.exports = { panel, cep, correlacion };
