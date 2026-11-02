// Db_Select (Sprint 16, M1-M4): batería de entradas hostiles. El SQL viene de la base y no se confía en él: solo se acepta lo de la lista blanca.
const test = require("node:test");
const assert = require("node:assert/strict");
Object.assign(process.env, { DB_USER: "TEST", DB_PASSWORD: "x", DB_CONNECT_STRING: "localhost/TEST", JWT_SECRET: "una-clave-de-prueba-larga-y-aleatoria-0123456789abcdef" });
const { preparar, precargar } = require("../src/modules/gpi/formula/dbselect");
const { parsear } = require("../src/modules/gpi/formula/parser");

const P = { empr: 1, safra: 2026, fecha: "2026-10-21" };
const BASE = "FROM ba_movimientos_bascula bas WHERE bas.cod_empresa = [VAR_EMPR]";

// Las dos consultas que usan las fórmulas de producción (variables 46, 1742 y 1743).
const REALES = [
  `select sum((bas.peso_bruto - bas.peso_tara + (nvl(bas.kilos_descuento, 0) + nvl(bas.kilos_descuento_trash, 0) + nvl(bas.kilos_desc_impureza, 0) + nvl(bas.kilos_desc_cogollo, 0))) / 1000) tn_molida from ba_movimientos_bascula bas where bas.cod_empresa = [VAR_EMPR] and bas.zafra = [VAR_SAFRA] and bas.fec_hor_salida >= [VAR_DATA] AND BAs.COD_TIP_MOVIMIENTO = BUSCA_PARAMETRO('BA', 'TIPO_MOV_COMPRA')`,
  `select sum(bas.peso_bruto - bas.peso_tara) tn_molida from ba_movimientos_bascula bas, personas p, lc_tipos_cañeros tc where bas.cod_persona = p.cod_persona(+) and p.cod_tipo = tc.cod_tipo(+) and bas.cod_empresa = [VAR_EMPR] and bas.zafra = [VAR_SAFRA] and bas.fec_hor_salida >= [VAR_DATA]`,
];

test("acepta las consultas reales y usa parámetros, no texto pegado", () => {
  for (const q of REALES) {
    const r = preparar(q, P);
    assert.equal(r.ok, true, r.motivo);
    assert.deepEqual(r.binds, { empr: 1, safra: 2026, fecha: "2026-10-21" });
    assert.match(r.sql, /:empr/);
    assert.match(r.sql, /TO_DATE\(:fecha,'YYYY-MM-DD'\)/);
    assert.doesNotMatch(r.sql, /2026-10-21|\[VAR_/);
  }
});

test("acepta variantes inocuas: esquema INV, mayúsculas, JOIN, GROUP BY, CASE, COUNT", () => {
  const buenas = [
    `SELECT COUNT(*) FROM INV.BA_MOVIMIENTOS_BASCULA b WHERE b.ZAFRA = [VAR_SAFRA]`,
    `select avg(nvl(b.peso_bruto,0)) from ba_movimientos_bascula b inner join personas p on p.cod_persona = b.cod_persona where b.cod_empresa = [VAR_EMPR] group by p.cod_tipo having count(*) > 1 order by 1 desc`,
    `select sum(case when b.peso_bruto > 0 then 1 else 0 end) from ba_movimientos_bascula b where b.cod_empresa = [var_empr]`,
    `select max(b.peso_bruto) from ba_movimientos_bascula b where b.nro_finca in (1, 2, 3) and b.parcela like 'A%' and b.observ = 'it''s ok'`,
  ];
  for (const q of buenas) assert.equal(preparar(q, P).ok, true, q);
});

const HOSTILES = {
  "no empieza con SELECT": ["DELETE FROM ba_movimientos_bascula", "update ba_movimientos_bascula set peso_bruto = 0", "  insert into personas values (1)", "begin null; end;", "SELECTX FROM ba_movimientos_bascula", ""],
  "otra sentencia": [`select 1 from ba_movimientos_bascula; drop table personas`, `select sum(1) ${BASE}; select 2 from dual`],
  "comentarios": [`select sum(1) ${BASE} -- y lo demás`, `select sum(1) ${BASE} /* x */`, `select/**/sum(1) ${BASE}`],
  "literales con prefijo q'…' o n'…'": [`select sum(1) ${BASE} and 'a' = q'[x'; delete from personas; --]'`, `select sum(1) ${BASE} and 'a' = nq'#x#'`, `select sum(1) ${BASE} and 'a' = Q'{x}'`, `select sum(1) ${BASE} and 'a' = n'x'`],
  "funciones que no están en la lista": [
    `select dbms_pipe.receive_message('x', 100) ${BASE}`, `select utl_http.request('http://evil/') ${BASE}`, `select sys.dbms_lock.sleep(60) ${BASE}`,
    `select dbms_xmlgen.getxml('select 1 from dual') ${BASE}`, `select xmltype('<a/>') ${BASE}`, `select utl_file.fopen('D','f','w') ${BASE}`,
    `select pkg_propio.escribe(1) ${BASE}`, `select sum(1) ${BASE} and dbms_random.value > 0`, `select sys_context('USERENV','SESSION_USER') ${BASE}`,
    `select user ${BASE} and to_char(sysdate)||chr(10) = 'x'`, `select sum(1) over (partition by 1) ${BASE}`, `select cast(1 as number) ${BASE}`,
  ],
  "subconsultas": [`select (select 1 from personas) ${BASE}`, `select sum(1) ${BASE} and 1 in (select 1 from personas)`, `select 1 from (select 1 from personas) x`],
  "operaciones de conjuntos, jerarquías y cláusulas de escritura": [
    `select sum(1) ${BASE} union select 1 from personas`, `select sum(1) ${BASE} minus select 1 from personas`, `select sum(1) ${BASE} for update`, `select sum(1) into x ${BASE}`,
    `select sum(1) ${BASE} connect by level < 100000000`, `select sum(1) ${BASE} start with 1 = 1`, `with a as (select 1 from personas) select sum(1) ${BASE}`,
    `select sum(1) ${BASE} lock table x`, `select sum(1) ${BASE} model dimension by (1)`,
  ],
  "enlaces de base de datos, identificadores citados y parámetros": [
    `select sum(1) from ba_movimientos_bascula@otra_base bas`, `select sum(1) from "BA_MOVIMIENTOS_BASCULA" bas`, `select sum(1) ${BASE} and 1 = :x`, `select sum(1) ${BASE} and 1 = &x`,
    `select sum(1) ${BASE} \\ x`, `select sum(1) ${BASE} {x}`, `select sum(1) ${BASE} [otro]`, `select sum(1) ${BASE} ? 1`,
  ],
  "tablas o esquemas fuera de la lista": [
    `select sum(1) from dual`, `select sum(1) from all_users`, `select sum(1) from sys.user$`, `select sum(1) from gatec_agr.gam_usuarios`, `select sum(1) from inv.otra_tabla`,
    `select sum(1) from ba_movimientos_bascula bas, gam_usuarios u`, `select sum(1) from ba_movimientos_bascula, gam_usuarios`, `select sum(1) from ba_movimientos_bascula bas join gam_usuarios u on 1 = 1`,
    `select sum(1) from personas p, ba_movimientos_bascula b, sys.obj$ o`, `select sum(1) from table(sys.odcinumberlist(1))`, `select sum(1)`,
  ],
  "forma": [`select sum(1) ${BASE} and (1 = 1`, `select sum(1) ${BASE} and 1 = 1)`, `select 'sin cerrar from ba_movimientos_bascula`, `select ${"sum(1) + ".repeat(400)} 1 ${BASE}`, `select ${"x".repeat(5000)} ${BASE}`],
};

for (const [motivo, lista] of Object.entries(HOSTILES)) {
  test(`rechaza: ${motivo}`, () => {
    for (const q of lista) {
      const r = preparar(q, P);
      assert.equal(r.ok, false, `debió rechazarse: ${q.slice(0, 100)}`);
      assert.ok(r.motivo);
    }
  });
}

test("los parámetros se validan: fecha inexistente, empresa o zafra que no son enteros", () => {
  const q = REALES[0];
  for (const fecha of ["2026-02-30", "21/10/2026", "2026-10-21'; drop table x; --", "", undefined]) assert.equal(preparar(q, { ...P, fecha }).ok, false, String(fecha));
  for (const empr of ["1 OR 1=1", "x", -1, 1.5, undefined]) assert.equal(preparar(q, { ...P, empr }).ok, false, String(empr));
  for (const safra of ["2026; drop", "abc", -5]) assert.equal(preparar(q, { ...P, safra }).ok, false, String(safra));
});

test("un SQL rechazado nunca llega a la base y el motivo queda como error en la caché", async () => {
  const ast = parsear(`Db_Select('delete from personas') + Db_Select('select sum(peso_bruto) from ba_movimientos_bascula where zafra = [VAR_SAFRA]')`);
  const ejecutadas = [];
  const cache = await precargar(ast, P, async (sql, binds) => { ejecutadas.push({ sql, binds }); return 42; });
  assert.equal(ejecutadas.length, 1);
  assert.deepEqual(ejecutadas[0].binds, { safra: 2026 });
  const [malo, bueno] = [...cache.entries()];
  assert.ok(malo[1] instanceof Error);
  assert.match(malo[1].message, /rechazado/);
  assert.equal(bueno[1], 42);
});

test("un error de la base queda en la caché y no detiene a las demás consultas", async () => {
  const ast = parsear(`Db_Select('select sum(peso_bruto) from ba_movimientos_bascula where zafra = [VAR_SAFRA]') + Db_Select('select sum(peso_tara) from ba_movimientos_bascula where zafra = [VAR_SAFRA]')`);
  let n = 0;
  const cache = await precargar(ast, P, async () => { if (n++ === 0) throw new Error("ORA-01013"); return 7; });
  const v = [...cache.values()];
  assert.ok(v[0] instanceof Error);
  assert.equal(v[1], 7);
});
