# 04 · Inventario y evaluación de pantallas

**Actualización:** tras redactar este inventario se recorrieron las 17 pantallas con la app real (BOT, DESA): todas cargaron sin errores y los anchos medidos coinciden con lo calculado (Anexo A de `01`). Hallazgos nuevos de Digitación: U16-U19.

**Alcance y confianza (de la redacción original).** *Alta*: leída completa o casi (Login, Inicio, Maestras, Digitación, componentes de cromo). *Media*: revisada estructuralmente (layout, controles, estados, a11y por grep + lectura parcial); sin renderizar con datos. Las capturas posteriores confirmaron Login, Inicio, Digitación, Valores y CEP (oscuro); las demás cargaron sin error pero no se inspeccionaron visualmente una a una. Puntuaciones 1-10; **10 = nada que objetar**. Justificación breve en cada ficha. Detalle de IDs (`Uxx`, `R`, `D`, `G`, `A`) en `07`.

## Resumen

| # | Pantalla | Ruta | Visual | Usab. | Consist. | Access. | General | Conf. |
|---|---|---|---|---|---|---|---|---|
| 0 | Login | (sin ruta; `App.tsx:77`) | 7 | 7 | 8 | 6 | 7 | Alta |
| 0b | Error de arranque | (sin ruta; `App.tsx:62`) | 6 | 6 | 7 | 6 | 6 | Alta |
| 1 | Inicio | `/` | 8 | 7 | 7 | 6 | 7 | Alta |
| 2 | Digitación diaria | `/gpi/lancamento` | 6 | 5 | 5 | 5 | **5** | Alta |
| 3 | Valores de variables | `/gpi/valores` | 7 | 6 | 6 | 5 | 6 | Media |
| 4 | Supervisorio | `/gpi/supervisorio` | 7 | 7 | 6 | 5 | 6 | Media |
| 5 | Panel de información | `/gpi/panel` | 7 | 7 | 6 | 4 | 6 | Media |
| 6 | Control estadístico (CEP) | `/gpi/cep` | 7 | 6 | 6 | 4 | 6 | Media |
| 7 | Correlación | `/gpi/correlacion` | 7 | 6 | 6 | 4 | 6 | Media |
| 8 | Informes | `/gpi/informes` | 7 | 7 | 6 | 5 | 6 | Media |
| 9 | Boletines | `/gpi/boletines` | 7 | 7 | 6 | 5 | 6 | Media |
| 10 | Real × Metas | `/gpi/metas` | 7 | 7 | 6 | 5 | 6 | Media |
| 11 | Listado de variables | `/gpi/listados/variables` | 7 | 7 | 7 | 6 | 7 | Media |
| 12 | Falta de digitación | `/gpi/listados/falta-digitacion` | 7 | 7 | 7 | 6 | 7 | Media |
| 13 | Fuera de especificación | `/gpi/listados/fuera-especificacion` | 7 | 7 | 7 | 6 | 7 | Media |
| 14 | Análisis de caña (sonda) | `/lab/sonda` | 7 | 7 | 7 | 6 | 7 | Media |
| 15 | Entrada de caña | `/lab/entrada-cana` | 7 | 7 | 7 | 6 | 7 | Media |
| 16 | Usuarios, grupos y permisos | `/admin` | 6 | 6 | 6 | 6 | 6 | Media |
| 17 | Tablas maestras (N recursos) | `/maestras/:recurso` | 7 | 6 | 7 | 6 | 6 | Alta |

**Lectura global**: promedio general ≈ 6,2. Ninguna pantalla es mala; la distancia a «profesional de primer nivel» viene de cromo, grilla de Digitación, accesibilidad y falta de ergonomía en tablas, no de un problema de gusto. Las pantallas de **consulta** (3-15) comparten arquitectura y por eso sus notas se parecen: arreglar el *patrón* sube las 13 a la vez.

**Criterio de puntuación**
- *Visual*: jerarquía, aire, coherencia con el sistema, ausencia de ruido. –1 por cromo apilado donde aplica, –1 por colores fuera de sistema.
- *Usabilidad*: pasos, claridad, prevención de errores (sin ver datos reales: tope 8 sin validación con usuarios).
- *Consistencia*: contra las demás pantallas y el propio `ui-sistema-visual.md`.
- *Accesibilidad*: contra la tabla de `03` §4; –1 por spinner mudo, –1 por tabla sin semántica, –1 adicional si 0 `aria-*` en el archivo (CEP, Correlación, Panel).
- Todas: **–1 de «Usabilidad» y «Accesibilidad»** por falta de plan móvil donde aplica solo si hubiera requisito (no se descontó, está en R1).

---

## 0 · Login
**Propósito/usuario**: autenticar con usuario GATEC + contraseña Oracle. Todos.
**Elementos**: logo (versión por tema), `Field` Usuario/Contraseña, botón «Ingresar» (deshabilitado hasta completar), alertas de aviso/error, `TemaToggle`.
**Verificado visualmente (1366 px, tema oscuro del sistema)**: centrado, jerarquía clara, logo sobre panel, sin ruido.
- Visual 7: sobrio; el panel del logo y el del formulario son dos cajas separadas, la primera aporta poco. 
- Problemas: no hay «mostrar contraseña» ni aviso de Bloq Mayús; texto «contraseña de Oracle» técnico (V3); botón deshabilitado sin explicar por qué; no se advierte del bloqueo de cuenta tras 2 fallos (ver F7) **[H]**; 0 `aria-*` propios (los `Field` envuelven en `<label>`, así que el nombre accesible está OK).
- Responsive: `max-w-sm` + `px-4` correcto [V código]; sin pruebas visuales.
- Mejoras: mostrar/ocultar contraseña, Bloq Mayús, mensaje de intentos restantes, copy «contraseña de su usuario Oracle (la misma del GATEC)».

## 0b · Error de arranque
«No se pudo validar su sesión» con Reintentar / Ingresar de nuevo. Correcto y útil. Falta distinguir «sin conexión con el servidor» de «sesión vencida» [H].

## 1 · Inicio `/`
**Propósito**: panorama de balanza/sonda + accesos + notificaciones. **Usuario**: todos; los KPI solo para quienes tienen permiso de laboratorio.
**Elementos**: saludo, contexto (empresa · zafra · grupos), 4 KPI, barras 14 días, accesos recientes/sugeridos, notificaciones.
- **Bien**: jerarquía, skeletons con `aria-busy`, estados vacíos por bloque, accesos por historial por usuario (`recientes.ts`), enlace «Ver entrada de caña».
- Problemas: sin comparativos en KPI; ningún indicador de **proceso/GPI** (fuera de especificación, falta digitar) pese a que es el módulo principal; efecto `fondo-inicio` (resplandor) + vidrio: único sitio con degradado (V4); íconos decorativos en títulos de panel (V5); para usuarios sin permiso lab solo queda «Accesos» + «Notificaciones»; `grupos: …` en el subtítulo puede ser una lista larga sin truncar [H].
- Mejoras: bloque «Requiere atención» por rol; comparativos «vs ayer»; KPI configurable.

## 2 · Digitación diaria `/gpi/lancamento` — la pantalla clave
**Propósito**: ver (y, con permiso/interruptor, **editar**) los resultados diarios de una planilla. **Usuario**: analista de laboratorio/proceso.
**Elementos**: `AppHeader`; panel lateral con árbol de análisis y buscador (`w-80`); `BarraTitulo` (nombre, detalle de lote/hora, badge Solo consulta/Edición habilitada) + hasta 17 controles; grilla con encabezado agrupado por día, columnas fijas, filas calculadas en amarillo + Σ, fuera de especificación en rojo, columnas Id/Esp/Semanal/Zafra opcionales; edición por celda; hoja de impresión.
- **Visual 6**: la grilla en sí es buena (fijas, tabular-nums, calc amarillo con marca lateral); lo bajan el encabezado verde fuera de sistema, violeta/rosa sin tokens, y la barra de controles.
- **Usabilidad 5**: G1 (toolbar), D1 (pérdida de borrador), sin flechas, afordancia de edición oculta, estado «calculadas desactualizadas» (ver 03 F1).
- **Consistencia 5**: único lugar con `window.confirm`, colores crudos, H1 de 15 px, botones de columnas con texto críptico, etiquetas `«`/`»`.
- **Accesibilidad 5**: contraste 3,77:1 (encabezado), `tr tabIndex=0` + `td role="button"` (semántica mixta), `Lock` sin texto fuera de `aria-label` (bien), 22 aria/roles (el mejor de las pantallas, pero rompe a nivel de tabla), sin `<caption>`.
- **Responsive**: no soporta <1100 px (panel `w-80` + sidebar). 
- **Rendimiento percibido** [V]: cada día extra (hasta 8) dispara `useQueries` independiente; cada fila `tabIndex`; sin virtualización [H: medir con planillas de 100+ variables].
- **Mejoras**: ver `06` §F1. Es la prioridad nº 1 de rediseño.

## 3 · Valores de variables `/gpi/valores`
Selección de variables (panel `w-96` con «Cargar variables de…» y eje 1/2 por variable) + rango + `Consultar` + gráfico y tabla (máx 28 rem) + CSV.
- Bien: eje por variable, consultas guardadas, tope/aviso.
- Problemas: panel más ancho del sistema (384 px; ancho útil a 1100 px = 460 px); botón explícito sin auto-consulta; fechas sin `min/max`; control de eje como segmented control de 12 px (`text-xs`) con 24-28 px de alto aprox [H].
- Mejora: panel colapsable; `DateRange` con presets (Hoy, 7 d, Zafra); consulta automática o «cambios pendientes de aplicar».

## 4 · Supervisorio `/gpi/supervisorio`
Lista de paneles + rango + «Actualizar» + «Auto (n min)» + rejilla de gráficos `xl:grid-cols-2`.
- Bien: auto-actualización explícita, rejilla responsive interna, cada gráfico con límites.
- Problemas: «Auto» sin indicador de última actualización (hora) **[H]**; sin pantalla completa/modo TV para pantallas de planta **[H]**.

## 5 · Panel de información `/gpi/panel`
Panel personal (variables, especificaciones, CEP) por día. Sin panel lateral → `BarraHerramientas` + paneles `xl:grid-cols-2`.
- Problemas: el estado «sin panel configurado» remite a «el sistema viejo» (texto de paridad que no ayuda al usuario final); 0 aria/role en el archivo.

## 6 · Control estadístico (CEP) `/gpi/cep`
Formulario lateral (variable, rango, tamaño de subgrupo) + cartas X̄/R + capacidad. Hex de series en el archivo.
- Bien: desglose de métricas en `Dato`; mensaje de muestras insuficientes con guía («pruebe con más días»).
- Problemas: términos técnicos (LC, LCS, LCI, LSE, LIE y los índices de capacidad) sin glosario/tooltip [H]; 0 aria/role.

## 7 · Correlación `/gpi/correlacion`
Selección de ≥2 variables + rango + matriz con colores. Matriz `<table>` con encabezados truncados (`max-w-40`) con `title`.
- Problemas: `title` solo-mouse para ver el nombre completo; colores de la matriz [H: verificar que no dependan solo de matiz]; 0 aria/role.

## 8 · Informes `/gpi/informes`
Lista de informes configurables + rango (máx N días) + exportar CSV. Tabla con filas de variable y celdas por día (`max-w-72 truncate`).
- Problemas: truncados; mensaje de rango inválido tras el error.

## 9 · Boletines `/gpi/boletines`
Lista + día; columnas de paneles `xl:grid-cols-2`. Estable. Mismas observaciones de cromo/fechas.

## 10 · Real × Metas `/gpi/metas`
`BarraHerramientas` con fecha y período; una tabla. Correcto. Sin indicador visual de % de cumplimiento en barra/semáforo **[H: ver tabla real]**.

## 11-13 · Listados GPI
`ListadosGpiPage` con 3 tipos: variables (buscador + planilla + tipo), falta de digitación (día ±1), fuera de especificación (rango). Tienen Excel e imprimir; avisos de truncado **sí** se muestran.
- Bien: es el mejor ejemplo de estado «truncado» y de exportación.
- Problemas: fechas con 3 maneras de entrada («Desde … hasta …» texto suelto), «Falta de digitación» podría vivir en el Inicio (F2).

## 14 · Análisis de caña (sonda) y 15 · Entrada de caña
`BarraHerramientas` con rango + estado + `Consultar`; resumen en `Dato` (`grid-cols-2…xl:grid-cols-9`) + tabla (máx 500, con aviso) + modal de detalle (sonda).
- Bien: aviso de truncado de 500, resumen que cuenta todo, modal con `dl`.
- Problemas: resumen de hasta 9 `Dato` sin jerarquía (todos iguales); tabla ancha con `truncate` [H].

## 16 · Usuarios, grupos y permisos `/admin`
3 pestañas (`role=tablist`) con master-detail (`w-72/80`), 8 `<table>` en total, historial de conexiones.
- Bien: pestañas con `aria-selected`; no expone contraseñas; solo lectura declarado en barra.
- Problemas: tabs en la `BarraHerramientas` junto al título (mezcla navegación y herramientas); pestaña «Pantallas» exige buscar ≥2 caracteres antes de listar **[V `:251`]** — sin mensaje previo claro; matriz de permisos con niveles (1/2/3) cuya semántica **inversa** (1=total, 2=sin acceso) se muestra como `Nivel` — verificar que el rótulo sea texto, no número [H].

## 17 · Tablas maestras `/maestras/:recurso`
Título + badge «Solo consulta», búsqueda con retardo, `Nuevo`, tabla `data-table` con acciones, modal de alta/edición.
- Visual 7 / Usab 6 / Consist 7 / Acces 6.
- Problemas: **U3** (5.000 filas, sin paginación/orden, `truncado` ignorado), borrado sin nombrar el registro, «—» en `text-slate-400` (~2,56:1), sin toast de éxito, acciones con IconButton sin etiqueta visible (OK por `label`, pero sin la identidad de la fila en el nombre accesible: «Editar» ×5.000 en un lector).
- Mejoras: `DataTable` con orden/paginación, `aria-label` «Editar {nombre}», confirmación nombrando el registro.
