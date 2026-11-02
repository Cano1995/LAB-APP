// Genera web/public/docs/lab-app-manual.pdf a partir de web/src/content/wiki.json (la misma fuente de la Wiki de «Acerca de»).
// Usa Edge headless (sin dependencias). Uso: node tools/generar-manual-pdf.js
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const raiz = path.join(__dirname, "..");
const wiki = JSON.parse(fs.readFileSync(path.join(raiz, "web/src/content/wiki.json"), "utf8"));
const salida = path.join(raiz, "web/public/docs/lab-app-manual.pdf");

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const bloque = (b) => {
  if (b.t === "p") return `<p>${esc(b.x)}</p>`;
  if (b.t === "ul") return `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
  return `<table><thead><tr>${b.cab.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${b.filas
    .map((f) => `<tr>${f.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
};

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(wiki.titulo)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; }
  h1 { font-size: 24pt; margin: 0 0 4pt; color: #0f3d5e; }
  .ver { color: #64748b; margin-bottom: 14pt; }
  h2 { font-size: 15pt; color: #0f3d5e; border-bottom: 1px solid #cbd5e1; padding-bottom: 3pt; margin: 18pt 0 6pt; break-after: avoid; }
  ul { margin: 4pt 0 8pt; padding-left: 18pt; } li { margin-bottom: 3pt; }
  table { width: 100%; border-collapse: collapse; margin: 6pt 0 10pt; font-size: 10pt; break-inside: avoid; }
  th { background: #e2e8f0; text-align: left; } th, td { border: 1px solid #cbd5e1; padding: 4pt 6pt; vertical-align: top; }
  .ind li { margin: 0; }
</style></head><body>
<h1>${esc(wiki.titulo)}</h1><div class="ver">Versión: ${esc(wiki.version)}</div>
<h2>Contenido</h2><ul class="ind">${wiki.secciones.map((s) => `<li>${esc(s.titulo)}</li>`).join("")}</ul>
${wiki.secciones.map((s) => `<h2>${esc(s.titulo)}</h2>${s.bloques.map(bloque).join("")}`).join("")}
</body></html>`;

const edge = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(fs.existsSync);
if (!edge) { console.error("No se encontró Edge."); process.exit(1); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "manual-"));
const archivo = path.join(tmp, "manual.html");
fs.writeFileSync(archivo, html);
fs.mkdirSync(path.dirname(salida), { recursive: true });
fs.rmSync(salida, { force: true });
const proc = spawn(edge, [
  "--headless=new", "--disable-gpu", `--user-data-dir=${path.join(tmp, "perfil")}`,
  "--no-pdf-header-footer", `--print-to-pdf=${salida}`, "file:///" + archivo.replace(/\\/g, "/"),
], { stdio: "ignore" });

// Edge puede devolver el control antes de terminar de escribir: se espera a que el PDF aparezca y deje de crecer.
(async () => {
  let tam = -1;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const t = fs.existsSync(salida) ? fs.statSync(salida).size : 0;
    if (t > 0 && t === tam) break;
    tam = t;
  }
  proc.kill();
  await new Promise((r) => setTimeout(r, 500));
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* el perfil de Edge puede seguir abierto */ }
  if (!fs.existsSync(salida)) { console.error("Edge no generó el PDF."); process.exit(1); }
  console.log("PDF generado:", salida, fs.statSync(salida).size, "bytes");
})();
