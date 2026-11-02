// Evaluador de fórmulas del GPI sobre el AST de parser.js.
//
// La fuente de datos es un "contexto" inyectado, para poder evaluar contra la base real
// o contra datos en memoria (arnés de validación). El contexto implementa:
//   analise(idVar, flag)            valor de la variable en la columna actual (flag = 5.º arg de GetAnalise)
//   media(idVar, fecha, fechaFin)   resultado del día (o promedio del rango) de la variable
//   fecha                           'AAAA-MM-DD' del día que se calcula
//   inicioSafra, finSafra           fechas de la zafra del GPI
//   tabGen(cod, campo, valor)       búsqueda en tablas genéricas
//   meAlcool(tipo, valor)           tabla de masa específica del alcohol
//   densBrix(tipo, valor)           tabla densidad/Brix
//   tanque(tipo, idTanque)          capacidad/factor de tanques
//   diasDeSafra()                   días desde el inicio de la zafra
//
// Semántica de nulos (como VB6 con Null): toda operación con nulo da nulo; una comparación
// con nulo es nula y SE la toma como falsa; Nvl reemplaza nulos. División por cero → nulo.

class ErrorEvaluacion extends Error {}

const esNulo = (v) => v === null || v === undefined || v === "";

// Los valores guardados son texto (MOV_VALOR); si parecen número se operan como número.
function aNumero(v) {
  if (esNulo(v)) return null;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  const s = String(v).trim().replace(",", ".");
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return Number(s);
  return null;
}
const comoValor = (v) => {
  if (esNulo(v)) return null;
  const n = aNumero(v);
  return n === null ? String(v) : n;
};

// "hh:mm" → horas decimales (también acepta números ya decimales).
function horaDec(v) {
  if (esNulo(v)) return null;
  if (typeof v === "number") return v;
  const m = /^\s*(-?)(\d{1,4}):(\d{2})/.exec(String(v));
  if (m) return (m[1] ? -1 : 1) * (Number(m[2]) + Number(m[3]) / 60);
  return aNumero(v);
}
// horas decimales → "h:mm" (redondeo al minuto; el VB6 no rellena la hora: "9:30", "0:00").
function decHora(v) {
  const n = aNumero(v);
  if (n === null) return null;
  const neg = n < 0;
  let min = Math.round(Math.abs(n) * 60);
  const h = Math.floor(min / 60);
  min -= h * 60;
  return `${neg ? "-" : ""}${h}:${String(min).padStart(2, "0")}`;
}

// 'AAAA-MM-DD' ± días, sin zona horaria. Fecha mal formada o desplazamiento absurdo → error controlado (antes: TypeError o RangeError «Invalid time value»).
const MAX_DESPLAZAMIENTO_DIAS = 100000;
function sumarDias(fecha, n) {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new ErrorEvaluacion(`Fecha inválida: '${fecha}'`);
  if (!Number.isFinite(n) || Math.abs(n) > MAX_DESPLAZAMIENTO_DIAS) throw new ErrorEvaluacion(`Desplazamiento de días inválido: ${n}`);
  const [y, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  if (Number.isNaN(t.getTime())) throw new ErrorEvaluacion(`Fecha inválida: '${fecha}'`);
  return t.toISOString().slice(0, 10);
}
// Fecha (y hora opcional) en texto → días (para Dif_Data). Acepta AAAA-MM-DD y DD/MM/AAAA.
function aDias(v) {
  if (esNulo(v)) return null;
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?/.exec(s);
  let y, mo, d, h = 0, mi = 0;
  if (m) { [y, mo, d] = [m[1], m[2], m[3]].map(Number); if (m[4]) { h = Number(m[4]); mi = Number(m[5]); } } else {
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(s);
    if (!m) return null;
    [d, mo, y] = [m[1], m[2], m[3]].map(Number);
    if (m[4]) { h = Number(m[4]); mi = Number(m[5]); }
  }
  return Date.UTC(y, mo - 1, d, h, mi) / 86400000;
}

const arit = (op, a, b, nuloComoCero = false) => {
  let x = aNumero(a), y = aNumero(b);
  if (nuloComoCero) {
    if (x === null && esNulo(a)) x = 0;
    if (y === null && esNulo(b)) y = 0;
  }
  if (op === "+" && (typeof a === "string" || typeof b === "string") && (x === null || y === null)) {
    // Concatenación de textos (Dif_Data arma 'fecha' + ' ' + 'hora').
    return esNulo(a) || esNulo(b) ? null : String(a) + String(b);
  }
  if (x === null || y === null) return null;
  switch (op) {
    case "+": return x + y;
    case "-": return x - y;
    case "*": return x * y;
    case "/": return y === 0 ? null : x / y;
    case "^": { const r = Math.pow(x, y); return Number.isFinite(r) ? r : null; }
  }
  return null;
};

function comparar(op, a, b) {
  if (esNulo(a) || esNulo(b)) return null;
  const x = aNumero(a), y = aNumero(b);
  const [p, q] = x !== null && y !== null ? [x, y] : [String(a), String(b)];
  switch (op) {
    case "=": return p === q;
    case "<>": return p !== q;
    case "<": return p < q;
    case ">": return p > q;
    case "<=": return p <= q;
    case ">=": return p >= q;
  }
  return null;
}

const verdadero = (v) => v === true || (typeof v === "number" && v !== 0);
// Lógica de tres valores (Null de VB6): False And Null = False, True Or Null = True; en los demás casos con nulo el resultado es nulo.
const tri = (v) => (esNulo(v) ? null : verdadero(v));
const MAX_PROFUNDIDAD_EVALUACION = 200;

// Pureza del caldo residual que el VB6 usa en las funciones de bagazo cuando no hay dato.
const PUREZA_RESIDUAL_DEFECTO = 70;

// Punto de entrada: cualquier fallo interno (TypeError por un argumento que falta, RangeError, un contexto incompleto…) sale como ErrorEvaluacion con
// mensaje claro, no como un Error genérico. Los errores que ya son de evaluación se dejan pasar tal cual.
function evaluar(ast, ctx) {
  try {
    return evaluarNodo(ast, ctx, 0);
  } catch (e) {
    if (e instanceof ErrorEvaluacion) throw e;
    const motivo = e instanceof RangeError ? "demasiado anidada" : e.message;
    throw Object.assign(new ErrorEvaluacion(`Fallo al evaluar: ${motivo}`), { causa: e });
  }
}

function evaluarNodo(ast, ctx, nivel) {
  if (nivel > MAX_PROFUNDIDAD_EVALUACION) throw new ErrorEvaluacion("Fórmula demasiado anidada");
  if (!ast || typeof ast !== "object") throw new ErrorEvaluacion("Árbol de fórmula inválido");
  const ev = (n) => evaluarNodo(n, ctx, nivel + 1);
  switch (ast.t) {
    case "num": return ast.v;
    case "str": return ast.v;
    case "null": return null;
    case "neg": { const v = aNumero(ev(ast.a)); return v === null ? null : -v; }
    case "bin": {
      if (ast.op === "AND" || ast.op === "OR") {
        const a = tri(ev(ast.a));
        if (ast.op === "AND" && a === false) return false;
        if (ast.op === "OR" && a === true) return true;
        const b = tri(ev(ast.b));
        if (ast.op === "AND" && b === false) return false;
        if (ast.op === "OR" && b === true) return true;
        return a === null || b === null ? null : ast.op === "AND";
      }
      if (["=", "<>", "<", ">", "<=", ">="].includes(ast.op)) return comparar(ast.op, ev(ast.a), ev(ast.b));
      return arit(ast.op, ev(ast.a), ev(ast.b), !!ctx.nuloComoCero);
    }
    case "call": return llamar(ast, ctx, ev);
  }
  throw new ErrorEvaluacion(`Nodo desconocido ${ast.t}`);
}

// Argumentos de funciones de dominio: ('Etiqueta', idVar, ...) → valores numéricos de cada variable.
function valoresDominio(args, ctx, ev, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const idArg = args[i * 2 + 1];
    if (!idArg) throw new ErrorEvaluacion("Faltan argumentos en función de dominio");
    out.push(aNumero(ctx.analise(aNumero(ev(idArg)), null)));
  }
  return out;
}
// Aplica f() si ningún argumento es nulo y el resultado es finito.
function calc(f, ...xs) {
  if (xs.some((x) => x === null)) return null;
  const r = f();
  return r === null || !Number.isFinite(r) ? null : r;
}

function numArgs(ast, min) {
  if (ast.args.length < min) throw new ErrorEvaluacion(`${ast.fn} espera al menos ${min} argumentos`);
}

// Cantidad mínima de argumentos de cada función (M9): sin esto un argumento que falta daba un TypeError interno.
const MIN_ARGS = {
  GETANALISE: 3, GETMEDIA: 3, GETDATA: 1, NVL: 2, SE: 3, HORA_DEC: 1, DEC_HORA: 1, DIF_DATA: 2, GETTABGEN: 5, GETMEALCOOL: 2, GETDENSBRIX: 2, GETTANQUE: 2,
  DB_SELECT: 1, LOGN: 2, LOG: 1, POT: 2, RAIZ: 2, ABS: 1, TRUNC: 1, EXP: 1, POL: 4, POLCANA: 4, ARCANA: 4, BRIXCANA: 4, UMIDADECANA: 4, EXTRREDUZND: 4,
  BRIXBAGACODIG: 4, FIBRABAGACODIG: 6, EFICCENTRIFVINHO: 6, CONVGRAU: 1, MAIOR: 1, MENOR: 1, MEDIA: 1,
};

function llamar(ast, ctx, ev) {
  const a = ast.args;
  if (ast.fn in MIN_ARGS) numArgs(ast, MIN_ARGS[ast.fn]);
  switch (ast.fn) {
    case "GETANALISE": {
      numArgs(ast, 3);
      const flag = a[4] ? aNumero(ev(a[4])) : null;
      return comoValor(ctx.analise(aNumero(ev(a[2])), flag));
    }
    case "GETMEDIA": {
      numArgs(ast, 3);
      // Sin fecha: último valor diario disponible (verificado contra datos del VB6).
      const sinFecha = !a[4];
      const f1 = sinFecha ? ctx.fecha : ev(a[4]);
      const f2 = a[5] ? ev(a[5]) : null;
      return comoValor(ctx.media(aNumero(ev(a[2])), f1, f2, sinFecha));
    }
    case "GETDATA": {
      const tipo = String(ev(a[0]) || "").toUpperCase();
      const n = aNumero(a[1] ? ev(a[1]) : 0) || 0;
      if (tipo === "DIA") return sumarDias(ctx.fecha, n);
      if (tipo === "INICIO SAFRA") return sumarDias(ctx.inicioSafra, n);
      if (tipo === "FINAL SAFRA") return ctx.finSafra ? sumarDias(ctx.finSafra, n) : null;
      if (tipo === "PERIODO") return sumarDias(ctx.fecha, -n);
      throw new ErrorEvaluacion(`GetData: tipo '${tipo}' no soportado`);
    }
    case "NVL": { numArgs(ast, 2); const v = ev(a[0]); return esNulo(v) ? ev(a[1]) : v; }
    case "SE": { numArgs(ast, 3); return verdadero(ev(a[0])) ? ev(a[1]) : ev(a[2]); }
    case "HORA_DEC": return horaDec(ev(a[0]));
    case "DEC_HORA": return decHora(ev(a[0]));
    case "DIF_DATA": {
      const x = aDias(ev(a[0])), y = aDias(ev(a[1]));
      return x === null || y === null ? null : y - x;
    }
    case "GETTABGEN": {
      numArgs(ast, 5);
      return comoValor(ctx.tabGen(aNumero(ev(a[0])), aNumero(ev(a[2])), ev(a[4])));
    }
    case "GETMEALCOOL": return comoValor(ctx.meAlcool(aNumero(ev(a[0])), aNumero(ev(a[1]))));
    case "GETDENSBRIX": return comoValor(ctx.densBrix(aNumero(ev(a[0])), aNumero(ev(a[1]))));
    case "GETTANQUE": return comoValor(ctx.tanque(String(ev(a[0]) || ""), aNumero(ev(a[1]))));
    case "GETDIASDESAFRA": return ctx.diasDeSafra();
    // Material en proceso (sin argumentos): totales del día; ver formula/material.js.
    case "GETMASSABRIX": return ctx.material ? ctx.material("BRIX") : null;
    case "GETMASSAPOL": return ctx.material ? ctx.material("POL") : null;
    case "GETALCOOLDORNA": return ctx.material ? ctx.material("ALCOOL") : null;
    // Db_Select('SELECT …'): el valor lo resolvió antes dbselect.precargar; sin resolver o con error → nulo.
    case "DB_SELECT": return comoValor(ctx.dbSelect ? ctx.dbSelect(String(ev(a[0]))) : null);
    case "LOGN": { const v = aNumero(ev(a[0])), b = aNumero(ev(a[1])); return v === null || b === null || v <= 0 || b <= 0 || b === 1 ? null : Math.log(v) / Math.log(b); }
    case "LOG": { const v = aNumero(ev(a[0])); return v === null || v <= 0 ? null : Math.log10(v); }
    case "POT": return arit("^", ev(a[0]), ev(a[1]));
    case "RAIZ": { const v = aNumero(ev(a[0])), r = aNumero(ev(a[1])); return v === null || !r ? null : arit("^", v, 1 / r); }
    case "ABS": { const v = aNumero(ev(a[0])); return v === null ? null : Math.abs(v); }
    case "TRUNC": { const v = aNumero(ev(a[0])); return v === null ? null : Math.trunc(v); }
    case "EXP": { const v = aNumero(ev(a[0])); return v === null ? null : Math.exp(v); }
    // --- Funciones de tecnología azucarera ---------------------------------------------
    // Firma del VB6: F('Etiqueta', idVar, 'Etiqueta', idVar, ...). Los valores se toman como
    // GetAnalise de cada variable. Fórmulas verificadas al 100% contra los datos guardados
    // (tools/gpi-probar-funcion.js); ver docs/analisis/gpi-motor-formulas.md.
    case "POL": { const [l, bx] = valoresDominio(a, ctx, ev, 2); return calc(() => l * (0.2605 - 0.0009882 * bx), l, bx); }
    case "POLCANA": case "ARCANA": {
      const [s, f] = valoresDominio(a, ctx, ev, 2);
      return calc(() => s * (1 - 0.01 * f) * (1.0313 - 0.00575 * f), s, f);
    }
    case "BRIXCANA": { const [b, f] = valoresDominio(a, ctx, ev, 2); return calc(() => b * (1 - 0.01 * f), b, f); }
    case "UMIDADECANA": { const [b, f] = valoresDominio(a, ctx, ev, 2); return calc(() => 100 - b - f, b, f); }
    case "EXTRREDUZND": {
      // Extracción reducida a 12,5% de fibra (Noel Deerr).
      const [e, f] = valoresDominio(a, ctx, ev, 2);
      return calc(() => (f === 0 ? null : 100 - ((100 - e) * (100 - f) * 12.5) / (f * 87.5)), e, f);
    }
    // Bagazo por el método del digestor. Sin pureza del caldo residual se usa 70 (verificado en los datos).
    //  Pol bagazo = 0,26·L·(11 − 0,01·F); Brix = 100·Pol/Pur; Fibra = 100 − U − Brix.
    //  Fibra se despeja en forma cerrada: k = 26·L/Pur → F = (100 − U − 11k) / (1 − 0,01k).
    case "BRIXBAGACODIG": {
      const pol = aNumero(ctx.analise(aNumero(ev(a[1])), null));
      const pur = aNumero(ctx.analise(aNumero(ev(a[3])), null)) ?? PUREZA_RESIDUAL_DEFECTO;
      return calc(() => (pur === 0 ? null : (100 * pol) / pur), pol);
    }
    case "FIBRABAGACODIG": {
      const u = aNumero(ctx.analise(aNumero(ev(a[1])), null));
      const l = aNumero(ctx.analise(aNumero(ev(a[3])), null));
      const pur = aNumero(ctx.analise(aNumero(ev(a[5])), null)) ?? PUREZA_RESIDUAL_DEFECTO;
      return calc(() => {
        if (pur === 0) return null;
        const k = (26 * l) / pur;
        return (100 - u - 11 * k) / (1 - 0.01 * k);
      }, u, l);
    }
    case "EFICCENTRIFVINHO": {
      // Eficiencia de centrifugación: VB = levadura vino bruto, VC = vino centrifugado, FC = fermento centrifugado.
      const [vb, vc, fc] = valoresDominio(a, ctx, ev, 3);
      return calc(() => ((fc - vc) * vb === 0 ? null : (((vb - vc) * fc) / ((fc - vc) * vb)) * 100), vb, vc, fc);
    }
    case "SOMAPROP": {
      // Suma proporcional de pares (factor, valor): Σ(f·v)/Σf. Los argumentos son expresiones.
      let sf = 0, sfv = 0;
      for (let i = 0; i + 1 < a.length; i += 2) {
        const f = aNumero(ev(a[i])), v = aNumero(ev(a[i + 1]));
        if (f === null || v === null) continue;
        sf += f; sfv += f * v;
      }
      return sf === 0 ? null : sfv / sf;
    }
    case "CONVGRAU": return ctx.convGrau(aNumero(ev(a[0])));
    case "MAIOR": case "MENOR": case "MEDIA": {
      const vs = a.map((x) => aNumero(ev(x))).filter((x) => x !== null);
      if (!vs.length) return null;
      if (ast.fn === "MAIOR") return Math.max(...vs);
      if (ast.fn === "MENOR") return Math.min(...vs);
      return vs.reduce((s, x) => s + x, 0) / vs.length;
    }
  }
  throw new ErrorEvaluacion(`Función no implementada: ${ast.fn}`);
}

module.exports = { evaluar, aNumero, esNulo, horaDec, decHora, sumarDias, ErrorEvaluacion };
