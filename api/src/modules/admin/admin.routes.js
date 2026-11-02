const { Router } = require("express");
const { requireAuth } = require("../../middleware/auth");
const { nivelFormulario } = require("../auth/auth.service");
const svc = require("./admin.service");
const cfg = require("../configuracion/configuracion.service");

// Administración en solo consulta. Los formularios de GAtec_Senha no están registrados en GAM_MODULOS_FORMS (el VB6 solo deja entrar a administradores),
// así que se exige ser administrador (USE_MASTER) o tener acceso TOTAL a «Controle de Accesos» (form 9680, módulo 307).
const FORM_ACCESOS = 9680;

const exigeAdmin = async (req, res, next) => {
  try {
    const nivel = await nivelFormulario(req.usuario.id, FORM_ACCESOS, req.usuario.master);
    if (nivel < 3) return res.status(403).json({ error: "Solo administradores pueden ver esta pantalla" });
    next();
  } catch (e) { next(e); }
};

const responder = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
};

const router = Router();
router.use(requireAuth, exigeAdmin);

router.get("/usuarios", responder((req) => svc.usuarios({ q: req.query.q, estado: req.query.estado || "todos" })));
router.get("/usuarios/:id", responder((req) => svc.usuario({ id: req.params.id })));
router.get("/grupos", responder(() => svc.grupos()));
router.get("/grupos/:id", responder((req) => svc.grupo({ id: req.params.id })));
router.get("/pantallas", responder((req) => svc.pantallas({ q: req.query.q })));
router.get("/pantallas/:id/permisos", responder((req) => svc.permisosPantalla({ idForm: req.params.id })));
// Configuración de marca (única parte de esta pantalla que escribe; queda en LAB_APP_AUDIT). Las imágenes viajan en base64 dentro del JSON.
const quien = (req) => ({ idUsuario: req.usuario.id, usuario: req.usuario.usuario });
router.get("/configuracion", responder(() => cfg.detalle()));
router.put("/configuracion", responder((req) => cfg.guardarTextos(quien(req), req.body)));
router.put("/configuracion/assets/:clave", responder((req) => cfg.guardarAsset(quien(req), req.params.clave, req.body || {})));
router.delete("/configuracion/assets/:clave", responder((req) => cfg.quitarAsset(quien(req), req.params.clave)));
router.get("/conexiones", responder((req) => svc.conexiones({ desde: req.query.desde, hasta: req.query.hasta, usuario: req.query.usuario })));

module.exports = router;
