# Digitación diaria: botones Id, Esp, Sem y Acum, vista de varios días, imprimir y Excel

Barra de la pantalla `/gpi/lancamento` (equivale a `frmDigBolMultiData` de GATEC_GPI.exe). Todo es **solo lectura**; la edición del Sprint 18 sigue
limitada a la primera columna de día elegido.

## Botones de la barra (orden del GATEC)

`Fecha · Imprimir · Excel · Id · Esp · Sem · Acum · « · −7 · −1 · +1 · +7 · » · Fijar fecha · Hoy`

| Botón | Qué hace | Origen |
|---|---|---|
| **Id** | Columna con el número de variable (`ID_VAR`). | `GI_LAB_VAR` |
| **Esp** | Columnas Mín. y Máx. de la especificación. | `VAR_ESPEC_MIN_VALOR` / `VAR_ESPEC_MAX_VALOR` |
| **Acum** | Columna **Zafra** (rosa): acumulado de zafra hasta la fecha. | `GI_LAB_ACUM_{e}_{s}.ACU_MEDIA` de esa fecha |
| **Sem** | Columna **Semanal** (violeta): ver más abajo. **Provisorio.** | Calculado |
| **−7 / −1** | La fecha retrocede 7 / 1 día y se muestran 8 / 2 columnas: la fecha elegida y los 7 / 1 días siguientes (fecha en verde primero). | GATEC |
| **+1 / +7** | La fecha avanza 1 / 7 días y se muestran 2 / 8 columnas: los días anteriores y la fecha elegida al final (al revés que −1 / −7). | GATEC |
| **« / »** | Inicio de la zafra (`PAR_DT_INICIO`) / día actual de digitación (`PAR_DT_FECHA`). Por el nombre del control del GATEC (`cmdVoltaInicioSafra`, `cmdAvancaFimSafra`); **por confirmar**. | inventario |
| **Fijar fecha** | Con la fecha fija, al cambiar de planilla se conserva; sin fijar, vuelve al día actual de digitación. Por el nombre (`chkFixarData`); **por confirmar**. Por defecto fija. | inventario |

Cualquier otro cambio de fecha (campo de fecha, Hoy, «, ») vuelve a mostrar un solo día. Los días extra son siempre solo consulta.

## Zafra (Acum)

`ACU_MEDIA` de la fecha elegida. Si el día aún no está cerrado no hay fila de acumulado y la celda queda vacía (el acumulado lo escribe el cierre del día;
ver `gpi-cierre.md`: es incremental, `ACUM(D) = ACUM(D−1) ⊕ día D`).

## Semanal (Sem) — regla provisoria

El GATEC **no guarda** acumulados semanales (no hay columna ni tabla) y su regla no se conoce: no hay fuente del VB6 y el inventario solo trae los nombres de
los controles (`cmdExibeAcumSemanal`). Hasta confirmarlo con un usuario del GATEC, la app calcula con los resultados del día (columna 99) de los **7 días que
terminan en la fecha elegida**, según `VAR_TIPO_MEDIA` de la variable (`api/src/modules/gpi/acumulados.service.js`):

| `VAR_TIPO_MEDIA` | Semanal |
|---|---|
| 1 media aritmética | promedio de los días con dato |
| 2 media ponderada | `Σ(x·w)/Σw` con `w` = resultado del día de `VAR_ORI_POND`; se excluyen los días con x = 0 |
| 3 suma | suma de los días con dato |
| 4 último valor | último valor con dato |
| 5 media calculada, 0 | no se calcula (celda vacía) |

Pendiente de confirmar: qué día empieza la semana (¿lunes? ¿móvil de 7 días?), si el GATEC suma o promedia por tipo y si incluye el día elegido.
La metas semanal de `Real x Metas` tiene la misma duda (`gpi-sprint6-reportes.md`).

## Imprimir y Excel

- **Imprimir** (`window.print()`): hoja horizontal A4 con el formato del informe «Consulta de Entradas Diarias» del GATEC: encabezado (empresa, rango de fechas,
  «N Días de Zafra — M Días en el período», zafra, fecha y hora), banda verde `#A6FFA7` con `(id) planilla`, tabla Variable / Unidad / Mínimo / Máximo / días / Media
  (+ Semanal y Zafra si están activos). Calculadas en amarillo. Los colores se fuerzan con `print-color-adjust: exact`.
  La *Media* es el promedio del resultado del día de los días mostrados (igual al valor del día si hay uno solo); el GATEC puede calcularla distinto con varios días.
- **Excel**: libro `.xlsx` real (sin librerías: `web/src/lib/xlsx.ts`) con los colores del GATEC: «Análisis» gris, fecha y títulos de columna en verde (celeste en los
  días que no son el elegido), Semanal violeta, Zafra rosa, calculadas en amarillo, números como números.

## Pendiente

- Confirmar la regla de Semanal, «« / »» y «Fijar fecha» con un usuario del GATEC.
- Sin probar contra el GATEC: la columna *Media* del PDF y los «Días de Zafra».
