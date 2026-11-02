// Deduce GetMassaBrix / GetMassaPol / GetAlcoolDorna (SOLO LECTURA): prueba candidatas contra lo guardado.
// Uso: node tools/gpi-probar-material.js <desde> <hasta> [empr] [safra]
const { cargar, COL_DIA, aNumero, sumarDias, tablas } = require("./lib/gpi-datos");

(async () => {
  const [desde, hasta] = [process.argv[2], process.argv[3]];
  const empr = Number(process.argv[4] || 1), safra = Number(process.argv[5] || 2026);
  const g = await cargar({ hasta, empr, safra });
  const S = g.S;
  const cfg = await g.q(`SELECT MPR_PRODUTO P, MPR_COD_EQP E, MPR_CAPACIDADE CAP, ID_VAR_BRIX B, ID_VAR_POL PL, ID_VAR_GL GL FROM ${S}.GI_LAB_CAD_MATER_PROCESSO WHERE COD_EMPR=${empr}`);
  const dens = await g.q(`SELECT TDB_BRIX, TDB_DENSIDADE FROM ${S}.GI_LAB_TAB_DENS_BRIX`);
  const dig = await g.q(`SELECT MPR_PRODUTO P, MPR_COD_EQP E, TO_CHAR(MPR_DATA,'YYYY-MM-DD') D, MPR_VALOR V FROM ${S}.GI_LAB_DIG_MATER_PROCESSO WHERE COD_EMPR=${empr} AND MPR_DATA >= TO_DATE('${par0(g)}','YYYY-MM-DD') AND MPR_DATA <= TO_DATE('${hasta}','YYYY-MM-DD')`);
  function par0(g) { return g.par?.I || "2026-04-01"; }
  const num = (x) => aNumero(x) ?? 0;
  const hist = new Map(); // "P|E" → [{D,V}] ordenado
  for (const d of dig) { const k = `${d.P}|${d.E}`; if (!hist.has(k)) hist.set(k, []); hist.get(k).push(d); }
  for (const v of hist.values()) v.sort((a, b) => (a.D < b.D ? -1 : 1));
  const guardado = (f, id) => num(g.val(f, id, COL_DIA));
  const llenado = (k, f, modo) => {
    const h = hist.get(k) || [];
    if (modo === "dia") return num(h.find((x) => x.D === f)?.V);
    for (let i = h.length - 1; i >= 0; i--) if (h[i].D <= f && (modo === "ultimo" ? true : h[i].V !== 0)) return h[i].V;
    return 0;
  };
  const varDe = (f, id, modo) => num(modo === "dia" ? g.diaDe(f, id) : g.ultimo(f, id));
  const _masa = (f, mLleno, mVar, campo) => cfg.filter((c) => c.P === "1").reduce((s, c) => {
    const v = llenado(`${c.P}|${c.E}`, f, mLleno); if (!v) return s;
    const bx = varDe(f, c.B, mVar), pv = campo === "B" ? bx : varDe(f, c.PL, mVar);
    return s + (c.CAP * v / 100 * (tablas.densBrix(dens, 1, bx) ?? 1) * pv / 100) / 1000;
  }, 0);

  // Alcohol en dornas (289): equipos del producto 2. Candidatas sobre capacidad·llenado·GL.
  const eqs2 = cfg.filter((c) => c.P === "2");
  console.log("equipos producto 2:", eqs2.length, "con GL:", eqs2.filter((c) => c.GL).length, "vars GL:", [...new Set(eqs2.map((c) => c.GL))].join(","));
  for (const f of (process.env.DETALLE || "").split(",").filter(Boolean)) {
    const t = guardado(f, 289);
    let tot = 0;
    console.log("== detalle", f, "guardado", t);
    for (const c of eqs2) {
      const v = llenado(`2|${c.E}`, f, "dia"); if (!v) continue;
      const gl = varDe(f, c.GL, "ultimo"), glDia = c.GL ? g.diaDe(f, c.GL) : null;
      const x = c.CAP * v * gl / 1e4; tot += x;
      console.log(" eq", c.E, "cap", c.CAP, "ll", v, "GLvar", c.GL, "gl(ult)", gl, "gl(dia)", glDia, "→", Math.round(x));
    }
    console.log(" total", Math.round(tot), "falta", Math.round(t - tot));
  }
  // Equipos sin variable GL que aportan alcohol: fracción k implícita por día y variable candidata.
  const dias = (process.env.FALLAN || "").split(",").filter(Boolean);
  if (dias.length) {
    const sinGl = eqs2.filter((c) => !c.GL);
    const ks = dias.map((f) => {
      const conGl = eqs2.filter((c) => c.GL).reduce((a, c) => { const v = llenado(`2|${c.E}`, f, "dia"); return a + (v ? c.CAP * v * varDe(f, c.GL, "ultimo") / 1e4 : 0); }, 0);
      const litros = sinGl.reduce((a, c) => a + c.CAP * llenado(`2|${c.E}`, f, "dia") / 100, 0);
      return { f, k: litros ? ((guardado(f, 289) - conGl) / litros) * 100 : null, litros };
    });
    console.log("k implícito (% de los litros de equipos sin GL):", JSON.stringify(ks));
    const buenos = [];
    for (const v of g.vars) {
      const xs = ks.map((x) => varDe(x.f, v.ID_VAR, "ultimo"));
      if (xs.some((x) => !x) || ks.some((x) => x.k === null)) continue;
      const r = ks.map((x, i) => x.k / xs[i]);
      const m = r.reduce((a, b) => a + b, 0) / r.length;
      if (Math.max(...r.map((y) => Math.abs(y - m) / Math.abs(m))) < 0.02) buenos.push(`#${v.ID_VAR} ${v.VAR_NOM_VAR} (plan ${v.ID_PLAN}) k/var=${m.toFixed(4)} vals=${xs.join(",")}`);
    }
    console.log("variables proporcionales:", buenos.slice(0, 15).join(" ; ") || "ninguna");
  }
  // Regresión sobre todos los días del rango con equipos sin GL llenos: ¿qué variable es proporcional a k?
  if (process.env.REGRESION) {
    const sinGl = eqs2.filter((c) => !c.GL);
    const dias2 = [];
    for (let f = desde; f <= hasta; f = sumarDias(f, 1)) {
      const t = guardado(f, 289); if (!t) continue;
      const conGl = eqs2.filter((c) => c.GL).reduce((a, c) => { const v = llenado(`2|${c.E}`, f, "dia"); return a + (v ? c.CAP * v * varDe(f, c.GL, "ultimo") / 1e4 : 0); }, 0);
      const litros = sinGl.reduce((a, c) => a + c.CAP * llenado(`2|${c.E}`, f, "dia") / 100, 0);
      if (litros > 20000) dias2.push({ f, k: ((t - conGl) / litros) * 100 });
    }
    if (process.env.RAZON) {
      for (const d of dias2.filter((x) => x.k > 0.5).slice(0, 40)) {
        const pol = varDe(d.f, 8595, "ultimo"), bx = varDe(d.f, 8593, "ultimo"), ls = varDe(d.f, 8594, "ultimo");
        console.log(d.f, "k", d.k.toFixed(4), "pol", pol, "bx", bx, "ls", ls, "k/pol", (d.k / pol).toFixed(4), "k/bx", (d.k / bx).toFixed(4), "k/ls", (d.k / ls).toFixed(4));
      }
    }
    console.log("días con equipos sin GL:", dias2.length, "k>0:", dias2.filter((d) => d.k > 0.5).length);
    const util = dias2.filter((d) => d.k > 0.5);
    const res = [];
    for (const v of g.vars) {
      const r = [];
      for (const d of util) { const x = varDe(d.f, v.ID_VAR, "ultimo"); if (x) r.push(d.k / x); }
      if (r.length < Math.max(3, util.length * 0.6)) continue;
      const sr = [...r].sort((a, b) => a - b), m = sr[Math.floor(sr.length / 2)];
      const ok = r.filter((y) => Math.abs(y - m) / Math.abs(m) < 0.01).length;
      res.push({ id: v.ID_VAR, n: v.VAR_NOM_VAR, plan: v.ID_PLAN, m, ok, tot: r.length });
    }
    res.sort((a, b) => b.ok / b.tot - a.ok / a.tot);
    console.log(res.slice(0, 8).map((x) => `#${x.id} ${x.n} (plan ${x.plan}) k/var=${x.m.toFixed(4)} ${x.ok}/${x.tot}`).join(" ; "));
  }
  await g.cerrar();
})().catch((e) => { console.error(e); process.exit(1); });
