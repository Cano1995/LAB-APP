# GPI · Consultas y Supervisorio (Sprint 5, en consulta)

Pantallas de solo lectura sobre `GATEC_GPI_NEW`. Código: `api/src/modules/gpi/consultas.service.js`.

| Pantalla nueva | Form VB6 (permiso) | Tablas |
|---|---|---|
| `/gpi/valores` — Valores de variables | 8507 | `GI_LAB_VAR` (búsqueda), `GI_LAB_CONSULTA` (consultas guardadas), `GI_LAB_LANC_MOV_{e}_{s}` col. 99 (resultado del día), `GI_LAB_ACUM_{e}_{s}` (acumulado de zafra) |
| `/gpi/supervisorio` — Supervisorio | 8524 | `GI_LAB_SUPERVISORIO`, `GI_LAB_SUP_VAR`, `GI_LAB_LANC_MOV_{e}_{s}` |

## Reglas
- Solo se ven variables de planillas habilitadas para el usuario (`gpi.planesHabilitados`).
- Límites: 30 variables por consulta, 400 días, supervisorio hasta 14 días.
- Supervisorio: la hora de cada punto = inicio del plan + (columna − 1) × paso; las planillas por bateladas usan el resultado del día (12:00).
- Gráfico propio en SVG (`web/src/components/LineChart.tsx`): dos ejes, límites inferior/superior, tooltip, leyenda con alternado. Sin librerías nuevas.
- Exportación CSV de la tabla de valores.

## Panel de información, CEP y correlación (solo consulta)

| Pantalla nueva | Form VB6 (permiso) | Tablas |
|---|---|---|
| `/gpi/panel` — Panel de información | 9234 (`frmPainel`) | `GI_LAB_PAINEL_CONF` (preferencias), `GI_LAB_PAINEL_VAR` (variables: **V** valores, **F** seguimiento de especificación, **D** diagnóstico), `GI_LAB_PAINEL_CEP` (gráficos CEP con LSE/LIE/muestras), `GI_LAB_PAINEL_REL` (reportes), `GI_LAB_LANC_ESPEC` (especificación vigente) |
| `/gpi/cep` — Control estadístico | 8510 o 10149 (`FrmCEP`) | resultado diario (col. 99) de la variable |
| `/gpi/correlacion` — Correlación | 9995 o 10143 (`frmCorrelacao`/`frmCorrelacionaVar`) | resultado diario de las variables elegidas |

- El GATEC tiene **dos generaciones de formularios** para CEP y correlación; la API acepta el mayor permiso de cualquiera de los dos.
- **Panel**: es la configuración personal de cada usuario en el VB6 (hoy 13 usuarios, 62 variables, 24 CEP, 14 reportes). Solo se lee: las tablas son `GATEC_*`
  compartidas, no se escribe. Se muestran solo las variables que el usuario puede ver. Valor del día y acumulado de zafra salen de las consultas ya hechas.
  El refresco automático usa `PNF_TP_ATUALIZA` (segundos, mínimo 10). Los tipos de reporte (SU, BO, RG, RE, RS, CG, VS) se infieren de los nombres de los controles
  de `frmPainel`; solo **SU** (supervisorio) resuelve título y enlace.
- **CEP** (`api/src/modules/gpi/estadistica.js`): carta X̄–R con subgrupos de 1 a 10 (con 1: individuales y rango móvil), LC, LCS/LCI = LC ± A₂·R̄, σ = R̄/d₂,
  Cp, Cpl, Cpu, Cpk con LIE/LSE opcionales, puntos fuera de control resaltados. Constantes de control de calidad estándar.
- **Correlación**: Pearson entre pares de variables sobre los días en que ambas tienen resultado (mínimo 3 pares), hasta 12 variables.
- **Validación**: `GI_LAB_CEP`, `GI_LAB_CORRELACAO` y `GI_LAB_CORRELACAO_VAR` están **vacías** y el VB6 no guarda los resultados, así que no hay contra qué comparar. Las funciones se
  probaron con casos de manual (`node api/src/modules/gpi/estadistica.test.js`: Anscombe r = 0,8164, constantes X̄–R, capacidad). Falta contrastar con un usuario del GATEC.

## Pendiente del Sprint 5
- Reglas de **diagnóstico** del panel (`GI_LAB_VAR_DIAGNOSTICO`: valores fuera, nulos o repetidos): hoy solo se listan las variables marcadas con tipo D.
- Configuración del panel (altas/bajas de variables, CEP y reportes) y consultas guardadas de correlación: requieren escribir en tablas `GATEC_*`; no se hace.
- Reportes del panel que no son supervisorio (boletín, reporte general/de empresa/resumen, consulta gerencial): son del Sprint 6.
