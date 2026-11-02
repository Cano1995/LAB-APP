// GPI · Metas y Real x Metas (FrmMetas / frmRelatoriosMetas) en solo consulta.
// GI_LAB_LANC_METAS (ID_LANC_METAS, MET_DATA = vigencia, MET_DIARIO/QUINZENAL/MENSAL/ACUMULADO, MET_IDEAL 's' = más es mejor, 'i' = menos es mejor)
// y GI_LAB_LANC_METAS_VAR (variable, empresa, zafra). Rige la meta más reciente con MET_DATA <= fecha; 0 = sin meta.
// Real: diario = resultado del día; quincenal/mensual = suma (VAR_TIPO_MEDIA 3) o promedio de los días con dato desde el inicio del período hasta la fecha;
// acumulado = ACU_MEDIA de la zafra. Es una aproximación: el reporte del VB6 no guarda resultados con los que contrastar.
const { query } = require("../../db");
const { error } = require("../../lib/util");
const consultas = require("./consultas.service");

const S = "GATEC_GPI_NEW";
const PERIODOS = ["diario", "quincenal", "mensual", "acumulado"];
const { fechaReal: fechaValida } = require("../../lib/validar");
const num = (v) => { const n = Number(String(v ?? "").replace(",", ".")); return v === null || v === undefined || v === "" || !Number.isFinite(n) ? null : n; };

function inicioPeriodo(fecha, periodo) {
  const [y, m, d] = fecha.split("-");
  if (periodo === "mensual") return `${y}-${m}-01`;
  if (periodo === "quincenal") return `${y}-${m}-${Number(d) <= 15 ? "01" : "16"}`;
  return fecha;
}
const CAMPO = { diario: "MET_DIARIO", quincenal: "MET_QUINZENAL", mensual: "MET_MENSAL", acumulado: "MET_ACUMULADO" };

async function metasVigentes({ empr, safra, fecha }) {
  const r = await query(
    `SELECT * FROM (
       SELECT v.ID_VAR, TO_CHAR(m.MET_DATA, 'YYYY-MM-DD') VIGENCIA, m.MET_DIARIO, m.MET_QUINZENAL, m.MET_MENSAL, m.MET_ACUMULADO, m.MET_IDEAL, m.MET_OBS,
              ROW_NUMBER() OVER (PARTITION BY v.ID_VAR ORDER BY m.MET_DATA DESC, m.ID_LANC_METAS DESC) RN
         FROM ${S}.GI_LAB_LANC_METAS m
         JOIN ${S}.GI_LAB_LANC_METAS_VAR v ON v.ID_LANC_METAS = m.ID_LANC_METAS
        WHERE v.COD_EMPR = :e AND v.SAF_ANO_SAFRA = :s AND m.MET_DATA <= TO_DATE(:f, 'YYYY-MM-DD')) WHERE RN = 1`,
    { e: empr, s: safra, f: fecha }, { maxRows: 2000 },
  );
  return r.rows;
}

async function realVsMeta({ empr, safra, idUsuario, master, fecha, periodo }) {
  fechaValida(fecha, "Fecha");
  if (!PERIODOS.includes(periodo)) throw error("Período inválido (diario, quincenal, mensual, acumulado)");
  const vigentes = await metasVigentes({ empr, safra, fecha });
  const ids = vigentes.map((m) => m.ID_VAR);
  const desde = inicioPeriodo(fecha, periodo);
  const metas = new Map(), real = new Map();
  for (let i = 0; i < ids.length; i += 30) {
    const lote = ids.slice(i, i + 30);
    const r = await consultas.valores({ empr, safra, idUsuario, master, ids: lote, desde, hasta: fecha, acumulado: periodo === "acumulado" });
    for (const v of r.variables) metas.set(v.id, v);
    for (const f of r.filas) for (const [k, val] of Object.entries(f.valores)) {
      const n = num(val); if (n === null) continue;
      if (!real.has(Number(k))) real.set(Number(k), []);
      real.get(Number(k)).push({ f: f.fecha, y: n });
    }
  }
  const filas = vigentes.filter((m) => metas.has(m.ID_VAR)).map((m) => {
    const v = metas.get(m.ID_VAR);
    const pts = (real.get(m.ID_VAR) ?? []).sort((a, b) => (a.f < b.f ? -1 : 1));
    let valor = null;
    if (pts.length) {
      if (periodo === "acumulado") valor = pts[pts.length - 1].y;
      else if (periodo === "diario") valor = pts.find((p) => p.f === fecha)?.y ?? null;
      else valor = v.tipoMedia === 3 ? pts.reduce((s, p) => s + p.y, 0) : pts.reduce((s, p) => s + p.y, 0) / pts.length;
    }
    const meta = num(m[CAMPO[periodo]]);
    const metaEf = meta === null || meta === 0 ? null : meta;
    const cumplimiento = valor !== null && metaEf !== null ? (valor / metaEf) * 100 : null;
    const ideal = m.MET_IDEAL === "i" ? "inferior" : "superior";
    return {
      variable: v, vigencia: m.VIGENCIA, ideal, obs: m.MET_OBS ?? null,
      meta: metaEf, real: valor, cumplimiento,
      // El veredicto solo es claro para el día: en períodos parciales (mes en curso) la meta es del período completo.
      cumple: periodo === "diario" && cumplimiento !== null ? (ideal === "superior" ? cumplimiento >= 100 : cumplimiento <= 100) : null,
    };
  });
  filas.sort((a, b) => (a.variable.analisis || a.variable.nombre).localeCompare(b.variable.analisis || b.variable.nombre, "es"));
  return { fecha, periodo, desde, filas, sinMeta: vigentes.length - filas.length };
}

module.exports = { realVsMeta };
