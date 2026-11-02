// Guion de navegador del Sprint 14 (rendimiento del front). Uso: node tools/e2e/sprint14.js [carpeta de capturas]
const { abrir, guion, tokenDePrueba } = require("./lib");

(async () => {
  const g = guion("Sprint 14");
  const t = await abrir({ puerto: 9414, salida: process.argv[2] });
  try {
    await t.ir("/", 600);
    await t.js(`localStorage.setItem('lab_app_token', ${JSON.stringify(tokenDePrueba())})`);

    // ---- 1. Pantalla cargada bajo demanda: abre sin errores ----
    await t.ir("/gpi/cep?id=46&hasta=2026-10-21&muestras=30", 3500);
    g.paso("1. la pantalla de CEP (carga diferida) abre sin errores", /Control estadístico|CEP/i.test(await t.texto()) && !(await t.js("!!document.querySelector('[role=alert]')")));

    // ---- 2. Buscador con retardo: escribir una frase produce pocos pedidos, no uno por tecla ----
    const regla = { patron: /\/api\/gpi\/variaveis/, accion: "pasar" };
    t.reglas.push(regla);
    await t.ir("/gpi/valores", 3000);
    await t.js("document.querySelector(\"input[placeholder^='Descripción']\").focus()");
    for (const ch of "vol. fermento") { await t.cmd("Input.insertText", { text: ch }); await t.esperar(40); }
    await t.esperar(2500);
    g.paso("2. escribir 13 letras seguidas hace a lo sumo 2 pedidos a la API", (regla.n || 0) >= 1 && (regla.n || 0) <= 2, `pedidos: ${regla.n || 0}`);
    g.paso("2. aparecen resultados", (await t.js("document.querySelectorAll('aside li button').length")) > 0);
    t.reglas.length = 0;

    // ---- 3. Gráfico: mover el mouse muestra el tooltip y el cursor, sin recalcular la capa fija ----
    await t.ir("/gpi/cep?id=46&hasta=2026-10-21&muestras=40", 3500);
    await t.clic("button", "Calcular");
    await t.esperar(3500);
    const caja = await t.js("(() => { const r = document.querySelector('main svg[role=img]').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
    await t.js("window.__nodos = document.querySelector('main svg[role=img] g:nth-of-type(1)')");
    await t.cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: caja.x, y: caja.y });
    await t.esperar(400);
    g.paso("3. al mover el mouse sobre el gráfico aparece el tooltip", await t.js("!!document.querySelector('main .pointer-events-none.absolute')"));
    g.paso("3. la capa fija conserva sus nodos (no se vuelve a crear con el mouse)", await t.js("document.querySelector('main svg[role=img] g:nth-of-type(1)') === window.__nodos"));
    // Mide cuánto tarda en procesar 200 movimientos seguidos.
    const t0 = Date.now();
    for (let i = 0; i < 200; i++) await t.cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: caja.x - 150 + i, y: caja.y });
    const ms = Date.now() - t0;
    g.paso("3. 200 movimientos del mouse se procesan en menos de 6 s", ms < 6000, `${ms} ms`);
    await t.foto("1-grafico-tooltip");
  } finally {
    t.cerrar();
  }
  g.fin();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
