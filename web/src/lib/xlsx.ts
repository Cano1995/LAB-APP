// Exportación a Excel (.xlsx) sin dependencias: arma el libro a mano (XML + ZIP sin compresión).
// Soporta lo que necesita la Digitación diaria: celdas combinadas, colores de fondo, negrita, bordes, alineación y anchos.

export type Relleno = "gris" | "verde" | "rosa" | "amarillo" | "celeste" | "violeta";
export interface Estilo { negrita?: boolean; relleno?: Relleno; alinear?: "left" | "center" | "right" }
export interface CeldaX { v: string | number | null | undefined; e?: Estilo }
export interface HojaX {
  nombre: string;
  filas: (CeldaX | null)[][];
  /** Combinadas: [filaIni, colIni, filaFin, colFin], base 0. */
  combinadas?: [number, number, number, number][];
  /** Ancho de cada columna en caracteres. */
  anchos?: number[];
}

const COLORES: Record<Relleno, string> = {
  gris: "FFD9D9D9", verde: "FF66CC00", rosa: "FFEE82EE", amarillo: "FFFFFF00", celeste: "FF87CEEB", violeta: "FFDDD0F5",
};

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)
  // Caracteres de control no válidos en XML 1.0.
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

// A, B, …, Z, AA…
function letra(i: number): string {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function xmlHoja(h: HojaX, estilos: (e?: Estilo) => number): string {
  const filas = h.filas.map((fila, r) => {
    const celdas = fila.map((c, i) => {
      if (!c) return "";
      const ref = `${letra(i)}${r + 1}`;
      const s = estilos(c.e);
      if (c.v == null || c.v === "") return `<c r="${ref}" s="${s}"/>`;
      if (typeof c.v === "number") return `<c r="${ref}" s="${s}"><v>${c.v}</v></c>`;
      return `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${esc(c.v)}</t></is></c>`;
    }).join("");
    return `<row r="${r + 1}">${celdas}</row>`;
  }).join("");
  const cols = h.anchos?.length
    ? `<cols>${h.anchos.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const comb = h.combinadas?.length
    ? `<mergeCells count="${h.combinadas.length}">${h.combinadas.map(([a, b, c, d]) => `<mergeCell ref="${letra(b)}${a + 1}:${letra(d)}${c + 1}"/>`).join("")}</mergeCells>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${filas}</sheetData>${comb}</worksheet>`;
}

// Registro de estilos: cada combinación distinta pasa a ser un <xf>.
function registroEstilos() {
  const lista: Estilo[] = [{}];
  const indice = (e: Estilo = {}) => {
    const k = JSON.stringify([!!e.negrita, e.relleno ?? "", e.alinear ?? ""]);
    const i = lista.findIndex((x) => JSON.stringify([!!x.negrita, x.relleno ?? "", x.alinear ?? ""]) === k);
    if (i >= 0) return i;
    lista.push(e);
    return lista.length - 1;
  };
  const xml = () => {
    const rellenos = Object.keys(COLORES) as Relleno[];
    const fills = [`<fill><patternFill patternType="none"/></fill>`, `<fill><patternFill patternType="gray125"/></fill>`,
      ...rellenos.map((r) => `<fill><patternFill patternType="solid"><fgColor rgb="${COLORES[r]}"/><bgColor indexed="64"/></patternFill></fill>`)];
    const xfs = lista.map((e) => {
      const fill = e.relleno ? 2 + rellenos.indexOf(e.relleno) : 0;
      return `<xf numFmtId="0" fontId="${e.negrita ? 1 : 0}" fillId="${fill}" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"${e.alinear ? ` horizontal="${e.alinear}"` : ""}/></xf>`;
    }).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
      + `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>`
      + `<fills count="${fills.length}">${fills.join("")}</fills>`
      + `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders>`
      + `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`
      + `<cellXfs count="${lista.length}">${xfs}</cellXfs></styleSheet>`;
  };
  return { indice, xml };
}

// --- ZIP sin compresión ---
const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
export function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = TABLA_CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zip(archivos: { nombre: string; datos: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const locales: Uint8Array[] = [];
  const centrales: Uint8Array[] = [];
  let pos = 0;
  for (const a of archivos) {
    const nombre = enc.encode(a.nombre);
    const crc = crc32(a.datos);
    const loc = new Uint8Array(30 + nombre.length);
    const v = new DataView(loc.buffer);
    v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(8, 0, true);
    v.setUint16(10, 0, true); v.setUint16(12, 0x21, true); // 1980-01-01
    v.setUint32(14, crc, true); v.setUint32(18, a.datos.length, true); v.setUint32(22, a.datos.length, true);
    v.setUint16(26, nombre.length, true); v.setUint16(28, 0, true);
    loc.set(nombre, 30);
    const cen = new Uint8Array(46 + nombre.length);
    const c = new DataView(cen.buffer);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true); c.setUint16(12, 0, true); c.setUint16(14, 0x21, true);
    c.setUint32(16, crc, true); c.setUint32(20, a.datos.length, true); c.setUint32(24, a.datos.length, true);
    c.setUint16(28, nombre.length, true); c.setUint32(42, pos, true);
    cen.set(nombre, 46);
    locales.push(loc, a.datos);
    centrales.push(cen);
    pos += loc.length + a.datos.length;
  }
  const tamCen = centrales.reduce((s, x) => s + x.length, 0);
  const fin = new Uint8Array(22);
  const f = new DataView(fin.buffer);
  f.setUint32(0, 0x06054b50, true); f.setUint16(8, archivos.length, true); f.setUint16(10, archivos.length, true);
  f.setUint32(12, tamCen, true); f.setUint32(16, pos, true);
  const partes = [...locales, ...centrales, fin];
  const out = new Uint8Array(partes.reduce((s, x) => s + x.length, 0));
  let o = 0;
  for (const p of partes) { out.set(p, o); o += p.length; }
  return out;
}

export function armarXlsx(hoja: HojaX): Uint8Array {
  const enc = new TextEncoder();
  const reg = registroEstilos();
  const sheet = xmlHoja(hoja, reg.indice); // primero, para que el registro conozca todos los estilos
  const nombre = esc(hoja.nombre.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Hoja1");
  const A = (nombreArchivo: string, texto: string) => ({ nombre: nombreArchivo, datos: enc.encode(texto) });
  const cab = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`;
  return zip([
    A("[Content_Types].xml", `${cab}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    A("_rels/.rels", `${cab}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    A("xl/workbook.xml", `${cab}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${nombre}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    A("xl/_rels/workbook.xml.rels", `${cab}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    A("xl/styles.xml", reg.xml()),
    A("xl/worksheets/sheet1.xml", sheet),
  ]);
}

export function bajarXlsx(nombreArchivo: string, hoja: HojaX) {
  const blob = new Blob([armarXlsx(hoja)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
