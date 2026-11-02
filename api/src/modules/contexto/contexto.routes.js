const { Router } = require("express");
const { requireAuth } = require("../../middleware/auth");
const svc = require("./contexto.service");

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try { res.json({ contexto: await svc.obtener(req.usuario.id) }); } catch (e) { next(e); }
});

router.get("/opciones", async (_req, res, next) => {
  try { res.json({ empresas: await svc.opciones() }); } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const { codEmpr, safra } = req.body || {};
    if (codEmpr == null || safra == null) return res.status(400).json({ error: "Faltan empresa/zafra" });
    const r = await svc.seleccionar(req.usuario.id, Number(codEmpr), Number(safra));
    if (r.error) return res.status(400).json({ error: r.error });
    res.json(r);
  } catch (e) { next(e); }
});

module.exports = router;
