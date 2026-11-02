// Prueba Db_Select (SOLO LECTURA): para el día indicado ejecuta el SQL de las fórmulas que lo usan y
// lo compara con el valor guardado de cada variable. Uso: node tools/gpi-probar-dbselect.js [AAAA-MM-DD] [empr] [safra]
const { cargar, COL_DIA } = require("./lib/gpi-datos");

(async () => {
  const fecha = process.argv[2] || new Date().toISOString().slice(0, 10);
  const g = await cargar({ hasta: fecha, empr: Number(process.argv[3] || 1), safra: Number(process.argv[4] || new Date().getFullYear()) });
  await g.precargarDbSelect(fecha);
  const pol = g.POLITICAS.UV;
  for (const [id, ast] of g.asts) {
    if (ast.error || !JSON.stringify(ast).includes("DB_SELECT")) continue;
    let x; try { x = g.evaluarCelda(id, fecha, COL_DIA, pol); } catch (e) { x = "ERROR " + e.message; }
    console.log(`#${id} ${g.porId.get(id).VAR_NOM_VAR}: motor=${x} guardado=${g.val(fecha, id, COL_DIA)}`);
  }
  await g.cerrar();
})().catch((e) => { console.error(e); process.exit(1); });
