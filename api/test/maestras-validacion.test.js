// A12 / A13 (Sprint 11): validación estricta de entrada en el CRUD de maestras y tope de filas.
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");

Object.assign(process.env, { DB_USER: "TEST", DB_PASSWORD: "x", DB_CONNECT_STRING: "localhost/TEST", JWT_SECRET: "una-clave-de-prueba-larga-y-aleatoria-0123456789abcdef" });
const src = (p) => path.join(__dirname, "..", "src", p);

const db = require(src("db"));
const llamadas = [];
let filasListar = [];
let falloInsert = null; // error que debe lanzar el próximo INSERT (el servicio conserva la referencia original de db.query: el doble es conmutable)
db.query = async (sql, binds, opts) => {
  llamadas.push({ sql, binds, opts });
  if (falloInsert && /^INSERT/.test(sql)) throw falloInsert;
  return /^SELECT/.test(sql) ? { rows: filasListar } : { rows: [], rowsAffected: 1 };
};
db.queryOne = async () => null; // no existe (sin duplicado)

const authSvc = require(src("modules/auth/auth.service"));
authSvc.verificarToken = () => ({ sub: 1, typ: "access" });
authSvc.buscarUsuarioPorId = async () => ({ ID_USUARIO: 1, DSC_USUARIO: "T", USE_NOME: "T", USE_MASTER: "0", USE_ATIVO: "1" });
authSvc.nivelFormulario = async () => 3;

const recurso = {
  nombre: "x", titulo: "X", idForm: 1, esquema: "GATEC_AGR", tabla: "T", scoped: false, pk: ["ID"],
  columnas: [
    { col: "ID", label: "Código", tipo: "numero", pk: true, req: true },
    { col: "NOMBRE", label: "Nombre", tipo: "texto", len: 40 },
    { col: "ACTIVO", label: "Activo", tipo: "bool" },
    { col: "ACTIVO_SN", label: "Activo S/N", tipo: "bool", sn: true },
    { col: "DESDE", label: "Desde", tipo: "fecha" },
    { col: "FACTOR", label: "Factor", tipo: "numero" },
  ],
};
require(src("modules/maestras/recursos")).getRecurso = () => recurso;

const svc = require(src("modules/maestras/maestras.service"));
const insertBinds = () => llamadas.find((l) => /^INSERT/.test(l.sql))?.binds;
const limpiar = () => { llamadas.length = 0; filasListar = []; };

test("A13: el texto «false» ya no se guarda como verdadero", async () => {
  limpiar();
  const r = await svc.crear(recurso, { ID: 1, ACTIVO: "false", ACTIVO_SN: "false" });
  assert.ok(r.ok, JSON.stringify(r));
  assert.equal(insertBinds().ACTIVO, 0);
  assert.equal(insertBinds().ACTIVO_SN, "N");
});

test("A13: los valores verdaderos explícitos se guardan como verdaderos", async () => {
  limpiar();
  await svc.crear(recurso, { ID: 2, ACTIVO: "1", ACTIVO_SN: true });
  assert.equal(insertBinds().ACTIVO, 1);
  assert.equal(insertBinds().ACTIVO_SN, "S");
});

test("A13: un booleano ambiguo se rechaza", async () => {
  limpiar();
  const r = await svc.crear(recurso, { ID: 3, ACTIVO: "quizás" });
  assert.match(r.error, /Activo debe ser verdadero o falso/);
  assert.ok(!insertBinds(), "no debe insertar");
});

test("A13: un número en notación hexadecimal o científica se rechaza", async () => {
  for (const malo of ["0x10", "1e5", "Infinity"]) {
    limpiar();
    const r = await svc.crear(recurso, { ID: 4, FACTOR: malo });
    assert.match(r.error, /Factor debe ser numérico/, malo);
  }
  limpiar();
  const ok = await svc.crear(recurso, { ID: 5, FACTOR: "1,5" });
  assert.ok(ok.ok, "la coma decimal es válida");
});

test("A13: una fecha que no existe en el calendario se rechaza", async () => {
  limpiar();
  const r = await svc.crear(recurso, { ID: 6, DESDE: "2026-02-30" });
  assert.match(r.error, /Desde debe ser una fecha válida/);
  limpiar();
  const ok = await svc.crear(recurso, { ID: 7, DESDE: "2026-02-28" });
  assert.ok(ok.ok);
});

test("A13: los errores de tipo y fecha de Oracle se traducen en vez de dar 500", async () => {
  limpiar();
  falloInsert = new Error("ORA-01847: el día del mes debe estar entre 1 y el último día del mes");
  try {
    const r = await svc.crear(recurso, { ID: 8, DESDE: "2026-02-27" });
    assert.match(r.error, /fecha o una hora no es válida/);
  } finally { falloInsert = null; }
});

// ---------- A12: tope de filas por la ruta ----------
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
const pedir = (ruta) => fetch(base + ruta, { headers: { Authorization: "Bearer t" } });

test("A12: limit=0, limit=abc y limit fuera de rango son 400", async () => {
  for (const malo of ["0", "abc", "-5", "5001", "1e3", "0x10"]) {
    const r = await pedir(`/api/maestras/x?limit=${malo}`);
    assert.equal(r.status, 400, `limit=${malo}`);
  }
});

test("A12: el tope usado llega al SQL y la respuesta avisa el truncado", async () => {
  limpiar();
  filasListar = [{ ID: "1" }, { ID: "2" }, { ID: "3" }];
  const r = await pedir("/api/maestras/x?limit=3");
  assert.equal(r.status, 200);
  const cuerpo = await r.json();
  assert.equal(cuerpo.truncado, true, "se alcanzó el tope: puede haber más filas");
  assert.equal(llamadas.find((l) => /^SELECT/.test(l.sql)).opts.maxRows, 3);

  limpiar();
  filasListar = [{ ID: "1" }];
  const r2 = await pedir("/api/maestras/x?limit=3");
  assert.equal((await r2.json()).truncado, false);
});

test("A13: ?q repetido (arreglo) es 400", async () => {
  const r = await pedir("/api/maestras/x?q=a&q=b");
  assert.equal(r.status, 400);
});
