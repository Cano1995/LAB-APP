# 07 · Priorización y roadmap

## 1. Escala
- **P0** Crítico: impide completar tareas o pone datos en riesgo en el uso declarado.
- **P1** Alto: afecta de forma significativa la experiencia o cumple mal un criterio de accesibilidad/uso base.
- **P2** Medio: mejora importante de usabilidad o consistencia.
- **P3** Bajo: refinamiento.
- Evidencia: **[V]** verificado en código/cálculo, **[H]** hipótesis a validar.
- Complejidad: **S** ≤ 1 día · **M** 2-5 días · **L** 1-3 semanas (una persona).

**No encontré P0 en el uso de escritorio declarado.** R1 pasa a P0 si el móvil/tablet entra en alcance (decisión pendiente, §5); D1 es P1 hoy porque la escritura está tras un interruptor apagado por defecto, y pasa a **P0 el día que se active en producción**.

## 2. Registro de hallazgos

| ID | Sev | Hallazgo | Evidencia | Cmp | Depende de |
|---|---|---|---|---|---|
| **R1** | P1 (P0 si hay móvil) | Bajo 768 px no hay navegación y **el header se desborda: tema, campana y «Salir» quedan fuera de pantalla** (renderizado a 390 px) | [V] `Sidebar.tsx:156`, `AppHeader.tsx:22,34` | M | PageShell |
| **R2** | P1 | Paneles laterales fijos 288-384 px + sidebar 256: ancho útil 460-556 px a 1100 px | [V] geometría, 10 pantallas | M | MasterDetail |
| **D1** | P1 | Borrador de Digitación se pierde al navegar por menú o cambiar zafra; sin `beforeunload` | [V] `App.tsx:89`, `ContextoSelector.tsx:42`, `GpiLancamentoPage.tsx:22` | M | contexto de borrador |
| **G1** | P1 | Toolbar de Digitación con hasta 17 controles, rótulos crípticos, `»` ≡ `Hoy` | [V] `GpiLancamentoPage.tsx:327-365` | M | ColumnsMenu, DateStepper |
| **A1** | P1 | Spinners mudos (`aria-hidden`, sin texto) ≥ 15 sitios; sin skip-link; sin `<caption>/scope` | [V] grep | S-M | LoadState, layout |
| **A2** | P1 | Contraste: encabezado de día 3,77:1 (WCAG 1.4.3); «Pend.» 9 px y «—» ~2,56:1 | [V] cálculo | S | tokens |
| **A3** | P1 | Grilla de Digitación: tab-stop por fila y celda (~500), sin navegación por flechas | [V] `:580,635` | L | ARIA grid |
| U1 | P2 | Dos barras apiladas (≥ 100 px); `AppHeader` casi vacío; prop `migas` ignorada | [V] `AppHeader.tsx:16,39` | M | PageShell |
| U2 | P2 | Dos estilos de H1 (Space Grotesk 18 vs Inter 15) | [V] | S | PageShell |
| U3 | P2 | Maestras: 5.000 filas sin paginar/ordenar, `truncado` ignorado; borrar sin nombrar | [V] `MaestraPage.tsx:149`, `maestras.service.js:155` | M | DataTable |
| U4 | P2 | Ctrl+K / «/» no hace nada si el menú está oculto; solo busca pantallas | [V] `Sidebar.tsx:54-61` | M | CommandPalette |
| U5 | P2 | ~23 opciones «Pend.» en el menú del GPI frente a ~11 funcionales | [V] `pantallas.ts:62-97` | S | decisión de producto |
| U6 | P2 | `window.confirm` nativo ×3 | [V] `GpiLancamentoPage.tsx:22,331` | S | ConfirmDialog |
| U7 | P2 | Colores fuera de sistema (emerald/violet/pink, hex en sombras y CEP) | [V] §02 | S | tokens |
| U8 | P2 | Selector de contexto solo cambia zafra; cambio sin aviso de impacto | [V]; empresa múltiple **[H]** | S | decisión |
| U9 | P2 | 9 implementaciones de rango de fechas, sin `min/max` | [V] | M | DateRange |
| U10 | P2 | Estados de carga/error/vacío copiados y desiguales; sin «Reintentar» | [V] | M | LoadState |
| U11 | P2 | `docs/ui-sistema-visual.md` desactualizado (tema oscuro, foco, móvil) | [V] | S | — |
| U12 | P2 | Menú con 3 niveles de sangría en 256 px | [V] `Sidebar.tsx:200-221` | M | menú 2 niveles |
| U13 | P2 | Escala `slate/red/…` re-mapeada por tema: nombres de clase engañosos | [V] `tailwind.config.ts:32` | M | tokens semánticos + lint |
| U14 | P2 | Admin: pestañas en la barra de herramientas; «Pantallas» exige ≥ 2 caracteres sin pista | [V] `AdminPage.tsx:28,251` | S | — |
| **U18** | P1 | Vista «8 días» en planilla horaria: grilla de 14.832 px (≈ 17 pantallas); sin agrupación ni resumen | [V renderizado] Anexo A de 01 | M-L | Fase 4 |
| U16 | P2 | Hasta 5 botones «primarios» a la vez: «Fijar fecha» encendido por defecto + toggles en azul sólido | [V renderizado] | S | estado de toggle en `Button` |
| U17 | P2 | Rótulo de fecha de día no `sticky`: barra verde sin texto al desplazar | [V renderizado] | S | — |
| U19 | P3 | Motivo de «no editable» en gris 12 px, fecha ISO, sin ícono | [V renderizado] | S | — |
| V6 | P3 | Rótulos de eje del gráfico del Inicio ≈ 7 px en móvil | [V renderizado] | S | — |
| U15 | P3 | `EmptyState` sin guía ni acción | [V] | S | LoadState |
| V1 | P3 | Space Grotesk solo en 3 pantallas | [V] | S | — |
| V2 | P3 | `font-bold` con pesos 400/500/600 cargados | [V] | S | — |
| V3 | P3 | Login: texto «Oracle», sin mostrar contraseña / Bloq Mayús / intentos restantes | [V] | S | — |
| V4 | P3 | Degradado de menú y resplandor/vidrio del Inicio (contra el principio sobrio) | [V] | S | — |
| V5 | P3 | Íconos decorativos en títulos de panel del Inicio | [V] | S | — |

**Hipótesis para validar (no son hallazgos)**: H-a el usuario digita con teclado todo el día; H-b hay usuarios con varias empresas; H-c uso en tablet/planta; H-d legibilidad real con datos (densidad, anchos, truncados); H-e ratios exactos del tema oscuro (se ve correcto en capturas; falta medir); H-f series de gráficos distinguibles en daltonismo; H-g ¿los KPI del Inicio sirven sin comparativo?; H-h `aria-invalid` tras error de servidor en `FormModal`.

## 3. Roadmap por fases

### Fase 0 · Red de seguridad (S-M, 1 sem) — antes de tocar la UI
- Usuario DESA de **solo lectura** para capturas y e2e (hoy no hay forma de automatizar el login).
- **Catálogo de componentes** `/dev/componentes` (todos los estados, claro/oscuro).
- **Capturas de regresión** (Edge headless ya está en `tools/e2e`): 16 pantallas × claro/oscuro × 1366/1024/768.
- Prueba axe/pa11y sobre el catálogo y 5 pantallas → línea base de a11y.
- Actualizar `docs/ui-sistema-visual.md` (**U11**).
- H-d y H-e ya se verificaron en parte con la app real (Anexo A de `01`); queda H-a (observar 2 sesiones de digitación: `docs/sesion-validacion-sprint17.md`).

### Fase 1 · Correcciones críticas/rápidas (S, ≈ 1 sem)
| Ítem | IDs | Aceptación |
|---|---|---|
| Subir contraste del encabezado de día y de «Pend.»/«—» | A2, U7 parcial | ≥ 4,5:1 medido en ambos temas |
| `Spinner` con `label`; `LoadState` básico; skip-link | A1 | 0 spinners sin texto accesible; Tab 1 = «Saltar al contenido» |
| Quitar `»`/`Hoy` duplicado; renombrar toggles con texto claro («Columnas: Id, Mín/Máx, Semanal, Zafra») | G1 (parcial) | 1 botón por función |
| `ConfirmDialog` en lugar de `window.confirm`; borrar nombra el registro | U6, U3 (parcial) | 0 `window.confirm` |
| Aviso `truncado` en Maestras | U3 (parcial) | visible si API lo informa |
| `min/max` en fechas | U9 (parcial) | no se puede elegir rango inválido |
| Quitar Space Grotesk y `font-bold` | V1, V2 | un solo H1 |
| Login: mostrar contraseña, Bloq Mayús | V3 | — |
**Riesgo bajo; sin cambio de layout.**

### Fase 2 · Mejoras estructurales (M-L, 3-4 sem)
| Ítem | IDs | Aceptación |
|---|---|---|
| `PageShell` (barra única, migas, hamburguesa/drawer) | U1, U2, R1 | ≥ 52 px más de alto útil; navegación en 390 px |
| `MasterDetail` colapsable | R2 | Digitación muestra 8 días a 1366 px con panel colapsado |
| Guarda de navegación + contexto de borrador | **D1** | e2e: editar → clic en menú → aparece confirmación; cambiar zafra idem |
| `DateRange`, `LoadState`, `DataTable` básica | U9, U10, U3, U15 | usadas por ≥ 10 pantallas; 0 spinners copiados |
| Menú 2 niveles + «Pend.» fuera | U5, U12 | ≤ 12 filas por módulo GPI |
| `CommandPalette` Ctrl+K | U4 | funciona con menú oculto; encuentra planillas |
**Dependencias**: Fase 0; `PageShell` antes de `MasterDetail`; `DataTable` antes de reemplazar tablas.

### Fase 3 · Rediseño visual (M, 2 sem)
- Tokens semánticos + lint de clases prohibidas (U13, U7).
- Rediseño del **Inicio** por rol con «Requiere atención» y comparativos (F2).
- Chip de contexto con confirmación (F6/U8).
- Gráficos: `--chart-*`, trazo + marcador, límites con semántica (H-f).
- Quitar degradado/vidrio (opcional, V4/V5).

### Fase 4 · Optimización de experiencia — Digitación (L, 3 sem)
- Toolbar agrupada (`‹ fecha ›`, «Vista», «Columnas ▾», una acción primaria) — **G1**.
- **ARIA grid** con flechas/Enter/Tab/F2/Ctrl+Z — **A3**.
- Indicadores de celda (modificada, fuera de especificación con ícono, conflicto).
- Estado «recalcula al cerrar el día» tras grabar.
- Densidad compacta; virtualización si se mide necesidad.
- Reejecutar `tools/e2e/sprint18.js` y la validación de fórmulas (`tools/gpi-validar-formulas.js`) — **no deben cambiar**.

### Fase 5 · Refinamiento (S-M, 1-2 sem)
- Glosario CEP en tooltips, `EmptyState` con acción, atajos `?`, `Toast`, favoritos ★, Admin (U14), pulido de copy (V3).
- Auditoría a11y completa con lector de pantalla (NVDA) y teclado en las 5 pantallas principales.
- Responsive de tablas (1ª columna fija) y definición de «solo consulta» móvil (§5).

## 4. Dependencias técnicas (grafo corto)
```
Fase 0 ─► Fase 1 (independiente)
Fase 0 ─► PageShell ─► MasterDetail ─► (Digitación F4)
                 └──► Menú 2 niveles ─► CommandPalette
LoadState ─► DataTable ─► reemplazo de ~20 tablas
tokens semánticos ─► lint ─► (todo lo demás sin deuda nueva)
Contexto de borrador ─► ConfirmDialog ─► guarda de navegación
```

## 5. Preguntas abiertas (necesitan una persona, no más código)
1. **¿Entra el móvil/tablet?** Cambia R1 de P1 a P0 y la Fase 2 de M a L. *Sugerencia*: solo consulta (sin edición de grilla) en < 768 px.
2. **¿Se activa `ESCRITURA_GPI_DIGITACION` en producción y cuándo?** Fija la fecha límite de D1/A3.
3. ¿Existen usuarios con varias empresas? (U8)
4. ¿Qué hacen los usuarios con la tecla Enter en la grilla vieja del GATEC? (alinear atajos de la nueva)
5. ¿Es aceptable retirar las opciones «Pend.» del menú, con una página de equivalencias?
6. ¿Quién valida los cambios de la Digitación? Sin sesiones con usuarios (`docs/sesion-validacion-sprint17.md`) hay riesgo de optimizar lo equivocado.

## 6. Medidas de éxito (para decidir si valió la pena)
| Métrica | Hoy [H, medir en Fase 0] | Meta |
|---|---|---|
| Alto de la barra de herramientas de Digitación a 1100 px | ≈ 190 px, 4 filas (medido) | ≤ 56 px, 1 fila |
| Alto útil de contenido a 1366×768 | ~ 668 px (768 − 100) en Digitación | ≥ 720 px |
| Ancho útil de grilla (1440 / 1100 px) | **864 / 524 px** (medido) | ≥ 1.000 px con panel colapsado |
| Pasos F1 (abrir planilla de hoy) | ~ 5 clics | ≤ 2 (recientes / Ctrl+K) |
| Tab-stops en grilla (60×8) | ~ 540 | 1 |
| Hallazgos axe «serios/críticos» | por medir | 0 |
| Pérdida de borrador en test e2e | falla | 0 |
| Satisfacción del analista (SUS o 5 preguntas) | sin línea base | ≥ 75 |
