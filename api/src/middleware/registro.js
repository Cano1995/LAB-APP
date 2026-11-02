// Registro de pedidos en JSON, una línea por pedido, listo para journald, pm2 o cualquier recolector.
// Solo guarda lo necesario para diagnosticar: método, ruta SIN la cadena de consulta, estado, duración y usuario. Nunca el cuerpo ni la cabecera Authorization.
const SIN_REGISTRO = new Set(['/api/health']);

function registroPedidos(escribir = (linea) => process.stdout.write(linea + '\n')) {
  return (req, res, next) => {
    const t0 = process.hrtime.bigint();
    res.on('finish', () => {
      const ruta = req.originalUrl.split('?')[0];
      if (SIN_REGISTRO.has(ruta)) return;
      escribir(JSON.stringify({
        t: new Date().toISOString(),
        nivel: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'aviso' : 'info',
        metodo: req.method,
        ruta,
        estado: res.statusCode,
        ms: Math.round(Number(process.hrtime.bigint() - t0) / 1e6),
        usuario: req.usuario?.id ?? null,
      }));
    });
    next();
  };
}

module.exports = { registroPedidos };
