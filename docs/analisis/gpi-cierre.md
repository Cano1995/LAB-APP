# GPI — cierre diario (Fechamento) y acumulados

Análisis para el Sprint 4. **Solo lectura**: la app nueva todavía no cierra días; esto documenta lo que hace el VB6 y
lo que ya se pudo deducir para replicarlo. Herramienta: `tools/gpi-analizar-acumulados.js`.

## Fechas de control (`GI_LAB_PARAM_USINA`, por empresa y zafra)

| Campo | Significado | Evidencia |
|---|---|---|
| `PAR_DT_FECHA_REAL` | **Última fecha cerrada** | `UPDATE … SET PAR_DT_FECHA_REAL = ?` al cerrar |
| `PAR_DT_FECHA` | **Día actual de digitación** (el que abre el lançamento) | se actualiza junto con la anterior; hoy = último cierre + 1 |
| `PAR_DT_FECHA_TURNO` | Último día cerrado para los turnos | `UPDATE … SET PAR_DT_FECHA_TURNO = PAR_DT_FECHA_REAL` |
| `PAR_DT_INICIO` / `PAR_DT_FIM` | Inicio y fin de la zafra del GPI | |

*(La pantalla de consulta rotulaba `PAR_DT_FECHA` como "último cierre": estaba mal; corregido.)*

## Qué hace el cierre (SQL del exe, `FrmFechamentoDiario`)

1. Toma el control: `GI_LAB_CONTROLA_FECHAMENTO` (clave empresa+zafra) guarda quién está cerrando
   (`CON_USUARIO`, `CON_MAQUINA`, `CON_DATA`, `CON_TIPO`, `CON_ID_FECHAMENTO`). Es un **candado**: evita dos cierres a la vez.
2. Prepara variables auxiliares: `GI_LAB_FECHA_AUX` (se borra e inserta por empresa/zafra).
3. Recalcula el día (`sCalculaDia`), los acumulados (`sCalculaAcumulado`), las medias (`sProcessarMedia`) y verifica
   consistencia (`sVerificaConsistenciaAcumulados`).
4. Avanza fechas: actualiza `PAR_DT_FECHA`, `PAR_DT_FECHA_REAL` y `PAR_DT_FECHA_TURNO`.
5. Registra el cierre: `GI_LAB_RASTREA_FECHAMENTO` (20.896 filas; lista de variables recalculadas, tiempo, cancelación)
   y `GI_LAB_VALIDA_FECHA.DATA_ULTFECHA` (última fecha validada).
6. Libera el candado.

El cierre usa `GI_LAB_CONTROLA_P1_P2` (`EXEC_PARTE_1`, `EXEC_PARTE_2`): el proceso se parte en dos etapas con marca de
progreso, para poder reanudarlo si se corta.

## Acumulados (`GI_LAB_ACUM_{e}_{s}`) — reglas deducidas

Cada fila es (variable, fecha) con `ACU_VALOR_ACUM`, `ACU_DIVISOR_ACUM` y `ACU_MEDIA` (texto). Se acumula **desde el inicio
de la zafra** (`PAR_DT_INICIO`) usando el resultado del día (col. 99) de cada día. Siempre se cumple **`VALOR = MEDIA × DIVISOR`**.

| `VAR_TIPO_MEDIA` | Acumulado | Coincidencia |
|---|---|---|
| 1 (media aritmética) | `VALOR = Σx`, `DIVISOR = n` (días con dato), `MEDIA = Σx/n` | 100% (99% en 2025) |
| 2 (media ponderada) | `MEDIA = Σ(x·w)/Σw` con `w` = resultado del día de `VAR_ORI_POND`; **se excluyen los días con x = 0**; `DIVISOR = Σw` | 91–97% |
| 3 (suma) | `VALOR = MEDIA = Σx`, `DIVISOR = 1` | 97–100% |
| 4 (último valor / saldo) | `MEDIA = último valor del día`, `DIVISOR = 1` | 100% |
| 5 (media calculada) | `MEDIA` = **la fórmula de la variable evaluada con los ACUMULADOS (`ACU_MEDIA`) de sus entradas**, `DIVISOR = 1` | 92–96% |
| 0 | no acumula | — |

Resultados en 2026-10-20, 2026-07-15 (zafra 2026) y 2025-12-15 (zafra 2025): las reglas se mantienen.

### El acumulado es INCREMENTAL (hallazgo clave)

El VB6 no recalcula la zafra al cerrar: **`ACUM(D) = ACUM(D−1) ⊕ resultado del día D`**. Verificado con
`node tools/gpi-probar-acum-incremental.js 2026-10-15 2026-10-21` (acumulados de un día contra el del día anterior):

| Tipo | Regla incremental | Días-variable que coinciden |
|---|---|---|
| 1 (media) | `V += x`, `D += 1` | 3.794 / 3.794 (100 %) |
| 3 (suma) | `V += x` | 5.432 / 5.432 (100 %) |
| 2 (ponderada) | si x = 0, nulo o sin ponderador: no cambia; si no, `V += x·w`, `D += w` | 3.723 / 3.738 (99,6 %) |

Consecuencia: el 3–9 % de diferencia que se veía al **recalcular desde el inicio de zafra** (tabla de arriba) no es un error
de la regla sino que las correcciones posteriores a días ya cerrados **no se reflejan** en los acumulados. La app nueva debe
acumular desde la fila del día anterior, nunca sumar de nuevo la zafra, o va a divergir del VB6.

### Pendiente en acumulados
- Tipo 5: ~4–8% (probablemente funciones aún no implementadas o fórmulas con `GetAcumulado`/`GetAcumuladoGrupo`). Como el
  tipo 5 evalúa la fórmula con los `ACU_MEDIA` de las entradas, hereda lo incremental de ellas; hay que reprobarlo con esa base.
- Tipo 2: 15 casos de 3.738 sin explicar (variable 6718 y 8327; posible redondeo del ponderador).
- Acumulados "de la safra anterior" (`ACUMULADO_SAF_ANT`) y mensuales (`Media-mensal`, `-semanal`, `-quinzenal`): no analizados.
- Funciones de acumulado en fórmulas: `GetAcumulado`, `GetAcumuladoGrupo`.

## Qué falta para habilitar el cierre en la app nueva

1. Cerrar los pendientes de acumulados y del motor (`gpi-motor-formulas.md`).
2. Reproducir un cierre completo **en DESA** y comparar fila a fila contra el que dejó el VB6 (mismo día, mismos datos).
3. Replicar el candado `GI_LAB_CONTROLA_FECHAMENTO` (para no cerrar a la vez que el VB6, que sigue en uso en paralelo).
4. Validaciones previas: `FrmValidaFecha` (`GI_LAB_VALIDA_FECHA`), checklist (`GI_LAB_CONF_VAR_CHECKLIST`,
   `GI_LAB_LOG_VALIDA_CHECKLIST`) y variables de cierre (`GI_LAB_CONF_VAR_FECHAMENTO`): las tres están vacías en DESA.
5. ~~Decidir la regla de seguridad para `Db_Select`~~ — resuelto: se permite, solo SELECT en transacción de solo lectura (ver `gpi-motor-formulas.md`).

# Sprint 4 — mapeo de pantallas → tablas (`GATEC_GPI_NEW`)

Pantallas implementadas sobre el CRUD genérico. Permisos por `idForm` (ver `CLAUDE.md`, sección Autenticación).

| Pantalla VB6 | idForm | Tabla | Filas DESA | Recurso | Modo |
|---|---|---|---|---|---|
| Parada · Grupo | 8431 | `GI_LAB_GRUPO_PARADA` (+ `_STATUS`) | 2 | gpi-parada-grupo / -estado | edición |
| Parada · Local | 8433 | `GI_LAB_LOCAL_PARADA` (+ `_STATUS`) | 8 | gpi-parada-local / -estado | edición |
| Parada · Motivo | 8435 | `GI_LAB_MOT_PARADA` (+ `_STATUS`) | 2 | gpi-parada-motivo / -estado | edición |
| Parada · Lançamento | 8437 | `GI_MOT_PARADA_LANC` | 25 | gpi-parada-lanc | **consulta** |
| Redução · Grupo / Local / Motivo | 10112 / 10114 / 10116 | `GI_LAB_REDU_MOAGEM_GRUPO / _LOCAL / _MOTIVO` | 0 | gpi-redu-* | edición |
| Redução · Equipo | 10110 | `GI_LAB_REDU_MOAGEM_EQPTO` | 0 | gpi-redu-equipo | edición |
| Redução · Lançamento | 10118 | `GI_LAB_REDU_MOAGEM_LANC` | 0 | gpi-redu-lanc | **consulta** |
| Cadastro de Materiais | 8481 | `GI_LAB_CAD_MATER_PROCESSO_GEN` | 2 | gpi-material | edición |
| Configuração de Materiais | 8483 | `GI_LAB_CAD_MATER_PROCESSO` | 183 | gpi-material-config | **consulta** |
| Tanques · Medição / Estocagem | 8486 / 8488 | `GI_LAB_TANQUE_MED / _EST` | 3 / 13 | gpi-tanque-* | edición |
| Productos · Categorías / Productos | 8474 / 8476 | `GI_LAB_PRODUTO_CATEG`, `GI_LAB_CAD_ACUCAR` | 0 | gpi-producto-* | edición |

**Solo consulta** (a propósito): los lançamentos calculan campos (p. ej. `MPL_HORAS_PARADAS` en HH:MM) y validan
solapamientos; la configuración de materiales maneja fórmulas y variables Pol/Brix/GL con vigencia. Se habilitan cuando se
repliquen esas reglas. Las tablas `*_STATUS` guardan el historial de activo/inactivo por fecha; el VB6 las edita dentro de
la misma pantalla (subgrilla), acá son recursos separados "· Historial de estado".

**Sin recrear** (tablas vacías y sin pantalla en el menú de este exe): `GI_LAB_SETOR_PARADA`, `GI_LAB_CLASSE_PARADA`,
`GI_LAB_EQUIP_PARADA`, `GI_LAB_LANC_PARADA`, `GI_LAB_CAUSA_PARADA` (modelo nuevo de paradas, 1 fila), `GI_LAB_CAD_TURNO`.

## Pendiente del Sprint 4
- **Digitación de Material en proceso** (`frmDigMatProc`, `GI_LAB_DIG_MATER_PROCESSO`, 375.215 filas): requiere escritura
  y alimenta a `GetMassaBrix`, `GetMassaPol`, `GetAlcoolDorna`.
- **Fechamento** y **Valida Cierre** (arriba).
- Listados de paradas y de reducción de moagem (reportes), gráficos de paradas (Pareto): Sprint 6.
