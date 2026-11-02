const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');
const { nivelFormulario } = require('../auth/auth.service');
const contextoSvc = require('../contexto/contexto.service');
const entrada = require('../lab/entrada.service');
const sonda = require('../lab/sonda.service');

const router = Router();
router.use(requireAuth);

// Mismo permiso que la pantalla de Entrada de caña y la de Sonda (Pós-Colheita).
const FORM_LAB = [9905, 9903];

// Una sección que falla no tumba el tablero: queda en null y la pantalla muestra «no disponible».
const seccion = async (fn) => {
  try { return await fn(); } catch (e) { console.error('[inicio]', e.message); return null; }
};

// Datos del tablero de Inicio (solo consulta). Solo se incluyen las secciones a las que el usuario tiene acceso.
router.get('/', async (req, res, next) => {
  try {
    const ctx = await contextoSvc.obtener(req.usuario.id);
    if (!ctx) return res.status(409).json({ error: 'Seleccione empresa y zafra primero', code: 'SIN_CONTEXTO' });
    const niveles = await Promise.all(FORM_LAB.map((f) => nivelFormulario(req.usuario.id, f, req.usuario.master)));
    const lab = Math.max(...niveles) >= 1;
    const c = { empr: ctx.empresa.cod, safra: ctx.safra };

    const [balanza, analisis] = lab
      ? await Promise.all([
        seccion(() => entrada.serieDiaria(c)),
        seccion(async () => {
          const r = await sonda.buscar(c);
          return { fecha: r.hasta, ...r.resumen };
        }),
      ])
      : [undefined, undefined];
    res.json({ lab, balanza, analisis });
  } catch (e) { next(e); }
});

module.exports = router;
