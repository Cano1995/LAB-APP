const jwt = require('jsonwebtoken');
const { query, queryOne, oracledb } = require('../../db');
const config = require('../../config');
const intentos = require('./intentos');
const { titulo: traducirTitulo } = require('../../i18n/traducir');

const G = config.gatecSchema; // esquema núcleo GATEC (GAM_*)

// --- Usuarios y permisos (desde el núcleo GATEC) ---------------------------

async function buscarUsuarioPorLogin(usuario) {
  return queryOne(
    `SELECT ID_USUARIO, DSC_USUARIO, USE_NOME, USE_EMAIL, USE_MASTER, USE_ATIVO
       FROM ${G}.GAM_USUARIOS
      WHERE UPPER(DSC_USUARIO) = UPPER(:u) AND USE_ATIVO = '1'`,
    { u: usuario },
  );
}

async function buscarUsuarioPorId(idUsuario) {
  return queryOne(
    `SELECT ID_USUARIO, DSC_USUARIO, USE_NOME, USE_EMAIL, USE_MASTER, USE_ATIVO
       FROM ${G}.GAM_USUARIOS WHERE ID_USUARIO = :id`,
    { id: idUsuario },
  );
}

// --- Permisos (misma regla que el GATEC viejo) -------------------------------
// Códigos de FRM_ACESSOS, tal como los rotula GAtec_Senha.exe:
//   1 = ACESSO TOTAL · 2 = SEM ACESSO · 3 = ACESSO PARCIAL
// Resolución por formulario (consultas de GAtec_Senha.exe):
//   - un permiso DIRECTO del usuario manda sobre los de grupo;
//   - si no hay directo, entre varios grupos se toma el MIN del código (1 gana a 3, 3 a 2).
// Verificado contra el menú del GPI viejo con el usuario BOT: los menús con código 2 aparecen deshabilitados.
//
// Nivel interno de la app: 0 = sin acceso · 1 = consulta (parcial) · 3 = total.
// "Parcial" no está definido por formulario en la base; se trata como solo lectura (mínimo privilegio).
const COD_TOTAL = 1;
const COD_PARCIAL = 3;
const aNivel = (cod) => (cod === COD_TOTAL ? 3 : cod === COD_PARCIAL ? 1 : 0);

// Código efectivo por formulario para un usuario (solo los formularios con algún permiso definido).
const SQL_ACCESO_EFECTIVO = `
  SELECT f.ID_FORM,
         NVL(TO_NUMBER(u.FRM_ACESSOS), g.COD) COD
    FROM ${G}.GAM_MODULOS_FORMS f
    LEFT JOIN ${G}.GAM_USUARIOS_FORM_ACESSOS u ON u.ID_FORM = f.ID_FORM AND u.ID_USUARIO = :id
    LEFT JOIN (SELECT ga.ID_FORM, MIN(TO_NUMBER(ga.FRM_ACESSOS)) COD
                 FROM ${G}.GAM_GRUPO_FORM_ACESSOS ga
                 JOIN ${G}.GAM_GRUPOS_USUARIOS gu ON gu.ID_GRUPO = ga.ID_GRUPO
                WHERE gu.ID_USUARIO = :id
                GROUP BY ga.ID_FORM) g ON g.ID_FORM = f.ID_FORM
   WHERE u.ID_FORM IS NOT NULL OR g.ID_FORM IS NOT NULL`;

// Formularios/menús a los que el usuario tiene acceso (nivel interno > 0).
async function permisosDeUsuario(idUsuario) {
  const r = await query(
    `SELECT f.ID_FORM, f.MOD_MODULO, f.MOD_OBJ_NAME, f.MOD_OBJ_CAPTION, f.MOD_OBJ_TIPO, a.COD
       FROM (${SQL_ACCESO_EFECTIVO}) a
       JOIN ${G}.GAM_MODULOS_FORMS f ON f.ID_FORM = a.ID_FORM`,
    { id: idUsuario },
  );
  return r.rows
    .map((x) => ({
      idForm: x.ID_FORM,
      modulo: x.MOD_MODULO,
      objeto: x.MOD_OBJ_NAME,
      titulo: traducirTitulo(x.MOD_OBJ_CAPTION, x.ID_FORM),
      tipo: x.MOD_OBJ_TIPO,
      nivel: aNivel(x.COD),
    }))
    .filter((p) => p.nivel > 0);
}

// Nivel interno (0, 1 o 3) de un usuario sobre un formulario. Los usuarios master tienen siempre 3.
async function nivelFormulario(idUsuario, idForm, esMaster) {
  if (esMaster) return 3;
  const r = await queryOne(`SELECT COD FROM (${SQL_ACCESO_EFECTIVO}) WHERE ID_FORM = :f`, { id: idUsuario, f: idForm });
  return r ? aNivel(r.COD) : 0;
}

// Niveles de TODOS los formularios del usuario en una sola consulta: Map(idForm → nivel). Los formularios que no figuran no tienen acceso.
// Sirve para listar muchas pantallas a la vez sin lanzar una consulta de permiso por cada una.
async function nivelesDeUsuario(idUsuario) {
  const r = await query(`SELECT ID_FORM, COD FROM (${SQL_ACCESO_EFECTIVO})`, { id: idUsuario });
  return new Map(r.rows.map((x) => [x.ID_FORM, aNivel(x.COD)]));
}

async function gruposDeUsuario(idUsuario) {
  const r = await query(
    `SELECT g.ID_GRUPO, g.DSC_GRUPO
       FROM ${G}.GAM_GRUPOS g
       JOIN ${G}.GAM_GRUPOS_USUARIOS gu ON gu.ID_GRUPO = g.ID_GRUPO
      WHERE gu.ID_USUARIO = :id ORDER BY g.DSC_GRUPO`,
    { id: idUsuario },
  );
  return r.rows.map((x) => ({ id: x.ID_GRUPO, nombre: x.DSC_GRUPO }));
}

// --- Credenciales: se validan contra Oracle --------------------------------
// La contraseña es la del usuario de Oracle con el mismo nombre que el login del GATEC
// (DSC_USUARIO). La app no guarda contraseñas: abre una conexión con esas credenciales contra
// la misma base (DESA) y la cierra. LAB_APP_AUTH solo lleva el control de intentos y el contexto.
//
// Los perfiles de Oracle bloquean la cuenta tras pocos fallos (BOT: 3 intentos → 30 días), lo que
// afectaría a todo lo que use esa cuenta. Por eso la app corta ANTES: tras MAX_FALLOS seguidos deja
// de consultar a Oracle durante ESPERA_MIN minutos, y nunca provoca el fallo que bloquearía la cuenta.

// Identificador de Oracle sin comillas: evita armar conexiones con nombres raros.
const USUARIO_ORACLE = /^[A-Za-z][A-Za-z0-9_$#]{0,29}$/;

// Valida usuario/contraseña abriendo una conexión a la base. Devuelve un código, sin lanzar.
async function verificarEnOracle(usuario, senha) {
  let cn;
  try {
    cn = await oracledb.getConnection({ user: usuario, password: senha, connectString: config.db.connectString });
    return { ok: true };
  } catch (e) {
    const m = /ORA-(\d{5})/.exec(e.message);
    const ora = m ? m[1] : null;
    if (ora === '01017') return { ok: false, code: 'CREDENCIALES' };            // usuario/clave inválidos
    if (ora === '28000') return { ok: false, code: 'BLOQUEADO_ORACLE' };        // cuenta bloqueada en Oracle
    if (ora === '28001') return { ok: false, code: 'VENCIDA' };                 // contraseña vencida
    if (ora === '28002') return { ok: true };                                   // vence pronto: se permite
    return { ok: false, code: 'NO_DISPONIBLE', detalle: e.message };             // red, base caída, etc.
  } finally {
    if (cn) await cn.close().catch(() => {});
  }
}

// --- Tokens ----------------------------------------------------------------

function firmarToken(usuario, tipo = 'access') {
  return jwt.sign(
    { sub: usuario.ID_USUARIO, usuario: usuario.DSC_USUARIO, master: usuario.USE_MASTER === '1', typ: tipo },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
}

function verificarToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

async function perfilCompleto(usuario) {
  const { obtener: obtenerContexto } = require('../contexto/contexto.service');
  const [permisos, grupos, contexto] = await Promise.all([
    permisosDeUsuario(usuario.ID_USUARIO),
    gruposDeUsuario(usuario.ID_USUARIO),
    obtenerContexto(usuario.ID_USUARIO).catch(() => null),
  ]);
  return {
    id: usuario.ID_USUARIO,
    usuario: usuario.DSC_USUARIO,
    nombre: usuario.USE_NOME,
    email: usuario.USE_EMAIL || null,
    master: usuario.USE_MASTER === '1',
    grupos,
    permisos,
    contexto,
    // Funciones de escritura habilitadas en este servidor (la pantalla solo ofrece «Editar» si están encendidas).
    funciones: { gpiDigitacion: config.escritura.gpiDigitacion },
  };
}

// --- Casos de uso ----------------------------------------------------------

async function login(usuario, senha) {
  const malas = { ok: false, code: 'CREDENCIALES', msg: 'Usuario o contraseña inválidos' };
  // Solo usuarios activos del GATEC: así la web no sirve para probar (ni bloquear) otras cuentas Oracle.
  const u = await buscarUsuarioPorLogin(usuario);
  if (!u) return malas;
  const nombreOracle = String(u.DSC_USUARIO).trim();
  if (!USUARIO_ORACLE.test(nombreOracle) || !senha) return malas;

  // Se reserva el intento ANTES de consultar a Oracle (ver intentos.js): con pedidos en ráfaga, como máximo MAX_FALLOS llegan a Oracle.
  const cupo = await intentos.reservar(u.ID_USUARIO);
  if (!cupo.ok) {
    if (cupo.bloqueado) return { ok: false, code: 'BLOQUEADO', msg: 'Usuario bloqueado en la app; contacte al administrador' };
    return { ok: false, code: 'ESPERA', msg: `Demasiados intentos fallidos. Espere ${cupo.minutos} min antes de reintentar (protege su cuenta de Oracle de un bloqueo)` };
  }

  const r = await verificarEnOracle(nombreOracle, senha);
  if (r.ok) {
    await intentos.exito(u.ID_USUARIO);
    return { ok: true, token: firmarToken(u), perfil: await perfilCompleto(u) };
  }
  if (r.code === 'CREDENCIALES') return malas; // contraseña mala: el intento ya quedó contado

  // Fallas que no son culpa del usuario: se le devuelve el intento reservado.
  await intentos.liberar(u.ID_USUARIO);
  if (r.code === 'NO_DISPONIBLE') {
    console.error('[auth] no se pudo validar contra Oracle:', r.detalle);
    return { ok: false, code: 'NO_DISPONIBLE', msg: 'No se pudo validar la contraseña (base no disponible)' };
  }
  if (r.code === 'BLOQUEADO_ORACLE') return { ok: false, code: r.code, msg: 'Su usuario de Oracle está bloqueado; contacte al DBA' };
  if (r.code === 'VENCIDA') return { ok: false, code: r.code, msg: 'Su contraseña de Oracle venció; cámbiela y vuelva a intentar' };
  return malas;
}

module.exports = {
  login, verificarToken, perfilCompleto, buscarUsuarioPorId, permisosDeUsuario, nivelFormulario, nivelesDeUsuario,
};
