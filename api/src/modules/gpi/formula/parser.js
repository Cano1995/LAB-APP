// Parser del lenguaje de fórmulas del GPI (GI_LAB_VAR.VAR_FORMULA).
//
// Sintaxis observada en las 1.521 fórmulas de producción:
//   números (0.6475), textos entre comillas simples ('' escapa una comilla), NULL,
//   llamadas a función case-insensitive (GetAnalise, Nvl, SE, GetMedia, ...),
//   operadores + - * / ^, comparaciones = <> != < > <= >=, lógicos && || AND OR, menos unario.
// Precedencia (estilo VB): ^ > unario > * / > + - > comparaciones > AND > OR.
//
// Devuelve un AST: {t:'num',v} {t:'str',v} {t:'null'} {t:'call',fn,args} {t:'bin',op,a,b} {t:'neg',a}

class ErrorFormula extends Error {}

// Límites (M9): una fórmula hostil o corrupta no puede agotar la pila ni la memoria. La más larga de producción tiene menos de 2.000 caracteres.
const MAX_LARGO = 20000;
const MAX_TOKENS = 5000;
const MAX_PROFUNDIDAD = 100; // paréntesis y signos anidados

function tokenizar(src) {
  if (src.length > MAX_LARGO) throw new ErrorFormula(`Fórmula demasiado larga (máximo ${MAX_LARGO} caracteres)`);
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === "'" || ch === '"') {
      // Textos con comilla simple o doble (hay fórmulas con "Orgánico"); duplicarla la escapa.
      let s = "";
      i++;
      for (;;) {
        if (i >= src.length) throw new ErrorFormula("Texto sin cerrar");
        if (src[i] === ch) {
          if (src[i + 1] === ch) { s += ch; i += 2; continue; }
          i++;
          break;
        }
        s += src[i++];
      }
      tokens.push({ t: "str", v: s });
      continue;
    }
    const num = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
    if (num) { tokens.push({ t: "num", v: Number(num[0]) }); i += num[0].length; continue; }
    const id = /^[A-Za-z_][A-Za-z_0-9]*/.exec(src.slice(i));
    if (id) { tokens.push({ t: "id", v: id[0] }); i += id[0].length; continue; }
    const op = /^(&&|\|\||<>|!=|<=|>=|[-+*/^(),=<>])/.exec(src.slice(i));
    if (op) { tokens.push({ t: "op", v: op[0] }); i += op[0].length; continue; }
    throw new ErrorFormula(`Carácter inesperado '${ch}' en la posición ${i}`);
  }
  tokens.push({ t: "fin" });
  if (tokens.length > MAX_TOKENS) throw new ErrorFormula(`Fórmula demasiado compleja (máximo ${MAX_TOKENS} elementos)`);
  return tokens;
}

function parsear(src) {
  try {
    return parsearSinProteger(src);
  } catch (e) {
    if (e instanceof ErrorFormula) throw e;
    // Cualquier otro fallo interno (p. ej. desborde de pila) sale como un error de fórmula controlado.
    throw new ErrorFormula(`Fórmula no procesable: ${e instanceof RangeError ? "demasiado anidada" : e.message}`);
  }
}

function parsearSinProteger(src) {
  const tk = tokenizar(String(src || ""));
  let p = 0;
  let nivel = 0;
  const entrar = () => { if (++nivel > MAX_PROFUNDIDAD) throw new ErrorFormula(`Fórmula demasiado anidada (máximo ${MAX_PROFUNDIDAD} niveles)`); };
  const salir = () => { nivel--; };
  const ver = () => tk[p];
  const es = (v) => tk[p].t === "op" && tk[p].v === v;
  const esPalabra = (w) => tk[p].t === "id" && tk[p].v.toUpperCase() === w;
  const esperar = (v) => {
    if (!es(v)) throw new ErrorFormula(`Se esperaba '${v}' y vino '${ver().v ?? "fin"}'`);
    p++;
  };

  const expr = () => o();
  function o() {
    let a = y();
    while (es("||") || esPalabra("OR")) { p++; a = { t: "bin", op: "OR", a, b: y() }; }
    return a;
  }
  function y() {
    let a = cmp();
    while (es("&&") || esPalabra("AND")) { p++; a = { t: "bin", op: "AND", a, b: cmp() }; }
    return a;
  }
  function cmp() {
    let a = suma();
    while (["=", "<>", "!=", "<", ">", "<=", ">="].some(es)) {
      const op = ver().v === "!=" ? "<>" : ver().v;
      p++;
      a = { t: "bin", op, a, b: suma() };
    }
    return a;
  }
  function suma() {
    let a = prod();
    while (es("+") || es("-")) { const op = ver().v; p++; a = { t: "bin", op, a, b: prod() }; }
    return a;
  }
  function prod() {
    let a = unario();
    while (es("*") || es("/")) { const op = ver().v; p++; a = { t: "bin", op, a, b: unario() }; }
    return a;
  }
  function unario() {
    entrar();
    try {
      if (es("-")) { p++; return { t: "neg", a: unario() }; }
      if (es("+")) { p++; return unario(); }
      return pot();
    } finally { salir(); }
  }
  function pot() {
    const a = primario();
    if (es("^")) { p++; return { t: "bin", op: "^", a, b: unario() }; }
    return a;
  }
  function primario() {
    const x = ver();
    if (x.t === "num") { p++; return { t: "num", v: x.v }; }
    if (x.t === "str") { p++; return { t: "str", v: x.v }; }
    if (es("(")) { p++; entrar(); const e = expr(); salir(); esperar(")"); return e; }
    if (x.t === "id") {
      p++;
      if (x.v.toUpperCase() === "NULL") return { t: "null" };
      // Funciones sin argumentos pueden escribirse sin paréntesis (ej. GetDiasDeSafra + 1).
      if (!es("(")) return { t: "call", fn: x.v.toUpperCase(), args: [] };
      p++;
      const args = [];
      if (!es(")")) {
        for (;;) {
          args.push(expr());
          if (es(",")) { p++; continue; }
          break;
        }
      }
      esperar(")");
      return { t: "call", fn: x.v.toUpperCase(), args };
    }
    throw new ErrorFormula(`Token inesperado '${x.v ?? "fin"}'`);
  }

  const ast = expr();
  if (ver().t !== "fin") throw new ErrorFormula(`Sobra texto después de la expresión: '${ver().v}'`);
  return ast;
}

// Posición (0 = primer argumento) del id de variable en cada función que lee otras variables. GetAnalise/GetMedia: GetAnalise(plan, 'nombre', idVar, …).
// Las funciones de dominio llevan pares ('Etiqueta', idVar) y por eso el id está en las posiciones impares.
const POS_ID = { GETANALISE: [2], GETMEDIA: [2] };
const DOMINIO = { POL: 2, POLCANA: 2, ARCANA: 2, BRIXCANA: 2, UMIDADECANA: 2, EXTRREDUZND: 2, BRIXBAGACODIG: 2, FIBRABAGACODIG: 3, EFICCENTRIFVINHO: 3 };
const posiciones = (fn) => POS_ID[fn] ?? (DOMINIO[fn] ? Array.from({ length: DOMINIO[fn] }, (_, i) => i * 2 + 1) : []);

// Variables que lee la fórmula: para el orden de cálculo y la detección de ciclos. `dinamica` es verdadero si algún id no es un número escrito
// en la fórmula (no se puede saber a qué variable apunta).
function dependencias(ast, out = { ids: new Set(), dinamica: false }) {
  if (!ast) return out;
  if (ast.t === "call") {
    for (const i of posiciones(ast.fn)) {
      const a = ast.args[i];
      if (!a) continue;
      if (a.t === "num") out.ids.add(a.v); else out.dinamica = true;
    }
    ast.args.forEach((a) => dependencias(a, out));
  } else if (ast.t === "bin") { dependencias(ast.a, out); dependencias(ast.b, out); } else if (ast.t === "neg") dependencias(ast.a, out);
  return out;
}
const referencias = (ast) => dependencias(ast).ids;

// Ciclos entre variables. `grafo`: Map<idVariable, Set<idReferenciado>> (solo se consideran los ids que son claves del mapa).
// Devuelve los ciclos como listas de ids [a, b, a]; vacío si no hay.
function detectarCiclos(grafo) {
  const estado = new Map(); // 1 = en curso, 2 = terminado
  const ciclos = [];
  const pila = [];
  const visitar = (id) => {
    estado.set(id, 1); pila.push(id);
    for (const ref of grafo.get(id) ?? []) {
      if (!grafo.has(ref)) continue;
      if (estado.get(ref) === 1) ciclos.push([...pila.slice(pila.indexOf(ref)), ref]);
      else if (!estado.has(ref)) visitar(ref);
    }
    pila.pop(); estado.set(id, 2);
  };
  // Iterativo por claves; la recursión solo baja por una cadena de dependencias (acotada por la cantidad de variables).
  for (const id of grafo.keys()) if (!estado.has(id)) visitar(id);
  return ciclos;
}

module.exports = { parsear, tokenizar, referencias, dependencias, detectarCiclos, ErrorFormula, MAX_LARGO, MAX_PROFUNDIDAD };
