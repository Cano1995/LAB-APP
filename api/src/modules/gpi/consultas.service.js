// GPI · Consultas y Supervisorio (solo lectura).
//  - Valores de variables: resultado diario (col. 99) o acumulado de zafra, por rango de fechas.
//  - Consultas guardadas (GI_LAB_CONSULTA): lista de variables que se cargan en la pantalla.
//  - Supervisorio (GI_LAB_SUPERVISORIO / GI_LAB_SUP_VAR): series por hora de las variables de un panel, con sus límites.
// Reglas de acceso: solo variables de planillas habilitadas para el usuario (como el árbol de análisis).
const { query, queryOne } = require("../../db");
const { error } = require("../../lib/util");
const gpi = require("./gpi.service");

const S = "GATEC_GPI_NEW";
const MAX_VARS = 30;
const MAX_DIAS = 400;


// "1, 2,3" → [1,2,3] (enteros únicos, acotado).
function idsDe(texto) {
  const ids = [...new Set(String(texto || "").split(/[\s,;]+/).filter(Boolean).map(Number))];
  if (ids.some((n) => !Number.isInteger(n) || n <= 0)) throw error("Lista de variables inválida");
  if (ids.length > MAX_VARS) throw error(`Máximo ${MAX_VARS} variables por consulta`);
  return ids;
}

const { fechaReal: fechaValida } = require("../../lib/validar");

function diasEntre(desde, hasta) {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / 86400000) + 1;
}

// 'AAAA-MM-DD' + minutos → 'AAAA-MM-DDTHH:MM' (hora local, sin zona).
function aISO(ymd, minutos) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, minutos)).toISOString().slice(0, 16);
}

const binds = (prefijo, valores) => Object.fromEntries(valores.map((v, i) => [`${prefijo}${i}`, v]));
const lista = (prefijo, n) => Array.from({ length: n }, (_, i) => `:${prefijo}${i}`).join(", ");

// Metadatos de variables (nombre, planilla, unidad) limitados a las planillas habilitadas.
async function metaVariables({ empr, idUsuario, master, ids }) {
  if (!ids.length) return [];
  const tPlan = await gpi.tabla("NO_PLAN", empr);
  if (!tPlan) return [];
  const r = await query(
    `SELECT v.ID_VAR, v.ID_PLAN, v.VAR_NOM_VAR, v.VAR_NOM_ANALI, v.VAR_TIPO_MEDIA, v.VAR_MAS_DEC, v.VAR_ORI_DADOS,
            u.UNI_ABV, TRIM(n.NO_DESC) PLAN
       FROM ${S}.GI_LAB_VAR v
       JOIN ${tPlan} n ON n.ID_PLAN = v.ID_PLAN
       LEFT JOIN ${S}.GI_LAB_UNIDADE u ON u.ID_UNIDADE = v.ID_UNIDADE
      WHERE v.ID_VAR IN (${lista("i", ids.length)})`,
    binds("i", ids), { maxRows: 1000 },
  );
  const habilitados = await gpi.planesHabilitados(idUsuario, empr, master);
  const porId = new Map(r.rows.filter((x) => !habilitados || habilitados.has(x.ID_PLAN)).map((x) => [x.ID_VAR, x]));
  // Respeta el orden pedido.
  return ids.filter((i) => porId.has(i)).map((i) => {
    const x = porId.get(i);
    return {
      id: x.ID_VAR, plan: x.ID_PLAN, planNombre: x.PLAN, nombre: x.VAR_NOM_VAR, analisis: x.VAR_NOM_ANALI,
      unidad: x.UNI_ABV, decimales: x.VAR_MAS_DEC, tipoMedia: x.VAR_TIPO_MEDIA, calculada: x.VAR_ORI_DADOS === 1,
    };
  });
}

// Búsqueda de variables activas (por descripción, nombre corto, planilla o código).
async function buscarVariables({ empr, idUsuario, master, q, limit = 40 }) {
  const texto = String(q || "").trim();
  if (texto.length < 2) return [];
  const tPlan = await gpi.tabla("NO_PLAN", empr);
  if (!tPlan) return [];
  // Un usuario que no es administrador solo ve variables de sus planillas habilitadas. Se filtra en el SQL: si se hiciera después del
  // tope de 300 filas, una búsqueda genérica podía llenar el tope con planillas ajenas y dejar al usuario sin resultados.
  const binds = { e: empr, q: `%${texto.toUpperCase().slice(0, 60)}%`, id: texto.slice(0, 20) };
  let soloHabilitadas = "";
  if (!master) {
    const tAcc = await gpi.tabla("ACESSOS", empr);
    if (!tAcc) return [];
    soloHabilitadas = `AND v.ID_PLAN IN (SELECT a.ID_PLAN FROM ${tAcc} a WHERE a.ID_USUARIO = :u AND a.USU_HABILITADO = 'S')`;
    binds.u = idUsuario;
  }
  const r = await query(
    `SELECT v.ID_VAR FROM ${S}.GI_LAB_VAR v
       JOIN ${tPlan} n ON n.ID_PLAN = v.ID_PLAN AND n.NO_STATUS = 1
       JOIN ${S}.GI_LAB_VAR_STATUS s ON s.ID_VAR = v.ID_VAR AND s.COD_EMPR = :e AND s.VAR_STATUS = 1
      WHERE (UPPER(v.VAR_NOM_ANALI) LIKE :q OR UPPER(v.VAR_NOM_VAR) LIKE :q OR UPPER(n.NO_DESC) LIKE :q
         OR TO_CHAR(v.ID_VAR) = :id) ${soloHabilitadas}
      ORDER BY n.NO_DESC, v.VAR_ORDEM`,
    binds,
    { maxRows: 300 },
  );
  const todos = await metaVariables({ empr, idUsuario, master, ids: r.rows.map((x) => x.ID_VAR) });
  return todos.slice(0, limit);
}

// Consultas guardadas por la empresa (solo la lista de variables; las fechas guardadas son de otras zafras).
async function consultasGuardadas({ empr }) {
  const r = await query(
    `SELECT CON_CODIGO, TRIM(CON_DESC) CON_DESC, CON_VARIAVEL, CON_MEDIA,
            TO_CHAR(CON_DT_INI, 'YYYY-MM-DD') DT_INI, TO_CHAR(CON_DT_FIM, 'YYYY-MM-DD') DT_FIM
       FROM ${S}.GI_LAB_CONSULTA WHERE COD_EMPR = :e ORDER BY CON_DESC`,
    { e: empr }, { maxRows: 1000 },
  );
  return r.rows.map((x) => ({
    codigo: x.CON_CODIGO, descripcion: x.CON_DESC, media: x.CON_MEDIA, desde: x.DT_INI, hasta: x.DT_FIM,
    variables: String(x.CON_VARIAVEL || "").split(/[\s,;]+/).map(Number).filter((n) => Number.isInteger(n) && n > 0),
  }));
}

// Valores diarios (o acumulados de zafra) de las variables en un rango de fechas.
async function valores({ empr, safra, idUsuario, master, ids, desde, hasta, acumulado }) {
  fechaValida(desde, "Fecha inicial");
  fechaValida(hasta, "Fecha final");
  if (hasta < desde) throw error("La fecha final es anterior a la inicial");
  if (diasEntre(desde, hasta) > MAX_DIAS) throw error(`El rango máximo es de ${MAX_DIAS} días`);
  const variables = await metaVariables({ empr, idUsuario, master, ids });
  if (!variables.length) return { variables: [], filas: [], aviso: "Ninguna de las variables está habilitada para su usuario" };

  const vIds = variables.map((v) => v.id);
  let filas = [];
  if (acumulado) {
    const tAcum = await gpi.tabla("ACUM", empr, safra);
    if (tAcum) {
      const r = await query(
        `SELECT TO_CHAR(ACU_DATA, 'YYYY-MM-DD') D, ID_VAR, ACU_MEDIA V FROM ${tAcum}
          WHERE ID_VAR IN (${lista("i", vIds.length)}) AND ACU_DATA BETWEEN TO_DATE(:a, 'YYYY-MM-DD') AND TO_DATE(:b, 'YYYY-MM-DD')`,
        { ...binds("i", vIds), a: desde, b: hasta }, { maxRows: 200000 },
      );
      filas = r.rows;
    }
  } else {
    const tLanc = await gpi.tabla("LANC", empr, safra);
    const tMov = await gpi.tabla("LANC_MOV", empr, safra);
    if (tLanc && tMov) {
      const r = await query(
        `SELECT TO_CHAR(l.LAN_DATA, 'YYYY-MM-DD') D, m.ID_VAR, m.MOV_VALOR V
           FROM ${tLanc} l JOIN ${tMov} m ON m.ID_LANC = l.ID_LANC
          WHERE m.MOV_COLUNA = :c AND m.ID_VAR IN (${lista("i", vIds.length)})
            AND l.LAN_DATA BETWEEN TO_DATE(:a, 'YYYY-MM-DD') AND TO_DATE(:b, 'YYYY-MM-DD')`,
        { ...binds("i", vIds), c: gpi.COLUNA_DIA, a: desde, b: hasta }, { maxRows: 200000 },
      );
      filas = r.rows;
    }
  }

  // { fecha → { idVar → valor } }
  const porFecha = new Map();
  for (const f of filas) {
    if (!porFecha.has(f.D)) porFecha.set(f.D, {});
    porFecha.get(f.D)[f.ID_VAR] = f.V;
  }
  const fechas = [...porFecha.keys()].sort();
  return {
    variables,
    acumulado: !!acumulado,
    filas: fechas.map((d) => ({ fecha: d, valores: porFecha.get(d) })),
    aviso: fechas.length ? undefined : "Sin valores en el rango y la zafra seleccionados",
  };
}

// --- Supervisorio -------------------------------------------------------------------------------------------------

async function supervisorios({ empr }) {
  const r = await query(
    `SELECT s.SUP_CODIGO, TRIM(s.SUP_DESC) SUP_DESC, s.SUP_TEMPO, COUNT(v.SUV_ID_VAR) N
       FROM ${S}.GI_LAB_SUPERVISORIO s
       LEFT JOIN ${S}.GI_LAB_SUP_VAR v ON v.COD_EMPR = s.COD_EMPR AND v.SUP_CODIGO = s.SUP_CODIGO
      WHERE s.COD_EMPR = :e GROUP BY s.SUP_CODIGO, s.SUP_DESC, s.SUP_TEMPO
      ORDER BY TRIM(s.SUP_DESC)`,
    { e: empr }, { maxRows: 1000 },
  );
  return r.rows.map((x) => ({ codigo: x.SUP_CODIGO.trim(), descripcion: x.SUP_DESC, minutos: x.SUP_TEMPO, variables: x.N }));
}

// Variables del supervisorio con su escala y límites.
async function supervisorio({ empr, idUsuario, master, codigo }) {
  const cab = await queryOne(
    `SELECT TRIM(SUP_CODIGO) COD, TRIM(SUP_DESC) DESCR, SUP_TEMPO FROM ${S}.GI_LAB_SUPERVISORIO
      WHERE COD_EMPR = :e AND TRIM(SUP_CODIGO) = :c`,
    { e: empr, c: String(codigo).trim() },
  );
  if (!cab) throw error("Supervisorio no encontrado", 404);
  const r = await query(
    `SELECT SUV_ORDEM, SUV_ID_VAR, TRIM(SUV_DESC) SUV_DESC, SUV_VAR_MIN, SUV_VAR_MAX, SUV_TP_GRAF, SUV_LIMITE_INF, SUV_LIMITE_SUP
       FROM ${S}.GI_LAB_SUP_VAR WHERE COD_EMPR = :e AND TRIM(SUP_CODIGO) = :c ORDER BY SUV_ORDEM, SUV_ID_VAR`,
    { e: empr, c: String(codigo).trim() }, { maxRows: 200 },
  );
  const meta = new Map((await metaVariables({ empr, idUsuario, master, ids: r.rows.map((x) => x.SUV_ID_VAR) })).map((m) => [m.id, m]));
  return {
    codigo: cab.COD, descripcion: cab.DESCR, minutos: cab.SUP_TEMPO,
    variables: r.rows.map((x) => ({
      orden: x.SUV_ORDEM, id: x.SUV_ID_VAR, descripcion: x.SUV_DESC, min: x.SUV_VAR_MIN, max: x.SUV_VAR_MAX,
      tipoGrafico: x.SUV_TP_GRAF, limiteInf: x.SUV_LIMITE_INF, limiteSup: x.SUV_LIMITE_SUP,
      habilitada: meta.has(x.SUV_ID_VAR), unidad: meta.get(x.SUV_ID_VAR)?.unidad ?? null,
    })),
  };
}

// Serie por hora de cada variable del supervisorio. Cada columna de una planilla por horas tiene su hora
// (inicio + (columna−1)·paso); las planillas por bateladas no tienen hora y aportan su resultado del día al mediodía.
async function serieSupervisorio({ empr, safra, idUsuario, master, codigo, desde, hasta }) {
  fechaValida(desde, "Fecha inicial");
  fechaValida(hasta, "Fecha final");
  if (hasta < desde) throw error("La fecha final es anterior a la inicial");
  if (diasEntre(desde, hasta) > 14) throw error("El rango máximo del supervisorio es de 14 días");

  const sup = await supervisorio({ empr, idUsuario, master, codigo });
  const tLanc = await gpi.tabla("LANC", empr, safra);
  const tMov = await gpi.tabla("LANC_MOV", empr, safra);
  const series = [];
  const confPorPlan = new Map();
  const meta = new Map((await metaVariables({ empr, idUsuario, master, ids: sup.variables.map((v) => v.id) })).map((m) => [m.id, m]));

  for (const v of sup.variables) {
    const m = meta.get(v.id);
    if (!m || !tLanc || !tMov) { series.push({ ...v, puntos: [] }); continue; }
    if (!confPorPlan.has(m.plan)) confPorPlan.set(m.plan, await gpi.configuracion(empr, m.plan));
    const conf = confPorPlan.get(m.plan);
    const porHoras = conf && conf.divisao === 0;
    const [hi, mi] = (conf?.ini || "00:00").split(":").map(Number);
    const iniMin = hi * 60 + mi;
    const paso = (conf?.nvezes || 1) * 60;

    const r = await query(
      `SELECT TO_CHAR(l.LAN_DATA, 'YYYY-MM-DD') D, m.MOV_COLUNA C, m.MOV_VALOR V
         FROM ${tLanc} l JOIN ${tMov} m ON m.ID_LANC = l.ID_LANC
        WHERE l.ID_PLAN = :p AND m.ID_VAR = :v AND m.MOV_COLUNA ${porHoras ? "<" : "="} :c
          AND l.LAN_DATA BETWEEN TO_DATE(:a, 'YYYY-MM-DD') AND TO_DATE(:b, 'YYYY-MM-DD')
        ORDER BY l.LAN_DATA, m.MOV_COLUNA`,
      { p: m.plan, v: v.id, c: gpi.COLUNA_DIA, a: desde, b: hasta }, { maxRows: 20000 },
    );
    const puntos = [];
    for (const x of r.rows) {
      const y = Number(String(x.V).replace(",", "."));
      if (!Number.isFinite(y)) continue;
      puntos.push({ t: porHoras ? aISO(x.D, iniMin + (x.C - 1) * paso) : aISO(x.D, 720), y });
    }
    puntos.sort((p, q) => (p.t < q.t ? -1 : 1));
    series.push({ ...v, unidad: m.unidad, porHoras: !!porHoras, puntos });
  }
  return { supervisorio: { codigo: sup.codigo, descripcion: sup.descripcion, minutos: sup.minutos }, series };
}

module.exports = { metaVariables, buscarVariables, consultasGuardadas, valores, supervisorios, supervisorio, serieSupervisorio, idsDe };
