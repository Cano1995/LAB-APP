// Analiza cómo el VB6 calcula la columna 99 (resultado del día) a partir de las columnas,
// según VAR_TIPO_MEDIA. SOLO LECTURA. Prueba varias agregaciones candidatas por tipo.
// Uso (desde api/): node ../tools/gpi-analizar-media-dia.js 2026-10-01 2026-10-20 [empresa] [safra]
process.chdir(require("path").join(__dirname, "..", "api"));
require("../api/node_modules/dotenv").config();
const db = require("../api/src/db");
const { tolerancia } = require("./lib/tolerancia");

const [desde, hasta, EMPR = "1", SAFRA = "2026"] = process.argv.slice(2);
const S = "GATEC_GPI_NEW";
const num = (s) => (s == null || s === "" || isNaN(Number(s)) ? null : Number(s));

(async () => {
  await db.initPool();
  const q = async (sql, b = {}) => (await db.query(sql, b, { maxRows: 5e6 })).rows;
  const vars = new Map((await q(`SELECT ID_VAR, VAR_TIPO_MEDIA, VAR_ORI_POND, VAR_MAS_DEC, VAR_ORI_DADOS, VAR_POND_ZERO FROM ${S}.GI_LAB_VAR`)).map((v) => [v.ID_VAR, v]));
  const mov = await q(
    `SELECT l.ID_LANC, m.ID_VAR, m.MOV_COLUNA, m.MOV_VALOR FROM ${S}.GI_LAB_LANC_${EMPR}_${SAFRA} l
       JOIN ${S}.GI_LAB_LANC_MOV_${EMPR}_${SAFRA} m ON m.ID_LANC = l.ID_LANC
      WHERE l.LAN_DATA BETWEEN TO_DATE(:a,'YYYY-MM-DD') AND TO_DATE(:b,'YYYY-MM-DD')`, { a: desde, b: hasta });
  const porLanc = new Map(); // idLanc → idVar → col → valor
  for (const r of mov) {
    if (!porLanc.has(r.ID_LANC)) porLanc.set(r.ID_LANC, new Map());
    const m = porLanc.get(r.ID_LANC);
    if (!m.has(r.ID_VAR)) m.set(r.ID_VAR, new Map());
    m.get(r.ID_VAR).set(r.MOV_COLUNA, r.MOV_VALOR);
  }

  const cand = {
    media: (xs) => xs.reduce((s, x) => s + x.v, 0) / xs.length,
    mediaSinCeros: (xs) => { const y = xs.filter((x) => x.v !== 0); return y.length ? y.reduce((s, x) => s + x.v, 0) / y.length : 0; },
    suma: (xs) => xs.reduce((s, x) => s + x.v, 0),
    ultima: (xs) => xs[xs.length - 1].v,
    primera: (xs) => xs[0].v,
    max: (xs) => Math.max(...xs.map((x) => x.v)),
    ponderada: (xs, pond) => { let s = 0, w = 0; for (const x of xs) { const p = pond?.get(x.c); const pv = num(p); if (pv === null) continue; s += x.v * pv; w += pv; } return w ? s / w : null; },
  };
  const stats = {}; // tipo → candidato → {ok, n}
  for (const [, vm] of porLanc) {
    for (const [idVar, cols] of vm) {
      const v = vars.get(idVar); if (!v) continue;
      const dia = num(cols.get(99)); if (dia === null) continue;
      const xs = [...cols].filter(([c, s]) => c !== 99 && num(s) !== null).map(([c, s]) => ({ c, v: num(s) })).sort((a, b) => a.c - b.c);
      if (!xs.length) continue;
      const tol = tolerancia(v.VAR_MAS_DEC ?? 2);
      const k = `med${v.VAR_TIPO_MEDIA}${v.VAR_ORI_DADOS ? "·calc" : "·dig"}${v.VAR_TIPO_MEDIA === 2 ? (v.VAR_POND_ZERO === "S" ? "·pondZero=S" : "·pondZero=N") : ""}`;
      const st = (stats[k] ||= { n: 0 });
      st.n++;
      for (const [nombre, f] of Object.entries(cand)) {
        const r = f(xs, v.VAR_ORI_POND ? vm.get(v.VAR_ORI_POND) : null);
        if (r !== null && Math.abs(r - dia) <= tol) st[nombre] = (st[nombre] || 0) + 1;
      }
    }
  }
  for (const [k, st] of Object.entries(stats).sort()) {
    const lst = Object.entries(st).filter(([n]) => n !== "n").sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} ${((100 * c) / st.n).toFixed(1)}%`);
    console.log(`${k.padEnd(26)} n=${String(st.n).padEnd(6)} ${lst.join(" · ")}`);
  }
  await db.closePool();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
