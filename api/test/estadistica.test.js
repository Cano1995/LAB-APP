// Estadística del GPI (CEP y correlación) contra valores calculados a mano y de tablas publicadas (no recalculados con el mismo código).
const test = require("node:test");
const assert = require("node:assert/strict");
const { cartaControl, pearson } = require("../src/modules/gpi/estadistica");
const cerca = (a, b, t = 1e-3) => assert.ok(Math.abs(a - b) <= t, `${a} ≈ ${b}`);

test("Pearson: relación perfecta directa, inversa y sin variación", () => {
  cerca(pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]).r, 1);
  cerca(pearson([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]).r, -1);
  assert.equal(pearson([1, 2, 3, 4], [5, 5, 5, 5]).r, null);
});

test("Pearson: cuarteto de Anscombe (I) da 0,81642, valor publicado", () => {
  cerca(pearson([10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5], [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68]).r, 0.81642, 1e-4);
});

test("Pearson: los pares incompletos se descartan", () => {
  assert.equal(pearson([1, null, 3, 4], [2, 9, 6, 8]).n, 3);
});

// Tres subgrupos de 5: medias 100, 100, 100; rangos 10, 15, 15 → X̿ = 100, R̄ = 13,3333.
// Constantes de la tabla publicada para n = 5: A2 = 0,577; d2 = 2,326.
const DATOS = [[95, 100, 105, 100, 100], [92, 97, 102, 107, 102], [98, 103, 98, 108, 93]].flat();

test("Carta X̄–R (n = 5): límites con A2 = 0,577", () => {
  const c = cartaControl(DATOS, { tam: 5, lse: 120, lie: 80 });
  assert.equal(c.subgrupos, 3);
  cerca(c.x.lc, 100);
  cerca(c.r.lc, 13.3333, 1e-3);
  cerca(c.x.lcs, 107.692, 1e-2); // 100 + 0,577 × 13,3333
  cerca(c.x.lci, 92.308, 1e-2);
});

test("Capacidad: Cp = (120 − 80) / (6 × 13,3333 / 2,326) = 1,163", () => {
  const c = cartaControl(DATOS, { tam: 5, lse: 120, lie: 80 });
  cerca(c.capacidad.cp, 1.163, 5e-3);
});

test("Carta de individuales: LCS = X̄ + 2,66 × MR̄ (X̄ = 11,875; MR̄ = 12/7)", () => {
  const i = cartaControl([10, 12, 11, 13, 12, 14, 11, 12], { tam: 1 });
  cerca(i.x.lc, 11.875);
  cerca(i.x.lcs, 11.875 + 2.66 * (12 / 7), 0.02);
});

test("Con un solo dato no hay carta y se informa el error", () => {
  assert.ok(cartaControl([1], {}).error);
});

test("M11: con un último subgrupo incompleto todo se calcula sobre los datos agrupados y se informa lo descartado", () => {
  // 7 datos con subgrupos de 3: el 7.º (1000) queda afuera y no debe contaminar media, desvío, máximo ni capacidad.
  const datos = [10, 11, 12, 10, 11, 12, 1000];
  const c = cartaControl(datos, { tam: 3, lse: 20, lie: 0 });
  assert.equal(c.subgrupos, 2);
  assert.equal(c.n, 7);
  assert.equal(c.usados, 6);
  assert.equal(c.descartados, 1);
  cerca(c.media, 11, 1e-9);
  assert.equal(c.max, 12);
  cerca(c.x.lc, 11, 1e-9); // coincide con la media usada
  assert.ok(c.capacidad.cpk > 0 && c.capacidad.cpk < 10);
  // Con subgrupos completos no se descarta nada.
  const ok = cartaControl([10, 11, 12, 10, 11, 12], { tam: 3 });
  assert.equal(ok.descartados, 0);
  assert.equal(ok.usados, 6);
});
