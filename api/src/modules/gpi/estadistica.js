// Estadística del GPI: cartas de control (CEP) y correlación. Funciones puras, sin acceso a la base.
// Los resultados del VB6 (FrmCEP, frmCorrelacao) no se guardan, así que se validan con casos de manual (ver estadistica.test.js).

// Constantes de cartas X̄–R por tamaño de subgrupo (2..10).
const CONST = {
  2: { A2: 1.880, D3: 0, D4: 3.267, d2: 1.128 },
  3: { A2: 1.023, D3: 0, D4: 2.574, d2: 1.693 },
  4: { A2: 0.729, D3: 0, D4: 2.282, d2: 2.059 },
  5: { A2: 0.577, D3: 0, D4: 2.114, d2: 2.326 },
  6: { A2: 0.483, D3: 0, D4: 2.004, d2: 2.534 },
  7: { A2: 0.419, D3: 0.076, D4: 1.924, d2: 2.704 },
  8: { A2: 0.373, D3: 0.136, D4: 1.864, d2: 2.847 },
  9: { A2: 0.337, D3: 0.184, D4: 1.816, d2: 2.970 },
  10: { A2: 0.308, D3: 0.223, D4: 1.777, d2: 3.078 },
};
const D2_INDIVIDUALES = 1.128; // d2 para rangos móviles de 2 puntos
const TAM_MAX = 10;

const media = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
function desvio(xs) {
  if (xs.length < 2) return null;
  const m = media(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}
const redondear = (x, d = 6) => (x === null || !Number.isFinite(x) ? null : Math.round(x * 10 ** d) / 10 ** d);

// Carta de control de `valores` (orden cronológico). tam = tamaño del subgrupo (1 → individuales con rango móvil).
// lse/lie = límites de especificación (opcionales) para los índices de capacidad.
function cartaControl(valores, { tam = 1, lse = null, lie = null } = {}) {
  const xs = valores.filter((x) => typeof x === "number" && Number.isFinite(x));
  tam = Math.max(1, Math.min(TAM_MAX, Math.trunc(tam) || 1));
  if (xs.length < Math.max(2, tam * 2)) return { n: xs.length, error: "Datos insuficientes para la carta de control" };

  let puntos, rangos, c;
  if (tam === 1) {
    puntos = xs;
    rangos = xs.slice(1).map((x, i) => Math.abs(x - xs[i])); // rango móvil
    c = { A2: 3 / D2_INDIVIDUALES, D3: 0, D4: 3.267, d2: D2_INDIVIDUALES };
  } else {
    puntos = []; rangos = [];
    for (let i = 0; i + tam <= xs.length; i += tam) {
      const g = xs.slice(i, i + tam);
      puntos.push(media(g));
      rangos.push(Math.max(...g) - Math.min(...g));
    }
    c = CONST[tam];
  }
  if (!rangos.length) return { n: xs.length, error: "Datos insuficientes para la carta de control" };
  // Con un último subgrupo incompleto la carta solo usa los datos agrupados; el resto se informa en `descartados` (antes la media, el desvío y los
  // índices de capacidad usaban TODOS los datos mientras la línea central usaba solo los agrupados).
  const usados = tam === 1 ? xs : xs.slice(0, puntos.length * tam);
  const lc = media(puntos), rBarra = media(rangos);
  const sigma = rBarra / c.d2; // σ dentro de subgrupos
  const lcs = lc + c.A2 * rBarra, lci = lc - c.A2 * rBarra;
  const fuera = puntos.map((p, i) => (p > lcs || p < lci ? i : -1)).filter((i) => i >= 0);

  const out = {
    n: xs.length, usados: usados.length, descartados: xs.length - usados.length, tam, subgrupos: puntos.length,
    media: redondear(media(usados)), desvio: redondear(desvio(usados)), min: Math.min(...usados), max: Math.max(...usados),
    x: { puntos: puntos.map((p) => redondear(p)), lc: redondear(lc), lcs: redondear(lcs), lci: redondear(lci), fuera },
    r: { puntos: rangos.map((p) => redondear(p)), lc: redondear(rBarra), lcs: redondear(c.D4 * rBarra), lci: redondear(c.D3 * rBarra) },
    sigma: redondear(sigma),
  };
  // Índices de capacidad: Cp = (LSE−LIE)/6σ; Cpl = (μ−LIE)/3σ; Cpu = (LSE−μ)/3σ; Cpk = mín(Cpl, Cpu).
  if (sigma > 0) {
    const mu = media(usados);
    const cap = {};
    if (lse !== null && lie !== null) cap.cp = redondear((lse - lie) / (6 * sigma), 3);
    if (lie !== null) cap.cpl = redondear((mu - lie) / (3 * sigma), 3);
    if (lse !== null) cap.cpu = redondear((lse - mu) / (3 * sigma), 3);
    const lados = [cap.cpl, cap.cpu].filter((v) => v !== undefined && v !== null);
    if (lados.length) cap.cpk = Math.min(...lados);
    out.capacidad = cap;
  }
  return out;
}

// Coeficiente de correlación de Pearson con los pares donde ambos valores existen.
function pearson(xs, ys) {
  const px = [], py = [];
  for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
    if (typeof xs[i] === "number" && typeof ys[i] === "number" && Number.isFinite(xs[i]) && Number.isFinite(ys[i])) { px.push(xs[i]); py.push(ys[i]); }
  }
  const n = px.length;
  if (n < 3) return { r: null, n };
  const mx = media(px), my = media(py);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (px[i] - mx) * (py[i] - my); sxx += (px[i] - mx) ** 2; syy += (py[i] - my) ** 2; }
  if (sxx === 0 || syy === 0) return { r: null, n };
  return { r: redondear(sxy / Math.sqrt(sxx * syy), 4), n };
}

module.exports = { cartaControl, pearson, media, desvio };
