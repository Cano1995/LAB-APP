// Reglas de guardado del GPI (Sprint 16: M5, M6, M7). Los casos salen de valores reales que guardó el VB6 (DESA, 1-21/10/2026).
const test = require("node:test");
const assert = require("node:assert/strict");
Object.assign(process.env, { DB_USER: "TEST", DB_PASSWORD: "x", DB_CONNECT_STRING: "localhost/TEST", JWT_SECRET: "una-clave-de-prueba-larga-y-aleatoria-0123456789abcdef" });
const { aTextoGuardado, agregarDia, valorAGuardar } = require("../src/modules/gpi/formula/reglas");
const { vbRound, vbFormatRound } = require("../src/modules/gpi/formula/tablas");

const num = (dec) => ({ VAR_TIPO_DIG: 0, VAR_MAS_DEC: dec, VAR_TIPO_MEDIA: 2 });
const hora = { VAR_TIPO_DIG: 3, VAR_MAS_DEC: 2, VAR_TIPO_MEDIA: 3 };

test("M6: el texto guardado lleva exactamente los decimales de la máscara", () => {
  assert.equal(aTextoGuardado(num(3), 1375.54), "1375.540");
  assert.equal(aTextoGuardado(num(2), 708.56), "708.56");
  assert.equal(aTextoGuardado(num(2), 99.60000000000001), "99.60");
  assert.equal(aTextoGuardado(num(1), 1064.15), "1064.2"); // la mitad se aleja de cero sobre la representación decimal
  assert.equal(aTextoGuardado(num(0), 395901), "395901");
  assert.equal(aTextoGuardado(num(0), 395901.4), "395901");
  assert.equal(aTextoGuardado(num(0), 395901.5), "395902");
  assert.equal(aTextoGuardado(num(2), "12,5"), "12.50"); // texto con coma decimal
  assert.equal(aTextoGuardado(num(2), -3.456), "-3.46");
});

test("M6: nunca sale notación científica, ruido binario ni «-0»", () => {
  assert.equal(aTextoGuardado(num(2), 0.1 + 0.2), "0.30");
  assert.equal(aTextoGuardado(num(7), 1e-7), "0.0000001");
  assert.equal(aTextoGuardado(num(2), 1e-7), "0.00");
  assert.equal(aTextoGuardado(num(2), -0.001), "0.00");
  assert.equal(aTextoGuardado(num(0), -0.4), "0");
  assert.equal(aTextoGuardado({ VAR_TIPO_DIG: 0, VAR_MAS_DEC: null }, 0.1 + 0.2), "0.3");
  assert.equal(aTextoGuardado({ VAR_TIPO_DIG: 0, VAR_MAS_DEC: null }, 1e-7), "0.0000001");
  assert.equal(aTextoGuardado({ VAR_TIPO_DIG: 0, VAR_MAS_DEC: null }, 123456789012), "123456789012");
});

test("M6: nulo, vacío, texto y límite de 20 caracteres", () => {
  assert.equal(aTextoGuardado(num(2), null), null);
  assert.equal(aTextoGuardado(num(2), ""), null);
  assert.equal(aTextoGuardado(num(2), undefined), null);
  assert.equal(aTextoGuardado(num(2), "ANIDRO"), "ANIDRO");
  assert.equal(aTextoGuardado(num(2), "  ANIDRO "), "ANIDRO");
  assert.throws(() => aTextoGuardado(num(2), 1e19), /excede/);
  assert.equal(aTextoGuardado(num(0), 123456789012345), "123456789012345"); // 15 cifras: entra
});

test("M6: variables de hora — columnas en «h:mm» y el día en horas decimales con hasta 3 decimales", () => {
  assert.equal(aTextoGuardado(hora, 8.5), "8:30");
  assert.equal(aTextoGuardado(hora, 0), "0:00");
  assert.equal(aTextoGuardado(hora, "14:00"), "14:00");
  // Día (col. 99): 9.333, 15.5, 11, 0 y 120.833 son los textos que guardó el VB6.
  const dia = (x) => aTextoGuardado(hora, x, { dia: true });
  assert.equal(dia(9.333333333333334), "9.333");
  assert.equal(dia(15.5), "15.5");
  assert.equal(dia(11), "11");
  assert.equal(dia(0), "0");
  assert.equal(dia(120.83333333333333), "120.833");
  assert.equal(dia("9:20"), "9.333");
  assert.equal(dia(null), null);
});

test("M5: el día de una variable de hora suma las columnas ya redondeadas a 3 decimales (11.917 + 11.917 = 23.834)", () => {
  const cols = ["11:55", "11:55"]; // 11.9166… cada una
  assert.equal(aTextoGuardado(hora, agregarDia(hora, cols), { dia: true }), "23.834");
  assert.equal(aTextoGuardado(hora, agregarDia(hora, ["9:20"]), { dia: true }), "9.333");
});

test("M5: el día de variables numéricas es suma (tipo 3) o media aritmética de las columnas ya redondeadas", () => {
  const sumaV = { VAR_TIPO_DIG: 0, VAR_MAS_DEC: 2, VAR_TIPO_MEDIA: 3 };
  const mediaV = { VAR_TIPO_DIG: 0, VAR_MAS_DEC: 2, VAR_TIPO_MEDIA: 2 };
  assert.equal(agregarDia(sumaV, ["1.10", "2.20", null, ""]), 3.3000000000000003);
  assert.equal(aTextoGuardado(sumaV, agregarDia(sumaV, ["1.10", "2.20"])), "3.30");
  assert.equal(agregarDia(mediaV, [2, 4, null]), 3);
  assert.equal(agregarDia(mediaV, [null, ""]), null);
});

test("valorAGuardar redondea a la máscara salvo variables de hora y texto", () => {
  assert.equal(valorAGuardar(num(2), 2.675), 2.68);
  assert.equal(valorAGuardar(hora, "8:30"), "8:30");
  assert.equal(valorAGuardar(num(2), "ANIDRO"), "ANIDRO");
  assert.equal(valorAGuardar({ VAR_TIPO_DIG: 0, VAR_MAS_DEC: null }, 1.23456), 1.23456);
});

// ---------- M7: Round() de VB6 ----------
// ESTADO: sin resolver. Hay dos redondeos en el motor y sus diferencias solo aparecen en empates exactos (x.x5):
//  - vbFormatRound (Format de VB6, el que sirve para guardar): mitad alejándose de cero sobre la representación decimal. VERIFICADO (99,63 % exacto).
//  - vbRound (Round de VB6, usado para buscar en las tablas de masa específica y densidad): hoy redondea el producto x·10^n con empate al par.
//    Evidencia: «99.85 → 99.8» y «0.25 → 0.2» coinciden con los datos; no hay casos guardados que distingan «sobre el double» de «sobre el decimal»
//    (p. ej. 1.15 → 1.1 ó 1.2). Se fija el comportamiento actual para que un cambio sea deliberado; ver docs/analisis/gpi-motor-supuestos.md.
test("M7 (supuesto): vbRound con empate al par sobre el producto; vbFormatRound con la mitad alejándose de cero", () => {
  assert.equal(vbRound(99.85, 1), 99.8);
  assert.equal(vbRound(0.25, 1), 0.2);
  assert.equal(vbRound(0.35, 1), 0.4); // 0.35·10 da exactamente 3.5 en double: empate → par (4)
  assert.equal(vbRound(1.15, 1), 1.2);
  assert.equal(vbRound(2.5, 0), 2);
  assert.equal(vbRound(3.5, 0), 4);
  assert.equal(vbRound(null, 1), null);
  assert.equal(vbFormatRound(2.675, 2), 2.68);
  assert.equal(vbFormatRound(0.285, 2), 0.29);
  assert.equal(vbFormatRound(-2.675, 2), -2.68);
  assert.equal(vbFormatRound(1.005, 2), 1.01);
});
