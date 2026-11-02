const { Router } = require("express");
const { requireAuth } = require("../../middleware/auth");
const { nivelFormulario } = require("../auth/auth.service");
const contextoSvc = require("../contexto/contexto.service");
const sonda = require("./sonda.service");
const entrada = require("./entrada.service");

const router = Router();
router.use(requireAuth);

// Formularios del GATEC viejo (GAM_MODULOS_FORMS, módulo 6): Pesquisa Análise Pós-Colheita y Análises de Pós-Colheita.
const FORM = { SONDA: [9905, 9903] };

// Exige permiso de consulta sobre alguno de los formularios y carga el contexto empresa/zafra.
const exige = (idForm) => async (req, res, next) => {
  try {
    const niveles = await Promise.all([].concat(idForm).map((f) => nivelFormulario(req.usuario.id, f, req.usuario.master)));
    if (Math.max(...niveles) < 1) return res.status(403).json({ error: "Sin permiso para esta pantalla" });
    const ctx = await contextoSvc.obtener(req.usuario.id);
    if (!ctx) return res.status(409).json({ error: "Seleccione empresa y zafra primero", code: "SIN_CONTEXTO" });
    req.ctx = { idUsuario: req.usuario.id, master: req.usuario.master, empr: ctx.empresa.cod, safra: ctx.safra };
    next();
  } catch (e) { next(e); }
};

const responder = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
};

router.get("/sonda", exige(FORM.SONDA), responder((req) =>
  sonda.buscar({ ...req.ctx, desde: req.query.desde, hasta: req.query.hasta, comprobante: req.query.comprobante, estado: req.query.estado || "todos" })));

router.get("/sonda/:id", exige(FORM.SONDA), responder((req) => sonda.detalle({ ...req.ctx, id: req.params.id })));

// Entrada de caña (balanza): frmPesqEntradaCana no tiene formulario propio registrado; se cuelga del permiso de Pós-Colheita.
router.get("/entrada-cana", exige(FORM.SONDA), responder((req) =>
  entrada.buscar({ ...req.ctx, desde: req.query.desde, hasta: req.query.hasta, comprobante: req.query.comprobante, canero: req.query.canero })));

module.exports = router;
