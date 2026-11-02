// Prueba REAL de la digitación diaria contra DESA (ESCRIBE y luego deja todo como estaba). Requiere la API con ESCRITURA_GPI_DIGITACION=1 y un usuario con
// acceso TOTAL a «Lançamento diário» (por defecto GATEC, id 1; la firma del token usa el JWT_SECRET de api/.env, igual que tools/e2e).
// Uso: node tools/probar-digitacion-real.js [idPlan=261] [idVar=143] [AAAA-MM-DD = día de digitación actual]
//   Plan 261 · variable 143 («TEMP AZUCAR», media 1, 40 columnas); otra buena: plan 193 · variable 630 («VOL MASA C», suma, sin decimales).
// Solo contra DESA: la API se niega a conectarse a cualquier otro servidor. Si una celda de prueba ya tiene valor, no se toca (aborta).
const { tokenDePrueba } = require("./e2e/lib");

const BASE = process.env.API || "http://localhost:3101/api";
const ID_USUARIO = Number(process.env.USUARIO_ID || 1), NOMBRE = process.env.USUARIO_NOMBRE || "GATEC";
const H = { Authorization: `Bearer ${tokenDePrueba(ID_USUARIO, NOMBRE)}`, "Content-Type": "application/json" };
const llamar = async (metodo, p, cuerpo) => {
  const r = await fetch(BASE + p, { method: metodo, headers: H, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const filas = [];
const paso = (que, ok, detalle = "") => { filas.push({ ok }); console.log(`${ok ? "✔" : "✘"} ${que}${detalle ? " — " + detalle : ""}`); };

(async () => {
  const idPlan = Number(process.argv[2] || 261), idVar = Number(process.argv[3] || 143);
  const safra = await llamar("GET", "/gpi/safra");
  const dia = process.argv[4] || safra.json.parametros?.DIA_ACTUAL;
  const cerrado = safra.json.parametros?.FECHA_REAL;
  await llamar("POST", "/contexto", { codEmpr: 1, safra: 2026 });
  const url = `/gpi/planilhas/${idPlan}/lancamento`;
  const leer = async (fecha = dia) => (await llamar("GET", `${url}?data=${fecha}`)).json;
  const antes = await leer();
  const v = antes.variables.find((x) => x.id === idVar);
  if (!v || v.calculada) { console.log("La variable no existe en la planilla o es calculada."); process.exit(2); }
  const dec = v.decimales ?? 0, suma = v.tipoMedia === 3;
  const f = (x) => Number(x).toFixed(dec);
  const columnas = antes.columnas.map((c) => c.col);
  const dosColumnas = columnas.length >= 2;
  console.log(`Planilla ${idPlan} · variable ${idVar} «${v.nombre}» (media ${v.tipoMedia}, ${dec} decimales, ${columnas.length} columnas) · día ${dia} (último cierre ${cerrado})\n`);
  const valor = (l, col) => l.valores?.[idVar]?.[col] ?? null;
  if (valor(antes, 1) !== null || valor(antes, 2) !== null || valor(antes, 99) !== null) { console.log("Las celdas de prueba ya tienen valores; elija otra variable o día para no pisar datos."); process.exit(2); }
  paso("el día de digitación actual se puede editar", antes.edicion?.permitida === true, JSON.stringify(antes.edicion));

  // 1) Grabar: crea la cabecera si hace falta, la celda y el resultado del día.
  let r = await llamar("PUT", url, { data: dia, cambios: [{ idVar, col: 1, anterior: null, nuevo: "123,456" }] });
  paso("grabar una celda nueva (con coma decimal)", r.status === 200 && r.json.cambios === 1, `${r.status} ${JSON.stringify(r.json).slice(0, 120)}`);
  let l = await leer();
  paso("la celda quedó con los decimales de la máscara", valor(l, 1) === f(123.456), String(valor(l, 1)));
  paso("el resultado del día (col. 99) se guardó", valor(l, 99) === f(123.456), String(valor(l, 99)));
  const c1 = valor(l, 1);

  // 2) Concurrencia: un valor «anterior» que no es el actual se rechaza y no cambia nada.
  r = await llamar("PUT", url, { data: dia, cambios: [{ idVar, col: 1, anterior: "999", nuevo: "1" }] });
  paso("conflicto: otro valor anterior → 409 con la celda en conflicto", r.status === 409 && r.json.code === "CONFLICTO" && r.json.conflictos?.[0]?.actual === c1, `${r.status} ${JSON.stringify(r.json.conflictos)}`);
  paso("…y no se modificó nada", valor(await leer(), 1) === c1);

  // 3) Modificar y agregar: el día se recalcula (suma o promedio según la variable).
  const cambios = [{ idVar, col: 1, anterior: c1, nuevo: "200" }];
  if (dosColumnas) cambios.push({ idVar, col: 2, anterior: null, nuevo: "50" });
  r = await llamar("PUT", url, { data: dia, cambios });
  paso(dosColumnas ? "modificar una celda y agregar otra en el mismo pedido" : "modificar la celda", r.status === 200 && r.json.cambios === cambios.length, `${r.status}`);
  l = await leer();
  const esperado = dosColumnas ? f(suma ? 250 : 125) : f(200);
  console.log(`   columnas: 1=${valor(l, 1)} 2=${valor(l, 2)} día=${valor(l, 99)} (esperado ${esperado})`);
  paso(`el día sigue la regla de la variable (${suma ? "suma" : "promedio"})`, valor(l, 99) === esperado, String(valor(l, 99)));

  // 4) Rechazos: ninguno debe dejar rastros.
  const c1b = valor(l, 1);
  r = await llamar("PUT", url, { data: cerrado, cambios: [{ idVar, col: 1, anterior: null, nuevo: "1" }] });
  paso("un día cerrado no se edita (409)", r.status === 409, `${r.status} ${r.json.error}`);
  r = await llamar("PUT", url, { data: dia, cambios: [{ idVar, col: 1, anterior: c1b, nuevo: "abc" }] });
  paso("un valor no numérico se rechaza (400)", r.status === 400, r.json.error);
  r = await llamar("PUT", url, { data: dia, cambios: [{ idVar, col: 99, anterior: null, nuevo: "1" }] });
  paso("el resultado del día no se digita (400)", r.status === 400, r.json.error);
  r = await llamar("PUT", url, { data: dia, cambios: [{ idVar, col: columnas.length + 1, anterior: null, nuevo: "1" }] });
  paso("una columna que no existe en la planilla se rechaza (400)", r.status === 400, r.json.error);
  const calc = antes.variables.find((x) => x.calculada && x.activa);
  if (calc) { r = await llamar("PUT", url, { data: dia, cambios: [{ idVar: calc.id, col: 1, anterior: null, nuevo: "1" }] }); paso("una variable calculada no se digita (400)", r.status === 400, r.json.error); }
  r = await llamar("PUT", url, { data: dia, cambios: [{ idVar, col: 1, anterior: c1b, nuevo: "1" }, { idVar, col: 1, anterior: c1b, nuevo: "2" }] });
  paso("una celda repetida en el pedido se rechaza (400)", r.status === 400, r.json.error);
  r = await llamar("PUT", url, { data: dia, cambios: [{ idVar, col: 1, anterior: c1b, nuevo: String(10 ** 12) }] });
  paso("un valor con demasiados enteros se rechaza (400)", r.status === 400, r.json.error);
  r = await llamar("PUT", url, { data: dia, cambios: [] });
  paso("un pedido sin cambios se rechaza (400)", r.status === 400, r.json.error);
  paso("lo rechazado no dejó rastros", valor(await leer(), 1) === c1b && valor(await leer(), 99) === esperado);

  // 5) Auditoría visible desde la API de administración no existe aún: se comprueba con la base en la parte de pruebas de la guía.
  // 6) Limpieza: se borran las celdas que se crearon; el día (col. 99) debe desaparecer solo.
  const borrar = [{ idVar, col: 1, anterior: c1b, nuevo: "" }];
  if (dosColumnas) borrar.push({ idVar, col: 2, anterior: valor(l, 2), nuevo: null });
  r = await llamar("PUT", url, { data: dia, cambios: borrar });
  paso("borrar las celdas de prueba", r.status === 200, `${r.status}`);
  l = await leer();
  paso("quedó todo como estaba (sin celdas ni día)", valor(l, 1) === null && valor(l, 2) === null && valor(l, 99) === null, JSON.stringify(l.valores?.[idVar] ?? {}));

  const malas = filas.filter((x) => !x.ok).length;
  console.log(malas ? `\n${malas} de ${filas.length} comprobaciones FALLARON` : `\nTodas las comprobaciones pasaron (${filas.length}).`);
  process.exit(malas ? 1 : 0);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
