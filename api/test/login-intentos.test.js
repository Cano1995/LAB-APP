// A2 (Sprint 11): una ráfaga de logins con contraseña mala no puede superar el máximo de intentos hacia Oracle.
// Se doblan la base (usuarios) y la conexión de Oracle; la reserva atómica de verdad se probó contra DESA (ver el commit).
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

Object.assign(process.env, { DB_USER: "TEST", DB_PASSWORD: "x", DB_CONNECT_STRING: "localhost/TEST", JWT_SECRET: "una-clave-de-prueba-larga-y-aleatoria-0123456789abcdef" });
const src = (p) => path.join(__dirname, "..", "src", p);

const db = require(src("db"));
db.queryOne = async () => ({ ID_USUARIO: 7, DSC_USUARIO: "PRUEBA", USE_NOME: "P", USE_EMAIL: null, USE_MASTER: "0", USE_ATIVO: "1" });

// Persistencia de intentos en memoria, con la misma semántica que intentos.js (cada operación es atómica en un hilo).
const intentos = require(src("modules/auth/intentos"));
const mem = { cuenta: 0, espera: false };
intentos.reservar = async () => {
  if (mem.espera) return { ok: false, bloqueado: false, minutos: 15 };
  mem.cuenta += 1;
  if (mem.cuenta >= intentos.MAX_FALLOS) mem.espera = true;
  return { ok: true };
};
intentos.exito = async () => { mem.cuenta = 0; mem.espera = false; };
intentos.liberar = async () => { mem.cuenta = Math.max(0, mem.cuenta - 1); if (mem.cuenta < intentos.MAX_FALLOS) mem.espera = false; };

let conexiones = 0;
let modo = "mala"; // "mala" → ORA-01017; "caida" → ORA-12541
db.oracledb.getConnection = async () => {
  conexiones += 1;
  await new Promise((r) => setTimeout(r, 15)); // latencia: deja que los pedidos en ráfaga se crucen
  throw new Error(modo === "mala" ? "ORA-01017: invalid username/password" : "ORA-12541: TNS:no listener");
};

const auth = require(src("modules/auth/auth.service"));
const reiniciar = () => { mem.cuenta = 0; mem.espera = false; conexiones = 0; };

test("una ráfaga de 10 logins con clave mala llega a Oracle como máximo MAX_FALLOS veces", async () => {
  reiniciar(); modo = "mala";
  const res = await Promise.all(Array.from({ length: 10 }, () => auth.login("prueba", "clave-mala")));
  assert.equal(conexiones, intentos.MAX_FALLOS, "solo MAX_FALLOS intentos pueden tocar Oracle");
  assert.equal(res.filter((r) => r.code === "CREDENCIALES").length, intentos.MAX_FALLOS);
  assert.equal(res.filter((r) => r.code === "ESPERA").length, 10 - intentos.MAX_FALLOS);
  assert.ok(conexiones < 3, "debe quedar por debajo de los 3 fallos que bloquean el perfil de Oracle");
});

test("tras agotar los intentos, el siguiente login no consulta a Oracle", async () => {
  reiniciar(); modo = "mala";
  await auth.login("prueba", "x");
  await auth.login("prueba", "x");
  const antes = conexiones;
  const r = await auth.login("prueba", "x");
  assert.equal(r.code, "ESPERA");
  assert.equal(conexiones, antes, "no debe abrir otra conexión durante la espera");
});

test("si la base no está disponible no se gastan intentos del usuario", async () => {
  reiniciar(); modo = "caida";
  for (let i = 0; i < 6; i++) {
    const r = await auth.login("prueba", "clave");
    assert.equal(r.code, "NO_DISPONIBLE", `intento ${i + 1}`);
  }
  assert.equal(conexiones, 6, "todos los intentos llegaron a Oracle: no se bloquearon por una falla ajena");
  assert.equal(mem.cuenta, 0);
});

test("una contraseña vacía no reserva ningún intento ni llega a Oracle", async () => {
  reiniciar(); modo = "mala";
  const r = await auth.login("prueba", "");
  assert.equal(r.code, "CREDENCIALES");
  assert.equal(mem.cuenta, 0);
  assert.equal(conexiones, 0);
});
