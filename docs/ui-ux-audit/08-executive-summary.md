# 08 · Resumen ejecutivo

**Auditoría UI/UX de lab-app** · 30/10/2026 · Sin cambios de código. Detalle en `01`…`07`.

## Conclusión en tres líneas
1. El producto tiene una **base visual sólida y sobria** (tokens por tema, contraste calculado, modal ejemplar, sin ruido decorativo): no hace falta un rediseño estético ni cambiar de tecnología.
2. Sus problemas reales son de **estructura y ergonomía**: cromo apilado y de ancho fijo que se come la grilla, una Digitación diaria sobrecargada y frágil, accesibilidad por debajo de AA en puntos concretos, y componentes copiados en lugar de compartidos.
3. La mejora de mayor retorno es **una capa de patrones compartidos** (`PageShell`, `MasterDetail`, `DataTable`, `LoadState`, `DateRange`) más el **rediseño de la Digitación**: arregla 13 pantallas a la vez y la que más se usa.

## Qué se hizo y qué NO
- Lectura de código (shell, componentes, tokens, 3 pantallas completas, 14 estructurales) **más recorrido real** con el usuario BOT en DESA (solo lectura): 17 pantallas a 1440 y 1100 px, 768 y 390 en las principales, tema oscuro en 3, con medición de anchos. Capturas en `capturas/`; detalle en el Anexo A de `01`.
- No se operaron flujos (no se grabó nada) ni se observó a usuarios reales; lo que depende de eso está marcado [H].

## Puntuación global (1-10)
| Visual | Usabilidad | Consistencia | Accesibilidad | General |
|---|---|---|---|---|
| 7,0 | 6,5 | 6,3 | 5,4 | **6,2** |
La **Digitación diaria** (la tarea más importante) saca un **5**; los listados y la balanza, 7.

## Hallazgos más importantes
| # | Hallazgo | Sev | Impacto |
|---|---|---|---|
| 1 | **Pérdida silenciosa de lo digitado** si se navega por el menú o se cambia de zafra con celdas sin grabar (D1) | P1 → P0 al activar escritura en producción | Riesgo de datos y confianza |
| 2 | **Toolbar de Digitación con hasta 17 controles**, rótulos crípticos, botones duplicados (G1) | P1 | Carga cognitiva en la pantalla clave |
| 3 | **Ancho útil insuficiente**: sidebar 256 + panel 288-384 px fijos; a 1100 px quedan 460-556 px para datos y a 390 px, 70 px (R2, medido) y dos barras apiladas que suman ≥ 100 px (U1) | P1/P2 | La grilla muestra ~½ día |
| 4 | **Sin navegación bajo 768 px**; en 390 px tampoco se alcanza «Salir» (R1, renderizado) | P1 (P0 si el móvil entra) | Inutilizable en tablet/teléfono |
| 5 | **Accesibilidad**: contraste 3,77:1 en el encabezado de día; spinners mudos; ~500 tab-stops en la grilla; sin skip-link (A1-A3) | P1 | Cumplimiento WCAG 2.2 AA y teclado |
| 6 | Maestras con **5.000 filas sin paginar** y el aviso de truncado ignorado; borrar sin nombrar el registro (U3) | P2 | Errores y rendimiento |
| 7 | **Inconsistencias**: 2 estilos de título, 9 selectores de fechas, `window.confirm` vs `Modal`, colores fuera de sistema (U2, U6, U7, U9) | P2 | Percepción de producto no terminado |
| 8 | **Vista «8 días» de 14.832 px** en planillas horarias y fecha del día invisible al desplazar (U18, U17): *hallazgo nuevo, solo visible con datos* | P1/P2 | La función heredada pierde sentido |
| 9 | **~23 opciones «Pend.»** en el menú del GPI frente a ~11 funcionales (U5) | P2 | Ruido permanente |

## Lo que está bien (no tocar)
Paleta y roles de color; tokens claro/oscuro; `Modal` (foco, Esc, bloqueo al guardar); `Alert`/`Badge`; `LineChart` propio sin dependencias; carga por pantalla (lazy); avisos de truncado en listados y balanza; concurrencia por celda y auditoría en la edición del GPI; la búsqueda del menú; «Accesos recientes».

## Qué recomiendo, en orden
1. **Fase 0 (1 sem)**: usuario DESA solo lectura, catálogo de componentes, capturas y axe de línea base; observar 2 sesiones reales de digitación.
2. **Fase 1 (1 sem, bajo riesgo)**: contraste, spinners con texto, `ConfirmDialog`, aviso de truncado, `min/max` en fechas, quitar Space Grotesk/duplicados.
3. **Fase 2 (3-4 sem)**: `PageShell` + `MasterDetail` + guarda de navegación (**D1**) + `LoadState/DateRange/DataTable` + menú de 2 niveles + Ctrl+K.
4. **Fase 4 (3 sem)**: rediseño de la **Digitación** (barra agrupada, ARIA grid, estados de celda, «recalcula al cerrar el día»), sin cambiar reglas ni API.
5. Fases 3 y 5: tokens semánticos con lint, Inicio por rol, a11y completa con lector de pantalla.

**Estimación total**: ≈ 10-14 semanas-persona para las 5 fases; las Fases 0-2 (≈ 5-6 semanas) concentran la mayor parte del beneficio.

## Decisiones que necesito de ustedes
1. **¿Móvil/tablet dentro de alcance?** (cambia R1 a P0)
2. **¿Fecha prevista para activar la escritura de Digitación en producción?** (fija el plazo de D1)
3. ¿Hay usuarios con varias empresas? ¿Se pueden retirar las opciones «Pend.» del menú?
4. ¿Quién del laboratorio puede participar en 2-3 sesiones de 30 min para validar la Digitación?

## Riesgos principales
Romper la única escritura (mitigación: `tools/e2e/sprint18.js` y validación de fórmulas como puertas de calidad); resistencia por memoria muscular del GATEC (mitigación: atajos equivalentes y piloto); regresión en tema oscuro (mitigación: capturas claro/oscuro).
