// Motor de fórmulas del GPI (Sprint 16: M8, M9, M10, M14). Sin base de datos.
const test = require("node:test");
const assert = require("node:assert/strict");
Object.assign(process.env, { DB_USER: "TEST", DB_PASSWORD: "x", DB_CONNECT_STRING: "localhost/TEST", JWT_SECRET: "una-clave-de-prueba-larga-y-aleatoria-0123456789abcdef" });
const { parsear, dependencias, referencias, detectarCiclos, ErrorFormula, MAX_LARGO } = require("../src/modules/gpi/formula/parser");
const { evaluar, ErrorEvaluacion } = require("../src/modules/gpi/formula/evaluador");

const valor = (f, ctx = {}) => evaluar(parsear(f), ctx);

// ---------- M9: errores controlados y límites ----------
test("M9: una fórmula demasiado larga, compleja o anidada se rechaza con ErrorFormula, sin agotar la pila", () => {
  const casos = [
    "(".repeat(20000) + "1" + ")".repeat(20000),
    "(".repeat(500) + "1" + ")".repeat(500),
    "-".repeat(500) + "1",
    "1+".repeat(30000) + "1",
    "x".repeat(MAX_LARGO + 1),
    "1 + ".repeat(2600) + "1", // pocos caracteres por elemento pero demasiados elementos
  ];
  for (const f of casos) assert.throws(() => parsear(f), (e) => e instanceof ErrorFormula, f.slice(0, 20));
});

test("M9: una anidación razonable (30 niveles) sí se acepta", () => {
  assert.equal(valor("(".repeat(30) + "1" + ")".repeat(30)), 1);
});

test("M9: errores de sintaxis son ErrorFormula", () => {
  for (const f of ["1 +", "(1", "1)", "Nvl(1,", "'sin cerrar", "1 $ 2", "@", "GetAnalise(1,2,"]) assert.throws(() => parsear(f), (e) => e instanceof ErrorFormula, f);
});

const FUNCIONES_CON_ARGUMENTOS = ["GETANALISE", "GETMEDIA", "GETDATA", "NVL", "SE", "HORA_DEC", "DEC_HORA", "DIF_DATA", "GETTABGEN", "GETMEALCOOL", "GETDENSBRIX", "GETTANQUE",
  "DB_SELECT", "LOGN", "LOG", "POT", "RAIZ", "ABS", "TRUNC", "EXP", "POL", "POLCANA", "ARCANA", "BRIXCANA", "UMIDADECANA", "EXTRREDUZND", "BRIXBAGACODIG", "FIBRABAGACODIG",
  "EFICCENTRIFVINHO", "CONVGRAU", "MAIOR", "MENOR", "MEDIA"];

test("M9: llamar a cualquier función sin argumentos da ErrorEvaluacion, no un TypeError interno", () => {
  for (const fn of FUNCIONES_CON_ARGUMENTOS) {
    assert.throws(() => valor(`${fn}()`), (e) => e instanceof ErrorEvaluacion, fn);
    assert.throws(() => valor(`${fn}()`, { analise: () => 1, dbSelect: () => 1 }), (e) => e instanceof ErrorEvaluacion, `${fn} con contexto`);
  }
});

test("M9: una función desconocida y un contexto incompleto son ErrorEvaluacion", () => {
  assert.throws(() => valor("NoExiste(1)"), (e) => e instanceof ErrorEvaluacion && /no implementada/.test(e.message));
  assert.throws(() => valor("GetAnalise(1, 'x', 5)", {}), (e) => e instanceof ErrorEvaluacion); // el contexto no tiene analise()
  assert.throws(() => valor("GetData('Dia', 0)", {}), (e) => e instanceof ErrorEvaluacion); // sin fecha
  assert.throws(() => valor("GetData('Inicio Safra', 0)", { fecha: "2026-10-21" }), (e) => e instanceof ErrorEvaluacion); // sin inicio de zafra
});

test("M9: fechas y desplazamientos absurdos son ErrorEvaluacion (antes RangeError «Invalid time value»)", () => {
  const ctx = { fecha: "2026-10-21", inicioSafra: "2026-05-06" };
  for (const f of ["GetData('Dia', 99999999999)", "GetData('Dia', 1e9)", "GetData('Periodo', 1e20)"]) assert.throws(() => valor(f, ctx), (e) => e instanceof ErrorEvaluacion, f);
  assert.throws(() => valor("GetData('Dia', 0)", { fecha: "no-es-fecha" }), (e) => e instanceof ErrorEvaluacion);
  assert.equal(valor("GetData('Dia', 1)", ctx), "2026-10-22");
  assert.equal(valor("GetData('Periodo', 21)", ctx), "2026-09-30");
});

test("M9: un árbol manipulado (profundidad enorme o nodo inválido) no desborda la pila", () => {
  let ast = { t: "num", v: 1 };
  for (let i = 0; i < 5000; i++) ast = { t: "neg", a: ast };
  assert.throws(() => evaluar(ast, {}), (e) => e instanceof ErrorEvaluacion);
  assert.throws(() => evaluar({ t: "raro" }, {}), (e) => e instanceof ErrorEvaluacion);
  assert.throws(() => evaluar(null, {}), (e) => e instanceof ErrorEvaluacion);
});

test("M9: un fallo del contexto (p. ej. un Db_Select rechazado) sale como ErrorEvaluacion con su mensaje", () => {
  const ctx = { dbSelect: () => { throw new Error("Db_Select rechazado: tabla no permitida: X"); } };
  assert.throws(() => valor("Db_Select('x')", ctx), (e) => e instanceof ErrorEvaluacion && /rechazado/.test(e.message));
});

// ---------- M8: lógica de tres valores ----------
test("M8: AND y OR con nulo siguen la lógica de Null de VB6", () => {
  const v = (f) => valor(f);
  assert.equal(v("NULL AND 1 = 2"), false); // False And Null = False
  assert.equal(v("1 = 2 AND NULL"), false);
  assert.equal(v("NULL AND 1 = 1"), null); // True And Null = Null
  assert.equal(v("NULL AND NULL"), null);
  assert.equal(v("NULL OR 1 = 1"), true); // True Or Null = True
  assert.equal(v("1 = 1 OR NULL"), true);
  assert.equal(v("NULL OR 1 = 2"), null); // False Or Null = Null
  assert.equal(v("1 = 1 AND 2 = 2"), true);
  assert.equal(v("1 = 1 AND 2 = 3"), false);
  assert.equal(v("1 = 2 OR 2 = 3"), false);
  assert.equal(v("1 = 1 && 2 = 2"), true);
  assert.equal(v("1 = 2 || 2 = 2"), true);
  assert.equal(v("SE(NULL AND 1 = 1, 'si', 'no')"), "no"); // una condición nula se toma como falsa
});

// ---------- M10: dependencias y ciclos ----------
test("M10: las dependencias incluyen GetAnalise, GetMedia y las funciones de dominio, y avisan de las dinámicas", () => {
  const d = (f) => dependencias(parsear(f));
  assert.deepEqual([...d("GetAnalise(1,'a',10,'x') + GetMedia(2,'b',20,'y',GetData('Dia',0))").ids], [10, 20]);
  assert.deepEqual([...d("Pol('L',100,'B',101)").ids], [100, 101]);
  assert.deepEqual([...d("FibraBagacoDig('U',1,'L',2,'P',3)").ids], [1, 2, 3]);
  assert.deepEqual([...d("EficCentrifVinho('a',7,'b',8,'c',9)").ids], [7, 8, 9]);
  assert.deepEqual([...d("Nvl(SE(1=1, GetAnalise(1,'a',5,'x'), 0), BrixCana('B',6,'F',7))").ids].sort(), [5, 6, 7]);
  assert.equal(d("GetAnalise(1,'a',10,'x')").dinamica, false);
  assert.equal(d("GetAnalise(1,'a',GetAnalise(1,'a',10,'x'),'y')").dinamica, true);
  assert.deepEqual([...referencias(parsear("1 + 2"))], []);
});

test("M10: detecta ciclos directos, indirectos y autorreferencias, y no marca los acíclicos", () => {
  const g = (o) => new Map(Object.entries(o).map(([k, v]) => [Number(k), new Set(v)]));
  assert.deepEqual(detectarCiclos(g({ 1: [2], 2: [3], 3: [] })), []);
  assert.deepEqual(detectarCiclos(g({ 1: [2, 3], 2: [4], 3: [4], 4: [] })), []); // diamante
  assert.equal(detectarCiclos(g({ 1: [1] })).length, 1);
  const c = detectarCiclos(g({ 1: [2], 2: [3], 3: [1] }));
  assert.equal(c.length, 1);
  assert.deepEqual(c[0], [1, 2, 3, 1]);
  assert.equal(detectarCiclos(g({ 1: [2], 2: [1], 3: [4], 4: [3] })).length, 2);
  assert.deepEqual(detectarCiclos(g({ 1: [99] })), []); // referencia a una variable que no existe: no es ciclo
});

test("M10: una cadena larga (3.000 variables) no desborda la pila", () => {
  const grafo = new Map();
  for (let i = 0; i < 3000; i++) grafo.set(i, new Set(i < 2999 ? [i + 1] : []));
  assert.deepEqual(detectarCiclos(grafo), []);
  grafo.set(2999, new Set([0]));
  assert.equal(detectarCiclos(grafo).length, 1);
});

// ---------- M14: supuestos del evaluador, fijados para que un cambio sea deliberado ----------
// Ver docs/analisis/gpi-motor-supuestos.md: cada uno está marcado como VERIFICADO con datos del VB6 o como SUPUESTO por contrastar con el GATEC.
test("M14 (supuesto): la división por cero da nulo y un desborde también (no Infinity)", () => {
  assert.equal(valor("1 / 0"), null);
  assert.equal(valor("10 ^ 1000"), null);
  assert.equal(valor("0 ^ -1"), null);
});

test("M14 (supuesto): '1' + '2' con textos numéricos suma (3); con un texto no numérico concatena", () => {
  assert.equal(valor("'1' + '2'"), 3);
  assert.equal(valor("'a' + 'b'"), "ab");
  assert.equal(valor("'a' + NULL"), null);
});

test("M14 (supuesto): ^ asocia a derecha (2^3^2 = 512; VB6 asocia a izquierda = 64). Ninguna fórmula de producción encadena ^", () => {
  assert.equal(valor("2 ^ 3 ^ 2"), 512);
  assert.equal(valor("-2 ^ 2"), -4); // el menos unario aplica después de la potencia, como en VB6
});

test("M14: precedencia aritmética y comparaciones", () => {
  assert.equal(valor("2 + 3 * 4"), 14);
  assert.equal(valor("(2 + 3) * 4"), 20);
  assert.equal(valor("10 - 2 - 3"), 5);
  assert.equal(valor("8 / 4 / 2"), 1);
  assert.equal(valor("1 + 1 = 2"), true);
  assert.equal(valor("1 <> 2"), true);
  assert.equal(valor("1 != 1"), false);
});

test("M14 (supuesto): LOG es el logaritmo decimal y LOGN(valor, base) el de cualquier base; fuera de dominio → nulo", () => {
  assert.equal(valor("Log(1000)"), 3);
  assert.equal(valor("LogN(8, 2)"), 3);
  for (const f of ["Log(0)", "Log(-1)", "LogN(8, 1)", "LogN(0, 2)", "LogN(8, -2)"]) assert.equal(valor(f), null, f);
});

test("M14: los nulos se propagan en la aritmética y Nvl los reemplaza; una comparación con nulo es nula", () => {
  assert.equal(valor("NULL + 1"), null);
  assert.equal(valor("-NULL"), null);
  assert.equal(valor("Nvl(NULL, 5) + 1"), 6);
  assert.equal(valor("NULL = 1"), null);
  assert.equal(valor("SE(NULL = 1, 'si', 'no')"), "no");
});
