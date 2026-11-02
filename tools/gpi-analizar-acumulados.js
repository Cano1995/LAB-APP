// Deduce cómo el VB6 calcula los acumulados de zafra (GI_LAB_ACUM_{e}_{s}). SOLO LECTURA.
// Para cada variable con fila de acumulado en la fecha dada, arma la serie de resultados diarios (col. 99)
// desde el inicio de la zafra y prueba relaciones candidatas contra ACU_VALOR_ACUM / ACU_DIVISOR_ACUM / ACU_MEDIA,
// agrupando por VAR_TIPO_MEDIA.
// Uso (desde la raíz): node tools/gpi-analizar-acumulados.js 2026-10-20 [empresa=1] [safra=2026]
const { tolerancia } = require("./lib/tolerancia");
const { cargar, COL_DIA, aNumero, sumarDias } = require("./lib/gpi-datos");

const [fecha, EMPR = "1", SAFRA = "2026"] = process.argv.slice(2);

(async () => {
  const g = await cargar({ hasta: fecha, empr: EMPR, safra: SAFRA });
  const acum = await g.q(
    `SELECT ID_VAR, ACU_DIVISOR_ACUM D, ACU_MEDIA M, ACU_VALOR_ACUM V
       FROM ${g.S}.GI_LAB_ACUM_${EMPR}_${SAFRA} WHERE ACU_DATA = TO_DATE(:d, 'YYYY-MM-DD')`,
    { d: fecha },
  );
  console.log(`acumulados en ${fecha}: ${acum.length} variables · inicio de zafra ${g.par?.I}`);

  const decs = (s) => (String(s).split(".")[1] || "").length;
  const igual = (calc, guardado) => {
    const gN = aNumero(guardado);
    if (calc === null || gN === null) return false;
    const tol = tolerancia(decs(guardado), gN);
    return Math.abs(calc - gN) <= tol;
  };

  const serie = (id, desde) => {
    const xs = [];
    for (let d = desde; d <= fecha; d = sumarDias(d, 1)) {
      const x = aNumero(g.datos.get(d)?.get(id)?.get(COL_DIA));
      if (x !== null) xs.push({ d, x });
    }
    return xs;
  };
  const diaNum = (d, id) => aNumero(g.datos.get(d)?.get(id)?.get(COL_DIA));

  const mediaAcum = new Map(acum.map((r) => [r.ID_VAR, r.M]));
  const stats = {};
  const ejemplos = {};
  for (const a of acum) {
    const v = g.porId.get(a.ID_VAR);
    if (!v) continue;
    const xs = serie(a.ID_VAR, g.par.I);
    if (!xs.length) continue;
    const tipo = `media${v.VAR_TIPO_MEDIA}${v.VAR_ORI_POND ? `·pond·zero=${v.VAR_POND_ZERO}` : ""}`;
    const st = (stats[tipo] ||= { n: 0 });
    st.n++;
    const sum = xs.reduce((s, y) => s + y.x, 0);
    const n = xs.length;
    // Ponderación por el ponderador de la variable (resultado del día de VAR_ORI_POND).
    let sw = 0, sxw = 0;
    if (v.VAR_ORI_POND) for (const y of xs) { const w = diaNum(y.d, v.VAR_ORI_POND); if (w !== null) { sw += w; sxw += y.x * w; } }
    const sinCeros = xs.filter((y) => y.x !== 0);
    // Ponderada excluyendo los días con resultado 0.
    let swz = 0, sxwz = 0;
    if (v.VAR_ORI_POND) for (const y of sinCeros) { const w = diaNum(y.d, v.VAR_ORI_POND); if (w !== null) { swz += w; sxwz += y.x * w; } }
    // Tipo 5 ("media calculada"): la fórmula evaluada con los ACUMULADOS (ACU_MEDIA) de sus entradas.
    let formulaAcum = null;
    if (v.VAR_TIPO_MEDIA === 5 && g.asts.has(a.ID_VAR)) {
      try {
        formulaAcum = g.evaluarCelda(a.ID_VAR, fecha, COL_DIA, { analiseCustom: (idRef) => mediaAcum.get(idRef) ?? null });
      } catch { formulaAcum = null; }
    }
    const cand = {
      "M=fórmula sobre acumulados": formulaAcum === null ? false : igual(aNumero(formulaAcum), a.M),
      "V=Σx": igual(sum, a.V),
      "V=Σx · M=Σx/n": igual(sum, a.V) && igual(sum / n, a.M),
      "M=Σx/n": igual(sum / n, a.M),
      "M=Σx": igual(sum, a.M),
      "D=n": igual(n, a.D),
      "D=1": igual(1, a.D),
      "M=media sin ceros": sinCeros.length ? igual(sinCeros.reduce((s, y) => s + y.x, 0) / sinCeros.length, a.M) : false,
      "D=n sin ceros": igual(sinCeros.length, a.D),
      "M=último": igual(xs[xs.length - 1].x, a.M),
      "V=Σxw · D=Σw": sw ? igual(sxw, a.V) && igual(sw, a.D) : false,
      "M=Σxw/Σw": sw ? igual(sxw / sw, a.M) : false,
      "M=Σxw/Σw sin x=0": swz ? igual(sxwz / swz, a.M) : false,
      "D=Σw sin x=0": swz ? igual(swz, a.D) : false,
      "D=Σw": sw ? igual(sw, a.D) : false,
      "V=Σxw": sw ? igual(sxw, a.V) : false,
      "V=M·D": igual(aNumero(a.M) * aNumero(a.D), a.V),
    };
    for (const [k, ok] of Object.entries(cand)) if (ok) st[k] = (st[k] || 0) + 1;
    if (/^media2·pond/.test(tipo) && !cand["M=Σxw/Σw"] && (g.fallos2 ||= []).length < 6) g.fallos2.push(`${a.ID_VAR} ${v.VAR_NOM_VAR} pond=${v.VAR_ORI_POND} zero=${v.VAR_POND_ZERO}: M=${a.M} D=${a.D} V=${a.V} | Σxw/Σw=${sw ? (sxw / sw).toFixed(4) : "-"} Σw=${sw.toFixed(3)} n=${n}`);
    if (!ejemplos[tipo]) ejemplos[tipo] = `${a.ID_VAR} ${v.VAR_NOM_VAR}: V=${a.V} M=${a.M} D=${a.D} · n=${n} Σ=${sum.toFixed(3)} último=${xs[xs.length - 1].x}`;
  }
  for (const [tipo, st] of Object.entries(stats).sort()) {
    const lst = Object.entries(st).filter(([k]) => k !== "n").sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, c]) => `${k} ${((100 * c) / st.n).toFixed(0)}%`);
    console.log(`${tipo.padEnd(14)} n=${String(st.n).padEnd(5)} ${lst.join(" · ")}\n               ej: ${ejemplos[tipo]}`);
  }
  if (g.fallos2) console.log("\nfallos tipo 2 ponderado:\n  " + g.fallos2.join("\n  "));
  await g.cerrar();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
