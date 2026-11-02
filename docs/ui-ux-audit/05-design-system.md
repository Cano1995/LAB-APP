# 05 · Propuesta de sistema de diseño

Principio rector: **evolucionar, no reemplazar.** Los tokens actuales (`web/src/tema.css`) y el documento `docs/ui-sistema-visual.md` ya resuelven color, contraste, radios y densidad. Esta propuesta añade lo que falta (semántica, patrones, estados) y corrige las desviaciones. Sin cambio de tecnología: React + Tailwind + variables CSS + Lucide.

Cada ítem: **Problema que resuelve → Beneficio esperado.**

## 1. Color

### Conservar tal cual
Marca `brand-*` (matiz 264, primario `brand-800`), `canvas/surface/ink/muted/line/control`, estado `info/success/warning/danger`, `calc`. *Beneficio: cero regresión visual; ya validado a AA en claro.*

### Cambiar: de escalas Tailwind re-mapeadas a **tokens semánticos**
| Hoy (clase que engaña) | Propuesta | Problema que resuelve |
|---|---|---|
| `text-slate-700` (secundario fuerte) | `text-secondary` | El nombre dice «700» y en oscuro es casi blanco |
| `text-slate-500/600` | `text-tertiary` / `text-muted` (ya existe) | idem |
| `text-slate-400` para vacío/«Pend.» | `text-disabled` con piso ≥ 3:1 y **nunca para texto con significado** | Contraste 2,56:1 |
| `bg-slate-50/100` | `bg-subtle` / `bg-hover` | `hover:bg-slate-50` cambia de sentido por tema |
| `border-line` / `border-control` | se mantienen | — |
| `red/green/amber/blue-*` en `Alert`/`Badge` | `bg-danger-subtle text-danger-strong`, `…-success…`, `…-warning…`, `…-info…` (4 × 3 tokens) | Quita ~12 entradas de escala y `dark:` sueltos |
| `emerald-600`, `violet-*`, `pink-*` (Digitación) | `--col-dia-selec`, `--col-semanal`, `--col-zafra` (nuevos, probados AA en ambos temas) | Colores fuera de sistema, 3,77:1 |
*Beneficio: un desarrollador nuevo adivina la clase; se puede forzar con una regla de lint («prohibido `slate-*`, `emerald-*`… en `web/src`») y se acaba el `dark:` ad hoc.*

### Nuevos tokens de dato
`--chart-1…8` (reemplaza `PALETA` + tabla `EN_OSCURO` en `LineChart.tsx:10,29`), `--limit-control`, `--limit-spec`, `--center-line` (CEP). *Beneficio: el gráfico cambia de tema sin tabla de equivalencias y los límites CEP usan semántica real (rojo/ámbar/verde).*

### Reglas de uso
1. Una acción primaria (`brand-800`) por vista.
2. Verde = estado correcto, **no** selección (hoy se usa verde para «día elegido»); la selección es `brand-100` + marca lateral (ya definido para filas del árbol).
3. Ningún color como único portador de significado: fuera de especificación = rojo **+ ícono + texto accesible**, no solo `title`.
4. Todo par texto/fondo nuevo se valida contra AA y se anota en la tabla del documento (incluida la columna oscura, hoy ausente).

## 2. Tipografía

| Rol | Hoy | Propuesta | Por qué |
|---|---|---|---|
| Familia | Inter + Space Grotesk (solo H1 de 3 pantallas) | **Inter** únicamente | Una fuente menos que cargar; elimina el 2º estilo de H1 (U2); Inter con `tnum` es ideal para cifras |
| H1 de pantalla | 18/600 Space Grotesk **o** 15/600 Inter | `text-title` 18/600 Inter en **todas** (dentro de `PageShell`) | Consistencia |
| H2 panel | `.panel-title` 13/600 | igual (renombrar `text-heading`) | — |
| Datos | `text-[13px]` ×70 | token `text-data` 13/20 | Quitar valores mágicos |
| Cuerpo/controles | 14 | igual `text-body` | — |
| Secundario | 12 | igual `text-caption` | — |
| Piso | 9/10/11 px | **12 px mínimo** para todo texto con significado; 10-11 solo para badges numéricos | Legibilidad (9 px «Pend.») |
| Pesos | 400/500/600 cargados, `font-bold` usado | **solo 400/500/600**; sustituir `font-bold` por `font-semibold` | Evita negrita sintética |
| Cifras | `tabular-nums` manual | clase `.num` (`tabular-nums` + `text-right`) en `DataTable` | Alineación consistente |

## 3. Espaciado, radios, sombras, bordes
- **Escala**: 4 px base (4, 8, 12, 16, 24, 32). Hoy hay `p-2/3/4`, `px-6 py-6`, `gap-3/4/5`, `py-1.5/2.5` mezclados; fijar tokens de **gap de página (16)**, **padding de panel (16)**, **padding de celda (12×8)**.
- **Radios**: 6 (control), 8 (panel/modal) — se mantienen.
- **Sombras**: ninguna salvo `shadow-popover` (campana, menús desplegables) y `shadow-modal`. Se mantiene (hoy `shadow-lg` y `shadow-xl` sueltos).
- **Bordes**: `line` separa, `control` identifica controles — se mantiene.
- **Densidad**: introducir **dos densidades** de tabla (`comfortable` 36 px, `compact` 28-30 px) como atributo del componente, no como clases sueltas; la grilla de Digitación usa `compact` y es la que más gana. *Beneficio: ~25 % más filas visibles sin tocar tipografía.*

## 4. Iconografía
Lucide, grosor 1,75, 16 px (control) y 14 px (listas), **se mantiene**. Reglas añadidas: (a) ícono solo si cumple función; retirar `Clock`/`Bell` decorativos de títulos de panel; (b) estado = ícono + texto (rojo + `AlertCircle` + «Fuera de especificación») en vez de solo color.

## 5. Componentes — inventario propuesto

**Existentes (conservar, pulir)**: `Button`, `IconButton`, `Input`, `SearchInput`, `Select`, `Checkbox`, `Field`, `Alert`, `Badge`, `Modal`, `FormActions`, `Dato`, `EmptyState`, `Spinner`.
- `Button`: añadir variante `toolbar` (32 px, sin relleno, con `aria-pressed`) para los toggles de barra; `size="icon"`.
- `Field`: soporte de `error` (resalta, `aria-invalid`, `aria-describedby`) → resuelve validación solo-servidor.
- `Alert`: `action` opcional («Reintentar»).
- `EmptyState`: ícono + título + texto + acción opcional.
- `Spinner`: con `label` (texto visible o `sr-only`).
- `Checkbox`: área clicable ≥ 24 px (WCAG 2.5.8).

**Patrones repetidos a extraer** (hoy copiados; fuente: grep en `web/src/pages`):
| Nuevo componente | Qué reemplaza | Archivos afectados |
|---|---|---|
| `PageShell` (barra única: título, acciones, contexto, menú móvil; slot de contenido) | `AppHeader` + `BarraHerramientas` + `<main max-w-6xl …>` | 15 pantallas |
| `MasterDetail` (panel lateral **colapsable/redimensionable**, `drawer` bajo `lg`) | `<aside className="flex w-80 shrink-0 …">` ×10 | Digitación, Valores, Supervisorio, CEP, Correlación, Informes, Boletines, Admin |
| `DateRange` (desde/hasta con `min/max`, presets Hoy/7 d/Mes/Zafra, un solo estilo) | 9 implementaciones | todas las de consulta |
| `LoadState` (`<Cargando/>`, `<Error con Reintentar/>`, `<Vacío/>`, `<Truncado/>`) | spinner mudo ×15, `Alert error` ×30, `EmptyState` | todas |
| `DataTable` (encabezado fijo, orden, `caption/scope`, densidad, paginación o virtualización, selección de fila, acciones con nombre accesible) | `.data-table` y ~20 `<table>` manuales | Maestras, Admin, Informes, Listados, Sonda, Entrada, Metas… |
| `ConfirmDialog` (sobre `Modal`) | `window.confirm` ×3 y el modal de borrado | Digitación, Maestras |
| `Toast` (región `aria-live=polite`) | feedback de éxito inexistente | Maestras, Digitación |
| `CommandPalette` (Ctrl+K: pantallas + planillas + variables) | buscador del `Sidebar` | global |
| `ColumnsMenu` / `ToolbarGroup` | botones `Id/Esp/Sem/Acum` y similares | Digitación, Valores |

*Beneficio conjunto*: cambiar cromo/filtros/estados en **un** archivo; elimina las 3 clases de inconsistencia más visibles (títulos, fechas, cargas) y prepara el responsive de una vez.

## 6. Estados de interacción (matriz unificada)
| Estado | Botón | Campo | Fila/ítem navegable | Celda editable |
|---|---|---|---|---|
| Reposo | — | borde `control` | — | sin borde; **afordancia** (cursor, borde punteado al hover de la fila) |
| Hover | un tono | borde `muted` | `bg-hover` | `bg-hover` + borde `control` |
| Foco | anillo 2 px `brand-600` + offset 1 | borde `brand-800` + anillo 30 % | anillo | anillo |
| Activo/pulsado | un tono más oscuro | — | — | — |
| Seleccionado | `aria-pressed` + relleno `brand-100` (toolbar) | — | `brand-100` + marca lateral 2 px `link` | borde `brand-800`, fondo `brand-100` |
| Deshabilitado | 50 % opacidad | fondo `subtle`, texto legible | gris + candado | no editable (calculada) |
| Cargando | `loading` | skeleton | skeleton | spinner en celda |
| Error | — | borde `danger` + texto + `aria-invalid` | — | borde `danger` + tooltip + `aria-describedby` |
| Pendiente de grabar | — | — | — | `bg-brand-100` + marca de cambio (punto en la esquina) |
| Desactualizada | — | — | fila calculada tras grabar: sufijo «recalcular al cerrar el día» | — |
Casi todo ya existe; se formaliza para que `DataTable` y `PageShell` lo hereden.

## 7. Layout y breakpoints
| Breakpoint | Comportamiento propuesto |
|---|---|
| ≥ 1280 (xl) | Menú lateral 224-256 px + panel lateral de la pantalla (colapsable) + contenido |
| 1024-1279 (lg) | Menú **compacto de iconos** (56 px) con *flyout*; panel lateral colapsado por defecto en pantallas con grilla ancha |
| 768-1023 (md) | Menú oculto con hamburguesa en `PageShell`; panel lateral en **drawer** |
| < 768 (sm) | Solo consulta: menú en drawer, tablas con desplazamiento horizontal y 1ª columna fija, sin edición de grilla (ver decisión de alcance móvil en `07`) |
Contenedor de contenido: `max-w-6xl` solo para Inicio/Maestras; pantallas de datos a ancho completo.

## 8. Navegación (estructura, detalle en `06`)
- Menú lateral con **dos niveles** (módulo → pantalla); las «secciones/submenús» del GATEC pasan a ser **encabezados** o pestañas dentro de la pantalla.
- `Pend.` fuera del menú principal.
- Migas dentro de `PageShell` (reemplaza la prop muerta).
- Paleta de comandos (Ctrl+K).

## 9. Accesibilidad como parte del sistema
Cada componente nuevo se entrega con: nombre accesible, orden de foco, atajo documentado, contraste verificado, texto alternativo en estados. **Skip-link** en el layout; región `aria-live` para toasts y para el resultado de consultas («Se cargaron 120 filas»). Grillas editables siguen el patrón **ARIA grid** (flechas, Home/End, Enter/F2) con un único tab-stop.

## 10. Gobernanza
- Lint de clases prohibidas (escalas crudas, `text-[Npx]` fuera de tokens, hex en `web/src` salvo `print` y `chart`).
- Una **página de catálogo** (`/dev/componentes`, solo desarrollo) con todos los estados en claro y oscuro → base para revisión visual y regresión (ver `07` Fase 0).
- Actualizar `docs/ui-sistema-visual.md` (tema oscuro, foco azul, alcance responsive) como **fuente única**; hoy contradice al código en tres puntos.
