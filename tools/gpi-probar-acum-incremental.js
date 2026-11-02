// ¿El acumulado del VB6 es incremental? (SOLO LECTURA)
// Prueba: ACUM(D) = ACUM(D-1) combinado con el resultado del día D, sin recalcular la zafra entera.
// Uso: node tools/gpi-probar-acum-incremental.js <desde> <hasta> [empr] [safra]
const { cargar, aNumero, sumarDias } = require("./lib/gpi-datos");

(async () => {
  const [desde, hasta] = [process.argv[2], process.argv[3]];
  const empr = Number(process.argv[4] || 1), safra = Number(process.argv[5] || 2026);
  const g = await cargar({ hasta, empr, safra });
  const S = g.S;
  const filas = await g.q(`SELECT ID_VAR, TO_CHAR(ACU_DATA,'YYYY-MM-DD') D, ACU_VALOR_ACUM V, ACU_DIVISOR_ACUM DV, ACU_MEDIA M FROM ${S}.GI_LAB_ACUM_${empr}_${safra} WHERE ACU_DATA BETWEEN TO_DATE('${sumarDias(desde, -1)}','YYYY-MM-DD') AND TO_DATE('${hasta}','YYYY-MM-DD')`);
  const porVar = new Map();
  for (const r of filas) { if (!porVar.has(r.ID_VAR)) porVar.set(r.ID_VAR, new Map()); porVar.get(r.ID_VAR).set(r.D, r); }
  const cerca = (a, b) => { const x = aNumero(a), y = aNumero(b); return x !== null && y !== null && Math.abs(x - y) <= Math.max(0.011, Math.abs(y) * 1e-6); };
  const st = {};
  const ej = {};
  for (const [id, m] of porVar) {
    const v = g.porId.get(id); if (!v) continue;
    const tipo = `media${v.VAR_TIPO_MEDIA}${v.VAR_ORI_POND ? "·pond" : ""}`;
    const s = (st[tipo] ||= { n: 0, ok: 0 });
    for (let f = desde; f <= hasta; f = sumarDias(f, 1)) {
      const hoy = m.get(f), ayer = m.get(sumarDias(f, -1));
      if (!hoy || !ayer) continue;
      const x = aNumero(g.diaDe(f, id));
      let ok = false;
      if (v.VAR_TIPO_MEDIA === 3) ok = cerca(aNumero(ayer.V) + (x ?? 0), hoy.V);
      else if (v.VAR_TIPO_MEDIA === 1) ok = x === null ? cerca(ayer.V, hoy.V) : cerca(aNumero(ayer.V) + x, hoy.V) && cerca(aNumero(ayer.DV) + 1, hoy.DV);
      else if (v.VAR_TIPO_MEDIA === 2 && v.VAR_ORI_POND) {
        const w = aNumero(g.diaDe(f, v.VAR_ORI_POND));
        if (x === null || x === 0 || w === null) ok = cerca(ayer.DV, hoy.DV); // día excluido
        else ok = cerca(aNumero(ayer.DV) + w, hoy.DV) && cerca(aNumero(ayer.V) + x * w, hoy.V);
      } else continue;
      s.n++; if (ok) s.ok++; else (ej[tipo] ||= []).length < 4 && ej[tipo].push(`${id} ${f} ayer(V=${ayer.V},D=${ayer.DV}) hoy(V=${hoy.V},D=${hoy.DV}) x=${x}`);
    }
  }
  for (const [t, s] of Object.entries(st)) console.log(t, `${s.ok}/${s.n}`, ((100 * s.ok) / s.n).toFixed(1) + "%", "\n  fallos:", (ej[t] || []).join(" | "));
  await g.cerrar();
})().catch((e) => { console.error(e); process.exit(1); });
