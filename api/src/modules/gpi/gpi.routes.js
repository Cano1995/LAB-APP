const { Router } = require("express");
const { requireAuth } = require("../../middleware/auth");
const { nivelFormulario } = require("../auth/auth.service");
const contextoSvc = require("../contexto/contexto.service");
const svc = require("./gpi.service");
const consultas = require("./consultas.service");
const analitica = require("./analitica.service");
const informes = require("./informes.service");
const boletines = require("./boletines.service");
const metas = require("./metas.service");
const digitacion = require("./digitacion.service");
const config = require("../../config");

const acumulados = require("./acumulados.service");
const listados = require("./listados.service");
const router = Router();
router.use(requireAuth);

// Formularios del GATEC viejo que controlan el permiso (GAM_MODULOS_FORMS, módulo 90).
const FORM = { LANCAMENTO: 8420, ANALISES: 8462, VALORES: 8507, SUPERVISORIO: 8524, PANEL: 9234,
  // El GATEC viejo tiene dos generaciones de formularios para estas pantallas; vale el mayor permiso de cualquiera.
  CEP: [8510, 10149], CORRELACION: [9995, 10143],
  INFORMES: [8445, 10050], BOLETINES: [8453], METAS: [9984, 10054, 9990],
  // Listados del menú Informes: frmFilLisVariavel, FrmFilLisDiagnostico (+ frmDiagnostico) y FrmFilLisLancForaEspec (+ frmConsForaEspec).
  LIS_VARIABLES: [8457], LIS_FALTA: [8978, 10078], LIS_FUERA: [10126, 10107],
  LIS_ANOT: [8455], LIS_HIST_VALOR: [8648], LIS_HIST_VAR: [10130], LIS_HIST_ESPEC: [10122] };

// Exige permiso de consulta sobre el formulario y carga el contexto empresa/zafra.
const exige = (idForm) => async (req, res, next) => {
  try {
    const niveles = await Promise.all([].concat(idForm).map((f) => nivelFormulario(req.usuario.id, f, req.usuario.master)));
    const nivel = Math.max(...niveles);
    if (nivel < 1) return res.status(403).json({ error: "Sin permiso para esta pantalla" });
    const ctx = await contextoSvc.obtener(req.usuario.id);
    if (!ctx) return res.status(409).json({ error: "Seleccione empresa y zafra primero", code: "SIN_CONTEXTO" });
    req.nivel = nivel;
    req.ctx = { idUsuario: req.usuario.id, master: req.usuario.master, empr: ctx.empresa.cod, safra: ctx.safra };
    next();
  } catch (e) { next(e); }
};

const planVisible = async (req, res, next) => {
  try {
    const idPlan = Number(req.params.idPlan);
    if (!Number.isInteger(idPlan)) return res.status(400).json({ error: "Planilla inválida" });
    if (!(await svc.puedeVerPlan({ ...req.ctx, idPlan }))) return res.status(403).json({ error: "Planilla no habilitada para su usuario" });
    req.idPlan = idPlan;
    next();
  } catch (e) { next(e); }
};

const responder = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message, ...(e.code ? { code: e.code } : {}), ...(e.conflictos ? { conflictos: e.conflictos } : {}) });
    next(e);
  }
};

// Funciones de ESCRITURA: apagadas por defecto (config.escritura) y solo para quien tiene acceso TOTAL (nivel 3) al formulario.
const exigeEscritura = (clave) => (req, res, next) => {
  if (!config.escritura[clave]) return res.status(403).json({ error: "Esta función de edición está desactivada" });
  if (req.nivel < 3) return res.status(403).json({ error: "Su usuario no tiene permiso para editar esta pantalla" });
  next();
};

// Qué puede hacer el usuario con este día de esta planilla: lo usa la pantalla para mostrar u ocultar «Editar».
async function edicionPara(req, data) {
  if (!config.escritura.gpiDigitacion) return { permitida: false, motivo: "La edición está desactivada" };
  if (req.nivel < 3) return { permitida: false, motivo: "Su usuario tiene acceso de consulta" };
  const d = await digitacion.estadoEdicion({ empr: req.ctx.empr, safra: req.ctx.safra, data });
  return { permitida: d.ok, motivo: d.ok ? null : d.motivo };
}

router.get("/arbol", exige(FORM.LANCAMENTO), responder((req) => svc.arbol(req.ctx)));

router.get("/planilhas/:idPlan/variaveis", exige(FORM.ANALISES), planVisible,
  responder(async (req) => ({ variables: await svc.variables(req.idPlan, req.ctx.empr) })));

router.get("/planilhas/:idPlan/lancamento", exige(FORM.LANCAMENTO), planVisible,
  responder(async (req) => {
    const l = await svc.lancamento({ ...req.ctx, idPlan: req.idPlan, data: req.query.data });
    // ?acum=1 / ?sem=1: columnas «Zafra» y «Semana» del GATEC (solo lectura).
    const extra = await acumulados.columnasExtra({
      gpi: svc, ...req.ctx, variables: l.variables, data: req.query.data, acum: req.query.acum === "1", sem: req.query.sem === "1",
    });
    return { ...l, ...extra, edicion: await edicionPara(req, req.query.data) };
  }));

// Digitación diaria: graba los valores digitados (ver digitacion.service.js). Cada celda trae el valor que el cliente vio (`anterior`).
router.put("/planilhas/:idPlan/lancamento", exige(FORM.LANCAMENTO), planVisible, exigeEscritura("gpiDigitacion"),
  responder((req) => digitacion.grabar({
    ...req.ctx, idPlan: req.idPlan, data: req.body?.data, cambios: req.body?.cambios,
    usuario: { idUsuario: req.usuario.id, usuario: req.usuario.usuario },
  })));

router.get("/planilhas/:idPlan/dias", exige(FORM.LANCAMENTO), planVisible,
  responder(async (req) => ({ dias: await svc.diasConDatos({ ...req.ctx, idPlan: req.idPlan, mes: req.query.mes }) })));

router.get("/safra", exige(FORM.LANCAMENTO),
  responder(async (req) => ({ safra: req.ctx.safra, parametros: await svc.parametrosSafra(req.ctx.empr, req.ctx.safra) })));

// --- Consultas: valores de variables ---------------------------------------------------------------------------
router.get("/variaveis", exige([FORM.VALORES, ...FORM.CEP, ...FORM.CORRELACION]), responder(async (req) => {
  const ctx = req.ctx;
  if (req.query.ids) return { variables: await consultas.metaVariables({ ...ctx, ids: consultas.idsDe(req.query.ids) }) };
  return { variables: await consultas.buscarVariables({ ...ctx, q: req.query.q }) };
}));

router.get("/consultas", exige(FORM.VALORES), responder(async (req) => ({ consultas: await consultas.consultasGuardadas(req.ctx) })));

router.get("/valores", exige(FORM.VALORES), responder((req) =>
  consultas.valores({ ...req.ctx, ids: consultas.idsDe(req.query.ids), desde: req.query.desde, hasta: req.query.hasta, acumulado: req.query.acumulado === "1" })));

// --- Supervisorio -----------------------------------------------------------------------------------------------
router.get("/supervisorios", exige(FORM.SUPERVISORIO), responder(async (req) => ({ supervisorios: await consultas.supervisorios(req.ctx) })));

router.get("/supervisorios/:codigo/serie", exige(FORM.SUPERVISORIO), responder((req) =>
  consultas.serieSupervisorio({ ...req.ctx, codigo: req.params.codigo, desde: req.query.desde, hasta: req.query.hasta })));

// --- Panel de información, CEP y correlación ---------------------------------------------------------------------
router.get("/panel", exige(FORM.PANEL), responder((req) => analitica.panel({ ...req.ctx, fecha: req.query.fecha })));

router.get("/cep", exige(FORM.CEP), responder((req) =>
  analitica.cep({ ...req.ctx, id: req.query.id, hasta: req.query.hasta, muestras: req.query.muestras, tam: req.query.tam, lse: req.query.lse, lie: req.query.lie })));

router.get("/correlacion", exige(FORM.CORRELACION), responder((req) =>
  analitica.correlacion({ ...req.ctx, ids: req.query.ids, desde: req.query.desde, hasta: req.query.hasta })));

// --- Informes configurables --------------------------------------------------------------------------------------
router.get("/informes", exige(FORM.INFORMES), responder(async (req) => ({ informes: await informes.listar(req.ctx) })));
router.get("/informes/:id", exige(FORM.INFORMES), responder((req) =>
  informes.informe({ ...req.ctx, id: req.params.id, desde: req.query.desde, hasta: req.query.hasta })));

// --- Boletines y Real x Metas ------------------------------------------------------------------------------------
router.get("/boletines", exige(FORM.BOLETINES), responder(async (req) => ({ boletines: await boletines.listar(req.ctx) })));
router.get("/boletines/:id", exige(FORM.BOLETINES), responder((req) => boletines.boletin({ ...req.ctx, id: req.params.id, fecha: req.query.fecha })));

router.get("/metas", exige(FORM.METAS), responder((req) => metas.realVsMeta({ ...req.ctx, fecha: req.query.fecha, periodo: req.query.periodo || "diario" })));

// --- Listados del menú Informes (solo lectura) --------------------------------------------------------------------
router.get("/listados/variables", exige(FORM.LIS_VARIABLES), responder((req) =>
  listados.variables({ ...req.ctx, q: req.query.q, plan: req.query.plan, tipo: req.query.tipo, soloActivas: req.query.activas === "1" })));
router.get("/listados/falta-digitacion", exige(FORM.LIS_FALTA), responder((req) => listados.faltaDigitacion({ ...req.ctx, fecha: req.query.fecha })));
router.get("/listados/fuera-especificacion", exige(FORM.LIS_FUERA), responder((req) =>
  listados.fueraEspecificacion({ ...req.ctx, desde: req.query.desde, hasta: req.query.hasta })));
router.get("/listados/anotaciones", exige(FORM.LIS_ANOT), responder((req) =>
  listados.anotaciones({ ...req.ctx, desde: req.query.desde, hasta: req.query.hasta, plan: req.query.plan })));
router.get("/listados/historico-valor", exige(FORM.LIS_HIST_VALOR), responder((req) =>
  listados.historicoValor({ ...req.ctx, id: req.query.id, desde: req.query.desde, hasta: req.query.hasta })));
router.get("/listados/historico-variables", exige(FORM.LIS_HIST_VAR), responder((req) =>
  listados.historicoVariables({ ...req.ctx, id: req.query.id, desde: req.query.desde, hasta: req.query.hasta })));
router.get("/listados/historico-especificacion", exige(FORM.LIS_HIST_ESPEC), responder((req) =>
  listados.historicoEspecificacion({ ...req.ctx, id: req.query.id, desde: req.query.desde, hasta: req.query.hasta })));

module.exports = router;
