// Arma la aplicación Express sin abrir puertos ni conectarse a la base: server.js la arranca y las pruebas la usan con dobles.
const express = require('express');
const config = require('./config');
const authRoutes = require('./modules/auth/auth.routes');
const maestrasRoutes = require('./modules/maestras/maestras.routes');
const contextoRoutes = require('./modules/contexto/contexto.routes');
const menuRoutes = require('./modules/menu/menu.routes');
const inicioRoutes = require('./modules/inicio/inicio.routes');
const notificacionesRoutes = require('./modules/notificaciones/notificaciones.routes');
const gpiRoutes = require('./modules/gpi/gpi.routes');
const labRoutes = require('./modules/lab/lab.routes');
const brandingRoutes = require('./modules/configuracion/branding.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const { manejadorErrores } = require('./middleware/errores');
const { cabecerasSeguras, corsConLista } = require('./middleware/seguridad');
const { registroPedidos } = require('./middleware/registro');
const { servirFront } = require('./middleware/estaticos');

/**
 * @param {object} [opc]
 * @param {() => Promise<void>} [opc.listo]  comprobación de dependencias para /api/ready (lanza si la base no responde)
 * @param {string|null} [opc.dirFront]       carpeta del front compilado; si no existe no se sirve nada
 * @param {(linea: string) => void} [opc.escribirRegistro]
 */
function crearApp({ listo, dirFront = config.dirFront, escribirRegistro } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(registroPedidos(escribirRegistro));
  app.use('/api', cabecerasSeguras, corsConLista(config.corsOrigenes));
  // Las imágenes de marca llegan en base64 (hasta 1 MB → ~1,4 MB): solo esa ruta admite un cuerpo mayor; el parser global la saltea al estar ya leída.
  app.use('/api/admin/configuracion/assets', express.json({ limit: '2mb' }));
  app.use(express.json({ limit: '100kb' }));

  // /api/health = el proceso vive. /api/ready = además puede atender (la base responde): lo que debe mirar un balanceador o un supervisor.
  app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
  app.get('/api/ready', async (_req, res) => {
    try {
      if (listo) await listo();
      res.json({ ok: true });
    } catch {
      res.status(503).json({ ok: false, error: 'Base de datos no disponible' });
    }
  });
  app.use('/api/branding', brandingRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/maestras', maestrasRoutes);
  app.use('/api/contexto', contextoRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/inicio', inicioRoutes);
  app.use('/api/notificaciones', notificacionesRoutes);
  app.use('/api/gpi', gpiRoutes);
  app.use('/api/lab', labRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta inexistente' }));

  if (dirFront) servirFront(app, dirFront);
  app.use(manejadorErrores);
  return app;
}

module.exports = { crearApp };
