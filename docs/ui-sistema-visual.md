# Sistema visual de lab-app

Reglas para mantener la interfaz consistente. Los tokens viven en `web/tailwind.config.ts`, los estilos compartidos en
`web/src/index.css` y los componentes en `web/src/components/ui.tsx` y `AppHeader.tsx`. Tema claro y oscuro (interruptor en la barra superior); escritorio es el
entorno principal.

> **Tema azul AZPA (Sprint 14b, 28/10/2026):** la marca pasó de verde a azul (`#1A3A8F`). Tipografía: Inter para todo y Space Grotesk solo en el título de página (`.page-title`); ambas **autoalojadas** (`@fontsource`, sin Google Fonts). Los estados «buenos» (activo, cumple, dentro, completa) siguen en verde con `Badge tone="success"`. Se mantiene lo sobrio: sin gradientes, brillos ni sombras (salvo diálogos), radios de 6/8 px y solo tema claro.

> **Tema claro/oscuro (28/10/2026):** los colores son variables CSS (`web/src/tema.css`, generado desde los tokens oklch de `app-azpa-movil`, matiz 264) con un valor claro y otro oscuro; Tailwind los lee como `rgb(var(--x) / <alpha-value>)`, así que una misma clase (`bg-surface`, `text-muted`, `brand-*`, `slate-*`…) sirve en los dos temas. La clase `dark` va en `<html>`; se recuerda en el navegador (`lab_app_tema`) y, sin elección, sigue al sistema. Reglas: nunca usar hex ni colores de Tailwind fuera de la tabla (`text-link` para enlaces y texto azul, no `text-brand-800`); en SVG usar clases (`fill-muted`, `stroke-line`); las series de los gráficos pasan por `tinte()` de `LineChart.tsx` (su versión clara sobre fondo oscuro). Degradados y resplandor **solo** en el Inicio y el menú lateral (`.fondo-inicio`, `.panel-vidrio`); las pantallas de datos quedan planas. El logo tiene versión clara y oscura (`web/public/logo-lab.svg`, `logo-lab-oscuro.svg`) y el emblema se vuelve blanco en oscuro.

## Principios

- Sobrio y denso: paneles con borde de 1 px y sin sombra; la sombra se reserva para diálogos.
- Una sola acción primaria por pantalla (azul AZPA). Lo demás es secundario (borde) o fantasma.
- El color comunica estado, no decora: rojo = error, ámbar = restricción, azul = información, verde = estado bueno (activo, cumple, dentro); azul = marca, acción primaria y selección (la información usa el azul de estado `info`, más claro).
- Íconos solo cuando cumplen una función (acción, navegación, estado). Un solo grosor (1,75) y dos tamaños: 16 px (controles)
  y 14 px (listas densas).

## Paleta (tokens)

| Token | Valor | Uso |
|---|---|---|
| `brand-800` | `#1A3A8F` | Botón primario, acento, encabezado de fecha en grillas |
| `brand-900` / `brand-950` | `#12296B` / `#0B1A45` | Hover / pulsado del botón primario |
| `brand-100` | `#E1ECFF` | Selección (árbol, fila elegida, encabezados de columna) |
| `brand-50` | `#F3F7FF` | Hover de filas de navegación |
| `brand-600` | `#2A55C4` | Anillo de foco |
| `canvas` | `#EEF2F9` | Fondo general (gris azulado; antes `#F8FAFC`, casi blanco: los paneles no se distinguían) |
| `surface` | `#FFFFFF` | Paneles y campos |
| `ink` | `#0F172A` | Texto principal |
| `muted` | `#5B6B82` | Texto secundario (antes `#64748B`, que sobre el nuevo fondo daba 4,24) |
| `line` | `#E2E8F0` | Separadores y borde de panel |
| `control` | `#8190A5` | Borde de campos y botones secundarios |
| `info` / `success` / `warning` / `danger` | `#2563EB` / `#15803D` / `#F59E0B` / `#DC2626` | Estado |
| `calc` | `#FEF9C3` | Fila de variable calculada (GPI), suavizado del amarillo del sistema anterior |

### Contraste (WCAG 2.1; texto normal AA ≥ 4,5, componentes de UI ≥ 3)

| Par | Ratio |
|---|---|
| `ink` sobre `surface` / `canvas` | 17,9 / 15,9 |
| `muted` sobre `surface` / `canvas` | 5,43 / 4,83 |
| blanco sobre `brand-800` / `brand-900` | 10,27 / 13,50 |
| `brand-800` sobre `brand-100` · sobre `brand-50` | 8,62 · 9,56 |
| `brand-600` (anillo de foco) sobre blanco | 6,57 |
| blanco sobre `danger` · `danger` sobre blanco | 4,83 |
| `info` sobre blanco · `success` sobre blanco | 5,17 · 5,02 |
| `ink` sobre `calc` · `slate-600` sobre `calc` | 16,6 · 7,06 |
| `control` sobre `surface` (borde de campo) | 3,25 |

Decisiones por contraste:
- `warning` (`#F59E0B`, 2,15 sobre blanco) **nunca es texto**: se usa en íconos; el texto de advertencia es `amber-900` sobre
  `amber-100` (6,37).
- `muted` también cumple sobre `slate-100` (4,95) y sobre `calc` (5,05); en fondos más oscuros que esos va `slate-600` (`#475569`, ≥ 6,7).
- Valores fuera de especificación en grillas: `red-700` (`#B91C1C`, 6,0 sobre `calc`), además de negrita y tooltip.
- Placeholders en `muted` (5,43), no en `slate-400` (2,56).
- El borde de campo es `control`, no `line` (1,2): el borde de panel separa, el de campo identifica el control.

## Tipografía

Familia: Inter si está instalada, si no Segoe UI / sistema. Base 14 px.

| Rol | Clase | Tamaño / peso |
|---|---|---|
| Título de página | `.page-title` | 18 / 600 |
| Título de panel | `.panel-title` | 13 / 600 |
| Rótulo de sección | `.section-label` | 12 / 600, mayúsculas |
| Datos y navegación | `text-[13px]` | 13 / 400–500 |
| Formularios y controles | `text-sm` | 14 |
| Texto secundario | `text-xs text-muted` | 12 |

## Componentes (`components/ui.tsx`)

- **Alturas:** control 36 px (`md`) y 32 px (`sm`/`compact`). **Radios:** 6 px en controles, 8 px en paneles y diálogos.
- `Button` (`primary`, `secondary`, `ghost`, `danger`; `size`; `loading`), `IconButton` (siempre con `label`).
- `Input`, `SearchInput`, `Select`, `Checkbox`, `Field` (etiqueta + obligatorio + ayuda).
- `Alert` (`error`, `info`, `success`, `warning`; con ícono y `role`), `Badge`, `EmptyState`, `Spinner`.
- `Modal` (foco al primer campo, Esc cierra, devuelve el foco), `FormActions` (pie de acciones).
- `AppHeader`: marca, ubicación (migas), empresa/zafra y usuario. Todas las pantallas lo usan.

Estados: hover (borde o fondo), foco (borde azul + anillo en campos; anillo en botones y enlaces), pulsado (un tono más
oscuro), deshabilitado (50 % de opacidad; en campos, fondo gris y texto legible), carga (`loading` en botones, filas
esqueleto en tablas), error (`Alert` y `aria-invalid`).

## Tablas y grillas

- `.data-table` para listados: encabezado fijo, filas de 37 px, hover gris. **Códigos (clave numérica) a la izquierda y
  angostos; cantidades a la derecha** con cifras tabulares.
- Grilla del GPI: encabezado agrupado (fecha una vez sobre las columnas), columnas de orden y descripción fijas al desplazar.
  Filas **calculadas** en `calc` con marca lateral amarilla e ícono Σ; fila **elegida** (clic) en `brand-100`; **inactivas**
  en gris con etiqueta; fuera de especificación en rojo oscuro y negrita.
- Cuando las grillas pasen a editables: celdas editables con fondo `surface` y borde `control` al enfocar; las calculadas
  siguen sin editar.

## Layout

- Menú: panel con filas de enlace (sin tarjetas), agrupadas por módulo.
- Pantallas de datos: ancho máximo 1152 px centrado. Pantalla del GPI: dos paneles a pantalla completa (árbol 320 px + grilla).
- Escritorio ≥ 1100 px probado. No se diseñó para móvil.
