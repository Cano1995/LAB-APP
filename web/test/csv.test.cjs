// F7 (Sprint 12): el CSV no debe permitir inyección de fórmulas en Excel y usa coma decimal.
const test = require("node:test");
const assert = require("node:assert/strict");
const { cargarTs } = require("./util.cjs");
const { celdaCsv, textoCsv } = cargarTs("src/lib/csv.ts");

test("neutraliza las celdas que Excel ejecutaría como fórmula", () => {
  assert.equal(celdaCsv("=1+1"), "'=1+1");
  assert.equal(celdaCsv("+cmd|' /C calc'!A0"), "'+cmd|' /C calc'!A0");
  assert.equal(celdaCsv("-2+3"), "'-2+3");
  assert.equal(celdaCsv("@SUM(A1)"), "'@SUM(A1)");
  assert.equal(celdaCsv("\tcmd"), "'\tcmd");
});

test("los números legítimos (también negativos) no se alteran salvo la coma decimal", () => {
  assert.equal(celdaCsv("-12.5"), "-12,5");
  assert.equal(celdaCsv("3.14"), "3,14");
  assert.equal(celdaCsv("1234"), "1234");
  assert.equal(celdaCsv(7.5), "7,5");
  assert.equal(celdaCsv("-8"), "-8");
});

test("cita las celdas con separador, comillas o saltos de línea (incluido \\r)", () => {
  assert.equal(celdaCsv("con;punto y coma"), '"con;punto y coma"');
  assert.equal(celdaCsv('comillas "x"'), '"comillas ""x"""');
  assert.equal(celdaCsv("línea\r\nnueva"), '"línea\r\nnueva"');
  assert.equal(celdaCsv("solo\rretorno"), '"solo\rretorno"');
});

test("nulos y vacíos son celdas vacías; el texto normal no cambia", () => {
  assert.equal(celdaCsv(null), "");
  assert.equal(celdaCsv(undefined), "");
  assert.equal(celdaCsv("texto normal"), "texto normal");
});

test("una fila completa combina todas las reglas", () => {
  assert.equal(textoCsv([["Variable", "1/10"], ['=HYPERLINK("x")', "12.5"]]), 'Variable;1/10\r\n"\'=HYPERLINK(""x"")";12,5');
});
