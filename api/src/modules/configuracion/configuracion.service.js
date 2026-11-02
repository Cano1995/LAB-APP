// Configuración de marca de la instalación (nombre de la empresa, lema, logos e iconos). Vive en la base, en las tablas propias
// LAB_APP_CONFIG (clave/valor) y LAB_APP_ASSET (imágenes). Sin filas, la app usa los valores por defecto: se puede desplegar sin configurar nada.
const { oracledb, query, queryOne, transaccion } = require('../../db');
const config = require('../../config');
const { error } = require('../../lib/util');
const auditoria = require('../../lib/auditoria');

const A = config.appSchema;

// Campos de texto editables. `max` = largo máximo; `defecto` = valor si no hay fila (se puede fijar por variable de entorno APP_*).
const CAMPOS = {
  nombre: { max: 80, defecto: process.env.APP_NOMBRE || 'Lab App', obligatorio: true },
  nombre_corto: { max: 30, defecto: process.env.APP_NOMBRE_CORTO || 'Lab App', obligatorio: true },
  empresa: { max: 120, defecto: process.env.APP_EMPRESA || '' },
  lema: { max: 160, defecto: process.env.APP_LEMA || '' },
  descripcion: { max: 400, defecto: process.env.APP_DESCRIPCION || '' },
  pais: { max: 60, defecto: process.env.APP_PAIS || '' },
};

// Imágenes editables. `mimes` = tipos aceptados; `max` = bytes.
const MIMES_IMG = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const ASSETS = {
  logo_claro: { titulo: 'Logo (tema claro)', mimes: MIMES_IMG, max: 1_000_000 },
  logo_oscuro: { titulo: 'Logo (tema oscuro)', mimes: MIMES_IMG, max: 1_000_000 },
  emblema: { titulo: 'Emblema / icono del menú', mimes: MIMES_IMG, max: 500_000 },
  favicon: { titulo: 'Favicon (pestaña del navegador)', mimes: [...MIMES_IMG, 'image/x-icon', 'image/vnd.microsoft.icon'], max: 200_000 },
};

const NOMBRE_FORMATO = { 'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WEBP', 'image/svg+xml': 'SVG', 'image/x-icon': 'ICO', 'image/vnd.microsoft.icon': 'ICO' };

// Firma de los primeros bytes: el tipo declarado por el cliente no se confía.
function coincideFirma(mime, b) {
  switch (mime) {
    case 'image/png': return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/jpeg': return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case 'image/webp': return b.length > 12 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP';
    case 'image/x-icon':
    case 'image/vnd.microsoft.icon': return b.length > 4 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0;
    case 'image/svg+xml': {
      const t = b.toString('utf8');
      // Un SVG puede llevar scripts: se rechaza todo lo activo (además se sirve con una CSP restrictiva, ver branding.routes).
      return /<svg[\s>]/i.test(t) && !/<script|<foreignObject|\son[a-z]+\s*=|javascript:|<!ENTITY|<iframe|<embed|<object/i.test(t);
    }
    default: return false;
  }
}

async function leerTextos() {
  const r = await query(`SELECT CLAVE, VALOR FROM ${A}.LAB_APP_CONFIG`);
  const guardado = Object.fromEntries(r.rows.map((x) => [x.CLAVE, x.VALOR]));
  return Object.fromEntries(Object.entries(CAMPOS).map(([k, c]) => [k, guardado[k] ?? c.defecto]));
}

async function leerAssets() {
  const r = await query(`SELECT CLAVE, MIME, NOMBRE, TAMANO, TO_CHAR(ACTUALIZ, 'YYYYMMDDHH24MISS') V FROM ${A}.LAB_APP_ASSET`);
  return Object.fromEntries(r.rows.map((x) => [x.CLAVE, { mime: x.MIME, nombre: x.NOMBRE, tamano: x.TAMANO, url: `/api/branding/asset/${x.CLAVE}?v=${x.V}` }]));
}

/** Marca pública (la usa el login, antes de autenticarse): textos + URL de cada imagen cargada (null = usar la de fábrica). */
async function marca() {
  const [textos, assets] = await Promise.all([leerTextos(), leerAssets()]);
  return { ...textos, imagenes: Object.fromEntries(Object.keys(ASSETS).map((k) => [k, assets[k]?.url ?? null])) };
}

/** Lo mismo con el detalle que necesita la pantalla de configuración (títulos, tamaños, límites). */
async function detalle() {
  const [textos, assets] = await Promise.all([leerTextos(), leerAssets()]);
  return {
    textos,
    campos: Object.fromEntries(Object.entries(CAMPOS).map(([k, c]) => [k, { max: c.max, obligatorio: !!c.obligatorio }])),
    imagenes: Object.entries(ASSETS).map(([clave, a]) => ({ clave, titulo: a.titulo, mimes: a.mimes, max: a.max, actual: assets[clave] ?? null })),
  };
}

async function guardarTextos(quien, datos) {
  if (!datos || typeof datos !== "object") throw error("Datos inválidos");
  // Se valida todo antes de tocar la base.
  const limpios = {};
  for (const [k, v] of Object.entries(datos)) {
    const c = CAMPOS[k];
    if (!c) throw error(`Campo desconocido: ${k}`);
    if (typeof v !== "string") throw error(`${k} debe ser texto`);
    const t = v.trim();
    if (c.obligatorio && !t) throw error(`${k.replace("_", " ")} es obligatorio`);
    if (t.length > c.max) throw error(`${k.replace("_", " ")} admite hasta ${c.max} caracteres`);
    limpios[k] = t;
  }
  const antes = await leerTextos();
  const filas = Object.entries(limpios).filter(([k, t]) => t !== antes[k]).map(([k, t]) => ({ k, t, antes: antes[k] }));
  if (!filas.length) return { ok: true, cambios: 0 };
  await transaccion(async (cn) => {
    for (const f of filas) {
      await cn.execute(
        `MERGE INTO ${A}.LAB_APP_CONFIG c USING (SELECT :k CLAVE FROM dual) s ON (c.CLAVE = s.CLAVE)
         WHEN MATCHED THEN UPDATE SET c.VALOR = :v, c.ACTUALIZ = SYSDATE, c.ID_USUARIO = :u
         WHEN NOT MATCHED THEN INSERT (CLAVE, VALOR, ACTUALIZ, ID_USUARIO) VALUES (:k, :v, SYSDATE, :u)`,
        { k: f.k, v: f.t, u: quien.idUsuario },
      );
    }
    await auditoria.registrar(cn, quien, filas.map((f) => ({ accion: "config", tabla: "LAB_APP_CONFIG", clave: f.k, antes: f.antes, despues: f.t })), "configuración de marca");
  });
  return { ok: true, cambios: filas.length };
}

async function guardarAsset(quien, clave, { mime, nombre, datos }) {
  const def = ASSETS[clave];
  if (!def) throw error('Imagen desconocida', 404);
  if (!def.mimes.includes(mime)) throw error(`Formato no admitido (use ${[...new Set(def.mimes.map((m) => NOMBRE_FORMATO[m]))].join(', ')})`);
  if (typeof datos !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(datos)) throw error('Archivo inválido');
  const buf = Buffer.from(datos, 'base64');
  if (!buf.length) throw error('Archivo vacío');
  if (buf.length > def.max) throw error(`La imagen supera el máximo de ${Math.round(def.max / 1000)} KB`);
  if (!coincideFirma(mime, buf)) throw error('El contenido no corresponde al formato indicado (o el SVG contiene elementos no permitidos)');
  const nom = String(nombre || clave).replace(/[^\w.\- ]/g, '_').slice(0, 120);
  await transaccion(async (cn) => {
    await cn.execute(
      `MERGE INTO ${A}.LAB_APP_ASSET a USING (SELECT :k CLAVE FROM dual) s ON (a.CLAVE = s.CLAVE)
       WHEN MATCHED THEN UPDATE SET a.MIME = :m, a.NOMBRE = :n, a.DATOS = :d, a.TAMANO = :t, a.ACTUALIZ = SYSDATE, a.ID_USUARIO = :u
       WHEN NOT MATCHED THEN INSERT (CLAVE, MIME, NOMBRE, DATOS, TAMANO, ACTUALIZ, ID_USUARIO) VALUES (:k, :m, :n, :d, :t, SYSDATE, :u)`,
      { k: clave, m: mime, n: nom, d: { type: oracledb.BUFFER, val: buf }, t: buf.length, u: quien.idUsuario },
    );
    await auditoria.registrar(cn, quien, [{ accion: 'config', tabla: 'LAB_APP_ASSET', clave, despues: `${nom} (${buf.length} bytes)` }], 'configuración de marca');
  });
  return { ok: true };
}

async function quitarAsset(quien, clave) {
  if (!ASSETS[clave]) throw error('Imagen desconocida', 404);
  await transaccion(async (cn) => {
    const r = await cn.execute(`DELETE FROM ${A}.LAB_APP_ASSET WHERE CLAVE = :k`, { k: clave });
    if (r.rowsAffected) await auditoria.registrar(cn, quien, [{ accion: 'config', tabla: 'LAB_APP_ASSET', clave, despues: '(quitada)' }], 'configuración de marca');
  });
  return { ok: true };
}

/** Contenido de una imagen para servirla; null si no hay. */
async function leerAsset(clave) {
  if (!ASSETS[clave]) return null;
  const r = await queryOne(`SELECT MIME, DATOS FROM ${A}.LAB_APP_ASSET WHERE CLAVE = :k`, { k: clave }, { fetchInfo: { DATOS: { type: oracledb.BUFFER } } });
  return r ? { mime: r.MIME, datos: r.DATOS } : null;
}

module.exports = { marca, detalle, guardarTextos, guardarAsset, quitarAsset, leerAsset, CAMPOS, ASSETS, coincideFirma };
