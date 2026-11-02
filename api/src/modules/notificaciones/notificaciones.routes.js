const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');
const svc = require('./notificaciones.service');

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try { res.json(await svc.listar(req.usuario.id)); } catch (e) { next(e); }
});

router.post('/leidas', async (req, res, next) => {
  try { res.json({ ok: true, marcadas: await svc.marcarLeidas(req.usuario.id) }); } catch (e) { next(e); }
});

router.post('/:id/leida', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });
    res.json({ ok: true, marcadas: await svc.marcarLeidas(req.usuario.id, id) });
  } catch (e) { next(e); }
});

module.exports = router;
