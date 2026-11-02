// Marca pública: el login y el título de la pestaña la necesitan antes de que haya sesión. Solo lectura y sin datos sensibles.
const { Router } = require('express');
const svc = require('./configuracion.service');

const router = Router();

router.get('/', async (_req, res, next) => {
  try { res.set('Cache-Control', 'no-cache').json(await svc.marca()); } catch (e) { next(e); }
});

router.get('/asset/:clave', async (req, res, next) => {
  try {
    const a = await svc.leerAsset(req.params.clave);
    if (!a) return res.status(404).json({ error: 'Imagen no configurada' });
    // La URL lleva ?v=<fecha de carga>: al cambiar la imagen cambia la URL, así que se puede cachear fuerte.
    // CSP restrictiva: si alguien abre un SVG directo, no ejecuta nada.
    res.set({
      'Content-Type': a.mime,
      'Cache-Control': 'public, max-age=86400',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'Cross-Origin-Resource-Policy': 'same-origin',
    }).send(a.datos);
  } catch (e) { next(e); }
});

module.exports = router;
