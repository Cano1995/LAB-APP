// Guion de navegador del Sprint 18: Digitación diaria EDITABLE con doble clic (escribe en DESA y limpia). Requiere API con ESCRITURA_GPI_DIGITACION=1, el front y DESA.
// Usa un usuario con acceso TOTAL a «Lançamento diário» (GATEC, id 1). El caso de un usuario sin acceso total (403 y sin celdas editables) lo cubren las pruebas de la API:
// en esta copia de DESA ningún usuario activo tiene acceso parcial ni nulo a esa pantalla.
// La planilla de prueba debe estar VACÍA el día de digitación actual: así todo lo que aparezca lo escribió este guion y la limpieza solo toca su celda.
// Uso: node tools/e2e/sprint18.js [carpeta de capturas]
const { abrir, guion, tokenDePrueba } = require("./lib");

const API = process.env.API || "http://localhost:3101/api";
const PLAN = 261, VAR = 143, COLUMNA = 1; // «TEMP AZUCAR», media 1, 40 columnas
const H = (id, nombre) => ({ Authorization: `Bearer ${tokenDePrueba(id, nombre)}`, "Content-Type": "application/json" });
const api = async (id, nombre, metodo, ruta, cuerpo) => { const r = await fetch(API + ruta, { method: metodo, headers: H(id, nombre), body: cuerpo ? JSON.stringify(cuerpo) : undefined }); return { status: r.status, json: await r.json().catch(() => ({})) }; };

(async () => {
  const g = guion("Sprint 18");
  const safra = (await api(1, "GATEC", "GET", "/gpi/safra")).json;
  const dia = safra.parametros.DIA_ACTUAL;
  await api(1, "GATEC", "POST", "/contexto", { codEmpr: 1, safra: 2026 });
  const arbol = (await api(1, "GATEC", "GET", "/gpi/arbol")).json.nodos;
  const nombrePlan = arbol.find((n) => n.id === PLAN).nombre;
  const url = `/gpi/planilhas/${PLAN}/lancamento`;
  const lanc = async () => (await api(1, "GATEC", "GET", `${url}?data=${dia}`)).json;
  const valorApi = async () => ((await lanc()).valores?.[VAR]?.[COLUMNA] ?? null);
  const inicial = await lanc();
  if (Object.keys(inicial.valores ?? {}).length) { console.log("La planilla ya tiene valores ese día; abortando para no pisar datos."); process.exit(2); }
  const celda = `td[data-celda='${VAR}|${COLUMNA}']`;

  const t = await abrir({ puerto: 9418, salida: process.argv[2] });
  const entrar = async (id, nombre) => {
    await t.ir("/", 600);
    await t.js(`localStorage.setItem('lab_app_token', ${JSON.stringify(tokenDePrueba(id, nombre))})`);
    await t.ir("/gpi/lancamento", 3500);
    await t.js(`(() => { const i = document.querySelector("input[placeholder^='Buscar an']"); i.focus(); })()`);
    await t.cmd("Input.insertText", { text: nombrePlan });
    await t.esperar(800);
    await t.js(`(() => { const b = [...document.querySelectorAll('aside button')].find(x => x.textContent.trim() === ${JSON.stringify(nombrePlan)}); b && b.click(); })()`);
    await t.esperar(2500);
  };
  const dobleClic = (sel) => t.js(`(() => { const td = document.querySelector(${JSON.stringify(sel)}); td.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); })()`);
  const tecla = async (key, code, vk) => { await t.cmd("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk }); await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk }); };
  const hayBoton = (texto) => t.js(`[...document.querySelectorAll('button')].some(b => b.textContent.trim().startsWith(${JSON.stringify(texto)}))`);
  const escribirEnCelda = async (texto) => { await dobleClic(celda); await t.esperar(250); await t.cmd("Input.insertText", { text: texto }); await tecla("Enter", "Enter", 13); await t.esperar(300); };
  const hayInput = () => t.js(`!!document.querySelector("td[data-celda='${VAR}|${COLUMNA}'] input")`);
  try {
    // ---- 1. Acceso total: celdas editables con doble clic, sin botón «Editar» ----
    await entrar(1, "GATEC");
    const txt0 = await t.texto();
    g.paso("2. con acceso total se ve «Edición habilitada», la indicación del doble clic y NO hay botón «Editar»", txt0.includes("Edición habilitada") && txt0.includes("Doble clic en una celda blanca") && !(await hayBoton("Editar")));
    const editables = await t.js("document.querySelectorAll('td[data-celda]').length");
    g.paso("2. solo las variables digitadas tienen celdas editables (las calculadas no)", editables > 0 && (await t.js("document.querySelectorAll('tr.bg-calc td[data-celda]').length")) === 0, `${editables} celdas`);
    g.paso("2. no se puede escribir con un solo clic", (await t.js(`(() => { document.querySelector(${JSON.stringify(celda)}).click(); return !document.querySelector("td[data-celda='${VAR}|${COLUMNA}'] input"); })()`)));
    await t.foto("1-celdas-editables");

    // ---- 2. Doble clic abre la celda; Esc cancela; Enter confirma ----
    await dobleClic(celda);
    await t.esperar(250);
    g.paso("3. el doble clic abre la celda para escribir (con el foco en el campo)", (await hayInput()) && (await t.js("document.activeElement?.tagName")) === "INPUT");
    await t.cmd("Input.insertText", { text: "999" });
    await tecla("Escape", "Escape", 27);
    await t.esperar(250);
    g.paso("3. Esc cancela: no queda cambio pendiente", !(await hayInput()) && !(await hayBoton("Grabar")));
    await escribirEnCelda("12,5");
    g.paso("3. Enter confirma: la celda queda marcada como cambio y aparece «Grabar (1)»", (await hayBoton("Grabar (1)")) && (await t.js(`document.querySelector(${JSON.stringify(celda)}).textContent`)) === "12,5");
    await t.foto("2-cambio-pendiente");
    // Volver al valor original (vacío) cancela el cambio pendiente.
    await dobleClic(celda); await t.esperar(200);
    await t.js(`(() => { const i = document.querySelector("td[data-celda='${VAR}|${COLUMNA}'] input"); i.select(); })()`);
    await t.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
    await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
    await tecla("Enter", "Enter", 13); await t.esperar(250);
    g.paso("3. dejar la celda como estaba elimina el cambio pendiente", !(await hayBoton("Grabar")));

    // ---- 3. Grabar ----
    await escribirEnCelda("12,5");
    await t.clic("button", "Grabar");
    await t.esperar(2500);
    const txt = await t.texto();
    g.paso("4. se confirma lo grabado y se advierte que los calculados se actualizan al cierre", /Se grabaron 1 celda/.test(txt) && /cerrar el día/.test(txt));
    g.paso("4. la celda muestra el valor grabado con los decimales de la máscara y ya no hay pendientes", (await t.js(`document.querySelector(${JSON.stringify(celda)}).textContent`)) === "12.50" && !(await hayBoton("Grabar")));
    g.paso("4. el valor quedó en la base (por la API)", (await valorApi()) === "12.50");
    await t.foto("3-grabado");

    // ---- 4. Conflicto: otro usuario cambia la celda mientras se edita ----
    await escribirEnCelda("99");
    await api(1, "GATEC", "PUT", url, { data: dia, cambios: [{ idVar: VAR, col: COLUMNA, anterior: "12.50", nuevo: "77" }] }); // «otro usuario»
    await t.clic("button", "Grabar");
    await t.esperar(2500);
    g.paso("5. el conflicto se avisa y no pisa el valor del otro usuario", /Otro usuario cambió 1 celda/.test(await t.texto()) && (await valorApi()) === "77.00");
    g.paso("5. la celda en conflicto vuelve a mostrar el valor actual y no queda pendiente", (await t.js(`document.querySelector(${JSON.stringify(celda)}).textContent`)) === "77.00" && !(await hayBoton("Grabar")));
    await t.foto("4-conflicto");

    // ---- 5. Cambios sin grabar: confirmar antes de descartar ----
    await escribirEnCelda("5");
    await t.js("window.__confirmaciones = 0; window.confirm = () => { window.__confirmaciones++; return false; }");
    await t.js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'Día anterior'); b && b.click(); })()`);
    await t.esperar(600);
    g.paso("6. cambiar de día con cambios sin grabar pide confirmación y, si se rechaza, se queda", (await t.js("window.__confirmaciones")) === 1 && (await t.js("document.querySelector('input[type=date]').value")) === dia);
    await t.js("window.confirm = () => true");
    await t.clic("button", "Descartar");
    await t.esperar(500);
    g.paso("6. «Descartar» elimina los pendientes sin grabar nada", !(await hayBoton("Grabar")) && (await valorApi()) === "77.00");

    // ---- 6. Teclado: Enter sobre la celda enfocada la abre ----
    await t.js(`document.querySelector(${JSON.stringify(celda)}).focus()`);
    await tecla("Enter", "Enter", 13);
    await t.esperar(250);
    g.paso("7. con el teclado, Enter sobre la celda enfocada la abre", await hayInput());
    await tecla("Escape", "Escape", 27);

    // ---- 7. Día cerrado ----
    await t.js(`(() => { const i = document.querySelector('input[type=date]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ${JSON.stringify(safra.parametros.FECHA_REAL)}); i.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await t.esperar(2000);
    g.paso("8. un día cerrado no tiene celdas editables y se explica por qué", (await t.js("document.querySelectorAll('td[data-celda]').length")) === 0 && /ya está cerrado/.test(await t.texto()));
  } finally {
    // Limpieza: SOLO la celda de prueba (la planilla estaba vacía al empezar, así que nada más pudo ser escrito por este guion).
    const actual = await valorApi();
    if (actual !== null) await api(1, "GATEC", "PUT", url, { data: dia, cambios: [{ idVar: VAR, col: COLUMNA, anterior: actual, nuevo: "" }] });
    const resto = Object.keys((await lanc()).valores ?? {}).length;
    g.paso("limpieza: la planilla quedó vacía como estaba", resto === 0, resto ? "quedaron celdas que este guion no esperaba: revíselas en LAB_APP_AUDIT" : "");
    t.cerrar();
  }
  g.fin();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
