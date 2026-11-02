// Crea las tablas propias de la app si no existen (idempotente).
// Necesario porque DESA se recarga a diario y borra lo creado a mano:
// al arrancar la API, la tabla de auth se recrea sola.
const { query } = require('../db');
const config = require('../config');

const A = config.appSchema; // mismo esquema que usan los servicios (${A}.LAB_APP_AUTH); antes se leía process.env.APP_SCHEMA directo

async function ensureAuthTable() {
  const r = await query(
    `SELECT COUNT(*) N FROM all_tables WHERE owner = :o AND table_name = 'LAB_APP_AUTH'`,
    { o: A },
  );
  if (r.rows[0].N > 0) return false;

  await query(`
    CREATE TABLE ${A}.LAB_APP_AUTH (
      ID_USUARIO         NUMBER(5)    NOT NULL,
      SENHA_HASH         VARCHAR2(100),
      REQUIERE_RESET     NUMBER(1)    DEFAULT 1 NOT NULL,
      INTENTOS_FALLIDOS  NUMBER(3)    DEFAULT 0 NOT NULL,
      BLOQUEADO          NUMBER(1)    DEFAULT 0 NOT NULL,
      ULTIMO_LOGIN       DATE,
      SEL_COD_EMPR       NUMBER(2),
      SEL_SAF_ANO_SAFRA  NUMBER(4),
      FECHA_ACTUALIZ     DATE         DEFAULT SYSDATE NOT NULL,
      CONSTRAINT PK_LAB_APP_AUTH PRIMARY KEY (ID_USUARIO)
    )`);
  return true;
}

// Agrega una columna si falta (idempotente). Para evolucionar la tabla sin recrearla.
async function ensureColumn(tabla, columna, definicion) {
  const r = await query(
    `SELECT COUNT(*) N FROM all_tab_columns WHERE owner = :o AND table_name = :t AND column_name = :c`,
    { o: A, t: tabla, c: columna },
  );
  if (r.rows[0].N > 0) return false;
  await query(`ALTER TABLE ${A}.${tabla} ADD (${columna} ${definicion})`);
  return true;
}

// Registro de auditoría de TODA escritura de la app en tablas del GATEC: quién, qué, valor anterior y nuevo. Es propia de la app (esquema APP_SCHEMA).
async function ensureAuditTable() {
  const r = await query(`SELECT COUNT(*) N FROM all_tables WHERE owner = :o AND table_name = 'LAB_APP_AUDIT'`, { o: A });
  if (r.rows[0].N > 0) return false;
  await query(`
    CREATE TABLE ${A}.LAB_APP_AUDIT (
      ID          NUMBER GENERATED ALWAYS AS IDENTITY,
      FECHA       TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
      ID_USUARIO  NUMBER(5)     NOT NULL,
      USUARIO     VARCHAR2(40)  NOT NULL,
      ACCION      VARCHAR2(30)  NOT NULL,
      TABLA       VARCHAR2(60)  NOT NULL,
      CLAVE       VARCHAR2(200) NOT NULL,
      ANTES       VARCHAR2(200),
      DESPUES     VARCHAR2(200),
      CONTEXTO    VARCHAR2(200),
      CONSTRAINT PK_LAB_APP_AUDIT PRIMARY KEY (ID)
    )`);
  await query(`CREATE INDEX ${A}.IX_LAB_APP_AUDIT_FECHA ON ${A}.LAB_APP_AUDIT (FECHA)`);
  return true;
}

// Bandeja de notificaciones de la app (propia, esquema APP_SCHEMA). Cada fila va dirigida a un usuario; LEIDA_FECHA nula = pendiente.
async function ensureNotifTable() {
  const r = await query(`SELECT COUNT(*) N FROM all_tables WHERE owner = :o AND table_name = 'LAB_APP_NOTIF'`, { o: A });
  if (r.rows[0].N > 0) return false;
  await query(`
    CREATE TABLE ${A}.LAB_APP_NOTIF (
      ID           NUMBER GENERATED ALWAYS AS IDENTITY,
      FECHA        TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
      ID_USUARIO   NUMBER(5)      NOT NULL,
      TIPO         VARCHAR2(20)   DEFAULT 'info' NOT NULL,
      TITULO       VARCHAR2(120)  NOT NULL,
      MENSAJE      VARCHAR2(500),
      ENLACE       VARCHAR2(200),
      LEIDA_FECHA  TIMESTAMP,
      CONSTRAINT PK_LAB_APP_NOTIF PRIMARY KEY (ID)
    )`);
  await query(`CREATE INDEX ${A}.IX_LAB_APP_NOTIF_USU ON ${A}.LAB_APP_NOTIF (ID_USUARIO, LEIDA_FECHA)`);
  return true;
}

// Configuración de marca: textos (clave/valor) e imágenes (BLOB). Propias de la app; sin filas se usan los valores por defecto.
async function ensureConfigTables() {
  const r = await query(`SELECT table_name FROM all_tables WHERE owner = :o AND table_name IN ('LAB_APP_CONFIG', 'LAB_APP_ASSET')`, { o: A });
  const hay = new Set(r.rows.map((x) => x.TABLE_NAME));
  if (!hay.has('LAB_APP_CONFIG')) {
    await query(`
      CREATE TABLE ${A}.LAB_APP_CONFIG (
        CLAVE       VARCHAR2(60)   NOT NULL,
        VALOR       VARCHAR2(500),
        ACTUALIZ    DATE           DEFAULT SYSDATE NOT NULL,
        ID_USUARIO  NUMBER(5),
        CONSTRAINT PK_LAB_APP_CONFIG PRIMARY KEY (CLAVE)
      )`);
  }
  if (!hay.has('LAB_APP_ASSET')) {
    await query(`
      CREATE TABLE ${A}.LAB_APP_ASSET (
        CLAVE       VARCHAR2(40)   NOT NULL,
        MIME        VARCHAR2(60)   NOT NULL,
        NOMBRE      VARCHAR2(120),
        DATOS       BLOB           NOT NULL,
        TAMANO      NUMBER(10)     NOT NULL,
        ACTUALIZ    DATE           DEFAULT SYSDATE NOT NULL,
        ID_USUARIO  NUMBER(5),
        CONSTRAINT PK_LAB_APP_ASSET PRIMARY KEY (CLAVE)
      )`);
  }
  return ['LAB_APP_CONFIG', 'LAB_APP_ASSET'].filter((t) => !hay.has(t));
}

async function bootstrap() {
  const created = await ensureAuthTable();
  console.log(created ? '[bootstrap] tabla LAB_APP_AUTH creada' : '[bootstrap] LAB_APP_AUTH ya existe');
  const nuevas = [];
  if (await ensureColumn('LAB_APP_AUTH', 'SEL_COD_EMPR', 'NUMBER(2)')) nuevas.push('SEL_COD_EMPR');
  if (await ensureColumn('LAB_APP_AUTH', 'SEL_SAF_ANO_SAFRA', 'NUMBER(4)')) nuevas.push('SEL_SAF_ANO_SAFRA');
  // Espera tras intentos fallidos (protege las cuentas de Oracle de un bloqueo; ver auth.service).
  if (await ensureColumn('LAB_APP_AUTH', 'BLOQ_HASTA', 'DATE')) nuevas.push('BLOQ_HASTA');
  if (await ensureAuditTable()) console.log('[bootstrap] tabla LAB_APP_AUDIT creada');
  if (await ensureNotifTable()) console.log('[bootstrap] tabla LAB_APP_NOTIF creada');
  const cfgNuevas = await ensureConfigTables();
  if (cfgNuevas.length) console.log(`[bootstrap] tablas creadas: ${cfgNuevas.join(', ')}`);
  if (nuevas.length) console.log(`[bootstrap] columnas agregadas: ${nuevas.join(', ')}`);
}

module.exports = { bootstrap };
