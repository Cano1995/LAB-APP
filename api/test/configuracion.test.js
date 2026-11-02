// Configuración de marca: validación de imágenes y textos (todo se rechaza antes de tocar la base, así que no hace falta una).
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const http = require("node:http");

Object.assign(process.env, {
  DB_USER: "TEST", DB_PASSWORD: "x", DB_CONNECT_STRING: "localhost/TEST",
  JWT_SECRET: "una-clave-de-prueba-larga-y-aleatoria-0123456789abcdef",
});
const svc = require(path.join(__dirname, "..", "src", "modules", "configuracion", "configuracion.service"));
const { crearApp } = require(path.join(__dirname, "..", "src", "app"));

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(20)]);
const quien = { idUsuario: 1, usuario: "ADMIN" };

test("firma: acepta imágenes reales y rechaza las que dicen otro formato", () => {
  assert.equal(svc.coincideFirma("image/png", PNG), true);
  assert.equal(svc.coincideFirma("image/jpeg", PNG), false);
  assert.equal(svc.coincideFirma("image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0])), true);
  assert.equal(svc.coincideFirma("image/x-icon", Buffer.from([0, 0, 1, 0, 1])), true);
  assert.equal(svc.coincideFirma("image/gif", PNG), false);
});

test("SVG: se acepta el limpio y se rechaza el que trae scripts o manejadores", () => {
  const limpio = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>');
  assert.equal(svc.coincideFirma("image/svg+xml", limpio), true);
  for (const malo of [
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><rect/></a></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div/></foreignObject></svg>',
    "<html><body>no soy un svg</body></html>",
  ]) assert.equal(svc.coincideFirma("image/svg+xml", Buffer.from(malo)), false, malo);
});

test("guardarAsset rechaza clave, formato, base64, tamaño y contenido inválidos", async () => {
  const ok = { mime: "image/png", nombre: "logo.png", datos: PNG.toString("base64") };
  await assert.rejects(svc.guardarAsset(quien, "inexistente", ok), /desconocida/);
  await assert.rejects(svc.guardarAsset(quien, "logo_claro", { ...ok, mime: "image/gif" }), /Formato no admitido/);
  await assert.rejects(svc.guardarAsset(quien, "logo_claro", { ...ok, datos: "no es base64!" }), /Archivo inválido/);
  await assert.rejects(svc.guardarAsset(quien, "logo_claro", { ...ok, datos: Buffer.from("texto plano").toString("base64") }), /no corresponde/);
  await assert.rejects(svc.guardarAsset(quien, "favicon", { ...ok, datos: Buffer.concat([PNG, Buffer.alloc(300_000)]).toString("base64") }), /supera el máximo/);
  await assert.rejects(svc.guardarAsset(quien, "logo_claro", { ...ok, mime: "image/x-icon" }), /Formato no admitido/);
});

test("guardarTextos rechaza campos desconocidos, vacíos obligatorios y largos excesivos", async () => {
  await assert.rejects(svc.guardarTextos(quien, { otro: "x" }), /desconocido/);
  await assert.rejects(svc.guardarTextos(quien, { nombre: "   " }), /obligatorio/);
  await assert.rejects(svc.guardarTextos(quien, { nombre: "x".repeat(81) }), /hasta 80/);
  await assert.rejects(svc.guardarTextos(quien, { lema: 5 }), /texto/);
  await assert.rejects(svc.guardarTextos(quien, null), /inválidos/);
});

test("la administración de la marca exige sesión", async () => {
  const servidor = http.createServer(crearApp({ dirFront: null }));
  await new Promise((r) => servidor.listen(0, r));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  try {
    for (const [metodo, ruta] of [["GET", "/api/admin/configuracion"], ["PUT", "/api/admin/configuracion"], ["PUT", "/api/admin/configuracion/assets/logo_claro"], ["DELETE", "/api/admin/configuracion/assets/logo_claro"]]) {
      const r = await fetch(base + ruta, { method: metodo, headers: { "Content-Type": "application/json" }, body: metodo === "PUT" ? "{}" : undefined });
      assert.equal(r.status, 401, `${metodo} ${ruta}`);
    }
  } finally { servidor.close(); }
});
