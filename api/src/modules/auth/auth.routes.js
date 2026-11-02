const { Router } = require('express');
const svc = require('./auth.service');
const { requireAuth } = require('../../middleware/auth');
const { limitarPorIp } = require('../../middleware/limite');

const router = Router();

// Usuario = login del GATEC (GAM_USUARIOS); contraseña = la de su usuario de Oracle (ver auth.service).
const HTTP = { ESPERA: 429, NO_DISPONIBLE: 503 };

// 20 pedidos de login cada 5 minutos por IP: frena la fuerza bruta y el abuso del bloqueo propio (A5).
router.post('/login', limitarPorIp({ ventanaMs: 5 * 60 * 1000, max: 20, mensaje: 'Demasiados intentos de ingreso desde este equipo; espere unos minutos' }), async (req, res, next) => {
  try {
    const { usuario, senha } = req.body || {};
    if (!usuario) return res.status(400).json({ error: 'Falta el usuario' });
    const r = await svc.login(usuario, senha || '');
    if (!r.ok) return res.status(HTTP[r.code] || 401).json({ code: r.code, error: r.msg });
    res.json({ token: r.token, perfil: r.perfil });
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const u = await svc.buscarUsuarioPorId(req.usuario.id);
    res.json({ perfil: await svc.perfilCompleto(u) });
  } catch (e) { next(e); }
});

module.exports = router;
