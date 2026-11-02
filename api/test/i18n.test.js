const test = require("node:test");
const assert = require("node:assert/strict");
const { traducir, titulo } = require("../src/i18n/traducir");

test("traduce frases y palabras del glosario respetando mayúsculas", () => {
  assert.equal(traducir("Lançamento diário"), "Digitación diaria");
  assert.equal(traducir("Pós-Colheita"), "Poscosecha");
  assert.equal(traducir("DIVISAO 1"), "DIVISIÓN 1");
  assert.equal(traducir("Pesquisa Talhao"), "Búsqueda Parcela");
  assert.equal(traducir("Alterar Empresa/Safra"), "Cambiar Empresa/Zafra");
});

test("las abreviaturas no duplican el punto", () => {
  assert.equal(traducir("Classe por Func."), "Clase por func.".replace("func.", "Func."));
  assert.equal(traducir("Frente po Empreit."), "Frente po Contrat.");
});

test("un título ya en español queda igual", () => {
  assert.equal(traducir("Control Estadístico del Proceso"), "Control Estadístico del Proceso");
  assert.equal(traducir("Valores de Variables"), "Valores de Variables");
});

test("titulo() tolera valores vacíos", () => {
  assert.equal(titulo(null, 1), null);
  assert.equal(titulo("", 1), "");
});
