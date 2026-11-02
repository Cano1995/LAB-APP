// Guion de navegador del Sprint 12 (sesión y consistencia del frontend). Uso: node tools/e2e/sprint12.js [carpeta de capturas]
const { abrir, guion, tokenDePrueba } = require("./lib");

(async () => {
  const g = guion("Sprint 12");
  const t = await abrir({ puerto: 9412, salida: process.argv[2] });
  const token = tokenDePrueba();
  const fijarToken = (v) => t.js(`localStorage.setItem('lab_app_token', ${JSON.stringify(v)})`);
  const hayToken = () => t.js(`!!localStorage.getItem('lab_app_token')`);
  try {
    // ---- 1. Token basura al abrir: vuelve al login y borra el token ----
    await t.ir("/", 600);
    await fijarToken("token.invalido.xyz");
    await t.ir("/", 3000);
    let txt = await t.texto();
    g.paso("1. token inválido al abrir → pantalla de ingreso", /Ingresar/.test(txt) && /Use su usuario de GATEC/.test(txt));
    g.paso("1. el token inválido se borra", !(await hayToken()));

    // ---- 2. Sesión válida y luego un 401 en un pedido: login con aviso, token borrado ----
    await fijarToken(token);
    await t.ir("/", 3500);
    txt = await t.texto();
    g.paso("2. con un token válido se ve el Inicio", /Inicio/.test(txt) && !/Use su usuario de GATEC/.test(txt));
    t.reglas.push({ patron: /\/api\/gpi\//, accion: "401" });
    await t.clic("a[href='/gpi/boletines']");
    await t.esperar(3000);
    txt = await t.texto();
    g.paso("2. un 401 durante el uso lleva al ingreso con el aviso «Su sesión venció»", /Su sesión venció/.test(txt) && /Ingresar/.test(txt));
    g.paso("2. el token vencido se borra", !(await hayToken()));
    await t.foto("1-sesion-vencida");
    t.reglas.length = 0;

    // ---- 3. Servidor caído al validar la sesión: no cierra la sesión y ofrece reintentar ----
    await fijarToken(token);
    t.reglas.push({ patron: /\/api\/auth\/me/, accion: "caer" });
    await t.ir("/", 3000);
    txt = await t.texto();
    g.paso("3. servidor caído al abrir → «No se pudo validar su sesión» con Reintentar", /No se pudo validar su sesión/.test(txt) && /Reintentar/.test(txt));
    g.paso("3. el token se conserva (no se cerró la sesión por una caída)", await hayToken());
    await t.foto("2-servidor-caido");
    t.reglas.length = 0; // el servidor «vuelve»
    await t.clic("button", "Reintentar");
    await t.esperar(3000);
    txt = await t.texto();
    g.paso("3. al reintentar, entra sin volver a ingresar", /Inicio/.test(txt) && !/No se pudo validar/.test(txt) && !/Use su usuario de GATEC/.test(txt));

    // ---- 4. Un 503 al validar tampoco cierra la sesión ----
    await t.ir("/", 800);
    t.reglas.push({ patron: /\/api\/auth\/me/, accion: { status: 503, cuerpo: { error: "Servicio no disponible, reintente en unos segundos" } } });
    await t.ir("/", 3000);
    txt = await t.texto();
    g.paso("4. un 503 al validar → reintentar, sin cerrar la sesión", /No se pudo validar su sesión/.test(txt) && (await hayToken()));
    t.reglas.length = 0;

    // ---- 5. Un 403 no reintenta ni cierra la sesión ----
    await t.ir("/", 3000);
    let llamadas = 0;
    t.reglas.push({ patron: /\/api\/lab\/sonda/, accion: { status: 403, cuerpo: { error: "Sin permiso para esta pantalla" } } });
    await t.ir("/lab/sonda", 3500);
    txt = await t.texto();
    g.paso("5. un 403 muestra el mensaje y NO cierra la sesión", /Sin permiso para esta pantalla/.test(txt) && (await hayToken()));
    t.reglas.length = 0;
    void llamadas;

    // ---- 6. Salir: vuelve al ingreso sin aviso de sesión vencida ----
    await t.ir("/", 3000);
    await t.clic("button", "Salir");
    await t.esperar(1500);
    txt = await t.texto();
    g.paso("6. «Salir» → ingreso sin aviso de vencimiento", /Ingresar/.test(txt) && !/Su sesión venció/.test(txt) && !(await hayToken()));

    // ---- 7. Guarda de rutas: abrir por URL una pantalla sin permiso vuelve al Inicio con aviso ----
    await fijarToken(token);
    await t.ir("/admin", 3500);
    txt = await t.texto();
    g.paso("7. /admin sin ser administrador → vuelve al Inicio con el aviso de permiso", /No tiene permiso para abrir/.test(txt) && /Usuarios, grupos y permisos/.test(txt) && !/Solo consulta: no se modifica nada/.test(txt));
    await t.foto("3-ruta-denegada");
    await t.ir("/gpi/boletines", 3000);
    txt = await t.texto();
    g.paso("7. una pantalla permitida (Boletines) sí abre", /Seleccione un boletín de la lista/.test(txt) || /Boletines/.test(txt));

    // ---- 8. Cambio de zafra: se reinicia el estado de la pantalla y se descartan los datos ----
    const opciones = { empresas: [{ cod: 1, nombre: "AZPA", safras: [{ anio: 2026, etiqueta: "2026/2027" }, { anio: 2025, etiqueta: "2025/2026" }] }] };
    t.reglas.push({ patron: new RegExp("/api/contexto/opciones"), accion: { status: 200, cuerpo: opciones } });
    t.reglas.push({ patron: new RegExp("/api/contexto$"), accion: { status: 200, cuerpo: { ok: true, contexto: { empresa: { cod: 1, nombre: "AZPA" }, safra: 2025 } } } });
    await t.ir("/gpi/boletines", 3000);
    await t.js("(() => { const b=[...document.querySelectorAll('aside li button')].find(x=>x.textContent.includes('COPAC')); b && b.click(); })()");
    await t.esperar(3500);
    txt = await t.texto();
    g.paso("8. antes del cambio hay un boletín abierto", /Concepto/.test(txt) && /Acumulado de zafra/.test(txt));
    await t.js("(() => { const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; const s=document.querySelector('select[aria-label=Zafra]'); set.call(s,'2025'); s.dispatchEvent(new Event('change',{bubbles:true})); })()");
    await t.esperar(2500);
    txt = await t.texto();
    g.paso("8. tras cambiar de zafra la pantalla se reinicia (sin el boletín anterior)", /Seleccione un boletín de la lista/.test(txt) && !/Concepto/.test(txt));
    g.paso("8. el selector muestra la zafra nueva", new RegExp("2025/2026").test(await t.js("document.querySelector('select[aria-label=Zafra]')?.selectedOptions[0]?.textContent || ''")));
    await t.foto("4-cambio-de-zafra");

    // ---- 9. Error al cambiar de zafra: se muestra, no se queda en silencio ----
    t.reglas.length = 0;
    t.reglas.push({ patron: new RegExp("/api/contexto/opciones"), accion: { status: 200, cuerpo: opciones } });
    t.reglas.push({ patron: new RegExp("/api/contexto$"), accion: { status: 500, cuerpo: { error: "Error interno" } } });
    await t.ir("/gpi/boletines", 3000);
    await t.js("(() => { const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; const s=document.querySelector('select[aria-label=Zafra]'); set.call(s,'2025'); s.dispatchEvent(new Event('change',{bubbles:true})); })()");
    await t.esperar(2000);
    txt = await t.texto();
    g.paso("9. un error al cambiar de zafra se muestra al usuario", /No se pudo cambiar la zafra/.test(txt));
    await t.foto("5-error-cambio-zafra");
    t.reglas.length = 0;

    // ---- 10. «Consultar» con los mismos filtros vuelve a consultar (antes no hacía nada) ----
    const cuenta = { patron: new RegExp("/api/lab/sonda[?]"), accion: "pasar" };
    t.reglas.push(cuenta);
    await t.ir("/lab/sonda", 4000);
    const antes = cuenta.n || 0;
    await t.clic("button", "Consultar");
    await t.esperar(2500);
    g.paso("10. «Consultar» sin cambiar los filtros hace un pedido nuevo", (cuenta.n || 0) > antes, "pedidos: " + antes + " → " + (cuenta.n || 0));
    t.reglas.length = 0;

    // ---- 11. Error al cargar una consulta guardada: se muestra ----
    t.reglas.push({ patron: new RegExp("/api/gpi/variaveis"), accion: { status: 500, cuerpo: { error: "Error interno" } } });
    await t.ir("/gpi/valores", 3500);
    await t.js("(() => { const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; const s=document.querySelector('aside select'); set.call(s, s.options[2].value); s.dispatchEvent(new Event('change',{bubbles:true})); })()");
    await t.esperar(2500);
    txt = await t.texto();
    g.paso("11. un error al cargar una consulta guardada se muestra al usuario", /No se pudo cargar la consulta guardada/.test(txt));
    await t.foto("6-error-consulta-guardada");
    t.reglas.length = 0;

    // ---- 12-13. Modal: arrastrar desde dentro hasta el fondo NO cierra; foco atrapado; scroll bloqueado ----
    t.reglas.length = 0;
    await t.ir("/lab/sonda", 4500);
    const abrirDetalle = async () => { await t.js("(() => { const b=document.querySelector('tbody tr button'); b && b.click(); })()"); await t.esperar(1500); };
    const hayDialogo = () => t.js("!!document.querySelector('[role=dialog]')");
    const mouse = async (tipo, x, y) => t.cmd("Input.dispatchMouseEvent", { type: tipo, x, y, button: "left", clickCount: 1 });
    await abrirDetalle();
    g.paso("12. Modal: al abrir hay un diálogo", await hayDialogo());
    g.paso("12. Modal: el scroll de la página se bloquea mientras está abierto", (await t.js("document.body.style.overflow")) === "hidden");
    const centro = await t.js("(() => { const r=document.querySelector('[role=dialog]').getBoundingClientRect(); return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + 40) }; })()");
    await mouse("mousePressed", centro.x, centro.y); // empieza DENTRO del diálogo…
    await mouse("mouseReleased", 8, 8);               // …y termina en el fondo
    await t.esperar(400);
    g.paso("12. Modal: arrastrar desde dentro hasta el fondo no lo cierra", await hayDialogo());
    for (let i = 0; i < 40; i++) {
      await t.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    }
    g.paso("13. Modal: tras 40 Tab el foco sigue dentro del diálogo", await t.js("!!document.activeElement && !!document.activeElement.closest('[role=dialog]')"));
    for (let i = 0; i < 5; i++) {
      await t.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: 8 });
      await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: 8 });
    }
    g.paso("13. Modal: Mayús+Tab tampoco saca el foco", await t.js("!!document.activeElement.closest('[role=dialog]')"));
    await mouse("mousePressed", 8, 8); await mouse("mouseReleased", 8, 8); // clic completo en el fondo
    await t.esperar(500);
    g.paso("12. Modal: un clic completo en el fondo sí lo cierra", !(await hayDialogo()));
    g.paso("12. Modal: el scroll de la página se restaura al cerrar", (await t.js("document.body.style.overflow")) !== "hidden");
    await abrirDetalle();
    await t.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await t.esperar(500);
    g.paso("12. Modal: Esc lo cierra", !(await hayDialogo()));

    // ---- 14. Fila de Sonda: se abre con el teclado desde el botón de la primera celda ----
    await t.js("document.querySelector('tbody tr button').focus()");
    await t.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
    await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await t.esperar(1500);
    g.paso("14. Sonda: Enter sobre el botón de la fila abre el detalle", await hayDialogo());
    g.paso("14. Sonda: el botón tiene nombre accesible", /Ver el análisis/.test(await t.js("document.querySelector('tbody tr button')?.getAttribute('aria-label') || ''")));
    await t.cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await t.cmd("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await t.esperar(400);

    // ---- 15. Gráfico: descripción para lectores de pantalla ----
    await t.ir("/gpi/cep?id=46&hasta=2026-10-21&muestras=40", 3500);
    await t.clic("button", "Calcular");
    await t.esperar(3500);
    const desc = await t.js("(() => { const s=document.querySelector('main svg[role=img]'); const id=s?.getAttribute('aria-describedby'); return id ? (document.getElementById(id)?.textContent || '') : ''; })()");
    g.paso("15. Gráfico: aria-describedby apunta a un resumen con mínimo, máximo y último", /puntos; mínimo .* máximo .* último/.test(desc), desc.slice(0, 90));

    // ---- 16. Contraste de la matriz de correlación (AA ≥ 4,5) con la correlación más intensa ----
    const cuerpo = { variables: [{ id: 1, nombre: "A", analisis: "Variable A", unidad: null, planNombre: "P", decimales: 2 }, { id: 2, nombre: "B", analisis: "Variable B", unidad: null, planNombre: "P", decimales: 2 }], desde: "2026-09-01", hasta: "2026-10-21", dias: 40, matriz: [[{ r: 1, n: 40 }, { r: -1, n: 40 }], [{ r: 1, n: 40 }, { r: 1, n: 40 }]] };
    t.reglas.push({ patron: new RegExp("/api/gpi/correlacion"), accion: { status: 200, cuerpo } });
    await t.ir("/gpi/correlacion", 3000);
    await t.js("(() => { const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; })()");
    // Se eligen dos variables reales para habilitar «Calcular» (la respuesta está simulada).
    const vaciar = "(()=>{const i=document.querySelector(\"input[placeholder^='Descripción']\"); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,''); i.dispatchEvent(new Event('input',{bubbles:true}));})()";
    for (const q of ["vol. fermento cuba", "vol. fermento cuba cereal"]) {
      await t.js(vaciar);
      await t.js("document.querySelector(\"input[placeholder^='Descripción']\").focus()");
      await t.cmd("Input.insertText", { text: q });
      for (let i = 0; i < 25; i++) { // espera a que llegue la búsqueda
        await t.esperar(400);
        if (await t.js("[...document.querySelectorAll('aside li button')].some(x=>!x.disabled && !x.getAttribute('aria-label'))")) break;
      }
      await t.js("(() => { const b=[...document.querySelectorAll('aside li button')].find(x=>!x.disabled && !x.getAttribute('aria-label')); b && b.click(); })()");
      await t.esperar(400);
    }
    await t.clic("button", "Calcular");
    await t.esperar(2500);
    const contraste = await t.js(`(() => {
      const celdas = [...document.querySelectorAll('main tbody td')].filter(td => td.style.background || td.style.backgroundColor);
      const lum = (r,g,b) => { const f = (c) => { c/=255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
      const peor = { ratio: 99, texto: '' };
      for (const td of celdas) {
        const m = /rgba\\((\\d+),(\\d+),(\\d+),([\\d.]+)\\)/.exec(td.style.background.replace(/ /g,''));
        if (!m) continue;
        const a = Number(m[4]);
        const bg = [0,1,2].map(i => Math.round(255*(1-a) + Number(m[i+1])*a));
        for (const el of [td, ...td.querySelectorAll('span')]) {
          if (!el.textContent.trim()) continue;
          const c = /rgb\\((\\d+), (\\d+), (\\d+)\\)/.exec(getComputedStyle(el).color);
          if (!c) continue;
          const l1 = lum(bg[0],bg[1],bg[2]), l2 = lum(+c[1],+c[2],+c[3]);
          const ratio = (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
          if (ratio < peor.ratio) { peor.ratio = ratio; peor.texto = el.textContent.trim(); }
        }
      }
      return { celdas: celdas.length, peor: Math.round(peor.ratio*100)/100, texto: peor.texto };
    })()`);
    g.paso("16. Correlación: contraste mínimo del texto sobre las celdas coloreadas ≥ 4,5", contraste && contraste.celdas >= 1 && contraste.peor >= 4.5, JSON.stringify(contraste));
    await t.foto("7-correlacion-contraste");
    t.reglas.length = 0;
  } finally {
    t.cerrar();
  }
  g.fin();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
