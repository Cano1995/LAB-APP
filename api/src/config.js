require('dotenv').config();

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name} (ver .env.example)`);
  return v;
}

// El secreto firma los tokens: uno corto o el valor de ejemplo permitiría forjar sesiones de cualquier usuario (A6).
function secretoJwt() {
  const v = required('JWT_SECRET');
  if (v.length < 32 || /cambiar-esto/i.test(v)) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres y no puede ser el valor de ejemplo del .env.example (generar uno aleatorio: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))")');
  }
  return v;
}

// Orígenes del navegador que pueden llamar a la API (CORS). El front en desarrollo usa el proxy de Vite (mismo origen) y no lo necesita.
const corsOrigenes = (process.env.CORS_ORIGIN || 'http://localhost:3100,http://127.0.0.1:3100').split(',').map((s) => s.trim()).filter(Boolean);

// Carpeta del front compilado (web/dist). Si existe, la API lo sirve y no hace falta otro servidor web; con FRONT_DIR vacío no se sirve.
const dirFront = process.env.FRONT_DIR === undefined ? require('path').join(__dirname, '..', '..', 'web', 'dist') : process.env.FRONT_DIR;

// INTERRUPTORES DE ESCRITURA (Sprint 18). Cada función que graba en las tablas del GATEC está APAGADA por defecto y se enciende con su variable de entorno
// (=1). Además solo funciona contra la base esperada (DESA) salvo que se declare ESCRITURA_EN_PRODUCCION=1, una decisión explícita que hoy nadie tomó.
const enDesa = (process.env.DB_HOST_ESPERADO || 'oradesa').toLowerCase() === 'oradesa';
const escrituraEnProduccion = process.env.ESCRITURA_EN_PRODUCCION === '1';
const interruptor = (nombre) => process.env[nombre] === '1' && (enDesa || escrituraEnProduccion);
const escritura = {
  gpiDigitacion: interruptor('ESCRITURA_GPI_DIGITACION'),
  enProduccion: escrituraEnProduccion,
};

module.exports = {
  escritura,
  corsOrigenes,
  dirFront: dirFront || null,
  port: Number(process.env.PORT) || 3101,
  db: {
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    connectString: required('DB_CONNECT_STRING'),
    libDir: process.env.ORACLE_CLIENT_LIB_DIR || undefined,
    // Servidor de base esperado (SYS_CONTEXT SERVER_HOST). Producción y DESA comparten el nombre
    // de servicio BDTEB, así que se verifica el host al arrancar: si no coincide, la API no inicia.
    hostEsperado: (process.env.DB_HOST_ESPERADO || 'oradesa').toLowerCase(),
  },
  appSchema: (process.env.APP_SCHEMA || process.env.DB_USER).toUpperCase(),
  gatecSchema: (process.env.GATEC_SCHEMA || 'GATEC_AGR').toUpperCase(),
  jwt: {
    secret: secretoJwt(),
    expiresIn: process.env.JWT_EXPIRES || '8h',
  },
};
