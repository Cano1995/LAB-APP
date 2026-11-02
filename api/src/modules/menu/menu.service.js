const config = require('../../config');
const { query } = require('../../db');
const { permisosDeUsuario } = require('../auth/auth.service');

const G = config.gatecSchema;

// Rótulos que el GATEC guarda en portugués; la interfaz es en español.
const ROTULOS = {
  'gerencia de processo industrial': 'Gerencia de Proceso Industrial',
  'processo industrial': 'Proceso Industrial',
  'controle de accesos': 'Control de Accesos',
  'consultas': 'Consultas',
  'herramientas': 'Herramientas',
  'media para la industria': 'Media para la industria',
  'configuración e pré-cosecha': 'Configuración y pre-cosecha',
};
const rotulo = (s) => ROTULOS[String(s || '').trim().toLowerCase()] || String(s || '').trim();

// Árbol de carpetas y programas del menú principal del GATEC (GA_MENU_ARVORE / GA_MENU_ARV_EXE), solo lo que el usuario puede ver.
// Regla del VB6: cada carpeta es un formulario del módulo 307 con MOD_OBJ_NAME = ID_NO; cada programa, uno con MOD_OBJ_NAME = nombre del programa.
async function obtener(usuario) {
  const [nodos, exes, favs, permisos] = await Promise.all([
    query(`SELECT ID_NO, ID_NO_ANT, MNA_DESCRICAO FROM ${G}.GA_MENU_ARVORE ORDER BY ID_NO`),
    query(`SELECT ID_EXE, ID_NO, MAI_EXE, MAI_EXE_ORIGINAL FROM ${G}.GA_MENU_ARV_EXE ORDER BY MAI_EXE`),
    query(`SELECT ID_EXE FROM ${G}.GA_MENU_FAVORITO WHERE ID_USUARIO = :id`, { id: usuario.id }),
    usuario.master ? Promise.resolve(null) : permisosDeUsuario(usuario.id),
  ]);

  const permitidos = permisos && new Set(permisos.filter((p) => p.modulo === 307).map((p) => String(p.objeto).trim().toUpperCase()));
  const ok = (clave) => !permitidos || permitidos.has(String(clave).trim().toUpperCase());

  const exesOk = exes.rows.filter((e) => ok(e.MAI_EXE));
  const nodosOk = new Set(nodos.rows.filter((n) => ok(n.ID_NO)).map((n) => n.ID_NO));
  // Una carpeta con programas visibles se muestra aunque su propio permiso no esté (y sus ancestros con ella).
  const porId = new Map(nodos.rows.map((n) => [n.ID_NO, n]));
  const subir = (id) => { for (let n = porId.get(id); n && !nodosOk.has(n.ID_NO) ; n = porId.get(n.ID_NO_ANT)) nodosOk.add(n.ID_NO); };
  for (const e of exesOk) subir(e.ID_NO);

  const idsFav = new Set(favs.rows.map((f) => f.ID_EXE));
  return {
    carpetas: nodos.rows
      .filter((n) => nodosOk.has(n.ID_NO) && (n.ID_NO_ANT == null || nodosOk.has(n.ID_NO_ANT)))
      .map((n) => ({ id: n.ID_NO, padre: n.ID_NO_ANT ?? null, nombre: rotulo(n.MNA_DESCRICAO) })),
    programas: exesOk.map((e) => ({ id: e.ID_EXE, carpeta: e.ID_NO, nombre: rotulo(e.MAI_EXE), exe: String(e.MAI_EXE_ORIGINAL || '').trim() })),
    favoritos: exesOk.filter((e) => idsFav.has(e.ID_EXE)).map((e) => e.ID_EXE),
  };
}

module.exports = { obtener };
