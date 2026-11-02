// Utilidades para pruebas de navegador (Edge headless + protocolo CDP), sin dependencias. Solo lectura contra DESA.
// Requisitos: API en :3101, front en :3100 y Microsoft Edge instalado.
//   node tools/e2e/sprint12.js            (guion del Sprint 12)
// El token de prueba es de BOT y se firma con el secreto de la propia API local (api/.env); no se prueban contraseñas.
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const RAIZ = path.join(__dirname, "..", "..");
const EDGE = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = process.env.E2E_BASE || "http://localhost:3100";
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function tokenDePrueba(id = 196, usuario = "BOT") {
  const apiModulos = path.join(RAIZ, "api", "node_modules");
  require(path.join(apiModulos, "dotenv")).config({ path: path.join(RAIZ, "api", ".env") });
  const jwt = require(path.join(apiModulos, "jsonwebtoken"));
  return jwt.sign({ sub: id, usuario, master: false, typ: "access" }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// Abre Edge y devuelve un objeto con helpers. `puerto` distinto por guion para poder correr varios.
async function abrir({ puerto = 9400, salida = path.join(os.tmpdir(), "azpa-e2e") } = {}) {
  fs.mkdirSync(salida, { recursive: true });
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "azpa-edge-"));
  const edge = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, "--window-size=1440,1000", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
  let lista;
  for (let i = 0; i < 60; i++) { try { lista = await (await fetch(`http://127.0.0.1:${puerto}/json`)).json(); if (lista.length) break; } catch { /* aún no */ } await esperar(250); }
  if (!lista) throw new Error("Edge no respondió");
  const ws = new WebSocket(lista.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pend = new Map();
  const manejadores = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); return; }
    for (const h of manejadores) h(d);
  };
  const cmd = (method, params = {}) => new Promise((res) => { const mi = ++id; pend.set(mi, res); ws.send(JSON.stringify({ id: mi, method, params })); });
  const js = async (e) => (await cmd("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const foto = async (nombre) => { const r = await cmd("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(salida, nombre + ".png"), Buffer.from(r.result.data, "base64")); };
  const clic = (sel, texto) => js(`(() => { const els=[...document.querySelectorAll(${JSON.stringify(sel)})]; const el=${texto ? `els.find(e=>e.textContent.trim().includes(${JSON.stringify(texto)}))` : "els[0]"}; if(!el) return false; el.click(); return true; })()`);
  const texto = () => js("document.body.innerText");
  const ir = async (ruta, ms = 2500) => { await cmd("Page.navigate", { url: BASE + ruta }); await esperar(ms); };

  // Interceptación de pedidos: `reglas` = [{ patron: RegExp, accion: "401" | "caer" | "pasar" (cuenta en regla.n) | { status, cuerpo } }]. Se puede cambiar en vivo.
  const reglas = [];
  manejadores.push(async (d) => {
    if (d.method !== "Fetch.requestPaused") return;
    const url = d.params.request.url;
    const r = reglas.find((x) => x.patron.test(url));
    if (!r) return void cmd("Fetch.continueRequest", { requestId: d.params.requestId });
    if (r.accion === "pasar") { r.n = (r.n || 0) + 1; return void cmd("Fetch.continueRequest", { requestId: d.params.requestId }); } // deja pasar y cuenta
    if (r.accion === "caer") return void cmd("Fetch.failRequest", { requestId: d.params.requestId, errorReason: "ConnectionRefused" });
    const { status, cuerpo } = r.accion === "401" ? { status: 401, cuerpo: { error: "Token inválido o vencido" } } : r.accion;
    cmd("Fetch.fulfillRequest", { requestId: d.params.requestId, responseCode: status, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify(cuerpo)).toString("base64") });
  });

  await cmd("Page.enable");
  await cmd("Fetch.enable", { patterns: [{ urlPattern: "*/api/*" }] });
  await cmd("Emulation.setFocusEmulationEnabled", { enabled: true });
  await cmd("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  const cerrar = () => { try { ws.close(); } catch { /* nada */ } edge.kill(); try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* nada */ } };
  return { cmd, js, foto, clic, texto, ir, reglas, esperar, cerrar, salida };
}

// Registro de resultados de un guion.
function guion(nombre) {
  const filas = [];
  return {
    paso(n, ok, extra = "") { filas.push(!!ok); console.log(ok ? "✔" : "✘", n, extra ? `(${extra})` : ""); },
    fin() { const todo = filas.every(Boolean); console.log(`\n${nombre}: ${filas.filter(Boolean).length}/${filas.length} ${todo ? "TODO OK" : "HAY FALLAS"}`); process.exitCode = todo ? 0 : 1; return todo; },
  };
}

module.exports = { abrir, guion, tokenDePrueba, esperar, BASE };
