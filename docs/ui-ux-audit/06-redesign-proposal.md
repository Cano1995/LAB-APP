# 06 · Propuesta integral de rediseño

Complementa `05-design-system.md`. Alcance: **UI/UX del front**; no toca API, permisos ni reglas de negocio. Cada propuesta indica el problema (ID en `07`) y el beneficio.

## 0. Principios para decidir

1. **Paridad funcional, no paridad visual.** Se conserva *qué* hace el GATEC viejo, se moderniza *cómo* se presenta.
2. **El dato manda.** Cromo mínimo, ancho para la grilla, nada que compita con los números.
3. **Una sola forma de hacer cada cosa** (elegir fechas, cargar, fallar, confirmar).
4. **Sobrio, no «de plantilla».** La referencia es la disciplina de Linear (densidad + teclado), Stripe (tablas, estados, copy claro), Notion (jerarquía plana), Vercel (barra única y ayuda contextual), Ramp/Shopify (estados de revisión y confirmación). **No se copian estilos**: de ellos se toman *principios*: atajos de teclado y paleta de comandos, tablas como ciudadano de primera clase, vacíos accionables, navegación de dos niveles, feedback inmediato.
5. **Cambios medibles**: cada mejora tiene un criterio de aceptación (ver `07`).

## 1. Estructura de navegación (arquitectura de información)

### 1.1 Shell único (`PageShell`) — resuelve U1, U2, R1, U4
```
┌ Menú ─┬──────────────────────────────────────────────────────────────┐
│logo   │ Inicio › GPI › Digitación diaria          [Zafra 2026 ▾] ☾ 🔔 │ ← barra única 48 px
│ 🔍 ⌘K ├──────────────────────────────────────────────────────────────┤
│ Inicio│ (acciones de la pantalla alineadas a la derecha de la barra)  │
│ GPI   │ ┌ panel lateral (colapsable) ┬ contenido ───────────────────┐ │
│ Lab   │ │ lista / árbol / filtros    │ datos                        │ │
│ Admin │ └────────────────────────────┴──────────────────────────────┘ │
│ Tablas│                                                                │
│ ───── │                                                                │
│ [JD]  │                                                                │
└───────┴──────────────────────────────────────────────────────────────┘
```
- Una barra (≈ 48 px) en lugar de dos (≥ 100 px): **recupera ≥ 52 px de alto**.
- Título = último tramo de las migas (implementa la prop `migas` que hoy se ignora). Una sola tipografía de H1.
- Las acciones de pantalla pasan a la derecha de la **misma** barra; los filtros específicos pasan a una **fila de filtros** (opcional, 40 px) bajo la barra, nunca envolviendo.
- Menú en `md`: hamburguesa con *drawer*; en `lg`: iconos con *flyout* (ver `05` §7).

### 1.2 Menú lateral — resuelve U5, U12, F3
- **Dos niveles**: módulo (Inicio, Proceso industrial, Laboratorio, Administración, Tablas) → pantalla. Las secciones del menú GATEC («Entrada diaria», «Consultas», «Supervisor», «Informes»…) pasan a **encabezados de grupo** (`section-label`, no desplegables) o a pestañas dentro de la pantalla. *Beneficio: elimina 3 niveles de sangría en 256 px.*
- **«Pend.»**: salen del menú. Se ofrece una página «Equivalencias GATEC» (tabla: opción vieja → estado/pantalla nueva) enlazada desde Ayuda. *Beneficio: el menú pasa de ~34 filas a ~11 útiles; el usuario que viene del VB6 igual encuentra qué falta.*
- **Favoritos y recientes**: ★ junto a pantallas (persistido por usuario, como `recientes.ts`).
- **Paleta Ctrl+K**: pantallas + planillas + variables + registros de maestras («ir a planilla Brix de jugo»). Funciona aun con menú oculto. *Resuelve U4 y acorta F1.*

### 1.3 Contexto empresa/zafra — resuelve F6
- Chip en la barra («Zafra 2026 · AZPA») que abre un popover con empresa y zafra.
- Si hay **borradores sin grabar**, el cambio pide confirmación (`ConfirmDialog`) y lista lo que se perdería.
- **[H]** Validar con usuarios si cambian de empresa; si no, mantener solo zafra.

## 2. Rediseño por flujo crítico

### F1 · Digitación diaria (prioridad 1)
**Qué se conserva**: árbol de planillas, día actual de digitación, columnas por lote/hora, filas calculadas, colores de «fuera de especificación», edición por celda con control de concurrencia, impresión, Excel.

**Qué cambia**
1. **Barra de acciones** → agrupada y priorizada (G1):
   ```
   [‹] [ 30/10/2026 📅 ] [›]  [Hoy]  · Vista: [1 día ▾ | 8 días] · [Columnas ▾] · [Inactivas ◻] · [⎙] [Excel]        [Descartar] [Grabar (3)]
   ```
   - Fecha como paso «‹ fecha ›» + «Hoy» (sustituye `−7/−1/+1/+7/«/»`, que pasan a atajos `Alt+←/→`, `Shift+Alt+←/→`, y a la vista «8 días»).
   - `Id/Esp/Sem/Acum` → menú **Columnas** con casillas.
   - «Fijar fecha» → ajuste dentro del menú de vista (con texto explicativo, no solo `title`).
   - **Una** acción primaria visible: `Grabar (n)`; aparece **fija a la derecha** de la barra y no se envuelve.
2. **Panel de planillas**: pestañas «Mis planillas / Recientes / Todas (árbol)»; colapsable a rail de 48 px; ancho 280. *Resuelve R2: +~270 px para la grilla.*
3. **Grilla (patrón ARIA grid)** — resuelve A3:
   - Un tab-stop; flechas mueven; **Enter** confirma y baja; **Tab** confirma y va a la derecha; **F2/escribir** edita; **Esc** cancela; **Ctrl+Z** deshace la última celda en borrador.
   - Celdas editables con afordancia permanente sutil (fondo `surface` + borde `line` visible al hover/foco); las calculadas con Σ y bloqueo (ya existe).
   - Indicadores: celda modificada (marca en esquina + `brand-100`), fuera de especificación (rojo + ícono ⚠ **dentro** de la celda, no solo `title`), conflicto (`warning`).
   - **Tras grabar**: toast «3 celdas grabadas» y las filas calculadas afectadas pasan a estado «recalcula al cerrar el día» (badge en fila) hasta el cierre. Resuelve la ambigüedad de 03 F1.
4. **Guarda de navegación (D1, P1)**: `useBlocker` de React Router + `beforeunload` + confirmación al cambiar zafra; estado `sucio` elevado a un contexto (`BorradorContext`) para que el menú lo respete. `ConfirmDialog` en lugar de `window.confirm` (U6).
5. **Encabezado de día**: color de selección = `brand` (no verde) con texto blanco 4,5:1+ (A2).
6. **Densidad**: `compact` (28-30 px) y opción «Comodidad». Congelar columnas Orden/Descripción (ya) y la fila de encabezados (ya).
7. **Rendimiento percibido**: virtualizar filas > 80 [H medir].

**Criterios de aceptación** (ver `07`): 8 días visibles a 1366 px con el panel colapsado; digitar 20 celdas sin ratón; 0 pérdida de borrador en tests e2e de «navegar con cambios».

### F2 · Inicio por rol
- Bloque superior «Requiere atención» (fuera de especificación hoy, planillas sin digitar, notificaciones sin leer) con **enlace profundo** a los listados ya filtrados.
- KPI actuales de balanza/sonda con comparativo («▲ 4,2 % vs ayer») y mini-tendencia (sparkline).
- Accesos recientes + favoritos (ya existe base).
- Respeta permisos: el Inicio de un usuario sin laboratorio muestra proceso, no un vacío.
- **Quitar** el resplandor y el vidrio (V4) o dejarlos solo en tema claro: opcional.

### F3-F4 · Consultas con gráfico
- `MasterDetail` + `DateRange` con presets (Hoy, 7 d, 30 d, Zafra, Personalizado) y `min/max` (prevención de rango inválido).
- Botón primario fijo en la barra; **aplicar automáticamente** si el costo de la consulta es bajo, con indicador «Actualizado hh:mm» y botón «Actualizar».
- Resultado con **grafico + tabla** en pestañas o 2 columnas; exportación en un solo menú «Exportar ▾» (CSV/Excel/Imprimir).
- Glosario CEP: tooltips «LCS: límite de control superior» en cabeceras (hoy solo siglas).
- Series con **trazo + marcador** además de color (daltonismo) y etiquetas directas al final de línea.

### F5 · Tablas maestras
- `DataTable`: orden por columna, paginación (50/100/250) o virtualización, aviso «Mostrando los primeros 5.000 de N: afine la búsqueda» (usa el `truncado` que la API ya manda).
- Borrado: `ConfirmDialog` que **nombra** el registro y su código («Eliminar «Zafra 2026» (cód. 12)»); acciones con nombre accesible «Editar {nombre}».
- Toast de éxito; tras crear, resaltar la fila nueva.
- Formulario: validación en cliente (`required`, tipos), `Field error`, foco al primer inválido.

### F6 · Administración
- Pestañas pasan de la barra de herramientas a una fila propia bajo el título (separa navegación de acciones).
- Pestaña Pantallas: mostrar lista inicial (o instrucción clara) en vez de exigir ≥2 caracteres sin pista.
- Niveles de acceso con **texto + ícono** («Total», «Parcial», «Sin acceso») — nunca el código numérico crudo.

### F7 · Login
- Mostrar/ocultar contraseña; aviso de Bloq Mayús; mensaje de intentos restantes antes del bloqueo; «Su contraseña de Oracle» → «La misma contraseña con la que ingresa a GATEC» (**validar con usuarios**).
- Unificar logo y formulario en un solo panel.

## 3. Mejoras funcionales transversales

| Área | Propuesta | Resuelve |
|---|---|---|
| Feedback | `Toast` + región `aria-live`; estados «Guardando… / Guardado hh:mm» | falta de confirmación de éxito |
| Validación | `Field error`, fechas con `min/max`, deshabilitar «Consultar» con tooltip del motivo | errores solo posteriores |
| Carga | `LoadState` con texto «Cargando planilla…» (visible o `sr-only`) y skeletons con la forma de la tabla | spinners mudos |
| Error | `Alert` con «Reintentar» y detalle expandible (código de error de la API sin datos internos) | recuperación |
| Vacíos | Mensaje + causa + siguiente paso («No hay análisis ese día. Pruebe el día anterior ‹ o cambie de planilla») | vacíos pobres |
| Accesibilidad | skip-link, `caption/scope`, ARIA grid, `aria-live`, objetivos ≥ 24 px, contraste AA | auditoría 03 §4 |
| Teclado | atajos documentados en un diálogo `?` | descubribilidad |
| Responsive | ver `05` §7 | R1/R2 |

## 4. Qué conservar / modificar / eliminar / crear

| | Elemento |
|---|---|
| **Conservar** | Paleta y roles de color; `Modal`; `Alert` (con cambios menores); `Badge`; `.panel`; `Dato`; `LineChart` (refactor de color); lazy por pantalla; tema claro/oscuro; recientes por usuario; avisos de truncado (listados, sonda); concurrencia y auditoría en Digitación |
| **Modificar** | `AppHeader`+`BarraHerramientas` → `PageShell`; `<aside>` fijos → `MasterDetail`; toolbar de Digitación; `ContextoSelector`; menú lateral (2 niveles, favoritos); `EmptyState`; tablas; login |
| **Eliminar** | Space Grotesk; `font-bold`; `window.confirm`; botón `»` o `Hoy` duplicado; `migas` ignorada (o implementarla); texto «Pend.» 9 px en el menú; hex y escalas Tailwind crudas; degradado de menú (opcional) |
| **Crear** | `PageShell`, `MasterDetail`, `DateRange`, `LoadState`, `DataTable`, `ConfirmDialog`, `Toast`, `CommandPalette`, `ColumnsMenu`, guarda de navegación, skip-link, catálogo de componentes, regresión visual |

## 5. Riesgos y cómo mitigarlos

| Riesgo | Mitigación |
|---|---|
| Usuarios con memoria muscular del GATEC rechazan cambios | Mantener nombres de menús; **atajos equivalentes** (F2, doble clic siguen funcionando); piloto con 2-3 analistas (`docs/sesion-validacion-sprint17.md`); no cambiar el comportamiento de cierre/recalculo |
| Romper la edición de GPI (única escritura) | Rediseño de grilla tras `tools/e2e/sprint18.js` verde y con interruptor de escritura apagado en el primer corte |
| Romper impresión | Mantener `ImpresionPlanilla`; añadir prueba e2e de `window.print` (captura PDF) |
| Regresión en tema oscuro | Catálogo + capturas claro/oscuro en CI (`07` Fase 0) |
| Esfuerzo | Faseado: primero componentes y patrón (Fase 1-2), después pantallas por orden de impacto |
