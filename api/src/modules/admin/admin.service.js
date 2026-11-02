// Administración (GAtec_Senha) en SOLO CONSULTA: usuarios, grupos, permisos por pantalla y conexiones.
// Esquema GATEC_AGR. Se leen columnas EXPLÍCITAS: nunca contraseñas (USE_SENHA, USE_SENHA_GDF, USE_SENHA_PROVISORIA, VAL_SENHA),
// ni CPF, correo u observaciones. Código de acceso de GAM_*_FORM_ACESSOS.FRM_ACESSOS: 1 = total, 2 = sin acceso, 3 = parcial.
// Regla de permiso efectivo (igual que el login): el directo del usuario pisa a los de grupo; entre grupos manda el mínimo código.
const { query, queryOne } = require("../../db");
const { error, trim } = require("../../lib/util");

const G = "GATEC_AGR";
const MAX_FILAS = 500;
const entero = (v, nombre) => { const n = Number(v); if (!Number.isInteger(n) || n < 0) throw error(`${nombre} inválido`); return n; };
const { fechaReal: fechaValida } = require("../../lib/validar");
const { titulo: traducirTitulo } = require("../../i18n/traducir");
const { hoyLocal } = require("../../lib/validar");
const hoyMas = (dias) => hoyLocal(dias);

const ACCESO = { 1: "Total", 2: "Sin acceso", 3: "Parcial" };
const acceso = (cod) => (cod === null || cod === undefined ? null : { codigo: Number(cod), texto: ACCESO[Number(cod)] ?? `Código ${cod}` });

// Columnas seguras de un usuario (a = alias de GAM_USUARIOS).
const COLS_USUARIO = `u.ID_USUARIO, u.DSC_USUARIO, u.USE_NOME, u.USE_RAMAL, u.USE_ATIVO, u.USE_MASTER, u.USE_BLOQ_SENHA`;
const aUsuario = (r) => ({
  id: r.ID_USUARIO, usuario: trim(r.DSC_USUARIO), nombre: trim(r.USE_NOME) || null, ramal: trim(r.USE_RAMAL) || null,
  activo: r.USE_ATIVO === "1", master: r.USE_MASTER === "1", bloqueado: r.USE_BLOQ_SENHA === "1" || r.USE_BLOQ_SENHA === 1,
});

async function usuarios({ q, estado = "todos" }) {
  if (!["todos", "activos", "inactivos"].includes(estado)) throw error("Estado inválido");
  const where = ["1 = 1"];
  const binds = {};
  if (estado === "activos") where.push("u.USE_ATIVO = '1'");
  if (estado === "inactivos") where.push("NVL(u.USE_ATIVO, '0') <> '1'");
  if (q && String(q).trim()) { where.push("(UPPER(u.DSC_USUARIO) LIKE :q OR UPPER(u.USE_NOME) LIKE :q)"); binds.q = `%${String(q).trim().toUpperCase().slice(0, 40)}%`; }
  const r = await query(
    `SELECT * FROM (
       SELECT ${COLS_USUARIO},
              (SELECT LISTAGG(TRIM(g.DSC_GRUPO), ', ') WITHIN GROUP (ORDER BY g.DSC_GRUPO)
                 FROM ${G}.GAM_GRUPOS_USUARIOS gu JOIN ${G}.GAM_GRUPOS g ON g.ID_GRUPO = gu.ID_GRUPO WHERE gu.ID_USUARIO = u.ID_USUARIO) GRUPOS
         FROM ${G}.GAM_USUARIOS u WHERE ${where.join(" AND ")} ORDER BY u.DSC_USUARIO) WHERE ROWNUM <= ${MAX_FILAS + 1}`,
    binds, { maxRows: MAX_FILAS + 1 },
  );
  return { truncado: r.rows.length > MAX_FILAS, usuarios: r.rows.slice(0, MAX_FILAS).map((x) => ({ ...aUsuario(x), grupos: x.GRUPOS || "" })) };
}

async function usuario({ id }) {
  id = entero(id, "Usuario");
  const u = await queryOne(`SELECT ${COLS_USUARIO} FROM ${G}.GAM_USUARIOS u WHERE u.ID_USUARIO = :i`, { i: id });
  if (!u) throw error("Usuario inexistente", 404);
  const [grupos, permisos, historial, conexiones] = await Promise.all([
    query(`SELECT g.ID_GRUPO, TRIM(g.DSC_GRUPO) DSC FROM ${G}.GAM_GRUPOS_USUARIOS gu JOIN ${G}.GAM_GRUPOS g ON g.ID_GRUPO = gu.ID_GRUPO WHERE gu.ID_USUARIO = :i ORDER BY g.DSC_GRUPO`, { i: id }, { maxRows: 100 }),
    query(
      `SELECT f.ID_FORM, f.MOD_MODULO, f.MOD_OBJ_NAME, f.MOD_OBJ_CAPTION, f.MOD_OBJ_TIPO, TO_NUMBER(ua.FRM_ACESSOS) DIRECTO, g.COD GRUPO,
              NVL(TO_NUMBER(ua.FRM_ACESSOS), g.COD) EFECTIVO
         FROM ${G}.GAM_MODULOS_FORMS f
         LEFT JOIN ${G}.GAM_USUARIOS_FORM_ACESSOS ua ON ua.ID_FORM = f.ID_FORM AND ua.ID_USUARIO = :i
         LEFT JOIN (SELECT ga.ID_FORM, MIN(TO_NUMBER(ga.FRM_ACESSOS)) COD FROM ${G}.GAM_GRUPO_FORM_ACESSOS ga
                      JOIN ${G}.GAM_GRUPOS_USUARIOS gu ON gu.ID_GRUPO = ga.ID_GRUPO WHERE gu.ID_USUARIO = :i GROUP BY ga.ID_FORM) g ON g.ID_FORM = f.ID_FORM
        WHERE ua.ID_FORM IS NOT NULL OR g.ID_FORM IS NOT NULL ORDER BY f.MOD_MODULO, f.ID_FORM`, { i: id }, { maxRows: 2000 }),
    query(
      `SELECT * FROM (SELECT TO_CHAR(h.RAS_DATA, 'YYYY-MM-DD"T"HH24:MI') FECHA, h.ID_FORM, f.MOD_OBJ_CAPTION, h.RAS_ACESSOS, TRIM(r.DSC_USUARIO) RESPONSABLE
                        FROM ${G}.GAM_USUARIO_FORM_HISTOR h LEFT JOIN ${G}.GAM_MODULOS_FORMS f ON f.ID_FORM = h.ID_FORM
                        LEFT JOIN ${G}.GAM_USUARIOS r ON r.ID_USUARIO = h.ID_USUARIO_RESPONSAVEL
                       WHERE h.ID_USUARIO = :i ORDER BY h.RAS_DATA DESC) WHERE ROWNUM <= 30`, { i: id }, { maxRows: 30 }),
    query(
      `SELECT * FROM (SELECT TO_CHAR(c.CRTL_DTHR_INI_CNN, 'YYYY-MM-DD"T"HH24:MI') INI, TO_CHAR(c.CRTL_DTHR_FIM_CNN, 'YYYY-MM-DD"T"HH24:MI') FIN, c.MOD_MODULO, c.CRTL_NOME_COMP
                        FROM ${G}.GAM_CONTROLE_LOGON c WHERE c.ID_USUARIO = :i ORDER BY c.CRTL_DTHR_INI_CNN DESC) WHERE ROWNUM <= 15`, { i: id }, { maxRows: 15 }),
  ]);
  return {
    ...aUsuario(u),
    grupos: grupos.rows.map((g) => ({ id: g.ID_GRUPO, nombre: g.DSC })),
    permisos: permisos.rows.map((p) => ({
      idForm: p.ID_FORM, modulo: p.MOD_MODULO, objeto: trim(p.MOD_OBJ_NAME), titulo: traducirTitulo(trim(p.MOD_OBJ_CAPTION), p.ID_FORM), tipo: p.MOD_OBJ_TIPO,
      directo: acceso(p.DIRECTO), grupo: acceso(p.GRUPO), efectivo: acceso(p.EFECTIVO),
    })),
    historial: historial.rows.map((h) => ({ fecha: h.FECHA, idForm: h.ID_FORM, titulo: traducirTitulo(trim(h.MOD_OBJ_CAPTION), h.ID_FORM) || null, acceso: acceso(h.RAS_ACESSOS), responsable: h.RESPONSABLE || null })),
    conexiones: conexiones.rows.map((c) => ({ inicio: c.INI, fin: c.FIN, modulo: c.MOD_MODULO, equipo: trim(c.CRTL_NOME_COMP) || null })),
  };
}

async function grupos() {
  const r = await query(
    `SELECT g.ID_GRUPO, TRIM(g.DSC_GRUPO) DSC,
            (SELECT COUNT(*) FROM ${G}.GAM_GRUPOS_USUARIOS gu WHERE gu.ID_GRUPO = g.ID_GRUPO) MIEMBROS,
            (SELECT COUNT(*) FROM ${G}.GAM_GRUPO_FORM_ACESSOS ga WHERE ga.ID_GRUPO = g.ID_GRUPO) PANTALLAS
       FROM ${G}.GAM_GRUPOS g ORDER BY g.DSC_GRUPO`, {}, { maxRows: 200 });
  return { grupos: r.rows.map((x) => ({ id: x.ID_GRUPO, nombre: x.DSC, miembros: x.MIEMBROS, pantallas: x.PANTALLAS })) };
}

async function grupo({ id }) {
  id = entero(id, "Grupo");
  const g = await queryOne(`SELECT ID_GRUPO, TRIM(DSC_GRUPO) DSC FROM ${G}.GAM_GRUPOS WHERE ID_GRUPO = :i`, { i: id });
  if (!g) throw error("Grupo inexistente", 404);
  const [miembros, permisos] = await Promise.all([
    query(`SELECT ${COLS_USUARIO} FROM ${G}.GAM_GRUPOS_USUARIOS gu JOIN ${G}.GAM_USUARIOS u ON u.ID_USUARIO = gu.ID_USUARIO WHERE gu.ID_GRUPO = :i ORDER BY u.DSC_USUARIO`, { i: id }, { maxRows: 500 }),
    query(`SELECT f.ID_FORM, f.MOD_MODULO, f.MOD_OBJ_CAPTION, f.MOD_OBJ_TIPO, TO_NUMBER(ga.FRM_ACESSOS) COD
             FROM ${G}.GAM_GRUPO_FORM_ACESSOS ga JOIN ${G}.GAM_MODULOS_FORMS f ON f.ID_FORM = ga.ID_FORM WHERE ga.ID_GRUPO = :i ORDER BY f.MOD_MODULO, f.ID_FORM`, { i: id }, { maxRows: 2000 }),
  ]);
  return {
    id: g.ID_GRUPO, nombre: g.DSC,
    miembros: miembros.rows.map(aUsuario),
    permisos: permisos.rows.map((p) => ({ idForm: p.ID_FORM, modulo: p.MOD_MODULO, titulo: traducirTitulo(trim(p.MOD_OBJ_CAPTION), p.ID_FORM), tipo: p.MOD_OBJ_TIPO, acceso: acceso(p.COD) })),
  };
}

// Pantallas del GATEC (GAM_MODULOS_FORMS) para elegir una y ver quién tiene acceso.
async function pantallas({ q }) {
  const binds = {};
  let w = "1 = 1";
  if (q && String(q).trim()) {
    const t = String(q).trim();
    if (/^\d+$/.test(t)) { w = "f.ID_FORM = :n"; binds.n = Number(t); } else { w = "(UPPER(f.MOD_OBJ_NAME) LIKE :q OR UPPER(f.MOD_OBJ_CAPTION) LIKE :q)"; binds.q = `%${t.toUpperCase().slice(0, 40)}%`; }
  }
  const r = await query(
    `SELECT * FROM (SELECT f.ID_FORM, f.MOD_MODULO, TRIM(f.MOD_OBJ_NAME) OBJ, TRIM(f.MOD_OBJ_CAPTION) TIT, f.MOD_OBJ_TIPO FROM ${G}.GAM_MODULOS_FORMS f WHERE ${w} ORDER BY f.MOD_MODULO, f.ID_FORM) WHERE ROWNUM <= 100`,
    binds, { maxRows: 100 });
  return { pantallas: r.rows.map((x) => ({ idForm: x.ID_FORM, modulo: x.MOD_MODULO, objeto: x.OBJ, titulo: traducirTitulo(x.TIT, x.ID_FORM), tipo: x.MOD_OBJ_TIPO })) };
}

// Quién tiene acceso a una pantalla: usuarios (con el permiso efectivo y su origen) y grupos.
async function permisosPantalla({ idForm }) {
  idForm = entero(idForm, "Pantalla");
  const f = await queryOne(`SELECT f.ID_FORM, f.MOD_MODULO, TRIM(f.MOD_OBJ_NAME) OBJ, TRIM(f.MOD_OBJ_CAPTION) TIT FROM ${G}.GAM_MODULOS_FORMS f WHERE f.ID_FORM = :f`, { f: idForm });
  if (!f) throw error("Pantalla inexistente", 404);
  const [us, gr] = await Promise.all([
    query(
      `SELECT ${COLS_USUARIO}, NVL(TO_NUMBER(ua.FRM_ACESSOS), g.COD) EFECTIVO, CASE WHEN ua.ID_USUARIO IS NOT NULL THEN 'directo' ELSE 'grupo' END ORIGEN
         FROM ${G}.GAM_USUARIOS u
         LEFT JOIN ${G}.GAM_USUARIOS_FORM_ACESSOS ua ON ua.ID_USUARIO = u.ID_USUARIO AND ua.ID_FORM = :f
         LEFT JOIN (SELECT gu.ID_USUARIO, MIN(TO_NUMBER(ga.FRM_ACESSOS)) COD FROM ${G}.GAM_GRUPO_FORM_ACESSOS ga
                      JOIN ${G}.GAM_GRUPOS_USUARIOS gu ON gu.ID_GRUPO = ga.ID_GRUPO WHERE ga.ID_FORM = :f GROUP BY gu.ID_USUARIO) g ON g.ID_USUARIO = u.ID_USUARIO
        WHERE ua.ID_USUARIO IS NOT NULL OR g.COD IS NOT NULL ORDER BY u.USE_ATIVO DESC, u.DSC_USUARIO`, { f: idForm }, { maxRows: 1000 }),
    query(`SELECT g.ID_GRUPO, TRIM(g.DSC_GRUPO) DSC, TO_NUMBER(ga.FRM_ACESSOS) COD FROM ${G}.GAM_GRUPO_FORM_ACESSOS ga JOIN ${G}.GAM_GRUPOS g ON g.ID_GRUPO = ga.ID_GRUPO WHERE ga.ID_FORM = :f ORDER BY g.DSC_GRUPO`, { f: idForm }, { maxRows: 200 }),
  ]);
  return {
    pantalla: { idForm: f.ID_FORM, modulo: f.MOD_MODULO, objeto: f.OBJ, titulo: traducirTitulo(f.TIT, f.ID_FORM) },
    usuarios: us.rows.map((x) => ({ ...aUsuario(x), efectivo: acceso(x.EFECTIVO), origen: x.ORIGEN })),
    grupos: gr.rows.map((x) => ({ id: x.ID_GRUPO, nombre: x.DSC, acceso: acceso(x.COD) })),
  };
}

// Conexiones al sistema viejo (GAM_CONTROLE_LOGON): quién entró, a qué módulo, desde qué equipo.
async function conexiones({ desde, hasta, usuario }) {
  hasta = hasta || hoyMas(0);
  desde = desde || hoyMas(-7);
  fechaValida(desde, "Fecha inicial"); fechaValida(hasta, "Fecha final");
  if (hasta < desde) throw error("La fecha final es anterior a la inicial");
  const binds = { d: desde, h: hasta };
  let w = "c.CRTL_DTHR_INI_CNN >= TO_DATE(:d, 'YYYY-MM-DD') AND c.CRTL_DTHR_INI_CNN < TO_DATE(:h, 'YYYY-MM-DD') + 1";
  if (usuario && String(usuario).trim()) { w += " AND UPPER(u.DSC_USUARIO) LIKE :u"; binds.u = `%${String(usuario).trim().toUpperCase().slice(0, 30)}%`; }
  const r = await query(
    `SELECT * FROM (SELECT c.ID_USUARIO, TRIM(u.DSC_USUARIO) USUARIO, c.MOD_MODULO, TO_CHAR(c.CRTL_DTHR_INI_CNN, 'YYYY-MM-DD"T"HH24:MI') INI, TO_CHAR(c.CRTL_DTHR_FIM_CNN, 'YYYY-MM-DD"T"HH24:MI') FIN,
                           TRIM(c.CRTL_NOME_COMP) EQUIPO, TRIM(c.CRTL_USER_SO) USER_SO
                      FROM ${G}.GAM_CONTROLE_LOGON c LEFT JOIN ${G}.GAM_USUARIOS u ON u.ID_USUARIO = c.ID_USUARIO
                     WHERE ${w} ORDER BY c.CRTL_DTHR_INI_CNN DESC) WHERE ROWNUM <= ${MAX_FILAS + 1}`,
    binds, { maxRows: MAX_FILAS + 1 },
  );
  return {
    desde, hasta, truncado: r.rows.length > MAX_FILAS,
    conexiones: r.rows.slice(0, MAX_FILAS).map((x) => ({ idUsuario: x.ID_USUARIO, usuario: x.USUARIO, modulo: x.MOD_MODULO, inicio: x.INI, fin: x.FIN, equipo: x.EQUIPO || null, usuarioSo: x.USER_SO || null })),
  };
}

module.exports = { usuarios, usuario, grupos, grupo, pantallas, permisosPantalla, conexiones };
