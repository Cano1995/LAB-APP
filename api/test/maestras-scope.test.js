// A3 (Sprint 11): leer, editar y borrar un registro de maestras debe respetar la empresa/zafra del usuario.
// Se dobla la capa de acceso a la base y se verifica el SQL y los parámetros que se enviarían.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

Object.assign(process.env, { DB_USER: "TEST", DB_PASSWORD: "x", DB_CONNECT_STRING: "localhost/TEST", JWT_SECRET: "una-clave-de-prueba-larga-y-aleatoria-0123456789abcdef" });

const db = require(path.join(__dirname, "..", "src", "db"));
const llamadas = [];
let filas = [];     // lo que devolvería queryOne para SELECT * (el registro)
let cuenta = 1;     // lo que devolvería COUNT(*)
db.queryOne = async (sql, binds) => { llamadas.push({ sql, binds }); return /COUNT\(\*\)/.test(sql) ? { N: cuenta } : filas.shift() ?? null; };
db.query = async (sql, binds) => { llamadas.push({ sql, binds }); return { rows: [], rowsAffected: 1 }; };

const svc = require(path.join(__dirname, "..", "src", "modules", "maestras", "maestras.service"));

// Recurso con empresa en la PK (como `funcionarios`) y otro con empresa/zafra fuera de la PK (como `fundo-agricola`).
const conEmpresaEnPk = {
  esquema: "GATEC_AGR", tabla: "T1", scoped: true, pk: ["COD_EMPR", "ID"],
  columnas: [
    { col: "COD_EMPR", label: "Empresa", tipo: "texto", fixedLen: 2, len: 2, pk: true, scope: true },
    { col: "ID", label: "Código", tipo: "numero", pk: true },
    { col: "NOMBRE", label: "Nombre", tipo: "texto", len: 40 },
  ],
};
const conEmpresaFueraDePk = {
  esquema: "GATEC_AGR", tabla: "T2", scoped: true, pk: ["ID"],
  columnas: [
    { col: "ID", label: "Código", tipo: "numero", pk: true },
    { col: "COD_EMPR", label: "Empresa", tipo: "texto", fixedLen: 2, len: 2, scope: true },
    { col: "SAF_ANO_SAFRA", label: "Zafra", tipo: "numero", scope: true },
    { col: "NOMBRE", label: "Nombre", tipo: "texto", len: 40 },
  ],
};
const ctx = { empresa: { cod: 2 }, safra: 2026 };
const limpiar = () => { llamadas.length = 0; filas = []; cuenta = 1; };

test("obtener: el WHERE incluye el filtro de empresa del usuario aunque la URL pida otra", async () => {
  limpiar();
  filas = [{ COD_EMPR: "02", ID: "7", NOMBRE: "X" }];
  await svc.obtener(conEmpresaEnPk, ["01", "7"], ctx); // la URL manda empresa 01; el usuario está en la 02
  const { sql, binds } = llamadas[0];
  assert.match(sql, /RTRIM\(COD_EMPR\) = :sc_COD_EMPR/, "debe filtrar por la empresa del contexto");
  assert.equal(binds.sc_COD_EMPR, "02");
  assert.equal(binds.pk_COD_EMPR, "01"); // la PK de la URL no se confunde con el contexto
});

test("actualizar: no se puede reasignar el registro a otra empresa ni zafra", async () => {
  limpiar();
  const actual = { ID: "5", COD_EMPR: "02", SAF_ANO_SAFRA: "2026", NOMBRE: "Viejo" };
  filas = [actual, actual]; // obtener y la relectura final
  await svc.actualizar(conEmpresaFueraDePk, ["5"], { NOMBRE: "Nuevo", COD_EMPR: "01", SAF_ANO_SAFRA: "2025" }, ctx);
  const upd = llamadas.find((l) => /^UPDATE/.test(l.sql));
  assert.ok(upd, "debe ejecutar el UPDATE");
  assert.match(upd.sql, /SET NOMBRE = :NOMBRE/);
  assert.ok(!/COD_EMPR = :COD_EMPR|SAF_ANO_SAFRA = :SAF_ANO_SAFRA/.test(upd.sql), "no debe modificar empresa ni zafra");
  assert.match(upd.sql, /WHERE .*RTRIM\(COD_EMPR\) = :sc_COD_EMPR.*SAF_ANO_SAFRA = :sc_SAF_ANO_SAFRA/s);
  assert.equal(upd.binds.sc_COD_EMPR, "02");
  assert.equal(upd.binds.sc_SAF_ANO_SAFRA, 2026);
});

test("actualizar: un registro de otra empresa/zafra no se encuentra", async () => {
  limpiar();
  filas = []; // el SELECT con el filtro de scope no devuelve nada
  const r = await svc.actualizar(conEmpresaFueraDePk, ["99"], { NOMBRE: "X" }, ctx);
  assert.equal(r.notFound, true);
  assert.ok(!llamadas.some((l) => /^UPDATE/.test(l.sql)), "no debe intentar actualizar");
});

test("eliminar: el DELETE lleva el filtro de empresa/zafra", async () => {
  limpiar();
  filas = [{ ID: "5", COD_EMPR: "02", SAF_ANO_SAFRA: "2026", NOMBRE: "X" }];
  await svc.eliminar(conEmpresaFueraDePk, ["5"], ctx);
  const del = llamadas.find((l) => /^DELETE/.test(l.sql));
  assert.ok(del);
  assert.match(del.sql, /sc_COD_EMPR/);
  assert.match(del.sql, /sc_SAF_ANO_SAFRA/);
  assert.equal(del.binds.sc_COD_EMPR, "02");
});

test("eliminar: un registro de otra empresa/zafra no se borra", async () => {
  limpiar();
  filas = [];
  const r = await svc.eliminar(conEmpresaFueraDePk, ["5"], ctx);
  assert.equal(r.notFound, true);
  assert.ok(!llamadas.some((l) => /^DELETE/.test(l.sql)));
});

test("recursos sin scope (catálogos globales): el WHERE no agrega filtro", async () => {
  limpiar();
  const global = { esquema: "GATEC_AGR", tabla: "T3", scoped: false, pk: ["ID"], columnas: [{ col: "ID", label: "Código", tipo: "numero", pk: true }, { col: "NOMBRE", label: "N", tipo: "texto" }] };
  filas = [{ ID: "1", NOMBRE: "A" }];
  await svc.obtener(global, ["1"], undefined);
  assert.ok(!/sc_/.test(llamadas[0].sql));
});
