// Mide el tiempo de respuesta de los endpoints principales de la API (solo lectura). Uso: node tools/medir-api.js [repeticiones]
// Requiere la API corriendo en :3101 y usa el token de prueba de tools/e2e/lib.js.
const { tokenDePrueba } = require("./e2e/lib");

const BASE = process.env.API || "http://localhost:3101";
const N = Number(process.argv[2]) || 5;
const RUTAS = [
  "/api/auth/me",
  "/api/maestras",
  "/api/maestras/empresa",
  "/api/maestras/funcionarios",
  "/api/lab/entrada-cana",
  "/api/lab/sonda",
  "/api/gpi/arbol",
  "/api/gpi/variaveis?q=vol",
];

(async () => {
  const token = tokenDePrueba();
  const filas = [];
  for (const ruta of RUTAS) {
    const ms = [];
    let estado = 0, bytes = 0;
    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      const r = await fetch(BASE + ruta, { headers: { Authorization: `Bearer ${token}` } });
      const cuerpo = await r.text();
      ms.push(performance.now() - t0); estado = r.status; bytes = cuerpo.length;
    }
    ms.sort((a, b) => a - b);
    filas.push({ ruta, estado, primera: Math.round(ms[0]), mediana: Math.round(ms[Math.floor(N / 2)]), max: Math.round(ms[N - 1]), kB: Math.round(bytes / 1024) });
  }
  console.table(filas);
})().catch((e) => { console.error(e); process.exit(1); });
