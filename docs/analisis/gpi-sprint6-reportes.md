# GPI · Sprint 6 — reportes, metas, correo/SMS, Fermentec

## Qué hay en DESA (filas por tabla, 26/10/2026)

| Área | Tablas | Filas | Decisión |
|---|---|---|---|
| Informes configurables | `GI_LAB_CONF_REL_TIT` / `_LINHA` | 30 / 1.714 | ✅ **Hecho** (`/gpi/informes`) |
| Boletines (resumen) | `GI_LAB_REL_RESUMO` / `GI_LAB_REL_RES_ITEM` | 6 / 539 | ✅ **Hecho** (`/gpi/boletines`) |
| Metas | `GI_LAB_LANC_METAS` / `_VAR` | 99 / 98 | ✅ **Hecho** en consulta (`/gpi/metas`, *Real x Metas*); la carga de metas (escritura) no |
| Recordes, diagnóstico, producción, ANP, plan analítico, LPD | `GI_LAB_CONF_REL_RECORDE_*`, `_DIAG_*`, `GI_LAB_REL_PRODUCAO*`, `_ANP*`, `_PLANO_ANALITICO*`, `_LPD*` | 0 (LPD: 1) | ⏸ Sin datos: no se recrean por ahora |
| Correo (SMTP, destinatarios, grupos, envío automático) | `GI_LAB_EMAIL_*`, `GI_FECHA_*_EMAIL*` | 1 / 0 / 0 / 0 (el resto ni existe) | ⏸ Sin uso en DESA; **enviar correo es una acción externa**, no se recrea sin decisión |
| SMS | `GI_LAB_SMS_*` | 0 | ⏸ Sin uso; igual que el correo |
| Fermentec (layout y exportación de texto) | `GI_LAB_CONS_FERMENTEC` | 0 | ⏸ Sin uso |

Mismo criterio que con el módulo 91: lo que está vacío en DESA no se recrea hasta confirmar con un usuario del GATEC que se usa en producción
(DESA se recarga desde producción, así que vacío en DESA = vacío en producción al día de la última carga).

## Informes (`/gpi/informes`, permisos 8445 o 10050 — `frmRelatorios` «Geral»)

- Lista los informes de `GI_LAB_CONF_REL_TIT` y arma la grilla **variables × días** (máximo 31 días) con el resultado del día (col. 99) de cada variable.
- Líneas (`GI_LAB_CONF_REL_LINHA`, orden `CRL_SEQ`): `CRL_STATUS` **V** con `ID_VAR` = variable; **S** = título de sección (con su color de fondo, entero BGR de VB6);
  **Q** y **A** = subtítulo; sin estado = línea en blanco. `VAR_NOM_ANALI` es el texto de la línea.
- Solo se ven valores de variables de planillas habilitadas para el usuario; las demás aparecen como «sin acceso».
- Los indicadores de la cabecera (`CRT_MED_DIA_SAF`, `CRT_ACUM_SAF`, `CRT_7/15/30_DIAS`, `CRT_DESV_PADRAO`, y sus equivalentes de zafra anterior) están **en nulo en los 30 informes**,
  por eso no se implementan. Si aparecen en producción, habría que agregarlos.
- Sin impresión (los reportes ActiveReports se reemplazan por pantalla + exportación a CSV).
- **No contrastado** contra la impresión del GATEC viejo: se desconoce qué columnas de período imprime exactamente `ActRelatorioGeral`.

## Boletines (`/gpi/boletines`, permiso 8453 — `frmRelResumo`)

- `GI_LAB_REL_RESUMO` (6 boletines; `REL_COLUNAS` = 1 o 2) y `GI_LAB_REL_RES_ITEM` (ítems por columna y `ITE_SEQ`): con `ID_VAR` = variable (`ITE_ITEM` es su rótulo);
  sin variable, `ITE_DIVISAO` **D** = división y **S** = subdivisión.
- Para la fecha elegida se muestran el **resultado del día** y el **acumulado de zafra** de cada variable. Qué columnas imprime exactamente el boletín del VB6 (`ActRelResumo`) no está
  confirmado; la selección de día y acumulado es la más probable para un boletín diario. Pendiente de contrastar.

## Real x Metas (`/gpi/metas`, permisos 9984, 10054 o 9990 — `frmRelatoriosMetas` / `frmMetas`)

- `GI_LAB_LANC_METAS` guarda por variable (vía `GI_LAB_LANC_METAS_VAR`: empresa y zafra) metas **diaria, semanal, quincenal, mensual y acumulada** con una fecha de vigencia (`MET_DATA`);
  `MET_IDEAL` **s** = más es mejor, **i** = menos es mejor. Rige la meta más reciente con vigencia ≤ fecha; una meta en 0 se toma como «sin meta».
- Datos en DESA: 14 variables en la zafra 2025, 26 en 2024, 47 en 2020; la zafra **2026 no tiene metas cargadas** (la pantalla lo avisa).
- Período: **diario** (resultado del día), **quincenal** y **mensual** (suma si `VAR_TIPO_MEDIA` = 3, promedio si no, de los días con dato desde el inicio del período hasta la fecha; la meta es la del
  período completo, por eso el estado cumple/no cumple solo se evalúa en el día) y **acumulado** de zafra (`ACU_MEDIA`). La meta **semanal** no se muestra (falta confirmar el inicio de semana).
- Aproximación: el reporte del VB6 no guarda resultados para contrastar.
