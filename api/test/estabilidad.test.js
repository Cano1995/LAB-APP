// Pruebas de estabilidad de la API (Sprint 11). Sin base de datos: se simulan las fallas.
//   cd api && node --test test/
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");

// Entorno mínimo para que config.js no falle (no se abre ninguna conexión).
Object.assign(process.env, {
  DB_USER: "TEST", DB_PASSWORD: "x", DB_CONNECT_STRING: "localhost/TEST",
  JWT_SECRET: "una-clave-de-prueba-larga-y-aleatoria-0123456789abcdef",
});

const src = (p) => path.join(__dirname, "..", "src", p);
const authSvc = require(src("modules/auth/auth.service"));
const recursos = require(src("modules/maestras/recursos"));

// Estado configurable de los dobles.
const estado = { verificar: () => ({ sub: 1, typ: "access" }), usuario: async () => ({ ID_USUARIO: 1, DSC_USUARIO: "T", USE_NOME: "T", USE_MASTER: "0", USE_ATIVO: "1" }), nivel: async () => 3 };
authSvc.verificarToken = (t) => estado.verificar(t);
authSvc.buscarUsuarioPorId = (id) => estado.usuario(id);
authSvc.nivelFormulario = (...a) => estado.nivel(...a);
recursos.getRecurso = () => ({ nombre: "x", titulo: "X", idForm: 1, scoped: false, columnas: [], pk: ["ID"] });

const express = require("express");
const { manejadorErrores } = require(src("middleware/errores"));
const maestras = require(src("modules/maestras/maestras.routes"));

let servidor, base;
test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/maestras", maestras);
  app.use(manejadorErrores);
  servidor = http.createServer(app);
  await new Promise((r) => servidor.listen(0, r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
test.after(() => servidor.close());

const pedir = (ruta, opciones = {}) => fetch(base + ruta, { ...opciones, headers: { Authorization: "Bearer t", "Content-Type": "application/json", ...(opciones.headers || {}) } });

test("A1: un error de base en cargarRecurso no tumba la API y no filtra el mensaje de Oracle", async () => {
  estado.nivel = async () => { throw new Error("ORA-00942: la tabla o vista GATEC_AGR.GA_SECRETA no existe"); };
  const r = await pedir("/api/maestras/x");
  assert.equal(r.status, 500);
  const cuerpo = await r.text();
  assert.equal(JSON.parse(cuerpo).error, "Error interno");
  assert.ok(!/ORA-|GATEC_AGR|GA_SECRETA/.test(cuerpo), "no debe filtrar detalles internos");
  // El proceso sigue vivo: un pedido posterior responde.
  estado.nivel = async () => 0;
  const r2 = await pedir("/api/maestras/x");
  assert.equal(r2.status, 403);
});

test("A4: un JSON malformado es 400 y no 500", async () => {
  estado.nivel = async () => 3;
  const r = await pedir("/api/maestras/x", { method: "POST", body: "{no es json" });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, "JSON inválido");
});

test("A1: un identificador con codificación malformada es 400", async () => {
  estado.nivel = async () => 3;
  const r = await pedir("/api/maestras/x/%E0%A4%A");
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, "Parámetro malformado");
});

test("A14: una caída de la base al validar el token es 503, no 401", async () => {
  estado.usuario = async () => { throw new Error("ORA-12541: no hay listener"); };
  const r = await pedir("/api/maestras/x");
  assert.equal(r.status, 503);
  estado.usuario = async () => ({ ID_USUARIO: 1, DSC_USUARIO: "T", USE_NOME: "T", USE_MASTER: "0", USE_ATIVO: "1" });
});

test("A14: un token inválido sigue siendo 401", async () => {
  estado.verificar = () => { throw new Error("jwt malformed"); };
  const r = await pedir("/api/maestras/x");
  assert.equal(r.status, 401);
  estado.verificar = () => ({ sub: 1, typ: "access" });
});

test("un token de otro tipo (no 'access') es 401", async () => {
  estado.verificar = () => ({ sub: 1, typ: "setup" });
  const r = await pedir("/api/maestras/x");
  assert.equal(r.status, 401);
  estado.verificar = () => ({ sub: 1, typ: "access" });
});
