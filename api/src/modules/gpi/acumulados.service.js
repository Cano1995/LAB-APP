// Columnas extra de la Digitación diaria (botones «Acum» y «Sem» del GATEC): solo lectura.
//   Acum (zafra):  GI_LAB_ACUM_{e}_{s}.ACU_MEDIA de la fecha (el que escribe el cierre del día).
//   Sem (semana):  PROVISORIO — el GATEC no guarda acumulados semanales y no se conoce su regla; se calcula con los
//                  resultados del día (col. 99) de los 7 días que terminan en la fecha, según VAR_TIPO_MEDIA
//                  (1 media, 2 ponderada, 3 suma, 4 último; 5 y 0 no se calculan). Ver docs/analisis/gpi-acumulados-digitacion.md.
const { query } = require("../../db");
const { fechaReal } = require("../../lib/validar");

const COLUNA_DIA = 99;
const DIAS_SEMANA = 7;

const lista = (n) => Array.from({ length: n }, (_, i) => `:i${i}`).join(", ");
const binds = (ids) => Object.fromEntries(ids.map((v, i) => [`i${i}`, v]));
const num = (t) => {
  if (t == null || String(t).trim() === "") return null;
  const n = Number(String(t).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

// AAAA-MM-DD ± n días, sin zona horaria.
function sumarDias(f, n) {
  const d = new Date(`${f}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Redondeo a los decimales de la variable (los de la máscara); sin máscara, 4.
const formatear = (n, dec) => String(Number(n.toFixed(dec ?? 4))).replace(".", ",");

async function acumuladoZafra({ tabla, ids, data }) {
  const r = await query(
    `SELECT ID_VAR, ACU_MEDIA FROM ${tabla}
      WHERE ACU_DATA = TO_DATE(:d, 'YYYY-MM-DD') AND ID_VAR IN (${lista(ids.length)})`,
    { ...binds(ids), d: data }, { maxRows: 100000 },
  );
  const out = {};
  for (const x of r.rows) out[x.ID_VAR] = x.ACU_MEDIA;
  return out;
}

async function semanal({ tLanc, tMov, variables, data }) {
  const desde = sumarDias(data, -(DIAS_SEMANA - 1));
  const ponderadoras = variables.filter((v) => v.tipoMedia === 2 && v.ponderadaPor).map((v) => v.ponderadaPor);
  const ids = [...new Set([...variables.map((v) => v.id), ...ponderadoras])];
  if (!ids.length) return {};
  const r = await query(
    `SELECT TO_CHAR(l.LAN_DATA, 'YYYY-MM-DD') D, m.ID_VAR, m.MOV_VALOR V
       FROM ${tLanc} l JOIN ${tMov} m ON m.ID_LANC = l.ID_LANC
      WHERE m.MOV_COLUNA = :c AND m.ID_VAR IN (${lista(ids.length)})
        AND l.LAN_DATA BETWEEN TO_DATE(:a, 'YYYY-MM-DD') AND TO_DATE(:b, 'YYYY-MM-DD')`,
    { ...binds(ids), c: COLUNA_DIA, a: desde, b: data }, { maxRows: 200000 },
  );
  // idVar → [{ d, x }] ordenado por fecha
  const porVar = new Map();
  for (const f of r.rows) {
    const x = num(f.V);
    if (x == null) continue;
    if (!porVar.has(f.ID_VAR)) porVar.set(f.ID_VAR, []);
    porVar.get(f.ID_VAR).push({ d: f.D, x });
  }
  for (const l of porVar.values()) l.sort((a, b) => (a.d < b.d ? -1 : 1));

  const out = {};
  for (const v of variables) {
    const dias = porVar.get(v.id) || [];
    if (!dias.length) continue;
    let res = null;
    if (v.tipoMedia === 1) res = dias.reduce((s, y) => s + y.x, 0) / dias.length;
    else if (v.tipoMedia === 3) res = dias.reduce((s, y) => s + y.x, 0);
    else if (v.tipoMedia === 4) res = dias[dias.length - 1].x;
    else if (v.tipoMedia === 2 && v.ponderadaPor) {
      const w = new Map((porVar.get(v.ponderadaPor) || []).map((y) => [y.d, y.x]));
      let sw = 0; let sxw = 0;
      for (const y of dias) { const p = w.get(y.d); if (y.x !== 0 && p != null) { sw += p; sxw += y.x * p; } }
      if (sw) res = sxw / sw;
    }
    if (res != null) out[v.id] = formatear(res, v.decimales);
  }
  return out;
}

// { acumulado?: {idVar: texto}, semanal?: {idVar: texto} } para la fecha; vacío si no se pide o no hay tablas.
async function columnasExtra({ gpi, empr, safra, variables, data, acum, sem }) {
  fechaReal(data, "Fecha");
  const out = {};
  if (acum) {
    const t = await gpi.tabla("ACUM", empr, safra);
    out.acumulado = t && variables.length ? await acumuladoZafra({ tabla: t, ids: variables.map((v) => v.id), data }) : {};
  }
  if (sem) {
    const tLanc = await gpi.tabla("LANC", empr, safra);
    const tMov = await gpi.tabla("LANC_MOV", empr, safra);
    out.semanal = tLanc && tMov ? await semanal({ tLanc, tMov, variables, data }) : {};
  }
  return out;
}

module.exports = { columnasExtra, DIAS_SEMANA };
