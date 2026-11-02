// Corre todos los guiones de navegador en orden y resume. Uso: node tools/e2e/run-all.js [--base http://localhost:3101]
// Contra el front de desarrollo (por defecto, http://localhost:3100) o contra el compilado que sirve la API (--base http://localhost:3101 después de `npm run build`).
// Requiere la API corriendo con acceso a DESA, Microsoft Edge instalado y api/.env (el token de prueba se firma con el JWT_SECRET).
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const i = process.argv.indexOf("--base");
const env = { ...process.env, ...(i > 0 ? { E2E_BASE: process.argv[i + 1] } : {}) };
const API = process.env.API || "http://localhost:3101";
const GUIONES = ["humo.js", "sprint12.js", "sprint14.js"];

(async () => {
  try {
    const r = await fetch(`${API}/api/ready`);
    if (!r.ok) throw new Error(`/api/ready respondió ${r.status}`);
  } catch (e) {
    console.error(`La API no está lista en ${API}: ${e.message}. Inicie la API (cd api && npm run dev) y vuelva a intentar.`);
    process.exit(2);
  }
  const resultados = [];
  for (const g of GUIONES) {
    console.log(`\n=== ${g} (${env.E2E_BASE || "http://localhost:3100"}) ===`);
    const r = spawnSync(process.execPath, [path.join(__dirname, g)], { env, stdio: "inherit" });
    resultados.push({ guion: g, ok: r.status === 0 });
  }
  console.log("\nResumen:");
  for (const r of resultados) console.log(`  ${r.ok ? "✔" : "✘"} ${r.guion}`);
  process.exit(resultados.every((r) => r.ok) ? 0 : 1);
})();
