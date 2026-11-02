// Sirve el front compilado (web/dist) desde la misma API: un solo proceso y un solo origen (sin CORS ni proxy).
// Los archivos con hash en el nombre (assets/) se guardan en caché un año; index.html nunca, para que un despliegue nuevo se vea de inmediato.
const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

// Política de contenido del front: solo código propio. Los estilos en línea los usa React (atributo style) y los gráficos SVG.
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'";

function servirFront(app, dir) {
  const indice = path.join(dir, 'index.html');
  if (!fs.existsSync(indice)) return false;
  const cabecerasHtml = (res) => {
    res.set({
      'Cache-Control': 'no-cache',
      'Content-Security-Policy': CSP,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
    });
  };
  app.use(express.static(dir, {
    index: false,
    setHeaders: (res, archivo) => {
      if (/[\\/]assets[\\/]/.test(archivo)) res.set('Cache-Control', 'public, max-age=31536000, immutable');
      else if (archivo.endsWith('.html')) cabecerasHtml(res);
    },
  }));
  // Las rutas del front (/gpi/valores, etc.) se resuelven en el navegador: cualquier GET que no sea /api devuelve index.html.
  app.get(/^\/(?!api(\/|$)).*/, (_req, res) => { cabecerasHtml(res); res.sendFile(indice); });
  return true;
}

module.exports = { servirFront };
