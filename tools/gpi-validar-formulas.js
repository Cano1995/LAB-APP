// Arnés de validación del motor de fórmulas del GPI contra los valores que calculó el VB6.
// SOLO LECTURA. Para cada día de la muestra recalcula cada variable calculada usando como
// entradas los valores guardados de sus dependencias (cada fórmula se prueba aislada) y
// compara con lo guardado (tolerancia: medio dígito del último decimal de la máscara).
//
// Reglas deducidas (detalle y cifras en docs/analisis/gpi-motor-formulas.md):
//  - Se usa la fórmula VIGENTE en cada fecha (historial GI_LAB_RASTREA; HISTORIAL=0 lo desactiva).
//  - Columna 99 (día) = agregado de las columnas ya redondeadas a la máscara (Format VB6):
//    suma si VAR_TIPO_MEDIA=3, media aritmética en los demás tipos; en variables de hora
//    (VAR_TIPO_DIG=3) el día se guarda en horas decimales. (tools/gpi-analizar-media-dia.js)
//  - GetAnalise(…,1) y GetMedia sin fecha → último valor diario disponible (política U).
//
// Métricas: coincidencia en celdas guardadas (columnas y día), variables 100% correctas y
// "sobrantes" = celdas de columnas existentes donde el VB6 no guardó nada y el motor calcula
// algo (lo que se escribiría de más si se habilitara la escritura).
//
// Uso (desde la raíz): node tools/gpi-validar-formulas.js 2026-10-01 2026-10-20 [empresa=1] [safra=2026] [--detalle]
// Entorno: SOBRANTES=<política> lista sobrantes · DIF=P1,P2 variables que empeoran en P2 · HISTORIAL=0 · REDONDEO=round
const { cargar, COL_DIA, aNumero, esNulo, sumarDias, reglas } = require("./lib/gpi-datos");

const { leerArgs } = require("./lib/args");
const { desde, hasta, empr: EMPR, safra: SAFRA, banderas } = leerArgs(
  [{ nombre: "desde", tipo: "fecha", requerido: true }, { nombre: "hasta", tipo: "fecha", requerido: true }, { nombre: "empr", tipo: "entero", defecto: 1 }, { nombre: "safra", tipo: "entero", defecto: 2026 }],
  "node tools/gpi-validar-formulas.js AAAA-MM-DD AAAA-MM-DD [empresa=1] [safra=2026] [--detalle]");
if (hasta < desde) { console.error("«hasta» es anterior a «desde»."); process.exit(2); }
const DETALLE = banderas.includes("--detalle");
const unaLinea = (s) => String(s || "").replace(/\s+/g, " ");

(async () => {
  const g = await cargar({ hasta, empr: EMPR, safra: SAFRA });
  console.log(`vars ${g.vars.length} · días cargados ${g.datos.size} · historial de fórmulas ${process.env.HISTORIAL === "0" ? "NO" : "sí"} (${g.historial.size} vars) · safra ${JSON.stringify(g.par)}`);

  const resultados = {};
  for (const [nombre, pol] of Object.entries(g.POLITICAS)) {
    const r = (resultados[nombre] = {
      col: { ok: 0, mal: 0 }, dia: { ok: 0, mal: 0 }, colEx: { ok: 0, mal: 0 }, diaEx: { ok: 0, mal: 0 }, exMal: new Map(), porTipo: {}, errores: {}, malVars: new Map(),
      retroactivas: 0, sobrantes: 0, sobrantesVars: new Map(), sobrantesCeros: 0, sobrantesEj: new Map(), varsOk: 0, varsTot: 0,
    });
    const varOk = new Map(); // idVar → ¿todas sus celdas coinciden?
    for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
      const dv = g.datos.get(fecha); if (!dv) continue;
      for (const [id] of g.asts) {
        const v = g.porId.get(id);
        const guard = dv.get(id) || new Map();
        // Variable creada después de este día: sus valores son de un recálculo retroactivo posterior.
        if (g.retroactiva(id, fecha)) { r.retroactivas += guard.size; continue; }
        const evalCol = (col) => g.evaluarCelda(id, fecha, col, pol);

        // Sobrantes: solo variables activas (el VB6 no calcula las inactivas).
        for (const col of g.activa(id) ? g.colsPlan.get(`${fecha}:${v.ID_PLAN}`) || [] : []) {
          if (guard.has(col)) continue;
          let x = null;
          try { x = evalCol(col); } catch { x = null; }
          if (esNulo(x)) continue;
          r.sobrantes++;
          r.sobrantesVars.set(id, (r.sobrantesVars.get(id) || 0) + 1);
          if (aNumero(x) === 0) r.sobrantesCeros++;
          if (!r.sobrantesEj.has(id)) r.sobrantesEj.set(id, `${fecha} col${col} → ${x}`);
        }
        if (!guard.size) continue;

        const calculadas = new Map();
        const registrar = (col, guardado, calc, err) => {
          const ok = !err && g.coincide(v, guardado, calc);
          const k = col === COL_DIA ? "dia" : "col";
          r[k][ok ? "ok" : "mal"]++;
          // Comparación EXACTA (M5): el texto que se guardaría con la máscara de la variable debe ser idéntico al que guardó el VB6. La tolerancia de
          // arriba (media unidad del último decimal) no distingue un redondeo mal hecho; esta sí.
          let okEx = false;
          if (!err) { try { okEx = reglas.aTextoGuardado(v, calc, { dia: col === COL_DIA }) === (esNulo(guardado) ? null : String(guardado).trim()); } catch { okEx = false; } }
          r[k + "Ex"][okEx ? "ok" : "mal"]++;
          if (ok && !okEx) { const e = r.exMal.get(id) || { n: 0, ej: null }; e.n++; if (!e.ej) e.ej = `${fecha} col${col}: guardado=${guardado} texto=${(() => { try { return reglas.aTextoGuardado(v, calc, { dia: col === COL_DIA }); } catch (x) { return "ERR " + x.message.slice(0, 30); } })()} calculado=${calc}`; r.exMal.set(id, e); }
          const tk = `${k}·media${v.VAR_TIPO_MEDIA}`;
          (r.porTipo[tk] ||= { ok: 0, mal: 0 })[ok ? "ok" : "mal"]++;
          if (err) r.errores[err] = (r.errores[err] || 0) + 1;
          if (!ok) {
            const m = r.malVars.get(id) || { n: 0, ej: null };
            m.n++; if (!m.ej) m.ej = `${fecha} col${col}: guardado=${guardado} calculado=${err ? "ERR " + err : calc}`;
            r.malVars.set(id, m);
          }
          varOk.set(id, (varOk.get(id) ?? true) && ok);
        };
        for (const [col, guardado] of guard) {
          if (col === COL_DIA) continue;
          let calc, err;
          try { calc = evalCol(col); } catch (e) { err = e.message.replace(/\d+/g, "#").slice(0, 70); }
          // Se guarda redondeado a la máscara (Format VB6); el día agrega los valores ya redondeados.
          calculadas.set(col, err ? undefined : process.env.REDONDEO === "round" ? (aNumero(calc) === null || v.VAR_TIPO_DIG === 3 ? calc : g.redondear(aNumero(calc), v.VAR_MAS_DEC ?? 2)) : reglas.valorAGuardar(v, calc));
          registrar(col, guardado, calc, err);
        }
        if (guard.has(COL_DIA)) {
          let calc, err;
          try {
            if (calculadas.size) {
              if ([...calculadas.values()].some((x) => x === undefined)) throw new Error("columna con error");
              calc = reglas.agregarDia(v, [...calculadas.values()]);
            } else calc = evalCol(COL_DIA); // variable sin columnas: se evalúa sobre los valores del día
          } catch (e) { err = e.message.replace(/\d+/g, "#").slice(0, 70); }
          registrar(COL_DIA, guard.get(COL_DIA), calc, err);
        }
      }
    }
    r.varsTot = varOk.size; r.varsOk = [...varOk.values()].filter(Boolean).length;
  }

  const pct = (x) => `${((100 * x.ok) / Math.max(1, x.ok + x.mal)).toFixed(2)}% (${x.ok}/${x.ok + x.mal})`;
  for (const [nombre, r] of Object.entries(resultados)) {
    console.log(`\n=== Política ${nombre}: columnas ${pct(r.col)} · día(99) ${pct(r.dia)} · variables 100% correctas ${r.varsOk}/${r.varsTot} · sobrantes ${r.sobrantes} celdas en ${r.sobrantesVars.size} vars (${r.sobrantesCeros} ceros) · omitidas por recálculo retroactivo ${r.retroactivas}`);
    console.log(`  EXACTA (texto idéntico al guardado): columnas ${pct(r.colEx)} · día(99) ${pct(r.diaEx)} · celdas que pasan la tolerancia pero no la igualdad exacta: ${r.exMal.size} variables`);
    console.log("  por tipo:", Object.entries(r.porTipo).sort().map(([k, x]) => `${k} ${pct(x)}`).join(" | "));
  }
  if (process.env.EXACTO) {
    // EXACTO=UV: variables que coinciden dentro de la tolerancia pero no en el texto guardado.
    const lista = [...resultados[process.env.EXACTO].exMal].sort((a, b) => b[1].n - a[1].n).slice(0, 25);
    console.log(`\nDiferencias solo en la comparación exacta (${process.env.EXACTO}):`);
    for (const [id, m] of lista) { const v = g.porId.get(id); console.log(`  ${id} ${v.VAR_NOM_VAR} [med${v.VAR_TIPO_MEDIA} dec${v.VAR_MAS_DEC} dig${v.VAR_TIPO_DIG}] ×${m.n} · ${m.ej}`); }
  }
  if (process.env.DIF) {
    const [p1, p2] = process.env.DIF.split(",");
    for (const [id, m] of resultados[p2].malVars) {
      const m1 = resultados[p1].malVars.get(id);
      if ((m1?.n || 0) < m.n) { const v = g.porId.get(id); console.log(`  peor en ${p2}: ${id} ${v.VAR_NOM_VAR} plan${v.ID_PLAN} ×${m.n - (m1?.n || 0)} · ${m.ej} · ${unaLinea(v.VAR_FORMULA).slice(0, 150)}`); }
    }
  }
  if (process.env.SOBRANTES) {
    const r2 = resultados[process.env.SOBRANTES];
    for (const [id, n] of [...r2.sobrantesVars].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
      const v = g.porId.get(id);
      console.log(`  sobrante ${id} ${v.VAR_NOM_VAR} plan${v.ID_PLAN} ×${n} · ${r2.sobrantesEj.get(id)} · ${unaLinea(v.VAR_FORMULA).slice(0, 140)}`);
    }
  }
  const r = resultados.UV;
  console.log("\nErrores (UV):", Object.entries(r.errores).sort((a, b) => b[1] - a[1]).slice(0, 20));
  console.log("\nVariables con discrepancias (UV):");
  for (const [id, m] of [...r.malVars].sort((a, b) => b[1].n - a[1].n).slice(0, DETALLE ? 200 : 40)) {
    const v = g.porId.get(id);
    console.log(`  ${id} ${v.VAR_NOM_VAR} [med${v.VAR_TIPO_MEDIA} dec${v.VAR_MAS_DEC} dig${v.VAR_TIPO_DIG}] ×${m.n} · ${m.ej} · ${unaLinea(v.VAR_FORMULA).slice(0, 120)}`);
  }
  await g.cerrar();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
