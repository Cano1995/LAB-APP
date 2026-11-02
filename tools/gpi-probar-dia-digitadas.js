// Regla del resultado del día (col. 99) en variables DIGITADAS (VAR_ORI_DADOS = 0), SOLO LECTURA. Antes de que la app pueda grabar una columna digitada hay que
// saber qué guarda el VB6 en la col. 99 de esa variable: este script recalcula el día con reglas.agregarDia + reglas.aTextoGuardado y lo compara,
// como TEXTO EXACTO, con el que guardó el VB6, y resume por tipo de media. Uso: node tools/gpi-probar-dia-digitadas.js AAAA-MM-DD AAAA-MM-DD [empresa=1] [safra=2026]
const { cargar, COL_DIA, esNulo, sumarDias, reglas } = require("./lib/gpi-datos");
const { leerArgs } = require("./lib/args");

const { desde, hasta, empr, safra } = leerArgs(
  [{ nombre: "desde", tipo: "fecha", requerido: true }, { nombre: "hasta", tipo: "fecha", requerido: true }, { nombre: "empr", tipo: "entero", defecto: 1 }, { nombre: "safra", tipo: "entero", defecto: 2026 }],
  "node tools/gpi-probar-dia-digitadas.js AAAA-MM-DD AAAA-MM-DD [empresa=1] [safra=2026]");

(async () => {
  const g = await cargar({ hasta, empr, safra });
  const st = {}; // tipoMedia|tipoDig → { ok, mal, sinDia, ej[] }
  for (const v of g.vars) {
    if (v.VAR_ORI_DADOS !== 0) continue; // solo digitadas
    const k = `media${v.VAR_TIPO_MEDIA}·dig${v.VAR_TIPO_DIG}`;
    const s = (st[k] ||= { ok: 0, mal: 0, sinDia: 0, soloDia: 0, ej: [] });
    for (let f = desde; f <= hasta; f = sumarDias(f, 1)) {
      const m = g.datos.get(f)?.get(v.ID_VAR);
      if (!m) continue;
      const cols = [...m.entries()].filter(([c, x]) => c !== COL_DIA && !esNulo(x));
      const guardadoDia = m.get(COL_DIA);
      if (!cols.length) { if (!esNulo(guardadoDia)) s.soloDia++; continue; }
      if (esNulo(guardadoDia)) { s.sinDia++; continue; }
      // Cada columna se redondea como se guardó (ya viene así), el día agrega esos valores.
      const dia = reglas.agregarDia(v, cols.map(([, x]) => x));
      let texto; try { texto = reglas.aTextoGuardado(v, dia, { dia: true }); } catch (e) { texto = "ERR " + e.message; }
      const ok = texto === String(guardadoDia).trim();
      s[ok ? "ok" : "mal"]++;
      if (!ok && s.ej.length < 3) s.ej.push(`#${v.ID_VAR} ${f}: cols=[${cols.map(([c, x]) => c + ":" + x).join(" ")}] guardado=${guardadoDia} calculado=${texto}`);
    }
  }
  console.log("tipo de media · tipo de digitación → coincidencia exacta del día (col. 99) de variables digitadas");
  for (const [k, s] of Object.entries(st).sort()) {
    const tot = s.ok + s.mal;
    console.log(`  ${k}: ${tot ? ((100 * s.ok) / tot).toFixed(2) : "—"}% (${s.ok}/${tot}) · día guardado sin columnas: ${s.soloDia} · columnas sin día guardado: ${s.sinDia}`);
    s.ej.forEach((e) => console.log("     " + e));
  }
  await g.cerrar();
})().catch((e) => { console.error(e); process.exit(1); });
