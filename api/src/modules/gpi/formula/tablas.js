// Funciones de tabla del GPI, con la semántica exacta que se dedujo de los valores
// que guardó el VB6 (ver docs/analisis/gpi-motor-formulas.md). No interpolan: buscan una fila.

// Round() de VB6: opera sobre el double y, ante un empate exacto, redondea al par.
// Ej.: vbRound(99.85, 1) = 99.8 (99.85 es 99.8499… en binario); vbRound(0.25, 1) = 0.2.
function vbRound(x, dec = 0) {
  if (x === null || x === undefined || !Number.isFinite(x)) return null;
  const f = 10 ** dec;
  const y = x * f;
  const piso = Math.floor(y);
  const resto = y - piso;
  let r;
  if (resto > 0.5) r = piso + 1;
  else if (resto < 0.5) r = piso;
  else r = piso % 2 === 0 ? piso : piso + 1;
  return r / f;
}

// Format() de VB6 con máscara de decimales: redondea la mitad alejándose de cero sobre la
// representación decimal (no sobre el double), p. ej. 2.675 → "2.68".
function vbFormatRound(x, dec = 0) {
  if (x === null || x === undefined || !Number.isFinite(x)) return null;
  const s = Math.abs(x).toPrecision(15); // corrige el ruido binario antes de redondear
  const f = 10 ** dec;
  const r = Math.floor(Number(s) * f + 0.5 + 1e-9) / f;
  return x < 0 ? -r : r;
}

// Masa específica del alcohol (GI_LAB_TAB_ME_ALCOOL), columna ME a 20 °C.
//  tipo 1: INPM → ME20. Se redondea el INPM a 1 decimal (Round VB6) y se busca la fila exacta.
//  tipo 0: ME20 → INPM. Fila con la menor ME20 que sea >= al valor (verificado: 800,0 → 96,4;
//          790,1 → 99,7; 790,0 → 99,8). Un valor faltante cuenta como 0 → INPM 100.
function meAlcool(filas, tipo, valor) {
  const v = valor ?? 0;
  if (tipo === 1) {
    const inpm = vbRound(v, 1);
    const f = filas.find((r) => Math.abs(r.MEA_INPM - inpm) < 1e-9);
    return f ? f.MEA_ME20 : null;
  }
  let mejor = null;
  for (const r of filas) if (r.MEA_ME20 >= v - 1e-9 && (!mejor || r.MEA_ME20 < mejor.MEA_ME20)) mejor = r;
  return mejor ? mejor.MEA_INPM : null;
}

// Densidad del Brix (GI_LAB_TAB_DENS_BRIX).
//  tipo 1: Brix → densidad. Brix redondeado a 1 decimal (Round VB6) y fila exacta (verificado).
//  tipo 0: densidad → Brix. Por simetría con meAlcool: fila con la menor densidad >= valor
//          (sin uso verificado en producción; ver validación).
function densBrix(filas, tipo, valor) {
  // Sin entrada no hay resultado (el VB6 no guarda nada; verificado con la métrica de sobrantes).
  if (valor === null || valor === undefined) return null;
  const v = valor;
  if (tipo === 1) {
    const bx = vbRound(v, 1);
    const f = filas.find((r) => Math.abs(r.TDB_BRIX - bx) < 1e-9);
    return f ? f.TDB_DENSIDADE : null;
  }
  let mejor = null;
  for (const r of filas) if (r.TDB_DENSIDADE != null && r.TDB_DENSIDADE >= v - 1e-9 && (!mejor || r.TDB_DENSIDADE < mejor.TDB_DENSIDADE)) mejor = r;
  return mejor ? mejor.TDB_BRIX : null;
}

// Tablas genéricas: GetTabGen(cod, nombre, campo, desc, valor) devuelve el OTRO campo de la fila
// cuyo campo indicado = valor, vigente a la fecha (la vigencia más reciente <= fecha).
function tabGen(filas, cod, campo, valor, fecha, { aNumero }) {
  if (valor === null || valor === undefined || valor === "") return null;
  const busca = campo === 2 ? "GEN_CAMPO2" : "GEN_CAMPO1";
  const da = campo === 2 ? "GEN_CAMPO1" : "GEN_CAMPO2";
  const igual = (x) => {
    const a = aNumero(x), b = aNumero(valor);
    return a !== null && b !== null ? a === b : String(x).trim() === String(valor).trim();
  };
  let mejor = null;
  for (const r of filas) {
    if (r.GEN_CODIGO !== cod || r.VIG > fecha || !igual(r[busca])) continue;
    if (!mejor || r.VIG > mejor.VIG) mejor = r;
  }
  return mejor ? mejor[da] : null;
}

// GetTanque('CAP-Tanq.Est.' | 'FAT-Tanq.Est.' | ...-Tanq.Med., id) → capacidad o factor.
function tanque(est, med, tipo, id) {
  const t = (/MED/i.test(tipo) ? med : est).find((r) => r.ID_TANQUE === id);
  if (!t) return null;
  return /^CAP/i.test(tipo) ? t.TAN_CAPAC : t.TAN_FATOR;
}

module.exports = { vbRound, vbFormatRound, meAlcool, densBrix, tabGen, tanque };
