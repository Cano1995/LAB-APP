// GPI · Informes configurables (frmRelatorios / "Informes") en solo consulta.
// GI_LAB_CONF_REL_TIT = cabecera del informe; GI_LAB_CONF_REL_LINHA = sus líneas en orden (CRL_SEQ):
//   CRL_STATUS 'V' con ID_VAR → variable; 'S' → título de sección; 'Q' y 'A' → subtítulo/texto; sin estado → línea en blanco.
// La grilla es variables × días; el valor de cada celda es el resultado del día (col. 99), como en Valores de variables.
// Los indicadores estadísticos de la cabecera (media de zafra, 7/15/30 días, desvío…) no se usan en ningún informe de DESA y no se implementan.
const { query } = require("../../db");
const { error } = require("../../lib/util");
const consultas = require("./consultas.service");

const S = "GATEC_GPI_NEW";
const MAX_DIAS = 31;

const { fechaReal: fechaValida } = require("../../lib/validar");
function sumarDias(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
// Color de VB6 (entero BGR) → '#RRGGBB'; blanco o vacío → null.
function colorVb(c) {
  const n = Number(c);
  if (!Number.isFinite(n) || n === 16777215) return null;
  const h = (v) => v.toString(16).padStart(2, "0");
  return `#${h(n & 255)}${h((n >> 8) & 255)}${h((n >> 16) & 255)}`;
}

async function listar({ empr }) {
  const r = await query(
    `SELECT t.ID_CONF_REL, t.CRT_TITULO, t.CRT_SUB_TITULO,
            (SELECT COUNT(*) FROM ${S}.GI_LAB_CONF_REL_LINHA l WHERE l.COD_EMPR = t.COD_EMPR AND l.ID_CONF_REL = t.ID_CONF_REL AND l.ID_VAR IS NOT NULL) VARIABLES
       FROM ${S}.GI_LAB_CONF_REL_TIT t WHERE t.COD_EMPR = :e ORDER BY t.CRT_TITULO, t.ID_CONF_REL`,
    { e: empr }, { maxRows: 500 },
  );
  return r.rows.map((x) => ({ id: x.ID_CONF_REL, titulo: x.CRT_TITULO, subtitulo: x.CRT_SUB_TITULO, variables: x.VARIABLES }));
}

async function informe({ empr, safra, idUsuario, master, id, desde, hasta }) {
  id = Number(id);
  if (!Number.isInteger(id)) throw error("Informe inválido");
  fechaValida(desde, "Fecha inicial"); fechaValida(hasta, "Fecha final");
  if (hasta < desde) throw error("La fecha final es anterior a la inicial");
  const fechas = [];
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) { fechas.push(f); if (fechas.length > MAX_DIAS) throw error(`El rango máximo es de ${MAX_DIAS} días`); }

  const [tit, lin] = await Promise.all([
    query(`SELECT CRT_TITULO, CRT_SUB_TITULO FROM ${S}.GI_LAB_CONF_REL_TIT WHERE COD_EMPR = :e AND ID_CONF_REL = :i`, { e: empr, i: id }),
    query(`SELECT CRL_SEQ, ID_VAR, CRL_STATUS, CRL_QUEBRA, CRL_COR, CRL_COR_FONTE, CRL_ESTILO_FONTE, VAR_NOM_ANALI
             FROM ${S}.GI_LAB_CONF_REL_LINHA WHERE COD_EMPR = :e AND ID_CONF_REL = :i ORDER BY CRL_SEQ`, { e: empr, i: id }, { maxRows: 2000 }),
  ]);
  if (!tit.rows.length) throw error("Informe inexistente", 404);

  const ids = [...new Set(lin.rows.map((l) => l.ID_VAR).filter((v) => v !== null && v !== undefined))].slice(0, 400);
  // `valores` limita a 30 variables por consulta: se piden en tandas.
  const metas = new Map();
  const celdas = new Map(); // idVar → { fecha → valor }
  for (let i = 0; i < ids.length; i += 30) {
    const r = await consultas.valores({ empr, safra, idUsuario, master, ids: ids.slice(i, i + 30), desde, hasta, acumulado: false });
    for (const v of r.variables) metas.set(v.id, v);
    for (const f of r.filas) for (const [idv, val] of Object.entries(f.valores)) {
      if (!celdas.has(Number(idv))) celdas.set(Number(idv), {});
      celdas.get(Number(idv))[f.fecha] = val;
    }
  }

  const lineas = lin.rows.map((l) => {
    const base = { seq: l.CRL_SEQ, color: colorVb(l.CRL_COR), colorFuente: colorVb(l.CRL_COR_FONTE), negrita: l.CRL_ESTILO_FONTE === "N", quiebre: l.CRL_QUEBRA === 1 };
    if (l.ID_VAR !== null && l.ID_VAR !== undefined) {
      const meta = metas.get(l.ID_VAR);
      return { ...base, tipo: "variable", texto: l.VAR_NOM_ANALI ?? meta?.analisis ?? "", variable: meta ?? null, habilitada: !!meta, valores: celdas.get(l.ID_VAR) ?? {} };
    }
    if (l.CRL_STATUS === "S") return { ...base, tipo: "seccion", texto: l.VAR_NOM_ANALI ?? "" };
    if (l.CRL_STATUS === "Q" || l.CRL_STATUS === "A") return { ...base, tipo: "subtitulo", texto: l.VAR_NOM_ANALI ?? "" };
    return { ...base, tipo: "espacio", texto: l.VAR_NOM_ANALI ?? "" };
  });
  return { id, titulo: tit.rows[0].CRT_TITULO, subtitulo: tit.rows[0].CRT_SUB_TITULO, fechas, lineas };
}

module.exports = { listar, informe };
