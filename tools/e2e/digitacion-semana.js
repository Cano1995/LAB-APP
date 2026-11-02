// Guion de navegador: Digitación diaria con varios días (−7 / −1 / +1 / +7), Id, Esp, Sem, Acum, « », Fijar fecha y menú lateral del GPI. Solo lectura.
// Requiere API (con DESA), front y un usuario con acceso a «Lançamento diário» (GATEC, id 1).
// Uso: node tools/e2e/digitacion-semana.js [carpeta de capturas]
const { abrir, guion, tokenDePrueba } = require("./lib");

const API = process.env.API || "http://localhost:3101/api";
const PLAN = 261; // «TEMP AZUCAR»
const H = { Authorization: `Bearer ${tokenDePrueba(1, "GATEC")}`, "Content-Type": "application/json" };
const api = async (metodo, ruta, cuerpo) => { const r = await fetch(API + ruta, { method: metodo, headers: H, body: cuerpo ? JSON.stringify(cuerpo) : undefined }); return { status: r.status, json: await r.json().catch(() => ({})) }; };

(async () => {
  const g = guion("Digitación con varios días");
  await api("POST", "/contexto", { codEmpr: 1, safra: 2026 });
  const dia = (await api("GET", "/gpi/safra")).json.parametros.DIA_ACTUAL;
  const nombrePlan = (await api("GET", "/gpi/arbol")).json.nodos.find((n) => n.id === PLAN).nombre;

  // API: columnas extra solo cuando se piden.
  const base = (await api("GET", `/gpi/planilhas/${PLAN}/lancamento?data=${dia}`)).json;
  g.paso("API: sin ?acum ni ?sem no devuelve acumulado ni semanal", base.acumulado === undefined && base.semanal === undefined);
  const ext = (await api("GET", `/gpi/planilhas/${PLAN}/lancamento?data=${dia}&acum=1&sem=1`)).json;
  g.paso("API: con ?acum=1&sem=1 devuelve ambos objetos", typeof ext.acumulado === "object" && typeof ext.semanal === "object", `${Object.keys(ext.acumulado ?? {}).length} acum / ${Object.keys(ext.semanal ?? {}).length} sem`);

  const t = await abrir({ puerto: 9419, salida: process.argv[2] });
  const fechasEnCabecera = () => t.js(`[...document.querySelectorAll('main thead tr:first-child th')].map(x => x.textContent.trim()).filter(x => /^\\d\\d\\/\\d\\d\\/\\d{4}$/.test(x))`);
  const boton = (texto) => t.js(`(() => { const b = [...document.querySelectorAll('main button')].find(x => x.textContent.trim() === ${JSON.stringify(texto)}); if (!b || b.disabled) return false; b.click(); return true; })()`);
  const encabezados = () => t.js(`[...document.querySelectorAll('main thead th')].map(x => x.textContent.trim())`);
  try {
    await t.ir("/", 600);
    await t.js(`localStorage.setItem('lab_app_token', ${JSON.stringify(tokenDePrueba(1, "GATEC"))})`);
    await t.ir("/gpi/lancamento", 3500);
    await t.js(`(() => { const i = document.querySelector("input[placeholder^='Buscar an']"); i.focus(); })()`);
    await t.cmd("Input.insertText", { text: nombrePlan });
    await t.esperar(800);
    await t.js(`(() => { const b = [...document.querySelectorAll('aside button')].find(x => x.textContent.trim() === ${JSON.stringify(nombrePlan)}); b && b.click(); })()`);
    await t.esperar(2500);

    g.paso("1. un solo día al abrir", (await fechasEnCabecera()).length === 1);
    await boton("−7"); await t.esperar(2500);
    const f7 = await fechasEnCabecera();
    g.paso("2. −7 muestra 8 días seguidos", f7.length === 8, f7.join(" "));
    await t.foto("1-menos7");
    await boton("−1"); await t.esperar(2500);
    g.paso("3. −1 muestra 2 días", (await fechasEnCabecera()).length === 2);
    await boton("+7"); await t.esperar(2500);
    g.paso("4. +7 muestra 8 días con la fecha elegida al final (verde)", (await fechasEnCabecera()).length === 8 && (await t.js(`(() => { const ths = [...document.querySelectorAll('main thead tr:first-child th')].filter(x => /^\\d\\d\\//.test(x.textContent)); return ths[ths.length - 1].className.includes('emerald'); })()`)));
    await boton("+1"); await t.esperar(2500);
    g.paso("5. +1 muestra 2 días", (await fechasEnCabecera()).length === 2);

    await boton("−7"); await t.esperar(2500); // Hoy está deshabilitado si ya se está en el día actual
    await boton("Hoy"); await t.esperar(2500);
    g.paso("6. Hoy vuelve a un solo día", (await fechasEnCabecera()).length === 1);

    await boton("Id"); await boton("Esp"); await boton("Sem"); await boton("Acum"); await t.esperar(2500);
    const enc = await encabezados();
    g.paso("7. Id / Esp / Sem / Acum agregan Id, Mín., Máx., Semanal y Zafra (Semanal antes que Zafra)",
      ["Id", "Mín.", "Máx.", "Semanal", "Zafra"].every((x) => enc.includes(x)) && enc.indexOf("Semanal") < enc.indexOf("Zafra"), enc.join("|"));
    await t.foto("2-columnas-extra");
    g.paso("8. sin errores en pantalla", !(await t.js("document.querySelectorAll('[role=alert]').length")));

    await boton("«"); await t.esperar(2500);
    const ini = (await fechasEnCabecera())[0];
    g.paso("9. « va al inicio de la zafra", /^\d\d\/\d\d\/2026$/.test(ini ?? ""), ini);
    await boton("»"); await t.esperar(2500);
    g.paso("10. » vuelve al día actual de digitación", (await fechasEnCabecera())[0] === dia.split("-").reverse().join("/"));

    // Menú lateral del GPI.
    const lateral = await t.js("document.querySelector('aside nav')?.innerText ?? ''");
    g.paso("11. la barra lateral muestra los menús del GATEC", ["Entrada diaria", "Movimientos", "Cierre", "Informes", "Tablas", "Configuración", "Consultas", "Supervisor", "Utilitarios"].every((x) => lateral.includes(x)));
    await t.js(`(() => { const b = [...document.querySelectorAll('aside nav button')].find(x => x.textContent.trim() === 'Movimientos'); b && b.click(); })()`);
    await t.esperar(300);
    await t.js(`(() => { const b = [...document.querySelectorAll('aside nav button')].find(x => x.textContent.trim() === 'Parada'); b && b.click(); })()`);
    await t.esperar(300);
    g.paso("12. Movimientos y Parada se despliegan", ((await t.js("document.querySelector('aside nav')?.innerText ?? ''")).includes("Lanzamiento de paradas")));
    await t.foto("3-menu");

    // Listados del menú Informes (solo lectura).
    const filasListado = () => t.js("document.querySelectorAll('.panel tbody tr, .panel li').length");
    for (const [ruta, texto, minimo] of [["/gpi/listados/variables", "Listado de variables", 100], ["/gpi/listados/falta-digitacion", "falta de digitación", 5], ["/gpi/listados/fuera-especificacion", "fuera de especificación", 1]]) {
      await t.ir(ruta, 4500);
      const n = await filasListado();
      g.paso(`13. ${ruta} muestra datos y sin errores`, (await t.texto()).toLowerCase().includes(texto.toLowerCase()) && n >= minimo && !(await t.js("document.querySelectorAll('[role=alert]').length")), `${n} filas`);
      await t.foto("4-" + ruta.split("/").pop());
    }
    // Anotaciones e históricos: el período por defecto trae datos (anotaciones, cambios de variables) o pide elegir variable (histórico de valor).
    for (const [ruta, texto, contar] of [
      ["/gpi/listados/anotaciones", "anotaciones", "document.querySelectorAll('.panel p').length"],
      ["/gpi/listados/historico-variables", "histórico de variables", "document.querySelectorAll('.panel tbody tr').length"],
      ["/gpi/listados/historico-especificacion", "histórico de especificación", "document.querySelectorAll('.panel tbody tr').length"],
      ["/gpi/listados/historico-valor", "histórico de valor", "1"],
    ]) {
      await t.ir(ruta, 4500);
      const n = await t.js(contar);
      g.paso(`14. ${ruta} carga sin errores`, (await t.texto()).toLowerCase().includes(texto) && !(await t.js("document.querySelectorAll('[role=alert]').length")), `${n} filas`);
      await t.foto("5-" + ruta.split("/").pop());
    }
  } finally {
    t.cerrar();
  }
  g.fin();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
