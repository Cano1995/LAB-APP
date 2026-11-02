// GPI · Boletines (frmRelResumo / ActRelResumo) en solo consulta.
// GI_LAB_REL_RESUMO = cabecera (REL_COLUNAS = 1 o 2 columnas); GI_LAB_REL_RES_ITEM = ítems por columna y orden (ITE_SEQ):
//   con ID_VAR → variable (ITE_ITEM es su rótulo); sin variable y ITE_DIVISAO 'D' → división; 'S' → subdivisión.
// Para el día elegido se muestra el resultado del día y el acumulado de zafra de cada variable.
// Qué períodos imprime exactamente el boletín del VB6 no está confirmado (ver docs/analisis/gpi-sprint6-reportes.md).
const { query } = require("../../db");
const { error } = require("../../lib/util");
const consultas = require("./consultas.service");

const S = "GATEC_GPI_NEW";
const { fechaReal: fechaValida } = require("../../lib/validar");

async function listar({ empr }) {
  const r = await query(
    `SELECT r.ID_REL, r.REL_CABEC, r.REL_COLUNAS,
            (SELECT COUNT(*) FROM ${S}.GI_LAB_REL_RES_ITEM i WHERE i.COD_EMPR = r.COD_EMPR AND i.ID_REL = r.ID_REL AND i.ID_VAR IS NOT NULL) VARIABLES
       FROM ${S}.GI_LAB_REL_RESUMO r WHERE r.COD_EMPR = :e ORDER BY r.REL_CABEC, r.ID_REL`,
    { e: empr }, { maxRows: 200 },
  );
  return r.rows.map((x) => ({ id: x.ID_REL, titulo: x.REL_CABEC, columnas: Number(x.REL_COLUNAS) || 1, variables: x.VARIABLES }));
}

async function boletin({ empr, safra, idUsuario, master, id, fecha }) {
  id = Number(id);
  if (!Number.isInteger(id)) throw error("Boletín inválido");
  fechaValida(fecha, "Fecha");
  const [cab, items] = await Promise.all([
    query(`SELECT REL_CABEC, REL_COLUNAS FROM ${S}.GI_LAB_REL_RESUMO WHERE COD_EMPR = :e AND ID_REL = :i`, { e: empr, i: id }),
    query(`SELECT ITE_COLUNA, ITE_SEQ, ID_VAR, ITE_ITEM, ITE_DIVISAO FROM ${S}.GI_LAB_REL_RES_ITEM WHERE COD_EMPR = :e AND ID_REL = :i ORDER BY ITE_COLUNA, ITE_SEQ`,
      { e: empr, i: id }, { maxRows: 2000 }),
  ]);
  if (!cab.rows.length) throw error("Boletín inexistente", 404);

  const ids = [...new Set(items.rows.map((x) => x.ID_VAR).filter((v) => v !== null && v !== undefined))];
  const metas = new Map(), dia = new Map(), acum = new Map();
  for (let i = 0; i < ids.length; i += 30) {
    const lote = ids.slice(i, i + 30);
    const [d, a] = await Promise.all([
      consultas.valores({ empr, safra, idUsuario, master, ids: lote, desde: fecha, hasta: fecha, acumulado: false }),
      consultas.valores({ empr, safra, idUsuario, master, ids: lote, desde: fecha, hasta: fecha, acumulado: true }),
    ]);
    for (const v of d.variables) metas.set(v.id, v);
    for (const [k, v] of Object.entries(d.filas[0]?.valores ?? {})) dia.set(Number(k), v);
    for (const [k, v] of Object.entries(a.filas[0]?.valores ?? {})) acum.set(Number(k), v);
  }

  const columnas = [];
  for (const it of items.rows) {
    const c = it.ITE_COLUNA;
    (columnas[c - 1] ||= []).push(
      it.ID_VAR !== null && it.ID_VAR !== undefined
        ? { tipo: "variable", texto: it.ITE_ITEM ?? metas.get(it.ID_VAR)?.analisis ?? "", variable: metas.get(it.ID_VAR) ?? null, habilitada: metas.has(it.ID_VAR), dia: dia.get(it.ID_VAR) ?? null, acumulado: acum.get(it.ID_VAR) ?? null }
        : { tipo: it.ITE_DIVISAO === "D" ? "division" : "subdivision", texto: it.ITE_ITEM ?? "" },
    );
  }
  return { id, titulo: cab.rows[0].REL_CABEC, fecha, columnas: columnas.filter(Boolean) };
}

module.exports = { listar, boletin };
