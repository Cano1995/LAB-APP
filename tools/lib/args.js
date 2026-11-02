// Argumentos de línea de comandos de las herramientas, validados (M16): una fecha mal escrita o una empresa que no es un número cortan con un mensaje
// claro, en vez de armar consultas con texto de argv.
// leerArgs([{ nombre: "desde", tipo: "fecha", requerido: true }, { nombre: "empr", tipo: "entero", defecto: 1 }], uso) → { desde, empr, banderas }
const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

function fechaReal(s) {
  const m = FECHA.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

function leerArgs(definicion, uso, argv = process.argv.slice(2)) {
  const banderas = argv.filter((a) => a.startsWith("--"));
  const pos = argv.filter((a) => !a.startsWith("--"));
  const fallar = (msg) => { console.error(`${msg}\nUso: ${uso}`); process.exit(2); };
  if (pos.length > definicion.length) fallar(`Sobran argumentos: ${pos.slice(definicion.length).join(" ")}`);
  const out = { banderas };
  definicion.forEach((d, i) => {
    let v = pos[i];
    if (v === undefined || v === "") {
      if (d.requerido) fallar(`Falta el argumento «${d.nombre}».`);
      out[d.nombre] = d.defecto;
      return;
    }
    if (d.tipo === "fecha") { if (!fechaReal(v)) fallar(`«${d.nombre}» debe ser una fecha real AAAA-MM-DD (recibí «${v}»).`); } else if (d.tipo === "entero") {
      if (!/^\d{1,6}$/.test(v)) fallar(`«${d.nombre}» debe ser un número entero (recibí «${v}»).`);
      v = Number(v);
    }
    out[d.nombre] = v;
  });
  return out;
}

module.exports = { leerArgs, fechaReal };
