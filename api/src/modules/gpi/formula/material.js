// Funciones del módulo Material en proceso: GetMassaBrix, GetMassaPol, GetAlcoolDorna.
// Deducidas contra los valores guardados por el VB6 (tools/gpi-probar-material.js):
//  - Masa de Brix / Pol (producto 1, azúcar), en kg:
//      Σ equipos  capacidad · llenado% /100 · densidad(Brix) · (Brix | Pol) /100 / 1000
//    llenado = lo digitado ese día (GI_LAB_DIG_MATER_PROCESSO.MPR_VALOR; sin fila = 0);
//    Brix y Pol = último valor disponible de la variable del equipo (ID_VAR_BRIX / ID_VAR_POL).
//    Verificado: 15/15 días (10–24/10/2026), Brix y Pol.
//  - Alcohol en dornas (producto 2, álcool), en litros: Σ equipos con ID_VAR_GL  capacidad · llenado% · GL / 10.000.
//    Verificado 12/15 días recientes. PENDIENTE: los tanques de jugo sin variable GL (p. ej. 224, 349, 361) aportan
//    además ≈0,68 × Pol del jugo clarificado (#8595) con ±1% de dispersión; no se replica (ver gpi-motor-formulas.md).

const { densBrix } = require("./tablas");

// datos: { cfg:[{P,E,CAP,B,PL,GL}], dens:[filas], llenado(P,E,fecha), ultimo(idVar,fecha) }
function calcular(nombre, fecha, datos) {
  const num = (x) => (x === null || x === undefined || x === "" || Number.isNaN(Number(x)) ? 0 : Number(x));
  let total = 0;
  if (nombre === "BRIX" || nombre === "POL") {
    for (const c of datos.cfg) {
      if (c.P !== "1") continue;
      const v = num(datos.llenado(c.P, c.E, fecha));
      if (!v) continue;
      const bx = num(datos.ultimo(c.B, fecha));
      const x = nombre === "BRIX" ? bx : num(datos.ultimo(c.PL, fecha));
      total += ((c.CAP * v / 100) * (densBrix(datos.dens, 1, bx) ?? 1) * x / 100) / 1000;
    }
    return total;
  }
  if (nombre === "ALCOOL") {
    for (const c of datos.cfg) {
      if (c.P !== "2" || !c.GL) continue;
      const v = num(datos.llenado(c.P, c.E, fecha));
      if (!v) continue;
      total += (c.CAP * v * num(datos.ultimo(c.GL, fecha))) / 1e4;
    }
    return total;
  }
  return null;
}

module.exports = { calcular };
