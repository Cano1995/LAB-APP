# 03 · Auditoría de experiencia (UX)

Evidencia: **[V]** verificado en código · **[H]** hipótesis a validar con usuarios (ver `docs/validacion-con-usuarios.md` y `07` §Validación).
Todo lo de aquí se deriva de lectura de código; nadie usó la app con datos durante esta auditoría.

## 1. Perfiles y tareas

| Perfil | Tarea principal | Frecuencia [H] | Pantallas |
|---|---|---|---|
| Analista de laboratorio / proceso | Digitar resultados del día por planilla; revisar fuera de especificación y falta de digitación | Diaria, muchas veces | Digitación, Listados |
| Supervisor / jefe de proceso | Mirar tendencias y cumplimiento (valores, supervisorio, panel, CEP, metas, boletines) | Diaria | Inicio, Valores, Supervisorio, Panel, CEP, Metas, Boletines |
| Balanza / recepción | Entradas de caña y análisis de sonda | Diaria en zafra | Sonda, Entrada de caña, Inicio |
| Administrador | Consultar accesos y conexiones; mantener tablas maestras | Ocasional | Admin, Maestras |

## 2. Flujos importantes

### F1 · Digitar el análisis del día (flujo crítico)
1. **Quiere**: abrir su planilla de hoy, cargar valores de esta jornada, grabar, estar seguro de que quedó.
2. **Hoy**: menú lateral → *Proceso Industrial (GPI)* → *Entrada diaria* → *Digitación diaria* (3 clics + desplegar grupos; el estado abierto se recuerda en memoria de página, no entre sesiones) → árbol «Análisis» (otro árbol, 2º nivel de navegación) → elegir planilla → fecha ya viene en «día actual de digitación» → doble clic en celda blanca → escribir → Enter → repetir → **Grabar (n)** → mensaje.
3. **Dificultades** [V]:
   - **D1 · Pérdida silenciosa del borrador (P1)**: lo digitado vive en estado local (`borrador`). Se protege solo contra cambios *dentro* de la página (`descartar()` con `window.confirm`, `GpiLancamentoPage.tsx:22`). Pero (a) un clic en cualquier enlace del menú lateral desmonta la pantalla sin aviso; (b) cambiar la zafra en el selector (`ContextoSelector.tsx:42`) hace `qc.clear()` y `Routes key={claveContexto}` (`App.tsx:89`) remonta todo; (c) no existe guarda `beforeunload` ni bloqueo de navegación de React Router. Con la edición activada (interruptor de servidor), un analista que digitó 40 celdas puede perderlas con un clic. Hoy el riesgo está acotado porque la escritura va tras `ESCRITURA_GPI_DIGITACION` (apagada por defecto).
   - **Edición solo por doble clic / Enter / F2**; la única pista es una línea de texto gris `text-xs` que **desaparece** en cuanto hay un resultado o pendientes (`:373`). La celda editable se ve igual que la de lectura (sin borde ni afordancia); en táctil no hay doble clic fiable. **[H]** curva de aprendizaje para quien no venía del VB6.
   - **Sin navegación por flechas** entre celdas (patrón de hoja de cálculo): cada celda es un tab-stop (`tabIndex=0`) y cada **fila** también (`:580`): una planilla de 60 variables × 8 columnas son ~500 paradas de Tab, sin que Enter pase a la celda de abajo [V]. Para quien digita todo el día con teclado es el mayor ahorro de tiempo posible **[H: confirmar con observación]**.
   - **Resultado ambiguo tras grabar**: «Las variables calculadas y los acumulados se actualizan al cerrar el día (todavía no desde esta pantalla)» (`:228`) — el usuario graba pero las filas amarillas (calculadas) siguen mostrando el valor viejo: parece que algo falló. Es una limitación del producto (motor de fórmulas aún no habilitado para escribir), pero la UI debe **marcarlas como «desactualizadas»** y no solo avisarlo una vez en un `Alert` que se cierra al siguiente cambio.
   - **Toolbar cargada (G1, P1)**: ver 02 §4. La acción primaria «Grabar (n)» aparece/desaparece al inicio de una fila envolvente y puede quedar en la 2ª línea según el ancho.
   - **Grilla angosta (R2)**: a 1100 px, ~524 px de ancho útil; la columna «Descripción» fija (`min-w-64`=256) deja ~200 px para valores.
4. **Pasos innecesarios**: elegir planilla por árbol (podría ser «Mis planillas» + búsqueda + últimas usadas); «Fijar fecha» como modo oculto; dos botones para ir a hoy.
5. **Ideal**: ver `06` §F1 — «Mis planillas / recientes» arriba, árbol colapsable, barra con *una* acción primaria Grabar fija, selector de día tipo «‹ 30/10/2026 ›» + «Hoy», «Columnas ▾» con Id/Esp/Sem/Acum, edición directa con flechas/Enter/Tab, guarda de navegación, filas calculadas marcadas como pendientes tras grabar.

### F2 · Mirar cómo va el día/zafra (supervisor)
1. **Quiere**: abrir y ver en <10 s si algo está fuera de rango o falta digitar.
2. **Hoy**: Inicio muestra 4 KPI de **balanza/sonda** (camiones, toneladas, análisis, Pol) y barras de 14 días; **no** muestra fuera de especificación ni falta de digitación de proceso, que existen como Listados (3 clics en el menú) [V `Dashboard.tsx`]. Los KPI solo aparecen si `data.lab` (`:59`): un supervisor de proceso sin permiso de laboratorio ve un Inicio casi vacío con «Accesos sugeridos» [V].
3. **Dificultades**: el número sin comparativo (vs ayer/meta); sin alertas accionables; las **notificaciones** están (campana + panel) pero no se sabe qué las genera [H].
4. **Ideal**: Inicio por rol con «Qué requiere atención» (n fuera de especificación hoy, n variables sin digitar, últimas notificaciones) con enlace directo al listado filtrado.

### F3 · Encontrar una pantalla
1. **Hoy** [V]: menú con búsqueda (`/` o Ctrl+K enfocan el campo, filtra por título/programa/módulo, Enter abre el primer resultado) — buena base. Problemas: (a) con el menú oculto o en <768 px el atajo no hace nada (U4); (b) el buscador **solo encuentra pantallas**, no planillas, variables, usuarios ni registros; (c) el resultado se agrupa en las mismas carpetas del GATEC viejo, incluidas ~23 opciones «Pend.» que aparecen en la búsqueda también [V].
2. **Ideal**: paleta de comandos real (Ctrl+K) con pantallas + planillas + variables; las «Pend.» fuera del menú principal (a una página «Próximamente / equivalencias con GATEC» para quien venga del viejo).

### F4 · Consultar valores con gráfico (Valores, Supervisorio, CEP, Correlación)
- Patrón repetido: lista a la izquierda (variables/paneles) + rango de fechas + botón explícito (`Consultar`/`Calcular`) + resultado. Es coherente; **pero el resultado no se actualiza al cambiar filtros** (requiere botón) y el estado «sin consultar» muestra solo `EmptyState` [V `ConsultaValoresPage.tsx:173`]. **[H]** Si los datos tardan poco, auto-consultar y reservar el botón para rangos pesados.
- Rango inválido: un `Alert` rojo «La fecha final es anterior a la inicial» **después** de equivocarse; sería mejor prevenir (`min/max` en los inputs) [V: ningún `type=date` usa `min`/`max`].
- Exportar CSV/Excel: botones en distintos lugares (barra, cabecera de panel).

### F5 · Mantener una tabla maestra (admin)
1. **Quiere**: buscar un registro, editarlo o crear otro.
2. **Hoy** [V `MaestraPage.tsx`]: sidebar → «Tablas maestras» → módulo → tabla → buscar (con retardo) → ícono lápiz → modal.
3. **Dificultades**:
   - **U3 · Sin paginación ni orden (P2)**: hasta **5.000 filas** en el DOM (`LIMITE_MAESTRAS = 5000`, `maestras.service.js:155`); la API devuelve `truncado` pero **la UI nunca lo muestra** (no aparece en `MaestraPage.tsx`) → si hay más de 5.000 el usuario cree que ve todo. El pie dice «{n} registro(s)».
   - **Confirmar borrado sin identificar el registro**: «¿Eliminar este registro? Esta acción no se puede deshacer.» No dice cuál (código/nombre) [V `:149`]. Con 2 botones de ícono (lápiz/papelera) de 28 px juntos, el riesgo de error es real.
   - La edición **no permite deshacer** ni ofrece confirmación de éxito (el modal se cierra y la fila cambia; sin `Alert`/toast) **[H]**.
   - Columnas **sin orden ni anchos ajustables**.
4. **Ideal**: paginación/virtualización + orden por columna + aviso de truncado, borrado que nombra el registro, toast de «Guardado».

### F6 · Cambiar de zafra/empresa
- `ContextoSelector`: solo se puede cambiar **zafra** de la empresa actual; la empresa se muestra como texto (`:32-35`). Si un usuario tiene varias empresas no hay forma de cambiarla desde la UI **[H: confirmar si el caso existe; el código y el comentario hablan de «empresa/zafra»]**. Al cambiar, **se pierde todo estado** (filtros, selecciones, borradores; ver D1) sin aviso. Es una acción global con efectos grandes presentada como un `<select>` pequeño en una barra casi vacía.

### F7 · Iniciar sesión
- Flujo corto y claro. Mejoras menores: el texto «Use su usuario de GATEC y su contraseña de **Oracle**» usa jerarquía técnica ajena al usuario (**V3, P3**) — [H] ¿saben los usuarios que su contraseña es "de Oracle"? Falta mostrar/ocultar contraseña y aviso de Bloq Mayús. Hay **bloqueo de cuenta tras 2 fallos** (15 min, ver CLAUDE.md): el login debe **advertir antes del segundo intento** («queda 1 intento antes de bloquear 15 min») — hoy la UI solo muestra el error del servidor **[H: confirmar texto real devuelto en 401 y 429]**.

## 3. Evaluación por criterio

| Criterio | Nota | Evidencia |
|---|---|---|
| Aprender | 6 | Menú en la jerarquía del GATEC ayuda a los veteranos; novatos enfrentan carpetas + secciones + submenús + ~23 «Pend.»; edición por doble clic sin pista persistente |
| Navegar | 6 | Búsqueda del menú buena; sin migas; 3 columnas de navegación; atajo frágil (U4) |
| Pasos por tarea | 6 | F1 largo para quien repite la misma planilla; no hay «favoritos»/últimas planillas (existen «Accesos recientes» solo a nivel de **pantalla**) |
| Claridad de acciones | 6 | Toolbar Digitación (G1); resto de pantallas claras |
| Consistencia de comportamiento | 6 | Distintas disposiciones para filtros/acciones; `confirm` nativo vs `Modal` |
| Feedback | 7 | `loading` en botones, `Alert` success/warning/error, skeletons en Inicio/Maestras; falta toast de éxito y estado «guardado» persistente |
| Prevención de errores | 5 | Sin `min/max` en fechas; borrado sin nombre; D1; validación `required` solo servidor [H] |
| Recuperación de errores | 5 | Mensaje de error sin «Reintentar»; sin deshacer |
| Claridad de mensajes | 7 | Español, concretos (conflicto de celdas, truncados «filtre para ver el resto») |
| Carga cognitiva | 6 | Alta en Digitación y menú; baja en listados |
| Accesibilidad | 5 | Ver `02` §5 y §4 abajo |
| Móvil | 2 (por diseño) | Ver §5 |

## 4. Accesibilidad de la experiencia (WCAG 2.2 AA) — resumen
| Criterio | Estado | Detalle |
|---|---|---|
| 1.4.3 Contraste | ❌ puntual | Encabezado de día 3,77:1; «Pend.» y «—» ~2,56:1 |
| 2.4.1 Saltar bloques | ❌ | Sin «Saltar al contenido»; el menú tiene decenas de enlaces antes del contenido (`App.tsx`) |
| 2.4.3/2.1.1 Teclado | ⚠️ | Modal y menú bien; grilla de Digitación: ~500 tab-stops, sin flechas |
| 2.4.7/2.4.11 Foco visible | ✅ | Anillo en botones/enlaces (`index.css:33`); celdas editables con `focus-visible:ring-2` |
| 2.5.8 Tamaño de objetivo (24 px) | ✅/⚠️ | Botones 32/36 px; `IconButton` de tabla 28 px (cumple); checkboxes `h-4 w-4` (16 px) **fallan 24 px** aunque la etiqueta clicable los compensa |
| 4.1.2 Nombre/rol/valor | ⚠️ | `IconButton` siempre con `label` (bien); `Spinner` `aria-hidden` sin texto; `<th>` sin `scope`; `<td role="button">` dentro de tabla rompe semántica de grilla |
| 4.1.3 Mensajes de estado | ⚠️ | `Alert` usa `role=status/alert` (bien); cargas y resultados de consulta no anuncian nada |
| 1.3.1 Información y relaciones | ⚠️ | 0 `<caption>`; `aria-current` y `aria-pressed` presentes (bien) |
| Color como único portador | ⚠️ | Fuera de especificación = rojo + negrita + `title` (solo mouse); calculadas = amarillo + Σ (ok) |
| Alcance de cobertura | ⚠️ | 0 atributos aria/role en CEP, Correlación, Panel y Login → [H] revisar gráficos con lector (el `LineChart` tiene 6 aria) |

## 5. Móvil/tablet
- **R1 (P1; P0 si móvil entra en alcance)** [V `Sidebar.tsx:156`, `AppHeader.tsx:22,34-37`]: bajo 768 px el `Sidebar` es `hidden` y el `AppHeader` solo muestra logo + «Salir» (el botón de mostrar menú es `hidden … md:grid`). **No hay forma de navegar a ninguna pantalla**; solo el Inicio y sus «Accesos recientes». No existe menú hamburguesa/drawer.
- Panel lateral `w-72/80/96 shrink-0` en 10 pantallas: a 390 px el panel ocupa 74-98 % del ancho y el contenido queda a <100 px (`min-w-0` en `main` lo comprime) [V geometría; no renderizado].
- Consecuencia: la decisión «escritorio-only» está **escrita pero no aplicada**; un usuario en tablet (768-1023 px: sidebar visible, 256 px menos) tiene la peor experiencia. **Decisión de producto pendiente** (ver `07` Preguntas abiertas).

## 6. Situaciones de confusión/abandono previsibles
1. Grabo y las filas amarillas no cambian → «¿no se guardó?» (F1).
2. Cambio de zafra y desaparecen mis filtros/borrador.
3. Busco un listado en el menú y encuentro 3 opciones «Pend.» iguales de las que sí existen.
4. En Maestras no encuentro un registro porque pasaban de 5.000 sin aviso.
5. Ctrl+K no responde (menú oculto).
6. Escribo la fecha final antes que la inicial; el error llega después.
7. Digitador sin ratón: tabula 500 veces.
