// Cabeceras de seguridad y CORS con lista blanca (A16, Sprint 11), sin dependencias.
const cors = require('cors');

// Cabeceras defensivas para una API JSON: sin sniffing de tipo, sin marcos, sin referer y sin caché (hay datos por usuario).
function cabecerasSeguras(_req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
    'Cross-Origin-Resource-Policy': 'same-origin',
  });
  next();
}

// Solo los orígenes de la lista pueden llamar a la API desde un navegador (el front por proxy es del mismo origen y no lo necesita).
function corsConLista(origenes) {
  const permitidos = new Set(origenes);
  return cors({
    origin: (origin, cb) => cb(null, !origin || permitidos.has(origin)), // sin Origin: herramientas del servidor, mismo origen
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });
}

module.exports = { cabecerasSeguras, corsConLista };
