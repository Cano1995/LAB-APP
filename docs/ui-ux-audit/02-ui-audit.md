# 02 · Auditoría visual (UI)

Leyenda de evidencia: **[V]** verificado en código o cálculo · **[H]** hipótesis (requiere verlo con datos reales o validar con usuarios).
IDs `Uxx` = hallazgos globales, referenciados en `07-improvement-roadmap.md`. Severidades P0-P3 definidas allí.

## Veredicto corto
La base visual es **sobria y coherente**: paleta azul con pocos acentos, tokens por tema, bordes de 1 px, sin sombras ni gradientes en pantallas de datos, tipografía legible, controles de altura constante. No es una "plantilla genérica de dashboard". Los problemas **no** están en el estilo, sino en (1) el **cromo apilado y de ancho fijo** que se come el espacio de los datos, (2) **inconsistencias de jerarquía** entre pantallas, (3) **colores y componentes que se salen del propio sistema**, y (4) **accesibilidad** (contraste puntual, estados de carga mudos, grillas sin semántica).

## 1. Identidad visual

### Paleta — conservar [V]
- Marca `brand-800 #1A3A8F` como acción primaria; escala 50-950 (`tema.css`). Neutros con rol (`canvas`, `surface`, `ink`, `muted`, `line`, `control`) y estado (`info/success/warning/danger`).
- El documento calcula contrastes (`ui-sistema-visual.md:37-50`) y las decisiones son correctas: `warning` nunca como texto, borde de campo `control` (3,25:1) distinto del borde de panel `line`, placeholders en `muted`.
- Evaluación: **de lo mejor resuelto del producto**. No cambiar el azul ni la lógica de roles.

### Colores que se salen del sistema [V] — **U7 (P2)**
| Dónde | Qué | Problema |
|---|---|---|
| `GpiLancamentoPage.tsx:393` | `bg-emerald-600` + texto blanco 12 px (encabezado del día elegido) | Verde crudo de Tailwind fuera de tokens. **Contraste calculado 3,77:1** (#059669 sobre blanco) < 4,5:1 exigido para texto normal (WCAG 1.4.3). Además contradice la regla «verde = estado bueno» (aquí marca *selección*) |
| `GpiLancamentoPage.tsx:397-398,667-668` | `violet-*`, `pink-*` (Semanal / Zafra) | Dos matices sin token; en oscuro se parchean a mano con `dark:` (el resto del sistema no necesita `dark:`) |
| `GpiLancamentoPage.tsx:590,642` | `#EAB308`, `#2A55C4` en `shadow-[inset…]` | Hex duplicado de `--warning`/`--brand-600`; no cambian con el tema |
| `CepPage.tsx:132-147`, `LineChart.tsx:10,29` | Hex de series/límites | Aceptable para series (hay tabla `EN_OSCURO`), pero rojo/verde/ámbar de límites son semánticos y deberían salir de `--danger/--success/--warning` |
| `GpiLancamentoPage.tsx:467,478` | `#A6FFA7`, `#E0E0E0` | **Solo hoja impresa** (réplica del informe GATEC): intencional, dejar |

### Trampa de tokens: escala re-mapeada por tema [V] — **U13 (P2, mantenimiento)**
`tailwind.config.ts:32-37` redefine `slate/red/green/amber/blue` según el tema. Ejemplo: `text-slate-700` (`Sidebar.tsx:38`) es gris oscuro en claro y gris **claro** en oscuro. Ahorra clases `dark:` pero hace que el nombre de la clase no describa el color: un desarrollador que escriba `bg-slate-900` espera casi negro y en oscuro obtiene `rgb(2 3 9)` sobre una superficie `19 26 41`. Recomendación en `05`: reemplazar por **tokens semánticos** (`text-secondary`, `bg-subtle`, `bg-hover`…) y prohibir las escalas Tailwind crudas con una regla de lint.

### Tipografía
- Inter para todo; escala: 18/600 título, 15 título de barra, 13 datos (70 usos de `text-[13px]`), 14 controles, 12 secundario, más 9/10/11/16 sueltos. [V]
- **U2 (P2) Dos estilos de H1** [V]: `.page-title` = Space Grotesk 18/600 en Inicio, Maestras y Login; `BarraHerramientas.tsx:8` = Inter 15/600 en las otras 12 pantallas. El usuario ve dos «familias» de pantalla. 
- **V1 (P3)** Space Grotesk se descarga para 3 pantallas [V]; no aporta función en una app de datos. Recomendación: Inter en todo con `font-feature-settings: "tnum"` en cifras (ya se usa `tabular-nums`).
- **V2 (P3)** `font-bold` (700) en 2 sitios (`NotificationBell.tsx:57`, `Sidebar.tsx:233`) pero solo se cargan 400/500/600 → negrita sintética del navegador [V].
- **Tamaños sin token** [V]: `text-[13px]` ×70 es en realidad el tamaño base de datos; `text-[9px]` («Pend.», `Sidebar.tsx:146`) y `text-[10px]/[11px]` quedan por debajo de cualquier mínimo razonable de lectura. Falta un token `text-data` y un piso de 12 px para texto con significado.

### Iconografía [V]
Lucide con grosor único: coherente. Uso mayormente funcional. Excepciones menores decorativas contra el propio principio «íconos solo con función»: `Clock`/`Bell` en títulos de panel del Inicio (`Dashboard.tsx:88,106`) — **V5 (P3)**.

### Radios, sombras, bordes [V]
6 px controles / 8 px paneles, sombra solo en diálogos y popover. Coherente. Observación: el menú lateral tiene degradado (`from-surface to-brand-50`, `Sidebar.tsx:156`) y el Inicio resplandor + `backdrop-blur` (`.panel-vidrio`). Está **declarado como excepción** en el documento; es sutil y no daña la lectura. **V4 (P3)**: aceptable; si se busca una identidad aún más sobria, es lo primero que se puede quitar sin pérdida funcional.

## 2. Composición

### U1 (P2) Cromo apilado [V]
En 10 pantallas se suman `AppHeader` (48 px, `AppHeader.tsx:21`) + `BarraHerramientas` (≥ 52 px, `flex-wrap`). `AppHeader` en la práctica solo contiene empresa/zafra, tema y campana: **un 48 px de barra casi vacía** (el `flex-1` de la línea 39 es un espaciador). Peor: recibe `migas` desde todas las páginas y **las ignora** (`AppHeader(_props)`), es decir, el usuario nunca ve «Inicio › Proceso Industrial › Digitación diaria» aunque cada página lo pasa. Dos barras ≥ 100 px antes del primer dato, y en Digitación la segunda barra puede envolverse a 2-3 filas.

### R2 (P1) Paneles laterales de ancho fijo [V geometría, H percepción]
Sidebar `w-64` (256) + panel lateral de la pantalla `w-72/80/96` (288/320/384) con `shrink-0`:
| Pantalla | Panel lateral | Ancho útil a 1100 px | Ancho útil a 1366 px |
|---|---|---|---|
| Valores | `w-96` | 460 px | 726 px |
| Digitación, Supervisorio, CEP, Correlación, Admin | `w-80` | 524 px | 790 px |
| Informes, Boletines, Admin grupos | `w-72` | 556 px | 822 px |
La grilla de Digitación con 8 días necesita ~1.800 px; a 1100 px el usuario ve ~½ día. No hay colapso del panel (solo se puede ocultar el menú global, `Sidebar.tsx:162`). Resultado: **tres columnas de navegación** (menú global → árbol/lista → datos) donde la última recibe lo que sobra. Menú global y panel lateral compiten por el mismo propósito (elegir "qué mirar").

### Equilibrio y densidad
- Datos densos (filas 36-37 px, 13 px) con aire correcto en paneles; la densidad es **apropiada** para el dominio [H, confirmar con capturas con datos].
- `EmptyState` = una línea de texto gris centrada en 10 pantallas: no orienta ni ofrece acción (ej.: «Seleccione un panel de la lista.»). **U15 (P3)**.
- Inicio: jerarquía clara (saludo → 4 indicadores → gráfico 14 días → accesos/notificaciones). Es la pantalla mejor compuesta. Observación: «Camiones», «Caña recibida», «Análisis completados», «Pol» van sin comparación (vs ayer, vs meta) → número sin contexto [H, validar qué decisión toma el usuario con esto].

### Consistencia entre páginas [V]
- Fechas: **9 implementaciones** distintas de "desde/hasta" (rotuladas con `<label>`, con `Field`, con texto suelto «Desde … hasta …» en `ListadosGpiPage.tsx:201`, o sin rótulo). **U9 (P2)**.
- Cargando/errores copiados (ver 01 §6) con resultados casi iguales pero no idénticos.
- Botones de acción primaria: «Consultar», «Calcular», «Actualizar», «Grabar», «Nuevo»: ubicación variable (en barra, en panel lateral, a la derecha de la lista).

## 3. Componentes

| Componente | Estado | Nota |
|---|---|---|
| **Header** (`AppHeader.tsx`) | Débil | Casi vacío, ignora `migas`, `Button "Salir"` solo en móvil; ver U1 |
| **Sidebar** (`Sidebar.tsx`, 249 l.) | Funcional pero sobrecargado | 3 niveles de sangría (borde + `ml-3 pl-2` ×3) en 256 px; etiquetas truncadas con `title`; ver U12/U5 |
| **Menús** | Sin menú de usuario (avatar abajo del sidebar con «Salir» icono); sin atajos visibles | |
| **Dashboard** (`Dashboard.tsx`) | Bueno | 4 KPI + barras; skeletons con `aria-busy`; `ArrowRight text-slate-300` decorativo sobre blanco ~1,5:1 (aceptable por ser decorativo) |
| **Tarjetas/paneles** | Bueno | `.panel` borde 1 px; no hay «tarjetas dentro de tarjetas» |
| **Tablas** (`.data-table`) | Básico | Encabezado fijo, tabular-nums, hover; **sin orden, sin filtro por columna, sin paginación, sin `<caption>/scope`**; `tr tabIndex=0` en Digitación (A3) |
| **Formularios** (`FormModal`) | Correcto | `Field` con `*`; 1/2 columnas; falta resaltado de campo inválido al fallar; PK bloqueada con ayuda |
| **Modales** (`ui.tsx:267`) | **Muy bueno** | Foco atrapado, Esc, no cierra por arrastre, bloqueo al guardar, restaura foco |
| **Botones** | Bueno | 4 variantes, `loading`, 36/32 px. Hay **dos** botones iguales «»» y «Hoy» en Digitación [V] (`:356-362`) |
| **Filtros/Buscadores** | Mixto | `SearchInput` consistente; falta «limpiar (x)» y feedback de cantidad de resultados |
| **Selectores** | OK | `<select>` nativo con chevron; `compact` 32 px |
| **Gráficos** (`LineChart.tsx`) | Bueno | SVG propio, tooltip, leyenda interactiva, ejes duales, tema oscuro con tabla de equivalencias. Series distinguidas **solo por color** salvo límites punteados [H: probar con daltonismo] |
| **Notificaciones** (`NotificationBell.tsx`) | Correcto | Cierra con Esc/clic fuera; `role="dialog"` sin gestión de foco ni `aria-haspopup`; duplica el panel del Inicio |
| **Estados vacíos** | Pobres | ver arriba |
| **Cargando** | Inconsistente y mudo | Spinner `aria-hidden` sin texto (≥ 15 sitios) [V] |
| **Mensajes de error** | Correctos pero sin acción | `Alert` rojo con ícono y `role="alert"`; sin «Reintentar» |
| **Paginación** | **No existe** | Ver U3 |

## 4. Elementos anticuados, redundantes o innecesariamente complejos

1. **Barra de herramientas de Digitación (G1, P1)** [V `GpiLancamentoPage.tsx:327-365`]: hasta 17 controles en una fila envolvente: `Grabar(n)`, `Descartar`, fecha, imprimir, Excel, `Id`, `Esp`, `Sem`, `Acum`, `«`, `−7`, `−1`, `+1`, `+7`, `»`, `Fijar fecha`, `Hoy`, `Ver inactivas`. Rótulos crípticos (`Esp`, `Sem`, `Acum`, `«`, `»`), tres toggles con significados distintos mezclados (`Id/Esp/Sem/Acum` = columnas; `Fijar fecha` = modo; `Ver inactivas` = filtro) y duplicado `»` ≡ `Hoy`. Es la paridad con el GATEC viejo; se puede **agrupar** sin perder función (ver `06`).
2. **Menú con opciones «Pend.»** (U5, P2) [V `pantallas.ts:62-97`, `Sidebar.tsx:146`]: ~23 entradas en gris a 9 px junto a ~11 reales; ruido permanente y contraste ~2,5:1 (`text-slate-400` sobre superficie; el propio documento da 2,56 para ese gris).
3. **`window.confirm` nativo** (U6, P2) [V]: en Digitación ×3. Rompe el lenguaje visual (el resto usa `Modal`), no se puede traducir ni estilar, y en navegadores con diálogos suprimidos devuelve `false` silenciosamente.
4. **Atajo «Ctrl+K / /»** (U4, P2) [V `Sidebar.tsx:54-61`]: enfoca el buscador **del menú lateral**, no es una paleta de comandos. Si el menú está oculto (`oculto` → `hidden`) el `input` sigue en el DOM pero `display:none`: `focus()` no hace nada y el usuario no recibe respuesta.
5. **Prop `migas` muerta** (U1): API que promete algo que el componente no hace; confunde a quien modifique.

## 5. Contraste y color (WCAG 2.2 AA) — cálculos propios
| Par | Ratio | Resultado |
|---|---|---|
| Blanco sobre `emerald-600` (#059669), 12 px/600 | **3,77** | ❌ (texto normal exige 4,5) — encabezado de día en Digitación |
| `slate-400` sobre `surface` (Pend., «—» en tablas) | **2,56** (valor del propio doc) | ❌ si se considera texto con significado; `Maestras formatear()` usa `text-slate-400` para «—» (vacío) |
| `muted` sobre `canvas` | 4,83 (doc) | ✅ |
| `ink` / `brand-800` blanco / `danger` | ≥ 4,83 | ✅ |
| Foco por teclado (`ring-brand-600`) sobre blanco | 6,57 (doc) | ✅; anillo de 2 px + offset 1 (`index.css:33-35`) |
| Tema oscuro | **[H]** — `tema.css` no trae tabla de contraste; calcular `muted`(154,166,180) sobre `canvas`(12,17,29) ≈ 7:1 [estimado], pero `brand-800` oscuro (53,103,222) con **texto blanco** (botón primario) ≈ 4,9:1 [estimado] — **validar con herramienta** |

## 6. Qué se conserva, qué cambia
Resumen operativo en `06`. En una línea: **conservar** paleta, tokens, `Modal`, `Alert`, `Badge`, `.panel`, `LineChart`, sobriedad; **cambiar** cromo (barra única + panel lateral colapsable), grilla/toolbar de Digitación, H1 unificado, tokens semánticos, loading/empty/error; **eliminar** Space Grotesk, degradados residuales (opcional), `window.confirm`, `Hoy`/`»` duplicados, `migas` muertas o implementarlas; **crear** `PageShell`, `MasterDetail`, `DateRange`, `LoadState`, `DataTable`, paleta de comandos real.
