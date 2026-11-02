// Sprint 14: utilidades compartidas de fecha y número (antes copiadas en cada pantalla).
const test = require("node:test");
const assert = require("node:assert/strict");
const { cargarTs } = require("./util.cjs");
const { aDMA, sumarDias, hoyLocal } = cargarTs("src/lib/fecha.ts");
const { num } = cargarTs("src/lib/num.ts");

test("aDMA invierte AAAA-MM-DD a DD/MM/AAAA", () => {
  assert.equal(aDMA("2026-10-21"), "21/10/2026");
});

test("sumarDias cruza meses, años y bisiestos sin desfase horario", () => {
  assert.equal(sumarDias("2026-10-31", 1), "2026-11-01");
  assert.equal(sumarDias("2026-01-01", -1), "2025-12-31");
  assert.equal(sumarDias("2028-02-28", 1), "2028-02-29");
  assert.equal(sumarDias("2026-03-08", 0), "2026-03-08");
});

test("hoyLocal usa la fecha local, con formato AAAA-MM-DD", () => {
  assert.match(hoyLocal(), /^\d{4}-\d{2}-\d{2}$/);
  const d = new Date();
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  assert.equal(hoyLocal(), local);
  assert.equal(hoyLocal(1), sumarDias(local, 1));
});

test("num acepta coma decimal y devuelve null con vacío o texto inválido", () => {
  assert.equal(num("1,5"), 1.5);
  assert.equal(num("2.25"), 2.25);
  assert.equal(num("-3"), -3);
  for (const v of ["", null, undefined, "abc", "NaN"]) assert.equal(num(v), null);
});
