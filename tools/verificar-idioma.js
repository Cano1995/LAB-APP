// Control de idioma (Sprint 13): busca portugués en los textos que ve el usuario.
// Revisa los textos entre comillas y el texto de JSX de web/src y api/src, y los títulos de api/src/modules/maestras/recursos.js.
// Uso: node tools/verificar-idioma.js [--todo]   (sale con código 1 si hay hallazgos; --todo también lista la lista blanca)
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const CARPETAS = ["web/src", "api/src"];
const EXT = /\.(tsx?|jsx?)$/;

// Caracteres que el español no usa: ã õ ç â ê ô (y sus mayúsculas).
const CARACTERES = /[ãõçâêôÃÕÇÂÊÔ]/;
// Palabras portuguesas sin esos caracteres (se buscan como palabra completa, sin distinguir mayúsculas).
const PALABRAS = new RegExp("\\b(safra|safras|fundo|fundos|fazenda|talh[aã]o|empreiteiros?|est[aá]gio|colheita|moagem|painel|boletim|ordem|lancamento|frente de trabalho|nenhum|voce|obrigatorio|pesquisar|percurso|configura[cç][aã]o|par[aâ]metros|cadastros?|setor|cadastro)\\b", "i");

// Lista blanca: textos que pueden aparecer tal cual (nombres propios, identificadores técnicos).
// Se compara contra el texto completo del literal.
const LISTA_BLANCA = [
  /^\/api\//, /^\/gpi\//, /^\/lab\//, /^\/maestras\//, /^\/admin\//, // rutas
  /^[a-z0-9_.\-/:]+$/,                                                  // identificadores, claves, MIME
];

// Excepciones por archivo y fragmento exacto (documentar el motivo).
const EXCEPCIONES = [
  { archivo: "api/src/modules/gpi/formula/dbselect.js", contiene: "SAFRA", motivo: "nombre del marcador [VAR_SAFRA] que usan las consultas guardadas en la base" },
  { archivo: "api/src/modules/gpi/formula/evaluador.js", contiene: "SAFRA", motivo: "palabra clave de las fórmulas guardadas en la base (VB6)" },
  { archivo: "api/src/modules/gpi/gpi.routes.js", contiene: "/lancamento", motivo: "ruta de la API (no la ve el usuario)" },
  { archivo: "api/src/modules/gpi/gpi.service.js", contiene: "GI_LAB_", motivo: "nombre de tabla de la base" },
];

function* archivos(dir) {
  for (const e of fs.readdirSync(path.join(RAIZ, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") yield* archivos(rel); }
    else if (EXT.test(e.name)) yield rel;
  }
}

// Quita comentarios (// y /* */ y {/* */}) sin tocar las cadenas: recorre el texto carácter a carácter.
function sinComentarios(src) {
  let out = "", i = 0, q = null;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (q) {
      out += c;
      if (c === "\\") { out += n ?? ""; i += 2; continue; }
      if (c === q) q = null;
      i++; continue;
    }
    if (c === "/" && n === "/" && src[i - 1] !== ":") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && n === "*") { const f = src.indexOf("*/", i + 2); const hasta = f < 0 ? src.length : f + 2; out += src.slice(i, hasta).replace(/[^\n]/g, " "); i = hasta; continue; }
    if (c === '"' || c === "'" || c === "`") q = c;
    out += c; i++;
  }
  return out;
}

function textosDe(src) {
  const limpio = sinComentarios(src);
  const lineas = limpio.split("\n");
  const res = [];
  lineas.forEach((l, i) => {
    for (const m of l.matchAll(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)) res.push({ linea: i + 1, texto: m[1] ?? m[2] ?? m[3] });
    for (const m of l.matchAll(/>([^<>{}]+)</g)) if (m[1].trim()) res.push({ linea: i + 1, texto: m[1].trim() });
  });
  return res;
}

// Formato regional: los números se formatean con el locale único de web/src/lib/formato.ts (es-PY), no con "es" suelto.
const LOCALE_SUELTO = /toLocale(?:Date|Time)?String\(\s*["'](?!es-PY)/;

const hallazgos = [], toleradas = [];
for (const dir of CARPETAS) {
  for (const rel of archivos(dir)) {
    if (/[\\/]test[\\/]/.test(rel)) continue;
    if (dir === "web/src" && !rel.endsWith("lib/formato.ts")) {
      fs.readFileSync(path.join(RAIZ, rel), "utf8").split("\n").forEach((l, i) => {
        if (LOCALE_SUELTO.test(l)) hallazgos.push({ rel, linea: i + 1, texto: "locale distinto de es-PY (usar LOCALE de lib/formato)" });
      });
    }
    for (const { linea, texto } of textosDe(fs.readFileSync(path.join(RAIZ, rel), "utf8"))) {
      const t = texto.replace(/\$\{[^}]*\}/g, " ");
      if (!CARACTERES.test(t) && !PALABRAS.test(t)) continue;
      if (LISTA_BLANCA.some((r) => r.test(t))) continue;
      const exc = EXCEPCIONES.find((x) => x.archivo === rel && t.includes(x.contiene));
      (exc ? toleradas : hallazgos).push({ rel, linea, texto: t.trim().slice(0, 90), motivo: exc?.motivo });
    }
  }
}

const porArchivo = {};
for (const h of hallazgos) (porArchivo[h.rel] ||= []).push(h);
for (const [rel, lista] of Object.entries(porArchivo)) {
  console.log(`\n${rel} (${lista.length})`);
  for (const h of lista) console.log(`  ${h.linea}: ${h.texto}`);
}
if (process.argv.includes("--todo")) for (const h of toleradas) console.log(`  (tolerado) ${h.rel}:${h.linea}: ${h.texto} — ${h.motivo}`);
console.log(`\nIdioma: ${hallazgos.length} hallazgo(s) en ${Object.keys(porArchivo).length} archivo(s).`);
process.exit(hallazgos.length ? 1 : 0);
