// Control de títulos que vienen de la base (Sprint 13): lista los títulos de pantallas y menús (GAM_MODULOS_FORMS) que, ya traducidos
// con api/src/i18n, todavía parecen portugueses. Solo lectura. Uso: node tools/verificar-titulos.js
const { execFileSync } = require("child_process");
const path = require("path");
const { traducir } = require("../api/src/i18n/traducir");
const puntuales = require("../api/src/i18n/titulos-es.json");

const DB_QUERY = path.resolve(__dirname, "../../Agente-ia/db-query.js");
const sql = "SELECT ID_FORM, MOD_MODULO M, TRIM(MOD_OBJ_CAPTION) T FROM GATEC_AGR.GAM_MODULOS_FORMS ORDER BY 1";
const filas = JSON.parse(execFileSync("node", [DB_QUERY, sql, "5000"], { cwd: path.dirname(DB_QUERY), encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));

// Señales de portugués: caracteres que el español no usa, o terminaciones y palabras típicas.
const SENALES = /[ãõçâêôÃÕÇÂÊÔ]|\b(?:geral|diári[oa]s?|relat[oó]rios?|listagem|lan[cç]amentos?|cadastros?|safra|fora|dos|das|do|da|em|nova|pesquisa|talh[aã]o|f[aá]brica)\b/i;
const pendientes = [];
for (const f of filas) {
  const t = puntuales[f.ID_FORM] ?? traducir(f.T ?? "");
  if (SENALES.test(t)) pendientes.push({ id: f.ID_FORM, original: f.T, traduccion: t });
}
for (const p of pendientes) console.log(`${p.id}: «${p.original}» → «${p.traduccion}»`);
console.log(`\nTítulos: ${filas.length}; con portugués pendiente: ${pendientes.length}.`);
process.exit(pendientes.length ? 1 : 0);
