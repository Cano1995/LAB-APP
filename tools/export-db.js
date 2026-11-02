// Exporta código PL/SQL y catálogo de tablas de los esquemas GATEC_* desde DESA.
// Reusa el driver oracledb y el .env de Agente-ia (modo thick, ver su CLAUDE.md).
//
// Uso: node tools/export-db.js
// Salida: db/plsql/<OWNER>/<TIPO>/<NOMBRE>.sql  y  db/catalogo/<OWNER>.json
const fs = require('fs');
const path = require('path');

// Carpeta vecina con el driver y las credenciales (ver CLAUDE.md). Se puede cambiar con AGENTE_IA_DIR.
const AGENTE = process.env.AGENTE_IA_DIR || path.join(__dirname, '..', '..', 'Agente-ia');
const oracledb = require(path.join(AGENTE, 'node_modules/oracledb'));
const OUT = path.join(__dirname, '..', 'db');
const OWNERS = ['GATEC_AGR', 'GATEC_GPI_NEW', 'GATEC_LAB', 'GATEC_AZPA'];

function loadEnv(file) {
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

async function main() {
  const env = loadEnv(path.join(AGENTE, '.env'));
  oracledb.initOracleClient({ libDir: env.ORACLE_CLIENT_LIB_DIR });
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  oracledb.fetchAsString = [oracledb.CLOB];
  const cn = await oracledb.getConnection({
    user: env.DB_USER, password: env.DB_PASSWORD, connectString: env.DB_CONNECT_STRING,
  });
  const q = async (sql, binds = {}) => (await cn.execute(sql, binds, { maxRows: 0 })).rows;

  // DESA y producción comparten el nombre de servicio BDTEB: se exige el servidor esperado antes de leer nada (igual que la API).
  const esperado = (env.DB_HOST_ESPERADO || 'oradesa').toLowerCase();
  const [{ HOST }] = await q(`SELECT LOWER(SYS_CONTEXT('USERENV','SERVER_HOST')) HOST FROM dual`);
  if (HOST !== esperado) {
    await cn.close();
    throw new Error(`Base inesperada: servidor '${HOST}', se esperaba '${esperado}' (DB_HOST_ESPERADO). No se exporta nada.`);
  }

  for (const owner of OWNERS) {
    // Código fuente (paquetes, funciones, procedimientos, triggers, types)
    const src = await q(
      `SELECT name, type, line, text FROM all_source WHERE owner = :o ORDER BY name, type, line`, { o: owner });
    const files = {};
    for (const r of src) {
      const k = `${r.TYPE.replace(/ /g, '_')}/${r.NAME}`;
      (files[k] = files[k] || []).push(r.TEXT);
    }
    for (const [k, lines] of Object.entries(files)) {
      write(path.join(OUT, 'plsql', owner, `${k}.sql`), 'CREATE OR REPLACE ' + lines.join(''));
    }

    // Vistas
    const views = await q(`SELECT view_name, text FROM all_views WHERE owner = :o`, { o: owner });
    for (const v of views) {
      write(path.join(OUT, 'plsql', owner, 'VIEW', `${v.VIEW_NAME}.sql`),
        `CREATE OR REPLACE VIEW ${owner}.${v.VIEW_NAME} AS\n${v.TEXT}\n/\n`);
    }

    // Catálogo de tablas
    const tabs = await q(
      `SELECT t.table_name, t.num_rows, t.last_analyzed, c.comments
         FROM all_tables t
         LEFT JOIN all_tab_comments c ON c.owner = t.owner AND c.table_name = t.table_name
        WHERE t.owner = :o ORDER BY t.table_name`, { o: owner });
    const cols = await q(
      `SELECT c.table_name, c.column_name, c.data_type, c.data_length, c.data_precision, c.data_scale,
              c.nullable, cc.comments
         FROM all_tab_columns c
         LEFT JOIN all_col_comments cc ON cc.owner = c.owner AND cc.table_name = c.table_name
                                     AND cc.column_name = c.column_name
        WHERE c.owner = :o ORDER BY c.table_name, c.column_id`, { o: owner });
    const pks = await q(
      `SELECT k.table_name, k.constraint_type, k.constraint_name, k.r_constraint_name,
              LISTAGG(cc.column_name, ',') WITHIN GROUP (ORDER BY cc.position) cols
         FROM all_constraints k
         JOIN all_cons_columns cc ON cc.owner = k.owner AND cc.constraint_name = k.constraint_name
        WHERE k.owner = :o AND k.constraint_type IN ('P', 'R', 'U')
        GROUP BY k.table_name, k.constraint_type, k.constraint_name, k.r_constraint_name`, { o: owner });

    const byTable = {};
    for (const t of tabs) {
      byTable[t.TABLE_NAME] = {
        rows: t.NUM_ROWS, analyzed: t.LAST_ANALYZED, comment: t.COMMENTS || undefined,
        columns: [], pk: undefined, fks: [], uks: [],
      };
    }
    for (const c of cols) {
      const t = byTable[c.TABLE_NAME];
      if (!t) continue; // columnas de vistas
      let type = c.DATA_TYPE;
      if (c.DATA_PRECISION != null) type += `(${c.DATA_PRECISION}${c.DATA_SCALE ? ',' + c.DATA_SCALE : ''})`;
      else if (/CHAR/.test(type)) type += `(${c.DATA_LENGTH})`;
      t.columns.push([c.COLUMN_NAME, type, c.NULLABLE === 'N' ? 'NOT NULL' : '', c.COMMENTS || ''].filter(Boolean));
    }
    const pkName = {};
    for (const k of pks) {
      if (k.CONSTRAINT_TYPE === 'P') pkName[k.CONSTRAINT_NAME] = k.TABLE_NAME;
    }
    for (const k of pks) {
      const t = byTable[k.TABLE_NAME];
      if (!t) continue;
      if (k.CONSTRAINT_TYPE === 'P') t.pk = k.COLS;
      else if (k.CONSTRAINT_TYPE === 'U') t.uks.push(k.COLS);
      else t.fks.push(`${k.COLS} -> ${pkName[k.R_CONSTRAINT_NAME] || k.R_CONSTRAINT_NAME}`);
    }
    write(path.join(OUT, 'catalogo', `${owner}.json`), JSON.stringify(byTable, null, 1));
    console.log(`${owner}: ${Object.keys(files).length} fuentes PL/SQL, ${views.length} vistas, ${tabs.length} tablas`);
  }
  await cn.close();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
