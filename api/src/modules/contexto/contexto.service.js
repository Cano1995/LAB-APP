// Contexto de trabajo del usuario: empresa + zafra seleccionadas.
// Equivale al "Alterar Empresa/Safra" del GATEC viejo. Muchas tablas agrícolas
// se scopan por COD_EMPR + SAF_ANO_SAFRA; el contexto define cuáles se ven.
const { query, queryOne } = require("../../db");
const config = require("../../config");

const G = config.gatecSchema;
const A = config.appSchema;

// Empresas con sus zafras disponibles (las que tienen configuración empr/safra).
async function opciones() {
  const r = await query(
    `SELECT cs.COD_EMPR, e.DSC_EMPR, cs.SAF_ANO_SAFRA, s.SAF_SAFRA_EDIT
       FROM ${G}.GA_CONFI_EMPR_SAFRA cs
       JOIN ${G}.GA_EMPR e ON e.COD_EMPR = cs.COD_EMPR
       LEFT JOIN ${G}.GA_SAFRAS s ON s.COD_EMPR = cs.COD_EMPR AND s.SAF_ANO_SAFRA = cs.SAF_ANO_SAFRA
      ORDER BY cs.COD_EMPR, cs.SAF_ANO_SAFRA DESC`,
  );
  const empresas = new Map();
  for (const row of r.rows) {
    if (!empresas.has(row.COD_EMPR)) {
      empresas.set(row.COD_EMPR, { cod: row.COD_EMPR, nombre: (row.DSC_EMPR || "").trim(), safras: [] });
    }
    empresas.get(row.COD_EMPR).safras.push({
      anio: row.SAF_ANO_SAFRA,
      etiqueta: (row.SAF_SAFRA_EDIT || String(row.SAF_ANO_SAFRA)).trim(),
    });
  }
  return [...empresas.values()];
}

async function comboValido(codEmpr, safra) {
  const r = await queryOne(
    `SELECT 1 OK FROM ${G}.GA_CONFI_EMPR_SAFRA WHERE COD_EMPR = :e AND SAF_ANO_SAFRA = :s`,
    { e: codEmpr, s: safra },
  );
  return !!r;
}

// Contexto actual del usuario; si no eligió, usa la empresa/zafra más reciente.
async function obtener(idUsuario) {
  const row = await queryOne(
    `SELECT SEL_COD_EMPR, SEL_SAF_ANO_SAFRA FROM ${A}.LAB_APP_AUTH WHERE ID_USUARIO = :id`,
    { id: idUsuario },
  );
  let cod = row && row.SEL_COD_EMPR;
  let safra = row && row.SEL_SAF_ANO_SAFRA;

  if (!cod || !safra || !(await comboValido(cod, safra))) {
    const def = await queryOne(
      `SELECT COD_EMPR, SAF_ANO_SAFRA FROM ${G}.GA_CONFI_EMPR_SAFRA
        ORDER BY SAF_ANO_SAFRA DESC FETCH FIRST 1 ROWS ONLY`,
    );
    if (!def) return null;
    cod = def.COD_EMPR; safra = def.SAF_ANO_SAFRA;
  }
  const emp = await queryOne(`SELECT DSC_EMPR FROM ${G}.GA_EMPR WHERE COD_EMPR = :e`, { e: cod });
  return { empresa: { cod, nombre: emp ? emp.DSC_EMPR.trim() : String(cod) }, safra };
}

async function seleccionar(idUsuario, codEmpr, safra) {
  if (!(await comboValido(codEmpr, safra))) return { error: "Combinación empresa/zafra inválida" };
  await query(
    `UPDATE ${A}.LAB_APP_AUTH SET SEL_COD_EMPR = :e, SEL_SAF_ANO_SAFRA = :s, FECHA_ACTUALIZ = SYSDATE WHERE ID_USUARIO = :id`,
    { e: codEmpr, s: safra, id: idUsuario },
  );
  return { ok: true, contexto: await obtener(idUsuario) };
}

module.exports = { opciones, obtener, seleccionar };
