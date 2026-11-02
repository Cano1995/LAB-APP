// Comprueba contra la API (solo lectura) que los valores esperados de docs/validacion-con-usuarios.md siguen vigentes en DESA.
// Úselo el día anterior a la sesión con el usuario: DESA se recarga cada noche y un día que se corrigió en producción cambia el valor esperado.
// Uso: node tools/verificar-valores-esperados.js        (API en :3101; usa la cuenta de prueba de tools/e2e/lib.js)
// Para las metas 2025 cambia la zafra de esa cuenta a 2025 y la deja de nuevo en la que tenía.
const { tokenDePrueba } = require("./e2e/lib");

const BASE = process.env.API || "http://localhost:3101/api";
const H = { Authorization: `Bearer ${tokenDePrueba()}`, "Content-Type": "application/json" };
const get = async (p) => { const r = await fetch(BASE + p, { headers: H }); if (!r.ok) throw new Error(`${p} → ${r.status}`); return r.json(); };
const post = async (p, body) => { const r = await fetch(BASE + p, { method: "POST", headers: H, body: JSON.stringify(body) }); if (!r.ok) throw new Error(`${p} → ${r.status}`); return r.json(); };

const filas = [];
const num = (x) => (x === null || x === undefined || x === "" ? null : Number(String(x).replace(",", ".")));
function verificar(seccion, que, esperado, obtenido, tol = 0.0005) {
  const e = num(esperado), o = num(obtenido);
  const ok = e !== null && o !== null && Math.abs(e - o) <= tol;
  filas.push({ seccion, que, esperado: e, obtenido: o, ok });
}

(async () => {
  const antes = (await get("/contexto")).contexto;

  // 1.1 Digitación diaria: planilla «Entrada caña» (60).
  for (const [fecha, esperados] of [["2026-10-20", { 46: 5788.65, 1743: 2568.44, 1742: 2967.49, 2975: 252.72 }], ["2026-10-21", { 46: 1375.54 }]]) {
    const l = await get(`/gpi/planilhas/60/lancamento?data=${fecha}`);
    for (const [id, v] of Object.entries(esperados)) verificar("1.1", `Entrada caña ${fecha} · variable ${id} (día)`, v, l.valores[id]?.["99"]);
  }

  // 1.2 Valores de variables, acumulado de zafra al 20/09/2026.
  const ac = await get("/gpi/valores?ids=64,33&desde=2026-09-20&hasta=2026-09-20&acumulado=1");
  verificar("1.2", "Vol. fermento cuba, acumulado 20/09", 25185472, ac.filas[0]?.valores["64"], 0.5);
  verificar("1.2", "Vol. total vino en dorna, acumulado 20/09", 175388400, ac.filas[0]?.valores["33"], 0.5);

  // 1.3 Informe diario (#1), 18 a 24/10.
  const inf = await get("/gpi/informes/1?desde=2026-10-18&hasta=2026-10-24");
  const linea = (t) => inf.lineas.find((x) => x.texto === t);
  const dias = { "2026-10-18": 0, "2026-10-19": 1, "2026-10-20": 2, "2026-10-21": 3 };
  const informe = {
    "Días totales zafra": [166, 167, 168, 169],
    "Caña molida h efectiva": [0, 304.961, 290.644, 275.108],
    "Caña total ingresada": [0, 1804.35, 5788.65, 1375.54],
  };
  for (const [texto, vals] of Object.entries(informe)) {
    const l = linea(texto) || inf.lineas.find((x) => x.texto && x.texto.toLowerCase().startsWith(texto.toLowerCase()));
    for (const [f, i] of Object.entries(dias)) verificar("1.3", `${texto} ${f}`, vals[i], l?.valores?.[f]);
  }

  // 1.4 Boletín COPAC al 24/10 (acumulado de zafra).
  const bol = await get("/gpi/boletines/1?fecha=2026-10-24");
  const celdas = bol.columnas.flat();
  const bl = (t) => celdas.find((x) => x.texto === t);
  verificar("1.4", "COPAC · Días totales zafra (acumulado)", 172, bl("Días totales zafra")?.acumulado);
  verificar("1.4", "COPAC · Caña total ingresada (acumulado)", 536727.56, bl("Caña total ingresada")?.acumulado, 0.01);

  // 2.1 Sonda, 21/10/2026.
  const s = await get("/lab/sonda?desde=2026-10-21&hasta=2026-10-21");
  verificar("2.1", "Sonda 21/10 · total", 72, s.resumen.total);
  verificar("2.1", "Sonda 21/10 · completas", 20, s.resumen.completas);
  verificar("2.1", "Sonda 21/10 · sin resultado", 33, s.resumen.sinResultado);
  verificar("2.1", "Sonda 21/10 · acoplados", 19, s.resumen.acoplados);
  verificar("2.1", "Sonda 21/10 · Brix prom.", 19.22, s.resumen.brix, 0.005);
  verificar("2.1", "Sonda 21/10 · Pol caña prom.", 13.25, s.resumen.pol, 0.005);
  verificar("2.1", "Sonda 21/10 · Fibra prom.", 14.77, s.resumen.fibra, 0.005);
  verificar("2.1", "Sonda 21/10 · ATR prom.", 127.77, s.resumen.atr, 0.005);

  // 2.2 Entrada de caña (balanza).
  for (const [f, cam, tn, can] of [["2026-10-20", 207, 5646.57, 69], ["2026-10-21", 63, 1764.29, 29]]) {
    const e = await get(`/lab/entrada-cana?desde=${f}&hasta=${f}`);
    verificar("2.2", `Balanza ${f} · camiones`, cam, e.resumen.camiones);
    verificar("2.2", `Balanza ${f} · toneladas`, tn, e.resumen.toneladas, 0.005);
    verificar("2.2", `Balanza ${f} · cañeros`, can, e.resumen.caneros);
  }

  // 1.5 Metas, zafra 2025, día 20/10/2025 (cambia la zafra de la cuenta de prueba y la restaura).
  try {
    await post("/contexto", { codEmpr: 1, safra: 2025 });
    const m = await get("/gpi/metas?fecha=2025-10-20&periodo=diario");
    const fila = (t) => m.filas.find((x) => String(x.variable.analisis).toLowerCase().startsWith(t.toLowerCase()));
    for (const [t, meta, real, cumpl] of [["Caña total ingresada", 8000, 1448.83, 18], ["Aprov. tiempo", 83.9, 21.18, 25]]) {
      const c = fila(t);
      verificar("1.5", `Metas 2025 · ${t} · meta`, meta, c?.meta, 0.005);
      verificar("1.5", `Metas 2025 · ${t} · real`, real, c?.real, 0.005);
      verificar("1.5", `Metas 2025 · ${t} · cumplimiento %`, cumpl, c?.cumplimiento === null || c?.cumplimiento === undefined ? null : Math.round(c.cumplimiento), 0.5);
    }
  } finally {
    if (antes) await post("/contexto", { codEmpr: antes.empresa.cod, safra: antes.safra });
  }

  const malos = filas.filter((f) => !f.ok);
  console.table(filas.map((f) => ({ sec: f.seccion, qué: f.que, esperado: f.esperado, obtenido: f.obtenido, ok: f.ok ? "✔" : "✘" })));
  console.log(malos.length ? `\n${malos.length} de ${filas.length} valores NO coinciden con el documento: actualice docs/validacion-con-usuarios.md antes de la sesión.` : `\nLos ${filas.length} valores esperados siguen vigentes.`);
  process.exit(malos.length ? 1 : 0);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
