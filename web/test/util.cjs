// Carga un módulo TypeScript del front para probarlo con node:test, sin runner adicional: se compila con esbuild (ya viene con Vite).
//   cd web && npm test
const esbuild = require("esbuild");
const path = require("node:path");

function cargarTs(rutaRelativa) {
  const archivo = path.join(__dirname, "..", rutaRelativa);
  const { outputFiles } = esbuild.buildSync({
    entryPoints: [archivo], bundle: true, write: false, format: "cjs", platform: "node", logLevel: "silent",
    alias: { "@": path.join(__dirname, "..", "src") },
  });
  const modulo = { exports: {} };
  new Function("module", "exports", "require", outputFiles[0].text)(modulo, modulo.exports, require);
  return modulo.exports;
}

module.exports = { cargarTs };
