const { Router } = require("express");
const { requireAuth } = require("../../middleware/auth");
const { nivelFormulario, nivelesDeUsuario } = require("../auth/auth.service");
const { getRecurso, listarRecursos } = require("./recursos");
const svc = require("./maestras.service");
const contextoSvc = require("../contexto/contexto.service");
const { limite, escalar } = require("../../lib/validar");

const router = Router();
router.use(requireAuth);

// Carga el recurso por nombre y el nivel de permiso del usuario sobre su formulario.
async function cargarRecurso(req, res, next) {
  try {
    const recurso = getRecurso(req.params.recurso);
    if (!recurso) return res.status(404).json({ error: "Recurso no encontrado" });
    req.recurso = recurso;
    req.nivel = await nivelFormulario(req.usuario.id, recurso.idForm, req.usuario.master);
    if (req.nivel < 1) return res.status(403).json({ error: "Sin permiso para esta tabla" });
    if (recurso.scoped) {
      req.contexto = await contextoSvc.obtener(req.usuario.id);
      if (!req.contexto) return res.status(409).json({ error: "Seleccione empresa y zafra primero", code: "SIN_CONTEXTO" });
    }
    next();
  } catch (e) { next(e); }
}

const exigeNivel = (min) => (req, res, next) => {
  if (req.recurso.soloLectura) return res.status(403).json({ error: "Esta pantalla es de solo consulta" });
  return req.nivel >= min ? next() : res.status(403).json({ error: "Permiso insuficiente para esta acción" });
};

// La PK puede ser compuesta: en la URL viene separada por "~".
// Una codificación malformada (%E0%A4%A) es un error del cliente (400), no del servidor.
const idParts = (req) => {
  try { return decodeURIComponent(req.params.id).split("~"); } catch { throw Object.assign(new Error("Identificador malformado"), { status: 400 }); }
};

// Lista los recursos disponibles para el usuario (según permisos).
router.get("/", async (req, res, next) => {
  try {
    const todos = listarRecursos();
    // Una sola consulta de permisos (antes eran ~70, una por recurso: 1,6 s).
    const niveles = req.usuario.master ? null : await nivelesDeUsuario(req.usuario.id);
    const conNivel = todos.map((r) => ({ ...r, nivel: niveles ? (niveles.get(r.idForm) ?? 0) : 3 }));
    res.json({ recursos: conNivel.filter((r) => r.nivel >= 1) });
  } catch (e) { next(e); }
});

router.get("/:recurso", cargarRecurso, async (req, res, next) => {
  try {
    const q = escalar(req.query.q, "q");
    const tope = limite(req.query.limit, { defecto: svc.LIMITE_MAESTRAS, max: svc.LIMITE_MAESTRAS });
    const filas = await svc.listar(req.recurso, { q, limit: tope, context: req.contexto });
    res.json({
      recurso: { nombre: req.params.recurso, titulo: req.recurso.titulo, columnas: req.recurso.columnas, nivel: req.recurso.soloLectura ? Math.min(req.nivel, 1) : req.nivel, scoped: req.recurso.scoped, soloLectura: req.recurso.soloLectura },
      filas,
      // Si se alcanzó el tope puede haber más filas: antes el corte era silencioso.
      truncado: filas.length >= tope,
    });
  } catch (e) { next(e); }
});

router.get("/:recurso/:id", cargarRecurso, async (req, res, next) => {
  try {
    const reg = await svc.obtener(req.recurso, idParts(req), req.contexto);
    if (!reg) return res.status(404).json({ error: "No encontrado" });
    res.json({ registro: reg });
  } catch (e) { next(e); }
});

router.post("/:recurso", cargarRecurso, exigeNivel(2), async (req, res, next) => {
  try {
    const r = await svc.crear(req.recurso, req.body || {}, req.contexto);
    if (r.error) return res.status(400).json({ error: r.error });
    res.status(201).json(r);
  } catch (e) { next(e); }
});

router.put("/:recurso/:id", cargarRecurso, exigeNivel(2), async (req, res, next) => {
  try {
    const r = await svc.actualizar(req.recurso, idParts(req), req.body || {}, req.contexto);
    if (r.notFound) return res.status(404).json({ error: r.error });
    if (r.error) return res.status(400).json({ error: r.error });
    res.json(r);
  } catch (e) { next(e); }
});

router.delete("/:recurso/:id", cargarRecurso, exigeNivel(3), async (req, res, next) => {
  try {
    const r = await svc.eliminar(req.recurso, idParts(req), req.contexto);
    if (r.notFound) return res.status(404).json({ error: r.error });
    if (r.error) return res.status(400).json({ error: r.error });
    res.json(r);
  } catch (e) { next(e); }
});

module.exports = router;
