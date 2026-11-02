// Reglas del cálculo del GPI deducidas de los valores que guardó el VB6. Las usan tanto la API
// como el arnés de validación (tools/gpi-validar-formulas.js), para que lo validado sea lo que corre.
// Evidencia y cifras: docs/analisis/gpi-motor-formulas.md.
const { aNumero, esNulo, horaDec, decHora } = require("./evaluador");
const { vbFormatRound } = require("./tablas");

const COLUNA_DIA = 99;

// Valor que devuelve GetAnalise(plan, nombre, idVar, nombre[, bandera]).
//  - En el cálculo del día (col. 99): valor del día de la referencia.
//  - Bandera 1: valor de la misma columna y, si falta, el último valor diario disponible.
//  - Sin bandera: valor de la misma columna (un faltante es nulo y se propaga; Nvl lo reemplaza).
// fuentes = { columna(id, col), dia(id), ultimo(id) } sobre la fecha que se calcula.
function resolverAnalise(fuentes, idRef, col, bandera) {
  const enDia = col === COLUNA_DIA;
  if (bandera === 1) return (enDia ? null : fuentes.columna(idRef, col)) ?? fuentes.ultimo(idRef);
  if (enDia) return fuentes.dia(idRef);
  return fuentes.columna(idRef, col);
}

// Valor tal como se guarda en MOV_VALOR: redondeado a la máscara con Format de VB6
// (las variables de hora y de texto se guardan como vienen).
function valorAGuardar(variable, valor) {
  const n = aNumero(valor);
  if (n === null || variable.VAR_TIPO_DIG === 3 || variable.VAR_MAS_DEC == null) return valor;
  return vbFormatRound(n, variable.VAR_MAS_DEC);
}

// Largo máximo de GI_LAB_LANC_MOV_*.MOV_VALOR (VARCHAR2(20)).
const MAX_LARGO_VALOR = 20;

// Texto EXACTO que se guardaría en MOV_VALOR (M6). Reglas observadas en 7.532 valores numéricos guardados por el VB6 (15-18/10/2026), todas con
// la cantidad de decimales de la máscara de la variable (VAR_MAS_DEC), punto decimal, sin separador de miles, sin notación científica y sin «-0»:
//   - numérico con máscara: Format de VB6 a esa cantidad de decimales («1375.540», «395901» con 0 decimales);
//   - variable de hora (VAR_TIPO_DIG = 3): en las columnas «h:mm» sin rellenar la hora («8:30», «0:00»); un valor ya en texto se deja como viene.
//     El RESULTADO DEL DÍA (col. 99, `dia: true`) de esas variables se guarda en horas decimales con hasta 3 decimales y sin ceros finales
//     («9.333», «15.5», «11», «0»), verificado con 24 variables de hora el 1-21/10/2026;
//   - texto («ANIDRO»): tal cual.
// Devuelve null si no hay valor. Lanza un Error si el texto excede los 20 caracteres de la columna.
function aTextoGuardado(variable, valor, { dia = false } = {}) {
  if (esNulo(valor)) return null;
  const n = aNumero(valor);
  let texto;
  if (variable.VAR_TIPO_DIG === 3 && dia) {
    const h = horaDec(valor);
    if (h === null) return null;
    texto = String(Number(vbFormatRound(h, 3).toFixed(3))); // 9.333, 15.5, 11, 0 (sin ceros finales)
  } else if (variable.VAR_TIPO_DIG === 3) {
    texto = typeof valor === "number" ? decHora(valor) : String(valor).trim();
  } else if (n === null) {
    texto = String(valor).trim();
  } else if (variable.VAR_MAS_DEC == null) {
    texto = sinNotacionCientifica(n);
  } else {
    const r = vbFormatRound(n, variable.VAR_MAS_DEC);
    texto = (Object.is(r, -0) || r === 0 ? 0 : r).toFixed(variable.VAR_MAS_DEC); // un cero negativo se guarda como cero
  }
  if (texto.length > MAX_LARGO_VALOR) throw new Error(`El valor «${texto.slice(0, 24)}…» excede los ${MAX_LARGO_VALOR} caracteres de MOV_VALOR`);
  return texto;
}

// Número sin exponente («1e-7» → «0.0000001») y sin el ruido binario de los double («0.30000000000000004» → «0.3»).
function sinNotacionCientifica(n) {
  const p = Number(n.toPrecision(15));
  if (!/e/i.test(String(p))) return String(p);
  return p.toFixed(20).replace(/0+$/, "").replace(/\.$/, "");
}

// Resultado del día (col. 99) a partir de las columnas YA redondeadas: suma si VAR_TIPO_MEDIA = 3,
// media aritmética en los demás tipos. En variables de hora el día va en horas decimales.
function agregarDia(variable, valoresColumnas) {
  // En variables de hora cada columna entra en horas decimales ya redondeadas a 3 decimales (el VB6 suma esos valores: 11.917 + 11.917 = 23.834).
  const aNum = variable.VAR_TIPO_DIG === 3 ? (x) => { const h = horaDec(x); return h === null ? null : vbFormatRound(h, 3); } : aNumero;
  const nums = valoresColumnas.filter((x) => !esNulo(x)).map(aNum).filter((x) => x !== null);
  if (!nums.length) return null;
  const suma = nums.reduce((s, x) => s + x, 0);
  return variable.VAR_TIPO_MEDIA === 3 ? suma : suma / nums.length;
}

// El VB6 no calcula variables inactivas (VAR_STATUS ≠ 1 para la empresa, o planilla inactiva).
const seCalcula = (statusVar, statusPlan) => statusVar === 1 && statusPlan === 1;

module.exports = { COLUNA_DIA, MAX_LARGO_VALOR, resolverAnalise, valorAGuardar, aTextoGuardado, agregarDia, seCalcula };
