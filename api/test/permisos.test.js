// Matriz de permisos (Sprint 15): sin sesión → 401; sin acceso → 403 en TODAS las rutas de consulta; con acceso se pasa la guarda;
// Administración exige acceso total (o ser master). Sin base de datos: se simulan la sesión, los niveles y el contexto.
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");

Object.assign(process.env, {
  ESCRITURA_GPI_DIGITACION: "", // la prueba exige el valor por defecto (apagada) aunque el api/.env local la tenga encendida
  DB_USER: "TEST", DB_PASSWORD: "x", DB_CONNECT_STRING: "localhost/TEST",
  JWT_SECRET: "una-clave-de-prueba-larga-y-aleatoria-0123456789abcdef",
});
const src = (p) => path.join(__dirname, "..", "src", p);

const estado = { master: false, nivel: 0, contexto: null };
const authSvc = require(src("modules/auth/auth.service"));
authSvc.verificarToken = (t) => { if (t !== "valido") throw Object.assign(new Error("Token inválido"), { status: 401 }); return { sub: 7, typ: "access" }; };
authSvc.buscarUsuarioPorId = async () => ({ ID_USUARIO: 7, DSC_USUARIO: "PRUEBA", USE_NOME: "Prueba", USE_MASTER: estado.master ? "1" : "0", USE_ATIVO: "1" });
authSvc.nivelFormulario = async (_id, _form, master) => (master ? 3 : estado.nivel);
const contextoSvc = require(src("modules/contexto/contexto.service"));
contextoSvc.obtener = async () => estado.contexto;
const adminSvc = require(src("modules/admin/admin.service"));
adminSvc.usuarios = async () => ({ usuarios: [] });

const { crearApp } = require(src("app"));

// Rutas de consulta de cada módulo (GET) protegidas por permiso de formulario.
const GPI = ["/arbol", "/safra", "/variaveis?q=ab", "/consultas", "/valores?ids=1&desde=2026-10-01&hasta=2026-10-02", "/supervisorios", "/panel", "/cep?id=1", "/correlacion?ids=1,2", "/informes", "/informes/1", "/boletines", "/boletines/1", "/metas", "/planilhas/1/lancamento", "/planilhas/1/dias", "/planilhas/1/variaveis"].map((r) => `/api/gpi${r}`);
const LAB = ["/sonda", "/sonda/1", "/entrada-cana"].map((r) => `/api/lab${r}`);
const ADMIN = ["/usuarios", "/usuarios/1", "/grupos", "/grupos/1", "/pantallas", "/pantallas/1", "/conexiones"].map((r) => `/api/admin${r}`);

let servidor, base;
test.before(async () => {
  servidor = http.createServer(crearApp({ dirFront: null }));
  await new Promise((r) => servidor.listen(0, r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
test.after(() => servidor.close());
const pedir = (ruta, token = "valido") => fetch(base + ruta, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

test("sin sesión o con token inválido todas las rutas protegidas responden 401", async () => {
  for (const ruta of [...GPI, ...LAB, ...ADMIN, "/api/maestras", "/api/contexto"]) {
    assert.equal((await pedir(ruta, null)).status, 401, `${ruta} sin token`);
    assert.equal((await pedir(ruta, "falso")).status, 401, `${ruta} con token inválido`);
  }
});

test("un usuario sin acceso al formulario recibe 403 en cada ruta de GPI y de Laboratorio", async () => {
  Object.assign(estado, { master: false, nivel: 0, contexto: { empresa: { cod: 1 }, safra: 2026 } });
  for (const ruta of [...GPI, ...LAB]) {
    const r = await pedir(ruta);
    assert.equal(r.status, 403, `${ruta}: ${r.status}`);
    assert.equal((await r.json()).error, "Sin permiso para esta pantalla");
  }
});

test("con acceso de consulta se pasa la guarda: sin empresa/zafra elegida es 409 (no 403)", async () => {
  Object.assign(estado, { master: false, nivel: 1, contexto: null });
  for (const ruta of [...GPI, ...LAB]) {
    const r = await pedir(ruta);
    assert.equal(r.status, 409, `${ruta}: ${r.status}`);
    assert.equal((await r.json()).code, "SIN_CONTEXTO");
  }
});

test("Administración: consulta o acceso parcial → 403; acceso total o master → pasa", async () => {
  for (const nivel of [0, 1]) {
    Object.assign(estado, { master: false, nivel });
    for (const ruta of ADMIN) assert.equal((await pedir(ruta)).status, 403, `${ruta} con nivel ${nivel}`);
  }
  Object.assign(estado, { master: false, nivel: 3 });
  assert.equal((await pedir("/api/admin/usuarios")).status, 200);
  Object.assign(estado, { master: true, nivel: 0 });
  assert.equal((await pedir("/api/admin/usuarios")).status, 200);
});

// Única ruta de escritura de GPI (Sprint 18): la digitación diaria. Apagada por defecto (ESCRITURA_GPI_DIGITACION); su comportamiento está en digitacion.test.js.
const ESCRITURA_GPI = "PUT /api/gpi/planilhas/1/lancamento";

test("la digitación diaria está apagada por defecto: ni un master con acceso total puede grabar", async () => {
  Object.assign(estado, { master: true, nivel: 3, contexto: { empresa: { cod: 1 }, safra: 2026 } });
  const r = await fetch(base + "/api/gpi/planilhas/1/lancamento", { method: "PUT", headers: { Authorization: "Bearer valido", "Content-Type": "application/json" }, body: JSON.stringify({ data: "2026-10-27", cambios: [{ idVar: 1, col: 1, anterior: null, nuevo: "1" }] }) });
  assert.equal(r.status, 403);
  assert.match((await r.json()).error, /desactivada/);
});

test("las demás pantallas son de solo consulta: no aceptan escritura en ninguna ruta de GPI, Laboratorio o Administración", async () => {
  Object.assign(estado, { master: true, nivel: 3, contexto: { empresa: { cod: 1 }, safra: 2026 } });
  for (const ruta of [...GPI, ...LAB, ...ADMIN]) {
    for (const metodo of ["POST", "PUT", "DELETE"]) {
      if (`${metodo} ${ruta.replace(/lancamento.*/, "lancamento")}` === ESCRITURA_GPI) continue;
      const r = await fetch(base + ruta, { method: metodo, headers: { Authorization: "Bearer valido", "Content-Type": "application/json" }, body: metodo === "DELETE" ? undefined : "{}" });
      assert.equal(r.status, 404, `${metodo} ${ruta} debería no existir (fue ${r.status})`);
    }
  }
});
