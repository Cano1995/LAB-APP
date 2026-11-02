// Sprint 11: secreto JWT (A6), límite de pedidos (A5), cabeceras de seguridad y CORS con lista blanca (A16).
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const express = require("express");

const RAIZ = path.join(__dirname, "..");
const src = (p) => path.join(RAIZ, "src", p);
const BASE_ENV = { DB_USER: "TEST", DB_PASSWORD: "x", DB_CONNECT_STRING: "localhost/TEST" };

// ---------- A6: configuración del secreto JWT ----------
function arrancarConfig(secreto) {
  try {
    execFileSync(process.execPath, ["-e", `require(${JSON.stringify(src("config"))})`], { env: { ...process.env, ...BASE_ENV, JWT_SECRET: secreto }, stdio: "pipe", cwd: RAIZ });
    return { ok: true };
  } catch (e) { return { ok: false, mensaje: String(e.stderr) }; }
}

test("A6: la configuración rechaza un secreto JWT corto", () => {
  const r = arrancarConfig("corto-123");
  assert.equal(r.ok, false);
  assert.match(r.mensaje, /JWT_SECRET/);
});

test("A6: la configuración rechaza el valor de ejemplo del .env.example", () => {
  const r = arrancarConfig("cambiar-esto-por-un-secreto-largo-y-aleatorio");
  assert.equal(r.ok, false);
  assert.match(r.mensaje, /ejemplo/);
});

test("A6: acepta un secreto largo y aleatorio", () => {
  assert.equal(arrancarConfig("a".repeat(8) + "Zk93-xQ7pLm2VbN5tR8wYc1dFhJ6sG0eU4iOa").ok, true);
});

// ---------- A5: límite de pedidos ----------
const { limitarPorIp } = require(src("middleware/limite"));
const { cabecerasSeguras, corsConLista } = require(src("middleware/seguridad"));

async function servir(app) {
  const servidor = http.createServer(app);
  await new Promise((r) => servidor.listen(0, r));
  return { servidor, base: `http://127.0.0.1:${servidor.address().port}` };
}

test("A5: el pedido número max+1 de la misma IP recibe 429 con Retry-After, y otra IP no se ve afectada", async () => {
  const limite = limitarPorIp({ ventanaMs: 60_000, max: 3 });
  const app = express();
  app.set("trust proxy", true); // en la prueba la IP se toma de X-Forwarded-For
  app.post("/login", limite, (_req, res) => res.json({ ok: true }));
  const { servidor, base } = await servir(app);
  try {
    const pedir = (ip) => fetch(base + "/login", { method: "POST", headers: { "X-Forwarded-For": ip } });
    for (let i = 0; i < 3; i++) assert.equal((await pedir("10.0.0.1")).status, 200);
    const bloqueado = await pedir("10.0.0.1");
    assert.equal(bloqueado.status, 429);
    assert.ok(Number(bloqueado.headers.get("retry-after")) >= 1);
    assert.equal((await bloqueado.json()).code, "DEMASIADOS_PEDIDOS");
    assert.equal((await pedir("10.0.0.2")).status, 200, "otra IP no comparte el contador");
  } finally { limite.detener(); servidor.close(); }
});

test("A5: la ventana se libera con el tiempo", async () => {
  const limite = limitarPorIp({ ventanaMs: 150, max: 1 });
  const app = express();
  app.get("/", limite, (_req, res) => res.json({ ok: true }));
  const { servidor, base } = await servir(app);
  try {
    assert.equal((await fetch(base)).status, 200);
    assert.equal((await fetch(base)).status, 429);
    await new Promise((r) => setTimeout(r, 200));
    assert.equal((await fetch(base)).status, 200);
  } finally { limite.detener(); servidor.close(); }
});

// ---------- A16: cabeceras y CORS ----------
test("A16: las respuestas llevan cabeceras de seguridad y no revelan Express", async () => {
  const app = express();
  app.disable("x-powered-by");
  app.use(cabecerasSeguras);
  app.get("/", (_req, res) => res.json({ ok: true }));
  const { servidor, base } = await servir(app);
  try {
    const r = await fetch(base);
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    assert.equal(r.headers.get("x-frame-options"), "DENY");
    assert.equal(r.headers.get("cache-control"), "no-store");
    assert.equal(r.headers.get("referrer-policy"), "no-referrer");
    assert.equal(r.headers.get("x-powered-by"), null);
  } finally { servidor.close(); }
});

test("A16: CORS solo habilita los orígenes de la lista", async () => {
  const app = express();
  app.use(corsConLista(["http://localhost:3100"]));
  app.get("/", (_req, res) => res.json({ ok: true }));
  const { servidor, base } = await servir(app);
  try {
    const permitido = await fetch(base, { headers: { Origin: "http://localhost:3100" } });
    assert.equal(permitido.headers.get("access-control-allow-origin"), "http://localhost:3100");
    const ajeno = await fetch(base, { headers: { Origin: "http://sitio-malicioso.example" } });
    assert.equal(ajeno.headers.get("access-control-allow-origin"), null, "un origen ajeno no recibe permiso");
    const sinOrigen = await fetch(base);
    assert.equal(sinOrigen.status, 200, "sin cabecera Origin (servidor a servidor / mismo origen) funciona");
  } finally { servidor.close(); }
});
