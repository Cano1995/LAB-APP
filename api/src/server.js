const path = require('node:path');
const config = require('./config');
const { initPool, closePool, query } = require('./db');
const { bootstrap } = require('./lib/bootstrap');
const { initRecursos } = require('./modules/maestras/recursos');
const { instalarRedDeSeguridad } = require('./middleware/errores');
const { crearApp } = require('./app');

const app = crearApp({ listo: async () => { await query('SELECT 1 FROM DUAL'); } });
instalarRedDeSeguridad();

async function start() {
  const servidor = await initPool(); // verifica que sea el servidor esperado (ver db.js)
  console.log(`[db] pool conectado a ${config.db.connectString} (servidor ${servidor}) como ${config.db.user}`);
  await bootstrap();
  await initRecursos();
  const server = app.listen(config.port, () => {
    console.log(`[api] escuchando en http://localhost:${config.port}`);
    if (config.dirFront) console.log(`[api] el front compilado se sirve desde ${path.resolve(config.dirFront)} (si existe)`);
  });

  // Cierre ordenado: deja de aceptar pedidos, espera a los que están en curso (hasta 10 s) y cierra el pool.
  let cerrando = false;
  const shutdown = () => {
    if (cerrando) return;
    cerrando = true;
    console.log('\n[api] cerrando...');
    setTimeout(() => process.exit(1), 10_000).unref();
    server.close(async () => { await closePool(); process.exit(0); });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((e) => { console.error('No se pudo iniciar la API:', e.message); process.exit(1); });

module.exports = app;
