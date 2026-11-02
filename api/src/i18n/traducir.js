// Capa de traducción portugués → español para los títulos que vienen de la base (la base la comparte el VB6 y no se toca).
// Se aplica al leer: `titulo(texto, idForm)`. Si queda portugués sin traducir se muestra el texto y se registra como faltante una sola vez.
const glosario = require("./glosario-es.json");
const puntuales = require("./titulos-es.json");

const quitarTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const palabras = glosario.palabras;
// Frases: se indexan por su primera palabra y se prueban de la más larga a la más corta.
const frasesPorInicio = new Map();
for (const [k, v] of Object.entries(glosario.frases).sort((a, b) => b[0].split(" ").length - a[0].split(" ").length)) {
  const clave = k.split(" ");
  if (!frasesPorInicio.has(clave[0])) frasesPorInicio.set(clave[0], []);
  frasesPorInicio.get(clave[0]).push([clave, v]);
}

// Mantiene el uso de mayúsculas del original: TODO MAYÚSCULAS, Inicial Mayúscula o minúsculas.
function conMayusculas(original, traduccion) {
  const letras = original.replace(/[^\p{L}]/gu, "");
  if (letras.length > 1 && letras === letras.toUpperCase()) return traduccion.toUpperCase();
  if (/^\p{Lu}/u.test(original)) return traduccion.charAt(0).toUpperCase() + traduccion.slice(1);
  return traduccion;
}

function traducir(texto) {
  if (!texto) return texto;
  const partes = texto.split(/(\p{L}+)/u); // separador, palabra, separador, palabra, ...
  const idx = [];
  partes.forEach((_, i) => { if (i % 2 === 1) idx.push(i); });
  const norm = idx.map((i) => quitarTildes(partes[i]));
  let salida = partes[0];
  let k = 0;
  while (k < idx.length) {
    const i = idx[k];
    let usada = 1, nuevo = null;
    for (const [clave, valor] of frasesPorInicio.get(norm[k]) ?? []) {
      if (k + clave.length <= norm.length && clave.every((c, j) => norm[k + j] === c)) {
        nuevo = conMayusculas(partes.slice(i, idx[k + clave.length - 1] + 1).join(""), valor);
        usada = clave.length;
        break;
      }
    }
    if (nuevo === null) { const t = palabras[norm[k]]; nuevo = t ? conMayusculas(partes[i], t) : partes[i]; }
    let despues = partes[idx[k + usada - 1] + 1] ?? "";
    if (nuevo.endsWith(".") && despues.startsWith(".")) despues = despues.slice(1); // abreviatura que ya trae su punto
    salida += nuevo + despues;
    k += usada;
  }
  return salida;
}

const PORTUGUES = /[ãõçâêôÃÕÇÂÊÔ]/;
const avisados = new Set();
const faltantes = [];

// Traduce el título de una pantalla/menú. `titulos-es.json` ({ idForm: "texto" }) permite una traducción puntual cuando el glosario no alcanza.
function titulo(texto, idForm) {
  if (texto == null) return texto;
  const puntual = idForm != null ? puntuales[idForm] : undefined;
  if (puntual) return puntual;
  const t = traducir(texto);
  if (PORTUGUES.test(t) && !avisados.has(t)) {
    avisados.add(t);
    faltantes.push({ idForm, texto, traduccion: t });
    console.warn(`[i18n] título sin traducir: ${idForm ?? "-"} «${texto}»`);
  }
  return t;
}

module.exports = { titulo, traducir, faltantes };
