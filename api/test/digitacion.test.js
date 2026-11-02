// GPI · Digitación diaria (escritura, Sprint 18). Sin base de datos: reglas puras y la ruta con dobles.
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");

Object.assign(process.env, {
  DB_USER: "TEST", DB_PASSWORD: "x", DB_CONNECT_STRING: "localhost/TEST", JWT_SECRET: "una-clave-de-prueba-larga-y-aleatoria-0123456789abcdef",
  ESCRITURA_GPI_DIGITACION: "1", // el interruptor se enciende para estas pruebas (en el servidor real viene apagado)
});
const src = (p) => path.join(__dirname, "..", "src", p);
const dig = require(src("modules/gpi/digitacion.service"));
const { planificar, normalizarValor, validarCambios, diaEditable } = dig;

const num = (o = {}) => ({ id: 10, nombre: "CANA", tipoDig: 0, tipoMedia: 3, masInt: 6, masDec: 3, digitada: true, activa: true, ...o });
const vars = (...vs) => new Map(vs.map((v) => [v.id, v]));
const act = (o) => new Map(Object.entries(o));
const cam = (idVar, col, anterior, nuevo) => ({ idVar, col, anterior, nuevo });

// ---------- Día editable ----------
test("solo se edita un día posterior al último cierre, dentro de la zafra y hasta el día de digitación actual", () => {
  const p = { INICIO: "2026-05-06", FIM: null, DIA_ACTUAL: "2026-10-27", FECHA_REAL: "2026-10-26", ENCERRADA: 0 };
  assert.equal(diaEditable(p, "2026-10-27").ok, true);
  assert.match(diaEditable(p, "2026-10-26").motivo, /cerrado/);
  assert.match(diaEditable(p, "2026-10-01").motivo, /cerrado/);
  assert.match(diaEditable(p, "2026-10-28").motivo, /día actual/);
  assert.match(diaEditable(p, "2026-04-01").motivo, /inicio de la zafra/);
  assert.match(diaEditable({ ...p, ENCERRADA: 1 }, "2026-10-27").motivo, /encerrada/);
  assert.match(diaEditable({ ...p, FIM: "2026-10-20" }, "2026-10-27").motivo, /fin de la zafra/);
  assert.equal(diaEditable(null, "2026-10-27").ok, false);
});

// ---------- Normalización ----------
test("numéricos: coma o punto, decimales de la máscara, límite de enteros, rechazo de basura", () => {
  const v = num();
  assert.equal(normalizarValor(v, "12,5"), "12.500");
  assert.equal(normalizarValor(v, " 1375.54 "), "1375.540");
  assert.equal(normalizarValor(v, "-3"), "-3.000");
  assert.equal(normalizarValor(v, ""), null);
  assert.equal(normalizarValor(v, "   "), null);
  assert.equal(normalizarValor(v, null), null);
  assert.equal(normalizarValor(num({ masDec: 0 }), "395901.6"), "395902");
  for (const malo of ["abc", "1e5", "0x10", "Infinity", "1,2,3", "12 34", "--1"]) assert.throws(() => normalizarValor(v, malo), (e) => e.status === 400, malo);
  assert.throws(() => normalizarValor(v, "1234567"), /dígitos enteros/);
  assert.equal(normalizarValor(v, "123456"), "123456.000");
  assert.throws(() => normalizarValor(v, ["1"]), (e) => e.status === 400); // un arreglo no es un valor
  assert.equal(normalizarValor(num({ masInt: null }), "12345678"), "12345678.000");
});

test("horas: h:mm sin rellenar; texto: máximo 20 caracteres y sin caracteres de control", () => {
  const h = num({ tipoDig: 3 });
  assert.equal(normalizarValor(h, "08:30"), "8:30");
  assert.equal(normalizarValor(h, "8:05"), "8:05");
  assert.equal(normalizarValor(h, "24:00"), "24:00");
  for (const malo of ["8.5", "8:60", "8:5", "abc", "8:30:00"]) assert.throws(() => normalizarValor(h, malo), /h:mm/, malo);
  const t = num({ tipoDig: 2 });
  assert.equal(normalizarValor(t, "  ANIDRO "), "ANIDRO");
  assert.throws(() => normalizarValor(t, "x".repeat(21)), /20 caracteres/);
  assert.throws(() => normalizarValor(t, "a\nb"), /no permitidos/);
});

// ---------- Forma de los cambios ----------
test("validarCambios: lista, tope, columnas de la planilla, duplicados y tipos", () => {
  const cols = new Set([1, 2, 3]);
  assert.deepEqual(validarCambios([{ idVar: 5, col: 1, anterior: " 1.0 ", nuevo: "2" }], cols), [{ idVar: 5, col: 1, anterior: "1.0", nuevo: "2" }]);
  assert.deepEqual(validarCambios([{ idVar: 5, col: 1, anterior: "", nuevo: "2" }], cols)[0].anterior, null);
  for (const mal of [null, [], "x", {}]) assert.throws(() => validarCambios(mal, cols), (e) => e.status === 400);
  assert.throws(() => validarCambios(Array.from({ length: 501 }, (_, i) => ({ idVar: i + 1, col: 1, nuevo: "1" })), cols), /Demasiados/);
  assert.throws(() => validarCambios([{ idVar: 5, col: 4, nuevo: "1" }], cols), /no existe en esta planilla/);
  assert.throws(() => validarCambios([{ idVar: 5, col: 99, nuevo: "1" }], new Set([99])), /columna inválida/); // la 99 no se digita
  assert.throws(() => validarCambios([{ idVar: 5, col: 0, nuevo: "1" }], cols), /columna inválida/);
  assert.throws(() => validarCambios([{ idVar: "x", col: 1, nuevo: "1" }], cols), /variable inválida/);
  assert.throws(() => validarCambios([{ idVar: 5, col: 1, nuevo: "1" }, { idVar: 5, col: 1, nuevo: "2" }], cols), /dos veces/);
  assert.throws(() => validarCambios([{ idVar: 5, col: 1, anterior: { a: 1 }, nuevo: "1" }], cols), (e) => e.status === 400);
});

// ---------- Planificación ----------
test("insertar la primera celda de una variable de suma crea también el día (col. 99)", () => {
  const r = planificar({ variables: vars(num()), actuales: act({}), cambios: [cam(10, 1, null, "5788,65")] });
  assert.deepEqual(r.conflictos, []);
  assert.deepEqual(r.operaciones.map((o) => [o.tipo, o.col, o.despues, o.derivada]), [["insertar", 1, "5788.650", false], ["insertar", 99, "5788.650", true]]);
});

test("el día se recalcula con TODAS las columnas: suma (media 3) o promedio (media 1)", () => {
  const actuales = act({ "10|1": "10.000", "10|2": "20.000", "10|99": "30.000" });
  let r = planificar({ variables: vars(num()), actuales, cambios: [cam(10, 2, "20.000", "25")] });
  assert.deepEqual(r.operaciones.map((o) => [o.tipo, o.col, o.antes, o.despues]), [["actualizar", 2, "20.000", "25.000"], ["actualizar", 99, "30.000", "35.000"]]);
  r = planificar({ variables: vars(num({ tipoMedia: 1 })), actuales, cambios: [cam(10, 3, null, "30")] });
  assert.deepEqual(r.operaciones.map((o) => [o.tipo, o.col, o.despues]), [["insertar", 3, "30.000"], ["actualizar", 99, "20.000"]]);
});

test("borrar una columna recalcula el día y borrar la última lo elimina", () => {
  const actuales = act({ "10|1": "10.000", "10|2": "20.000", "10|99": "30.000" });
  let r = planificar({ variables: vars(num()), actuales, cambios: [cam(10, 2, "20.000", "")] });
  assert.deepEqual(r.operaciones.map((o) => [o.tipo, o.col, o.despues]), [["borrar", 2, null], ["actualizar", 99, "10.000"]]);
  r = planificar({ variables: vars(num()), actuales: act({ "10|1": "10.000", "10|99": "10.000" }), cambios: [cam(10, 1, "10.000", null)] });
  assert.deepEqual(r.operaciones.map((o) => [o.tipo, o.col]), [["borrar", 1], ["borrar", 99]]);
});

test("las variables sin agregación (media 0) no crean col. 99, pero la mantienen si ya existía", () => {
  const v = num({ tipoMedia: 0 });
  let r = planificar({ variables: vars(v), actuales: act({}), cambios: [cam(10, 1, null, "5")] });
  assert.deepEqual(r.operaciones.map((o) => o.col), [1]);
  r = planificar({ variables: vars(v), actuales: act({ "10|1": "5.000", "10|99": "5.000" }), cambios: [cam(10, 1, "5.000", "6")] });
  assert.deepEqual(r.operaciones.map((o) => [o.col, o.despues]), [[1, "6.000"], [99, "6.000"]]);
});

test("variables de hora: la columna va en h:mm y el día en horas decimales con 3 decimales", () => {
  const h = num({ id: 20, tipoDig: 3, tipoMedia: 3, masDec: 2 });
  const r = planificar({ variables: vars(h), actuales: act({}), cambios: [cam(20, 1, null, "11:55"), cam(20, 2, null, "11:55")] });
  assert.deepEqual(r.operaciones.map((o) => [o.col, o.despues]), [[1, "11:55"], [2, "11:55"], [99, "23.834"]]);
});

test("una celda sin cambio real no genera operaciones", () => {
  const r = planificar({ variables: vars(num()), actuales: act({ "10|1": "10.000", "10|99": "10.000" }), cambios: [cam(10, 1, "10.000", "10")] });
  assert.deepEqual(r.operaciones, []);
});

test("CONCURRENCIA: si el valor actual no es el que el usuario vio, se rechaza todo con la lista de conflictos", () => {
  const actuales = act({ "10|1": "10.000", "10|2": "20.000" });
  const r = planificar({ variables: vars(num()), actuales, cambios: [cam(10, 1, "10.000", "11"), cam(10, 2, "99.000", "21"), cam(10, 3, "5.000", "1")] });
  assert.deepEqual(r.operaciones, []);
  assert.deepEqual(r.conflictos, [{ idVar: 10, col: 2, actual: "20.000" }, { idVar: 10, col: 3, actual: null }]);
  // «vi la celda vacía» pero alguien la llenó:
  assert.equal(planificar({ variables: vars(num()), actuales, cambios: [cam(10, 1, null, "1")] }).conflictos.length, 1);
});

test("no se pueden grabar variables calculadas, inactivas, de otra planilla ni de un tipo sin regla verificada", () => {
  const p = (v, cambio) => () => planificar({ variables: vars(v), actuales: act({}), cambios: [cambio] });
  assert.throws(p(num({ digitada: false }), cam(10, 1, null, "1")), /calculada/);
  assert.throws(p(num({ activa: false }), cam(10, 1, null, "1")), /inactiva/);
  assert.throws(p(num({ tipoDig: 4 }), cam(10, 1, null, "1")), /todavía no se puede grabar/);
  assert.throws(p(num({ tipoDig: 1 }), cam(10, 1, null, "1")), /todavía no se puede grabar/);
  assert.throws(p(num(), cam(77, 1, null, "1")), /no pertenece a esta planilla/);
  // un valor inválido corta antes de escribir nada
  assert.throws(p(num(), cam(10, 1, null, "abc")), (e) => e.status === 400);
});

test("cada variable tocada recalcula su propio día y no el de las demás", () => {
  const actuales = act({ "10|1": "1.000", "10|99": "1.000", "11|1": "7.000", "11|99": "7.000" });
  const r = planificar({ variables: vars(num({ id: 10 }), num({ id: 11 })), actuales, cambios: [cam(10, 1, "1.000", "2")] });
  assert.deepEqual(r.operaciones.map((o) => [o.idVar, o.col]), [[10, 1], [10, 99]]);
});

// ---------- Ruta ----------
const estado = { nivel: 3, llamadas: [], resultado: null, error: null };
const authSvc = require(src("modules/auth/auth.service"));
authSvc.verificarToken = (t) => { if (t !== "valido") throw new Error("x"); return { sub: 7, typ: "access" }; };
authSvc.buscarUsuarioPorId = async () => ({ ID_USUARIO: 7, DSC_USUARIO: "PRUEBA", USE_NOME: "Prueba", USE_MASTER: "0", USE_ATIVO: "1" });
authSvc.nivelFormulario = async () => estado.nivel;
require(src("modules/contexto/contexto.service")).obtener = async () => ({ empresa: { cod: 1 }, safra: 2026 });
const gpiSvc = require(src("modules/gpi/gpi.service"));
gpiSvc.puedeVerPlan = async () => true;
gpiSvc.lancamento = async () => ({ configuracion: null, columnas: [], variables: [], safraGpi: null, idLanc: null, valores: {} });
dig.grabar = async (p) => { estado.llamadas.push(p); if (estado.error) throw estado.error; return estado.resultado ?? { ok: true, cambios: 1, filas: [] }; };
dig.estadoEdicion = async ({ data }) => (data === "2026-10-27" ? { ok: true } : { ok: false, motivo: "El día está cerrado" });
const { crearApp } = require(src("app"));

let servidor, base;
test.before(async () => {
  servidor = http.createServer(crearApp({ dirFront: null }));
  await new Promise((r) => servidor.listen(0, r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
test.after(() => servidor.close());
const put = (cuerpo, token = "valido") => fetch(`${base}/api/gpi/planilhas/60/lancamento`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(cuerpo) });

test("RUTA: sin sesión 401; sin acceso total 403; con acceso total graba con el usuario y el contexto", async () => {
  const cuerpo = { data: "2026-10-27", cambios: [{ idVar: 8449, col: 1, anterior: null, nuevo: "100" }] };
  assert.equal((await put(cuerpo, "falso")).status, 401);
  for (const nivel of [0, 1]) { estado.nivel = nivel; assert.equal((await put(cuerpo)).status, 403, `nivel ${nivel}`); }
  assert.equal(estado.llamadas.length, 0, "sin permiso no se llama al servicio");
  estado.nivel = 3;
  const r = await put(cuerpo);
  assert.equal(r.status, 200);
  assert.equal(estado.llamadas.length, 1);
  const l = estado.llamadas[0];
  assert.deepEqual([l.empr, l.safra, l.idPlan, l.data], [1, 2026, 60, "2026-10-27"]);
  assert.deepEqual(l.usuario, { idUsuario: 7, usuario: "PRUEBA" });
  assert.deepEqual(l.cambios, cuerpo.cambios);
});

test("RUTA: un conflicto sale como 409 con el código y la lista de celdas; un error de validación como 400", async () => {
  estado.nivel = 3;
  estado.error = Object.assign(new Error("Otro usuario cambió estos valores"), { status: 409, code: "CONFLICTO", conflictos: [{ idVar: 1, col: 2, actual: "5.000" }] });
  let r = await put({ data: "2026-10-27", cambios: [] });
  assert.equal(r.status, 409);
  const j = await r.json();
  assert.equal(j.code, "CONFLICTO");
  assert.deepEqual(j.conflictos, [{ idVar: 1, col: 2, actual: "5.000" }]);
  estado.error = Object.assign(new Error("Valor inválido"), { status: 400 });
  r = await put({ data: "2026-10-27", cambios: [] });
  assert.equal(r.status, 400);
  estado.error = new Error("ORA-00001: restricción única GATEC_GPI_NEW.SYS_C00426278 violada");
  r = await put({ data: "2026-10-27", cambios: [] });
  assert.equal(r.status, 500);
  assert.doesNotMatch(await r.text(), /ORA-|GATEC_GPI_NEW|SYS_C/); // nunca se filtra el mensaje interno
  estado.error = null;
});

test("RUTA: el lançamento informa si el usuario puede editar ese día y por qué no", async () => {
  const get = async (fecha, nivel) => { estado.nivel = nivel; return (await (await fetch(`${base}/api/gpi/planilhas/60/lancamento?data=${fecha}`, { headers: { Authorization: "Bearer valido" } })).json()).edicion; };
  assert.deepEqual(await get("2026-10-27", 3), { permitida: true, motivo: null });
  assert.deepEqual(await get("2026-10-20", 3), { permitida: false, motivo: "El día está cerrado" });
  assert.deepEqual(await get("2026-10-27", 1), { permitida: false, motivo: "Su usuario tiene acceso de consulta" });
});

test("el interruptor está APAGADO por defecto y solo se enciende con =1 (y solo en DESA)", async () => {
  const { execFileSync } = require("node:child_process");
  const leer = (env) => execFileSync(process.execPath, ["-e", "console.log(JSON.stringify(require(process.argv[1]).escritura))", src("config")], {
    // ESCRITURA_GPI_DIGITACION vacío por defecto: dotenv no pisa una variable ya definida, así el api/.env local no cambia el resultado.
    env: { PATH: process.env.PATH, DB_USER: "T", DB_PASSWORD: "x", DB_CONNECT_STRING: "l/T", JWT_SECRET: process.env.JWT_SECRET, ESCRITURA_GPI_DIGITACION: "", DB_HOST_ESPERADO: "oradesa", ESCRITURA_EN_PRODUCCION: "", ...env }, encoding: "utf8",
  }).trim();
  assert.deepEqual(JSON.parse(leer({})), { gpiDigitacion: false, enProduccion: false });
  assert.equal(JSON.parse(leer({ ESCRITURA_GPI_DIGITACION: "true" })).gpiDigitacion, false); // solo «1»
  assert.equal(JSON.parse(leer({ ESCRITURA_GPI_DIGITACION: "1" })).gpiDigitacion, true);
  // Contra una base que no es DESA no se enciende salvo decisión explícita.
  assert.equal(JSON.parse(leer({ ESCRITURA_GPI_DIGITACION: "1", DB_HOST_ESPERADO: "oraprod" })).gpiDigitacion, false);
  assert.equal(JSON.parse(leer({ ESCRITURA_GPI_DIGITACION: "1", DB_HOST_ESPERADO: "oraprod", ESCRITURA_EN_PRODUCCION: "1" })).gpiDigitacion, true);
});
