// A13 / A12 / A15 (Sprint 11): validación de entrada común.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { fechaReal, entero, limite, decimal, booleano, escalar, hoyLocal } = require(path.join(__dirname, "..", "src", "lib", "validar"));

const lanza400 = (fn) => assert.throws(fn, (e) => e.status === 400);

test("fechaReal acepta fechas del calendario y rechaza las que no existen", () => {
  assert.equal(fechaReal("2026-10-26"), "2026-10-26");
  assert.equal(fechaReal("2028-02-29"), "2028-02-29"); // año bisiesto
  for (const mala of ["2026-02-30", "2026-13-01", "2026-00-10", "2027-02-29", "2026-1-5", "26-10-2026", "", "abc", "2026-10-26T10:00", "1800-01-01", "2200-01-01"]) lanza400(() => fechaReal(mala));
  lanza400(() => fechaReal(undefined));
});

test("fechaReal rechaza arreglos y objetos (?fecha=a&fecha=b)", () => {
  lanza400(() => fechaReal(["2026-10-01", "2026-10-02"]));
  lanza400(() => fechaReal({ a: "2026-10-01" }));
});

test("entero es estricto: rechaza 0x10, 1e3, decimales, vacíos y fuera de rango", () => {
  assert.equal(entero("42"), 42);
  assert.equal(entero(" 7 "), 7);
  for (const malo of ["0x10", "1e3", "1.5", "", " ", "abc", "-1", "99999999999999999999"]) lanza400(() => entero(malo));
  lanza400(() => entero("11", "x", { max: 10 }));
  lanza400(() => entero(["1"]));
});

test("A12: limite — por defecto, rango y el 0 no significa «sin tope»", () => {
  assert.equal(limite(undefined, { defecto: 5000, max: 5000 }), 5000);
  assert.equal(limite("", { defecto: 5000, max: 5000 }), 5000);
  assert.equal(limite("50", { defecto: 5000, max: 5000 }), 50);
  lanza400(() => limite("0", { defecto: 5000, max: 5000 }));
  lanza400(() => limite("abc", { defecto: 5000, max: 5000 }));
  lanza400(() => limite("5001", { defecto: 5000, max: 5000 }));
});

test("decimal acepta coma o punto y rechaza notaciones raras", () => {
  assert.equal(decimal("1,5"), 1.5);
  assert.equal(decimal("-2.25"), -2.25);
  for (const malo of ["0x10", "1e5", "Infinity", "NaN", "", "1,2,3"]) lanza400(() => decimal(malo));
});

test("booleano: el texto «false» ya no se guarda como verdadero", () => {
  for (const v of [true, 1, "1", "S", "si", "true"]) assert.equal(booleano(v), true, String(v));
  for (const v of [false, 0, "0", "N", "no", "false"]) assert.equal(booleano(v), false, String(v));
  lanza400(() => booleano("quizás"));
  lanza400(() => booleano(""));
});

test("A15: hoyLocal usa la fecha local y no UTC", () => {
  const ahora = new Date();
  const esperado = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
  assert.equal(hoyLocal(), esperado);
  assert.match(hoyLocal(-7), /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(hoyLocal(-7) < hoyLocal());
});

test("escalar deja pasar texto y números", () => {
  assert.equal(escalar("a"), "a");
  assert.equal(escalar(3), 3);
  assert.equal(escalar(undefined), undefined);
});
