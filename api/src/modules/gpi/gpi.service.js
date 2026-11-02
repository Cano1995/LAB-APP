// GPI (módulo 90) — lectura del árbol de análisis, variables y lançamento diário.
// Esquema GATEC_GPI_NEW (el que usa GATEC_GPI.exe, sección [LOGINLAB] del GAtec.ini).
//
// Modelo (ver docs/analisis/gpi-modelo.md):
//   GI_LAB_NO_PLAN_{e}        árbol de análisis; cada nodo es una planilla (ID_PLAN), padre en ID_NO_ANT.
//   GI_LAB_VAR                variables de cada planilla (fórmula en VAR_FORMULA).
//   GI_LAB_PLAN_CONF_{e}      configuración de columnas (horas o bateladas); PLAN_CONF_GERAL la reemplaza.
//   GI_LAB_LANC_{e}_{s}       cabecera de un día de una planilla (ID_LANC).
//   GI_LAB_LANC_MOV_{e}_{s}   valores: (ID_VAR, MOV_COLUNA, ID_LANC) → MOV_VALOR (texto). Columna 99 = resultado del día.
// {e} = empresa, {s} = zafra del GPI (GI_LAB_PARAM_USINA), igual que el VB6.
const { query, queryOne } = require("../../db");

const S = "GATEC_GPI_NEW";
const COLUNA_DIA = 99;

const { fechaReal } = require("../../lib/validar");

const entero = (v, nombre) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw Object.assign(new Error(`${nombre} inválido`), { status: 400 });
  return n;
};

// Las tablas por empresa/zafra se nombran dinámicamente: se validan contra el catálogo
// antes de interpolarlas (nunca se arma SQL con un nombre no verificado).
// Una tabla que existe se recuerda siempre; una que NO existe, solo 60 s (DESA se recarga a diario y puede aparecer después).
const _existe = new Map(); // nombre → { ok, hasta }
const VIGENCIA_NEGATIVA_MS = 60 * 1000;
async function tabla(base, empr, safra) {
  const nombre = `GI_LAB_${base}_${entero(empr, "Empresa")}${safra == null ? "" : `_${entero(safra, "Zafra")}`}`;
  const previo = _existe.get(nombre);
  if (!previo || (!previo.ok && previo.hasta < Date.now())) {
    const r = await queryOne(`SELECT 1 OK FROM all_tables WHERE owner = :o AND table_name = :t`, { o: S, t: nombre });
    _existe.set(nombre, { ok: !!r, hasta: Date.now() + VIGENCIA_NEGATIVA_MS });
  }
  return _existe.get(nombre).ok ? `${S}.${nombre}` : null;
}

// Zafra del GPI (puede diferir de la agrícola) y su último cierre.
async function parametrosSafra(empr, safra) {
  return queryOne(
    `SELECT TO_CHAR(PAR_DT_INICIO, 'YYYY-MM-DD') INICIO, TO_CHAR(PAR_DT_FIM, 'YYYY-MM-DD') FIM,
            TO_CHAR(PAR_DT_FECHA, 'YYYY-MM-DD') DIA_ACTUAL, TO_CHAR(PAR_DT_FECHA_REAL, 'YYYY-MM-DD') FECHA_REAL, PAR_SAFRA_ENCER ENCERRADA
       FROM ${S}.GI_LAB_PARAM_USINA WHERE COD_EMPR = :e AND SAF_ANO_SAFRA = :s`,
    { e: empr, s: safra },
  );
}

// Planillas habilitadas para el usuario (GI_LAB_ACESSOS_{e}). El master ve todas.
async function planesHabilitados(idUsuario, empr, master) {
  if (master) return null; // sin restricción
  const t = await tabla("ACESSOS", empr);
  if (!t) return new Set();
  const r = await query(`SELECT ID_PLAN FROM ${t} WHERE ID_USUARIO = :u AND USU_HABILITADO = 'S'`, { u: idUsuario }, { maxRows: 100000 });
  return new Set(r.rows.map((x) => x.ID_PLAN));
}

async function arbol({ idUsuario, master, empr }) {
  const t = await tabla("NO_PLAN", empr);
  if (!t) return { nodos: [] };
  const r = await query(
    `SELECT n.ID_PLAN, n.ID_NO_ANT, TRIM(n.NO_DESC) NO_DESC, n.NO_STATUS, n.NO_ORDEM, n.NO_COR,
            (SELECT COUNT(*) FROM ${S}.GI_LAB_VAR v WHERE v.ID_PLAN = n.ID_PLAN) N_VARS
       FROM ${t} n ORDER BY n.NO_ORDEM, n.ID_PLAN`,
    {}, { maxRows: 100000 },
  );
  const habilitados = await planesHabilitados(idUsuario, empr, master);
  const nodos = r.rows.map((x) => ({
    id: x.ID_PLAN,
    padre: x.ID_NO_ANT || null,
    nombre: x.NO_DESC,
    activo: x.NO_STATUS === 1,
    variables: x.N_VARS,
    habilitado: habilitados ? habilitados.has(x.ID_PLAN) : true,
  }));
  return { nodos };
}

// Configuración vigente de columnas: PLAN_CONF_GERAL (por empresa) si existe, si no PLAN_CONF_{e}.
async function configuracion(empr, idPlan) {
  const tConf = await tabla("PLAN_CONF", empr);
  // Si la tabla por empresa no existe, solo cuenta la configuración general (antes quedaba `LEFT JOIN null c` y daba 500).
  const c = (col) => (tConf ? `c.${col}` : "NULL");
  const row = await queryOne(
    `SELECT NVL(g.PLC_DIVISAO, ${c("PLC_DIVISAO")}) DIVISAO, NVL(g.PLC_NVEZES, ${c("PLC_NVEZES")}) NVEZES,
            TO_CHAR(NVL(g.PLC_INT_DIV_INI, ${c("PLC_INT_DIV_INI")}), 'HH24:MI') INI,
            TO_CHAR(NVL(g.PLC_INT_DIV_FIM, ${c("PLC_INT_DIV_FIM")}), 'HH24:MI') FIM,
            NVL(g.PLC_STATUS, ${c("PLC_STATUS")}) STATUS
       FROM (SELECT :p ID_PLAN FROM dual) x
       ${tConf ? `LEFT JOIN ${tConf} c ON c.ID_PLAN = x.ID_PLAN` : ""}
       LEFT JOIN ${S}.GI_LAB_PLAN_CONF_GERAL g ON g.ID_PLAN = x.ID_PLAN AND g.COD_EMPR = :e
            AND g.PCG_DATA_ATUALIZA = (SELECT MAX(d.PCG_DATA_ATUALIZA) FROM ${S}.GI_LAB_PLAN_CONF_GERAL d
                                         WHERE d.COD_EMPR = g.COD_EMPR AND d.ID_PLAN = g.ID_PLAN)`,
    { p: idPlan, e: empr },
  );
  if (!row || row.DIVISAO == null) return null;
  return { divisao: row.DIVISAO, nvezes: row.NVEZES || 1, ini: row.INI, fim: row.FIM, activa: row.STATUS === 1 };
}

// Encabezados de columna. Divisão 0 = por horas: una columna cada NVEZES horas desde INI hasta FIM.
// Divisão 1 = por bateladas: NVEZES columnas numeradas.
function columnas(conf) {
  if (!conf) return [];
  if (conf.divisao === 1) return Array.from({ length: conf.nvezes }, (_, i) => ({ col: i + 1, titulo: String(i + 1) }));
  if (!conf.ini || !conf.fim) return []; // por horas pero sin ventana configurada: sin columnas en vez de un error
  const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const ini = aMin(conf.ini);
  const span = ((aMin(conf.fim) + 1 - ini + 1440 - 1) % 1440) + 1; // minutos de la ventana (con cruce de medianoche)
  const paso = conf.nvezes * 60;
  const n = Math.max(1, Math.ceil(span / paso));
  return Array.from({ length: n }, (_, i) => {
    const m = (ini + i * paso) % 1440;
    return { col: i + 1, titulo: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}` };
  });
}

async function variables(idPlan, empr) {
  const r = await query(
    `SELECT v.ID_VAR, v.VAR_ORDEM, v.VAR_NOM_VAR, v.VAR_NOM_ANALI, v.VAR_ORDEM, v.VAR_TIPO_DIG, v.VAR_ORI_DADOS,
            v.VAR_TIPO_MEDIA, v.VAR_ORI_POND, v.VAR_MAS_INT, v.VAR_MAS_DEC, v.VAR_FORMULA,
            s.VAR_ESPEC_MIN_VALOR, s.VAR_ESPEC_MAX_VALOR, u.UNI_ABV, s.VAR_STATUS
       FROM ${S}.GI_LAB_VAR v
       LEFT JOIN ${S}.GI_LAB_UNIDADE u ON u.ID_UNIDADE = v.ID_UNIDADE
       LEFT JOIN ${S}.GI_LAB_VAR_STATUS s ON s.ID_VAR = v.ID_VAR AND s.COD_EMPR = :e
      WHERE v.ID_PLAN = :p ORDER BY v.VAR_ORDEM, v.ID_VAR`,
    { p: idPlan, e: empr }, { maxRows: 10000 },
  );
  return r.rows.map((v) => ({
    id: v.ID_VAR,
    orden: v.VAR_ORDEM,
    nombre: v.VAR_NOM_VAR,
    analisis: v.VAR_NOM_ANALI,
    unidad: v.UNI_ABV,
    calculada: v.VAR_ORI_DADOS === 1, // 0 = digitada, 1 = fórmula
    tipoDig: v.VAR_TIPO_DIG,
    tipoMedia: v.VAR_TIPO_MEDIA,
    ponderadaPor: v.VAR_ORI_POND,
    decimales: v.VAR_MAS_DEC,
    formula: v.VAR_FORMULA,
    especMin: v.VAR_ESPEC_MIN_VALOR,
    especMax: v.VAR_ESPEC_MAX_VALOR,
    activa: v.VAR_STATUS !== 0,
  }));
}

async function puedeVerPlan({ idUsuario, master, empr, idPlan }) {
  const habilitados = await planesHabilitados(idUsuario, empr, master);
  return !habilitados || habilitados.has(idPlan);
}

// Grilla de un día: variables × columnas, con el resultado del día (columna 99).
async function lancamento({ empr, safra, idPlan, data }) {
  fechaReal(data, "Fecha");
  const tLanc = await tabla("LANC", empr, safra);
  const tMov = await tabla("LANC_MOV", empr, safra);
  const [conf, vars, param] = await Promise.all([configuracion(empr, idPlan), variables(idPlan, empr), parametrosSafra(empr, safra)]);
  const base = { configuracion: conf, columnas: columnas(conf), variables: vars, safraGpi: param, idLanc: null, valores: {} };
  if (!tLanc || !tMov) return { ...base, aviso: `No hay tablas del GPI para la zafra ${safra}` };

  const lanc = await queryOne(
    `SELECT ID_LANC FROM ${tLanc} WHERE ID_PLAN = :p AND LAN_DATA = TO_DATE(:d, 'YYYY-MM-DD')`,
    { p: idPlan, d: data },
  );
  if (!lanc) return base;
  const r = await query(
    `SELECT ID_VAR, MOV_COLUNA, MOV_VALOR FROM ${tMov} WHERE ID_LANC = :l`,
    { l: lanc.ID_LANC }, { maxRows: 100000 },
  );
  const valores = {}; // { [idVar]: { [coluna]: valor } }
  for (const m of r.rows) (valores[m.ID_VAR] ||= {})[m.MOV_COLUNA] = m.MOV_VALOR;
  return { ...base, idLanc: lanc.ID_LANC, valores };
}

// Días con datos de una planilla en un mes (para el calendario).
async function diasConDatos({ empr, safra, idPlan, mes }) {
  if (!/^\d{4}-\d{2}$/.test(mes || "")) throw Object.assign(new Error("Mes inválido"), { status: 400 });
  const tLanc = await tabla("LANC", empr, safra);
  if (!tLanc) return [];
  const r = await query(
    `SELECT TO_CHAR(LAN_DATA, 'YYYY-MM-DD') D FROM ${tLanc}
      WHERE ID_PLAN = :p AND TO_CHAR(LAN_DATA, 'YYYY-MM') = :m ORDER BY LAN_DATA`,
    { p: idPlan, m: mes }, { maxRows: 100 },
  );
  return r.rows.map((x) => x.D);
}

module.exports = {
  arbol, lancamento, diasConDatos, variables, puedeVerPlan, parametrosSafra, columnas, COLUNA_DIA,
  // Usados por consultas.service.js
  tabla, planesHabilitados, configuracion,
};
