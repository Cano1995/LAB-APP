// Manejo de errores centralizado de la API.

// Al cliente nunca se le devuelve el mensaje interno (Oracle incluye esquema, tabla y columna): el detalle queda solo en el registro del servidor.
// Los errores con status < 500 (validaciones, JSON malformado) conservan su código y su mensaje.
function manejadorErrores(err, req, res, _next) {
  const status = Number(err.status || err.statusCode) || 500;
  if (status >= 500) {
    console.error('[error]', req.method, req.originalUrl, '-', err.stack || err.message);
    return res.status(500).json({ error: 'Error interno' });
  }
  const mensaje = err.type === 'entity.parse.failed' ? 'JSON inválido'
    : err instanceof URIError ? 'Parámetro malformado'
    : (err.expose !== false && err.message) || 'Solicitud inválida';
  res.status(status).json({ error: mensaje });
}

// Red de seguridad: una promesa rechazada sin capturar no debe tumbar la API (Node la cerraría); se registra y se sigue.
// Una excepción no capturada deja el proceso en estado incierto: se registra y se cierra para que lo reinicie el supervisor.
function instalarRedDeSeguridad() {
  process.on('unhandledRejection', (motivo) => console.error('[unhandledRejection]', motivo instanceof Error ? motivo.stack : motivo));
  process.on('uncaughtException', (e) => { console.error('[uncaughtException]', e.stack || e.message); process.exit(1); });
}

module.exports = { manejadorErrores, instalarRedDeSeguridad };
