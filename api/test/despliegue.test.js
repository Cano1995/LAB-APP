// Sprint 15: despliegue. La API sirve el front compilado, /api/ready, registro de pedidos en JSON y rutas inexistentes. Sin base de datos.
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

Object.assign(process.env, {
  DB_USER: "TEST", DB_PASSWORD: "x", DB_CONNECT_STRING: "localhost/TEST",
  JWT_SECRET: "una-clave-de-prueba-larga-y-aleatoria-0123456789abcdef",
});
const { crearApp } = require(path.join(__dirname, "..", "src", "app"));

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "azpa-front-"));
fs.mkdirSync(path.join(dir, "assets"));
fs.writeFileSync(path.join(dir, "index.html"), "<!doctype html><title>lab-app</title><div id=root></div>");
fs.writeFileSync(path.join(dir, "assets", "app-abc123.js"), "console.log(1)");

let baseDatosViva = true;
const lineas = [];
let servidor, base;
test.before(async () => {
  const app = crearApp({ listo: async () => { if (!baseDatosViva) throw new Error("ORA-12541: sin listener en esquema SECRETO"); }, dirFront: dir, escribirRegistro: (l) => lineas.push(l) });
  servidor = http.createServer(app);
  await new Promise((r) => servidor.listen(0, r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
test.after(() => { servidor.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test("/api/ready responde 200 con la base viva y 503 sin filtrar el mensaje de Oracle", async () => {
  let r = await fetch(`${base}/api/ready`);
  assert.equal(r.status, 200);
  baseDatosViva = false;
  r = await fetch(`${base}/api/ready`);
  assert.equal(r.status, 503);
  const cuerpo = await r.text();
  assert.doesNotMatch(cuerpo, /ORA-|SECRETO/);
  baseDatosViva = true;
});

test("sirve index.html con política de contenido y sin caché", async () => {
  const r = await fetch(`${base}/`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /lab-app/);
  assert.equal(r.headers.get("cache-control"), "no-cache");
  assert.match(r.headers.get("content-security-policy"), /default-src 'self'/);
  assert.equal(r.headers.get("x-frame-options"), "DENY");
});

test("una ruta del front (/gpi/valores) devuelve index.html para que la resuelva el navegador", async () => {
  const r = await fetch(`${base}/gpi/valores?x=1`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /id=root/);
});

test("los archivos con hash se guardan en caché un año", async () => {
  const r = await fetch(`${base}/assets/app-abc123.js`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get("cache-control"), /max-age=31536000, immutable/);
});

test("una ruta /api inexistente es 404 JSON, no el index.html del front", async () => {
  const r = await fetch(`${base}/api/no-existe`);
  assert.equal(r.status, 404);
  assert.match(r.headers.get("content-type"), /json/);
  assert.equal((await r.json()).error, "Ruta inexistente");
});

test("las respuestas de la API no se guardan en caché", async () => {
  const r = await fetch(`${base}/api/health`);
  assert.equal(r.headers.get("cache-control"), "no-store");
});

test("el registro es JSON, sin la cadena de consulta ni datos del usuario, y no registra /api/health", async () => {
  lineas.length = 0;
  await fetch(`${base}/api/health`);
  await fetch(`${base}/api/maestras?q=secreto123`, { headers: { Authorization: "Bearer abc.def.ghi" } });
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(lineas.length, 1);
  const l = JSON.parse(lineas[0]);
  assert.equal(l.ruta, "/api/maestras");
  assert.equal(l.estado, 401);
  assert.equal(l.nivel, "aviso");
  assert.equal(typeof l.ms, "number");
  assert.doesNotMatch(lineas[0], /secreto123|abc\.def/);
});

test("sin carpeta de front la API sigue funcionando y no inventa rutas", async () => {
  const app = crearApp({ dirFront: path.join(dir, "no-existe") });
  const s = http.createServer(app);
  await new Promise((r) => s.listen(0, r));
  try {
    const r = await fetch(`http://127.0.0.1:${s.address().port}/`);
    assert.equal(r.status, 404);
  } finally { s.close(); }
});
