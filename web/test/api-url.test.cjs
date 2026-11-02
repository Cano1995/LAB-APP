// F6 / F12 (Sprint 12): construcción segura de URLs y lectura de fechas del gráfico.
const test = require("node:test");
const assert = require("node:assert/strict");
const { cargarTs } = require("./util.cjs");

// api.ts toca localStorage y fetch solo al llamar; se define lo mínimo para poder importarlo.
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const { consulta } = cargarTs("src/lib/api.ts");
const { mismos } = cargarTs("src/lib/utils.ts");

test("consulta() codifica los valores: un valor no puede agregar parámetros nuevos", () => {
  assert.equal(consulta({ hasta: "2026-01-01&lse=0" }), "?hasta=2026-01-01%26lse%3D0");
  assert.equal(consulta({ q: "a b/c?d" }), "?q=a+b%2Fc%3Fd");
});

test("consulta() omite los valores vacíos y respeta los ceros", () => {
  assert.equal(consulta({ a: "", b: undefined, c: null, d: 0, e: false }), "?d=0&e=false");
  assert.equal(consulta({}), "");
  assert.equal(consulta({ x: undefined }), "");
});

test("consulta() convierte números y booleanos a texto", () => {
  assert.equal(consulta({ id: 46, tam: 5, acumulado: 1 }), "?id=46&tam=5&acumulado=1");
});

test("mismos() compara por contenido, no por referencia", () => {
  assert.equal(mismos({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] }), true);
  assert.equal(mismos({ a: 1 }, { a: 2 }), false);
  assert.equal(mismos(null, null), true);
});

test("aMs entiende fechas con y sin hora, con segundos, milisegundos y zona; lo desconocido es NaN", () => {
  // LineChart es un componente React: se compila aparte solo para leer aMs.
  const { aMs } = cargarTs("src/components/LineChart.tsx");
  const base = Date.UTC(2026, 9, 21, 10, 30);
  assert.equal(aMs("2026-10-21T10:30"), base);
  assert.equal(aMs("2026-10-21T10:30:00"), base);
  assert.equal(aMs("2026-10-21T10:30:00.000Z"), base);
  assert.equal(aMs("2026-10-21 10:30"), base);
  assert.equal(aMs("2026-10-21"), Date.UTC(2026, 9, 21));
  assert.ok(Number.isNaN(aMs("21/10/2026")));
  assert.ok(Number.isNaN(aMs("")));
});
