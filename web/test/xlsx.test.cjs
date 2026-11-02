// El .xlsx de la Digitación diaria se arma a mano (sin librería): el ZIP debe ser válido y la hoja conservar celdas combinadas, colores y textos.
const test = require("node:test");
const assert = require("node:assert/strict");
const { cargarTs } = require("./util.cjs");
const { armarXlsx, crc32 } = cargarTs("src/lib/xlsx.ts");

// Lee las entradas de un ZIP sin compresión recorriendo el directorio central.
function entradas(bytes) {
  const b = Buffer.from(bytes);
  const fin = b.length - 22;
  assert.equal(b.readUInt32LE(fin), 0x06054b50);
  const n = b.readUInt16LE(fin + 10);
  let p = b.readUInt32LE(fin + 16);
  const out = {};
  for (let i = 0; i < n; i++) {
    assert.equal(b.readUInt32LE(p), 0x02014b50);
    const crc = b.readUInt32LE(p + 16), tam = b.readUInt32LE(p + 20), ln = b.readUInt16LE(p + 28), off = b.readUInt32LE(p + 42);
    const nombre = b.toString("utf8", p + 46, p + 46 + ln);
    const datos = b.subarray(off + 30 + b.readUInt16LE(off + 26) + b.readUInt16LE(off + 28), off + 30 + b.readUInt16LE(off + 26) + b.readUInt16LE(off + 28) + tam);
    assert.equal(crc32(datos), crc, `CRC de ${nombre}`);
    out[nombre] = datos.toString("utf8");
    p += 46 + ln;
  }
  return out;
}

test("arma un libro con las partes mínimas y CRC correcto", () => {
  const e = entradas(armarXlsx({ nombre: "Hoja: <1>", filas: [[{ v: "Análisis & más", e: { negrita: true, relleno: "verde" } }, { v: 12.5 }]], combinadas: [[0, 0, 0, 1]], anchos: [10, 8] }));
  assert.deepEqual(Object.keys(e).sort(), ["[Content_Types].xml", "_rels/.rels", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml"]);
  assert.match(e["xl/worksheets/sheet1.xml"], /Análisis &amp; más/);
  assert.match(e["xl/worksheets/sheet1.xml"], /<mergeCell ref="A1:B1"\/>/);
  assert.match(e["xl/worksheets/sheet1.xml"], /<c r="B1" s="0"><v>12.5<\/v><\/c>/);
  assert.match(e["xl/styles.xml"], /FF66CC00/);
  assert.match(e["xl/workbook.xml"], /name="Hoja {2}&lt;1&gt;"/);
});

test("crc32 coincide con el valor conocido", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});
