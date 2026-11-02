const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');
const svc = require('./menu.service');

const router = Router();
router.use(requireAuth);

// Menú principal del GATEC (carpetas, programas y favoritos) en solo consulta.
router.get('/', async (req, res, next) => {
  try { res.json(await svc.obtener(req.usuario)); } catch (e) { next(e); }
});

module.exports = router;
