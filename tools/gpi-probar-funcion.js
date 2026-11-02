// Prueba fórmulas candidatas para una función de dominio del GPI contra los valores guardados.
// SOLO LECTURA. Toma una variable de salida cuya fórmula es F('etiq', idA, 'etiq', idB, ...)
// y compara, celda por celda (mismo lanzamiento y columna), el valor guardado con cada candidata.
// Uso (desde api/): node ../tools/gpi-probar-funcion.js <idVarSalida> [safra=2026]
process.chdir(require("path").join(__dirname, "..", "api"));
// Nota: corre contra DESA (la conexión verifica el servidor en api/src/db.js).
require("../api/node_modules/dotenv").config();
const db = require("../api/src/db");
const { tolerancia } = require("./lib/tolerancia");

// Candidatas por función (args en el orden de la firma del catálogo del VB6).
const C = 1; // marcador para legibilidad
const CANDIDATAS = {
  POL: {
    "L*(0.2605-0.0009882*Bx)": (l, bx) => l * (0.2605 - 0.0009882 * bx),
    "L*0.26/(1+0.00383*Bx)": (l, bx) => (l * 0.26) / (1 + 0.00383 * bx),
  },
  POLCANA: {
    "S*(1-0.01F)*(1.0313-0.00575F)": (s, f) => s * (1 - 0.01 * f) * (1.0313 - 0.00575 * f),
    "S*(1-0.01F)*(1.0313-0.00575F) [F%]": (s, f) => s * (1 - 0.01 * f) * (1.0313 - 0.00575 * f),
    "S*(1-0.01F)": (s, f) => s * (1 - 0.01 * f),
  },
  BRIXCANA: { "B*(1-0.01F)*(1.0313-0.00575F)": (b, f) => b * (1 - 0.01 * f) * (1.0313 - 0.00575 * f), "B*(1-0.01F)": (b, f) => b * (1 - 0.01 * f) },
  ARCANA: { "AR*(1-0.01F)*(1.0313-0.00575F)": (a, f) => a * (1 - 0.01 * f) * (1.0313 - 0.00575 * f), "AR*(1-0.01F)": (a, f) => a * (1 - 0.01 * f) },
  UMIDADECANA: { "100-Bx-F": (b, f) => 100 - b - f },
  EXTRREDUZND: {
    "100-(100-E)(100-F)*12.5/(F*87.5)": (e, f) => 100 - ((100 - e) * (100 - f) * 12.5) / (f * 87.5),
    "100-(100-E)*F*87.5/(12.5*(100-F))": (e, f) => 100 - ((100 - e) * f * 87.5) / (12.5 * (100 - f)),
    "100-(100-E)*F/12.5": (e, f) => 100 - ((100 - e) * f) / 12.5,
    "100-(100-E)*(F/12.5)*((100-12.5)/(100-F))": (e, f) => 100 - (100 - e) * (f / 12.5) * ((100 - 12.5) / (100 - f)),
  },
  BRIXBAGACODIG: { "100*Pol/Pur": (p, pur) => (100 * p) / pur },
  FIBRABAGACODIG: {
    "100-U-100*L/Pur": (u, l, pur) => 100 - u - (100 * l) / pur,
  },
  EFICCENTRIFVINHO: {
    "(VB-VC)*FC/((FC-VC)*VB)*100": (vb, vc, fc) => ((vb - vc) * fc) / ((fc - vc) * vb) * 100,
    "(VB-VC)/(FC-VC)*100": (vb, vc, fc) => ((vb - vc) / (fc - vc)) * 100,
    "(VB-VC)/VB*100": (vb, vc) => ((vb - vc) / vb) * 100,
  },
  SOMAPROP: {
    "(f1v1+f2v2)/(f1+f2)": (f1, v1, f2, v2) => (f1 * v1 + f2 * v2) / (f1 + f2),
    "f1v1+f2v2": (f1, v1, f2, v2) => f1 * v1 + f2 * v2,
  },
};
void C;

(async () => {
  const [idSalida, SAFRA = "2026"] = process.argv.slice(2);
  await db.initPool();
  const q = async (sql, b = {}) => (await db.query(sql, b, { maxRows: 5e6 })).rows;
  const v = (await q(`SELECT ID_VAR, VAR_NOM_VAR, VAR_MAS_DEC, VAR_FORMULA FROM GATEC_GPI_NEW.GI_LAB_VAR WHERE ID_VAR = :i`, { i: Number(idSalida) }))[0];
  const fn = /^\s*([A-Za-z_]+)\s*\(/.exec(v.VAR_FORMULA)[1].toUpperCase();
  const ids = [...v.VAR_FORMULA.matchAll(/,\s*(\d+)\s*(?=[,)])/g)].map((m) => Number(m[1]));
  console.log(`${v.ID_VAR} ${v.VAR_NOM_VAR} = ${v.VAR_FORMULA.replace(/\s+/g, " ")}  → función ${fn}, entradas ${ids}`);
  const todos = [Number(idSalida), ...ids];
  const filas = await q(
    `SELECT TO_CHAR(l.LAN_DATA,'YYYY-MM-DD') D, m.ID_LANC, m.MOV_COLUNA, m.ID_VAR, m.MOV_VALOR
       FROM GATEC_GPI_NEW.GI_LAB_LANC_MOV_1_${SAFRA} m JOIN GATEC_GPI_NEW.GI_LAB_LANC_1_${SAFRA} l ON l.ID_LANC = m.ID_LANC
      WHERE m.ID_VAR IN (${todos.join(",")})`);
  // Valor del día de cada variable (col 99, o la 1.ª columna) por fecha: para entradas de otra planilla.
  const dia = new Map();
  for (const r of filas) {
    const k = `${r.D}:${r.ID_VAR}`;
    if (r.MOV_COLUNA === 99 || !dia.has(k)) dia.set(k, Number(r.MOV_VALOR));
  }
  const celdas = new Map();
  for (const r of filas.filter((x) => x.ID_VAR === Number(idSalida) && x.MOV_COLUNA < 99)) {
    const c = { [r.ID_VAR]: Number(r.MOV_VALOR) };
    for (const i of ids) {
      const mismo = filas.find((x) => x.ID_LANC === r.ID_LANC && x.MOV_COLUNA === r.MOV_COLUNA && x.ID_VAR === i);
      // Prioridad: mismo lanzamiento y columna → misma fecha y columna (otra planilla) → valor del día.
      const mismaCol = !mismo && filas.find((x) => x.D === r.D && x.MOV_COLUNA === r.MOV_COLUNA && x.ID_VAR === i);
      c[i] = mismo ? Number(mismo.MOV_VALOR) : mismaCol ? Number(mismaCol.MOV_VALOR) : dia.get(`${r.D}:${i}`);
    }
    celdas.set(`${r.ID_LANC}:${r.MOV_COLUNA}`, c);
  }
  const tol = tolerancia(v.VAR_MAS_DEC ?? 2);
  const cand = CANDIDATAS[fn] || {};
  const res = {};
  let n = 0;
  const ejemplos = [];
  for (const c of celdas.values()) {
    if (todos.some((i) => c[i] === undefined || isNaN(c[i]))) continue;
    n++;
    if (ejemplos.length < 5) ejemplos.push(`[${ids.map((i) => c[i]).join(", ")}] → ${c[idSalida]}`);
    for (const [nombre, f] of Object.entries(cand)) {
      const x = f(...ids.map((i) => c[i]));
      if (Math.abs(x - c[idSalida]) <= tol) res[nombre] = (res[nombre] || 0) + 1;
    }
  }
  console.log(`celdas completas: ${n} · ejemplos: ${ejemplos.join(" | ")}`);
  for (const [nombre] of Object.entries(cand)) console.log(`  ${nombre.padEnd(48)} ${(((res[nombre] || 0) * 100) / Math.max(1, n)).toFixed(1)}%`);
  await db.closePool();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
