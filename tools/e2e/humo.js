// Prueba de humo de navegador: recorre las pantallas con datos reales y comprueba que ninguna muestre un error.
// Uso: node tools/e2e/humo.js [carpeta de capturas]
const { abrir, guion, tokenDePrueba } = require("./lib");

(async () => {
  const g = guion("Humo");
  const t = await abrir({ puerto: 9413, salida: process.argv[2] });
  const sinError = async () => {
    const alertas = await t.js("[...document.querySelectorAll('[role=alert]')].map(a => a.textContent.trim()).join(' | ')");
    return { ok: !alertas, alertas };
  };
  try {
    await t.ir("/", 600);
    await t.js(`localStorage.setItem('lab_app_token', ${JSON.stringify(tokenDePrueba())})`);

    // Pantallas que cargan datos al abrir.
    for (const [ruta, texto] of [
      ["/", "Inicio"], ["/gpi/lancamento", "Digitación diaria"], ["/gpi/supervisorio", "Paneles"], ["/gpi/panel", "Panel de información"],
      ["/gpi/metas", "Real x Metas"], ["/lab/sonda", "Análisis de caña"], ["/lab/entrada-cana", "Entrada de caña"],
      ["/maestras/lab-motivo-cancelacion", "Motivo"],
    ]) {
      await t.ir(ruta, 4500);
      const cuerpo = await t.texto();
      const e = await sinError();
      g.paso(ruta, e.ok && cuerpo.toLowerCase().includes(texto.toLowerCase()), e.ok ? "" : e.alertas);
    }

    // Informes: elegir uno y ver la grilla.
    await t.ir("/gpi/informes", 3000);
    await t.js("(() => { const b=[...document.querySelectorAll('aside li button')].find(x=>x.textContent.includes('Informe diario')); b && b.click(); })()");
    await t.esperar(5000);
    g.paso("/gpi/informes → grilla del informe", (await t.js("document.querySelectorAll('main tbody tr').length")) > 20 && (await sinError()).ok);

    // Boletines.
    await t.ir("/gpi/boletines", 3000);
    await t.js("(() => { const b=[...document.querySelectorAll('aside li button')].find(x=>x.textContent.includes('COPAC')); b && b.click(); })()");
    await t.esperar(5000);
    g.paso("/gpi/boletines → boletín", (await t.js("document.querySelectorAll('main tbody tr').length")) > 20 && (await sinError()).ok);

    // Valores: buscar, elegir y consultar (usa varias URLs armadas con parámetros).
    await t.ir("/gpi/valores", 3000);
    await t.js("(() => { const i=document.querySelector(\"input[placeholder^='Descripción']\"); i.focus(); })()");
    await t.cmd("Input.insertText", { text: "vol. fermento cuba" });
    await t.esperar(2200);
    await t.js("(() => { const b=[...document.querySelectorAll('aside li button')].find(x=>!x.disabled); b && b.click(); })()");
    await t.esperar(400);
    await t.clic("button", "Consultar");
    await t.esperar(3500);
    g.paso("/gpi/valores → buscar, elegir y consultar", (await t.js("document.querySelectorAll('main tbody tr').length")) > 0 && (await sinError()).ok);

    // CEP con parámetros desde el enlace (id, hasta, muestras).
    await t.ir("/gpi/cep?id=46&hasta=2026-10-21&muestras=30", 3500);
    await t.clic("button", "Calcular");
    await t.esperar(3500);
    g.paso("/gpi/cep desde enlace → carta", (await t.js("document.querySelectorAll('main svg').length")) >= 2 && (await sinError()).ok);
    await t.foto("humo-cep");
  } finally {
    t.cerrar();
  }
  g.fin();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
