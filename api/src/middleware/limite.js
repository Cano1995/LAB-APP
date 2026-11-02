// Límite de pedidos por IP (ventana deslizante en memoria), sin dependencias. Para el login (A5, Sprint 11): frena la fuerza bruta y
// el abuso del bloqueo propio (que cualquiera puede activar con 2 intentos fallidos sobre un usuario conocido).
// En memoria: sirve para un solo proceso de la API (el despliegue actual). Con varios procesos habría que moverlo a la base o a un proxy.
function limitarPorIp({ ventanaMs = 5 * 60 * 1000, max = 20, mensaje = 'Demasiados pedidos; espere unos minutos' } = {}) {
  const golpes = new Map(); // ip → [marcas de tiempo]
  const barrido = setInterval(() => {
    const corte = Date.now() - ventanaMs;
    for (const [ip, marcas] of golpes) {
      const vigentes = marcas.filter((t) => t > corte);
      if (vigentes.length) golpes.set(ip, vigentes); else golpes.delete(ip);
    }
  }, Math.min(ventanaMs, 60 * 1000));
  barrido.unref(); // no impide que el proceso termine

  const middleware = (req, res, next) => {
    const ahora = Date.now();
    const ip = req.ip || req.socket?.remoteAddress || 'desconocida';
    const marcas = (golpes.get(ip) || []).filter((t) => t > ahora - ventanaMs);
    if (marcas.length >= max) {
      const espera = Math.max(1, Math.ceil((marcas[0] + ventanaMs - ahora) / 1000));
      res.set('Retry-After', String(espera));
      return res.status(429).json({ error: mensaje, code: 'DEMASIADOS_PEDIDOS' });
    }
    marcas.push(ahora);
    golpes.set(ip, marcas);
    next();
  };
  middleware.reiniciar = () => golpes.clear();
  middleware.detener = () => clearInterval(barrido);
  return middleware;
}

module.exports = { limitarPorIp };
