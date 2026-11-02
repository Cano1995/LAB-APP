# GPI (módulo 90) — modelo de datos

Cómo guarda sus datos `GATEC_GPI.exe`. Verificado contra la base DESA (copia diaria de producción) el 2026-10-22.

## Esquema y nombres de tabla

- El GPI usa **`GATEC_GPI_NEW`** (sección `[LOGINLAB]` del `GAtec.ini`, usuario `gatec_gpi_new`). `GATEC_LAB` tiene la
  misma estructura con otros datos.
- Muchas tablas llevan sufijo **`_{empresa}`** o **`_{empresa}_{zafra}`** (p. ej. `GI_LAB_LANC_1_2026`). La zafra es la
  del GPI (`GI_LAB_PARAM_USINA`), que corre de mayo a mayo: `_2025` llega al 16/05/2026 y `_2026` empieza el 04/05/2026.
- La app elige la tabla por la empresa y zafra del contexto del usuario, igual que el "Alterar Empresa/Safra" del VB6.
  El nombre dinámico **se valida contra `all_tables` antes de usarlo** (`gpi.service.js → tabla()`).

## Tablas núcleo

| Tabla | Qué guarda | Clave |
|---|---|---|
| `GI_LAB_NO_PLAN_{e}` | Árbol de análisis. Cada nodo es una planilla; padre en `ID_NO_ANT` (0 = raíz). 411 nodos, 29 raíces, 318 con variables | `ID_PLAN` |
| `GI_LAB_ACESSOS_{e}` | Planillas habilitadas por usuario (`USU_HABILITADO` S/N) | `ID_USUARIO`, `ID_PLAN` |
| `GI_LAB_VAR` | Variables: planilla, unidad, máscara (`VAR_MAS_INT/DEC`), origen (`VAR_ORI_DADOS` 0 = digitada, 1 = fórmula), fórmula, tipo de media | `ID_VAR` |
| `GI_LAB_VAR_STATUS` | Estado por empresa (`VAR_STATUS` 1 = activa), especificaciones, alertas | `COD_EMPR`, `ID_VAR` |
| `GI_LAB_PLAN_CONF_{e}` / `GI_LAB_PLAN_CONF_GERAL` | Columnas de la planilla. La GERAL (por empresa, con fecha de vigencia) **tiene prioridad** | `ID_PLAN` |
| `GI_LAB_LANC_{e}_{s}` | Cabecera de un día de una planilla | `ID_LANC` (`ID_PLAN` + `LAN_DATA` únicos) |
| `GI_LAB_LANC_MOV_{e}_{s}` | Valores: `MOV_VALOR` **texto** (ya formateado con la máscara) por variable y columna | `ID_VAR`, `MOV_COLUNA`, `ID_LANC` |
| `GI_LAB_ACUM_{e}_{s}` | Acumulados por variable y día (`ACU_MEDIA`, `ACU_VALOR_ACUM`, `ACU_DIVISOR_ACUM`) | `ID_VAR`, `ACU_DATA` |
| `GI_LAB_DEP_VAR` / `GI_LAB_DEP_ORD` | Grafo de dependencias entre fórmulas y orden de cálculo | — |
| `GI_LAB_PARAM_USINA` | Parámetros por empresa/zafra: inicio, **último cierre** (`PAR_DT_FECHA`), cálculo automático, etc. | `COD_EMPR`, `SAF_ANO_SAFRA` |

## Columnas de una planilla

- `PLC_DIVISAO = 0` → **por horas**: una columna cada `PLC_NVEZES` horas, desde `PLC_INT_DIV_INI` hasta `PLC_INT_DIV_FIM`
  (con cruce de medianoche). Ej.: 04:00–03:59 cada 1 h → 24 columnas; cada 4 h → 6.
- `PLC_DIVISAO = 1` → **por bateladas**: `PLC_NVEZES` columnas numeradas (hasta 97).
- **Columna 99** = resultado del día (ver `gpi-motor-formulas.md`).

## Trampas

- `GI_LAB_PLAN_CONF_1` tiene un *materialized view log* (`MLOG$_GI_LAB_PLAN_CONF_1`): hay replicación sobre esa tabla.
- Los valores son **texto**: `"10.47"`, `"9:30"` (horas), `"ANIDRO"` (variables de texto, `VAR_TIPO_DIG = 2`).
- `GI_LAB_TAB_CONV_GRAU` está vacía: `ConvGrau()` siempre resultó 1.
