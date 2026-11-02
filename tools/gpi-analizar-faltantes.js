// Busca la regla del VB6 para valores faltantes en fórmulas. SOLO LECTURA.
// Compara dos grupos de celdas:
//   C1 "necesita cero": el VB6 guardó un valor, la política U (nulo se propaga) no coincide y UN (nulo = 0) sí.
//   C2 "sobrante":      el VB6 NO guardó nada en una columna existente, U da nulo y UN da un valor.
// Para cada celda registra rasgos de las referencias faltantes y muestra su frecuencia en cada grupo:
// el rasgo que separa los grupos es candidato a ser la regla.
// Uso (desde la raíz): node tools/gpi-analizar-faltantes.js 2025-08-01 2025-08-10 [empresa] [safra]
const { cargar, COL_DIA, esNulo } = require("./lib/gpi-datos");

const [desde, hasta, EMPR = "1", SAFRA = "2026"] = process.argv.slice(2);

(async () => {
  const g = await cargar({ hasta, empr: EMPR, safra: SAFRA });
  const { U, UN } = g.POLITICAS;
  const grupos = { C1: { n: 0, rasgos: {}, ej: [] }, C2: { n: 0, rasgos: {}, ej: [] } };
  const unaLinea = (s) => String(s || "").replace(/\s+/g, " ");

  for (let fecha = desde; fecha <= hasta; fecha = require("./lib/gpi-datos").sumarDias(fecha, 1)) {
    const dv = g.datos.get(fecha); if (!dv) continue;
    for (const [id] of g.asts) {
      const v = g.porId.get(id);
      const guard = dv.get(id) || new Map();
      for (const col of g.colsPlan.get(`${fecha}:${v.ID_PLAN}`) || []) {
        const refsU = [];
        let rU, rUN;
        try { rU = g.evaluarCelda(id, fecha, col, U, (idRef, x, flag) => refsU.push({ idRef, x, flag })); } catch { continue; }
        try { rUN = g.evaluarCelda(id, fecha, col, UN); } catch { continue; }
        const guardado = guard.get(col);
        let grupo = null;
        if (!esNulo(guardado) && !g.coincide(v, guardado, rU) && g.coincide(v, guardado, rUN)) grupo = "C1";
        else if (esNulo(guardado) && esNulo(rU) && !esNulo(rUN)) grupo = "C2";
        if (!grupo) continue;

        const G = grupos[grupo];
        G.n++;
        const faltantes = refsU.filter((r) => esNulo(r.x));
        const conValor = refsU.filter((r) => !esNulo(r.x));
        const rasgos = new Set();
        const conf = g.conf.get(v.ID_PLAN) || {};
        rasgos.add(`planilla ${conf.divisao === 1 ? "bateladas" : "horas"}`);
        rasgos.add(`fórmula ${/NVL\s*\(/i.test(v.VAR_FORMULA) ? "con" : "sin"} Nvl`);
        rasgos.add(`refs con valor: ${conValor.length === 0 ? "ninguna" : "alguna"}`);
        rasgos.add(`resultado UN ${Number(rUN) === 0 ? "= 0" : "≠ 0"}`);
        for (const f of faltantes) {
          const ref = g.porId.get(f.idRef);
          const misma = ref && ref.ID_PLAN === v.ID_PLAN;
          rasgos.add(`faltante de ${misma ? "misma" : "otra"} planilla`);
          rasgos.add(`faltante ${ref?.VAR_ORI_DADOS === 1 ? "calculada" : "digitada"}`);
          const delDia = g.datos.get(fecha)?.get(f.idRef);
          const otras = delDia && [...delDia.keys()].some((c) => c !== COL_DIA);
          rasgos.add(`faltante ${!delDia ? "sin ningún dato ese día" : otras ? "con datos en otras columnas" : "solo con día(99)"}`);
          rasgos.add(`faltante vía ${f.flag === 1 ? "GetAnalise(,1)" : f.flag === "media" ? "GetMedia" : "GetAnalise"}`);
        }
        rasgos.add(`año ${fecha.slice(0, 4)}`);
        for (const r of rasgos) G.rasgos[r] = (G.rasgos[r] || 0) + 1;
        if (G.ej.length < 12 && !G.ej.some((e) => e.startsWith(`${id} `))) {
          G.ej.push(`${id} ${v.VAR_NOM_VAR} ${fecha} col${col} guardado=${guardado ?? "∅"} U=${rU} UN=${rUN} · faltan ${faltantes.map((f) => f.idRef).join(",")} · ${unaLinea(v.VAR_FORMULA).slice(0, 110)}`);
        }
      }
    }
  }

  const todos = new Set([...Object.keys(grupos.C1.rasgos), ...Object.keys(grupos.C2.rasgos)]);
  const pc = (G, r) => (G.n ? (100 * (G.rasgos[r] || 0)) / G.n : 0);
  console.log(`C1 (necesita cero): ${grupos.C1.n} celdas · C2 (sobrante con UN): ${grupos.C2.n} celdas\n`);
  console.log("Rasgo".padEnd(52) + "C1%".padStart(8) + "C2%".padStart(8));
  for (const r of [...todos].sort((a, b) => Math.abs(pc(grupos.C1, b) - pc(grupos.C2, b)) - Math.abs(pc(grupos.C1, a) - pc(grupos.C2, a)))) {
    console.log(r.padEnd(52) + pc(grupos.C1, r).toFixed(1).padStart(8) + pc(grupos.C2, r).toFixed(1).padStart(8));
  }
  for (const k of ["C1", "C2"]) { console.log(`\nEjemplos ${k}:`); grupos[k].ej.forEach((e) => console.log("  " + e)); }
  await g.cerrar();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
