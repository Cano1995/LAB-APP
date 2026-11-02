# GPI — motor de fórmulas (reimplementación)

El cálculo de las ~1.500 variables con fórmula estaba en el VB6 (código nativo, sin fuente). Se reescribió en
`api/src/modules/gpi/formula/` y **se valida contra los valores que calculó el VB6** con `tools/gpi-validar-formulas.js`.
Las reglas de abajo se dedujeron de los datos, no de documentación: cada una indica su evidencia.

## Componentes

- `parser.js` — lenguaje de fórmulas → AST. Parsea 1.520 de 1.521 fórmulas de producción; la que falla (`5533`) tiene
  un error de sintaxis real (falta un operador entre `SE(...)` y `( 100 * 789.23)`).
- `evaluador.js` — evalúa el AST contra un "contexto" inyectable (datos de la base o en memoria).
- `tablas.js` — funciones de tabla y redondeos con la semántica exacta del VB6.
- `reglas.js` — reglas de cálculo (referencias, redondeo al guardar, resultado del día, variables inactivas).
  **Las usa también el arnés**, así que lo validado es lo mismo que corre en la API.

## Reglas deducidas

### Cálculo

| Regla | Evidencia |
|---|---|
| `GetAnalise(…)` sin bandera = valor de la **misma columna**; faltante = nulo y **se propaga** (`Nvl` lo reemplaza) | ver "Valores faltantes" abajo |
| `GetAnalise(…, 1)` = misma columna y, si falta, **último valor diario disponible** | +0,4 pp sobre "último" a secas, sin empeorar ninguna variable |
| `GetMedia(…)` **sin fecha** = último valor diario disponible (arrastrado) | `FIB CANA PRE` repite 15,29 del 08/10 al 18/10/2026 |
| **Resultado del día (col. 99)** = suma de las columnas si `VAR_TIPO_MEDIA = 3`; media aritmética en los demás tipos. La ponderación **no** se usa para el día | 15.000+ casos, 99,7–100% (`tools/gpi-analizar-media-dia.js`) |
| El día agrega las columnas **ya redondeadas** | 377,47 calculado vs 378 guardado = suma de redondeados |
| Redondeo al guardar = **`Format` de VB6** (mitad hacia arriba sobre el decimal) | día 98,58% vs 98,22% con `Round` |
| Variables de hora (`VAR_TIPO_DIG = 3`): `h:mm` sin cero inicial (`9:30`); el día en horas decimales | datos guardados |
| **No se calculan variables inactivas** (`VAR_STATUS ≠ 1` o planilla inactiva) | elimina 280 de 314 celdas sobrantes |

### Valores faltantes — resuelto

En 2025 parecía que un faltante valía 0 (`TT IMP %` guardaba `IM% + IV%` con entradas vacías). **No es una regla del
motor: era la fórmula de esa época.** El historial `GI_LAB_RASTREA` muestra que hasta el 19/05/2026 esas fórmulas eran
`Nvl(IM%,0) + Nvl(IV%,0) + …`. Con la fórmula vigente en cada fecha, 2025 pasa de 81,8% a 99,5% sin tocar la regla de nulos.

- `GI_LAB_RASTREA.RAS_FORMULA` guarda la fórmula **anterior** al cambio (en 2.581 de 2.610 variables el último registro
  difiere de la fórmula actual).
- La fórmula vigente para el día D es la que regía **al final de D+1**: el VB6 recalcula el día al cerrarlo
  (el 01/10/2026 se reproduce con la fórmula cambiada el 02/10 a las 13:16).
- Variables **creadas después** de un día (registro `I` del historial) tienen valores de ese día por **recálculo
  retroactivo**, hecho con la fórmula de un momento desconocido: el arnés las excluye y las cuenta aparte.

### Funciones

| Función | Fórmula | Evidencia |
|---|---|---|
| `GetMEAlcool(1, INPM)` | INPM con `Round` de VB6 a 1 decimal (99,85 → 99,8), fila exacta → ME20 | pares guardados |
| `GetMEAlcool(0, ME)` | fila con la menor ME20 ≥ valor → INPM; faltante cuenta como 0 → 100 | 800,0 → 96,4; 790,1 → 99,7 |
| `GetDensBrix(1, Brix)` | Brix con `Round` a 1 decimal, fila exacta → densidad; faltante → nulo | pares + sobrantes |
| `ConvGrau(t)` | 1 con la tabla `GI_LAB_TAB_CONV_GRAU` vacía (si hay temperatura) | 1.754 celdas, todas `1.0000` |
| `Pol(L, Bx)` | `L·(0,2605 − 0,0009882·Bx)` | 241/241 |
| `PolCana`, `ARCana` | `S·(1 − 0,01F)·(1,0313 − 0,00575F)` | 118/118 |
| `BrixCana` | `B·(1 − 0,01F)` (sin el segundo factor) | 118/118 |
| `UmidadeCana` | `100 − Brix − Fibra` | 118/118 |
| `ExtrReduzND` | `100 − (100−E)(100−F)·12,5 / (F·87,5)` | 232/232 |
| `EficCentrifVinho` | `(VB−VC)·FC / ((FC−VC)·VB) × 100` | 1.567/1.567 |
| `SomaProp(f1,v1,f2,v2,…)` | `Σ(f·v)/Σf` | variables 585, 1493 sin discrepancias |
| `BrixBagacoDig(Pol, Pur)` | `100·Pol/Pur`; **sin pureza → 70** | pureza implícita 70,00 donde falta |
| `FibraBagacoDig(U, L, Pur)` | método del digestor en forma cerrada: `k = 26·L/Pur`, `F = (100 − U − 11k)/(1 − 0,01k)`; sin pureza → 70 | 44,650 vs 44,65 guardado; variables 353/9364 sin discrepancias |

## Resultado de la validación (política UV = reglas.js)

| Muestra | Columnas | Día (col. 99) | Variables 100% correctas | Sobrantes* | Omitidas (retroactivas) |
|---|---|---|---|---|---|
| 2025-08-01 → 10 | **99,55%** | 98,70% | 1.007 / 1.025 | 12 | 108 |
| 2025-12-01 → 10 | **99,62%** | 98,91% | 1.075 / 1.087 | 3 | 0 |
| 2026-06-01 → 10 | **99,36%** | 98,33% | 982 / 1.009 | 5 | 492 |
| 2026-10-01 → 20 | **99,63%** | 99,32% | 1.107 / 1.128 | 34 | 0 |

\* Celdas de variables activas donde el VB6 no guardó nada y el motor calcularía algo.

Cada fórmula se prueba **aislada**: sus entradas son los valores guardados de las variables de las que depende.

## Pendiente

1. **Material en proceso** (`formula/material.js`; deducción con `tools/gpi-probar-material.js`):
   - `GetMassaBrix` / `GetMassaPol` ✔ **15/15 días** (10–24/10/2026): Σ equipos del producto 1 de
     capacidad · llenado% · densidad(Brix) · (Brix | Pol)/100 / 1000. Llenado = lo digitado ese día (`GI_LAB_DIG_MATER_PROCESSO`,
     sin fila = 0); Brix y Pol = último valor disponible de la variable del equipo.
   - `GetAlcoolDorna` 🟡 12/15 días: Σ equipos del producto 2 con variable GL de capacidad · llenado% · GL / 10.000.
     **Falta** el aporte de los tanques de jugo sin variable GL (p. ej. 224, 349, 361): ≈0,68 × Pol del jugo clarificado
     (#8595) con ±1% de dispersión y muchos días con otros efectos (zafra 2025: proporcional en 94/143 días). Queda sin replicar.
2. **`Db_Select`** — **decidido: se permite** (3 variables de entrada de caña; SQL guardado en la fórmula contra
   `ba_movimientos_bascula`, con `[VAR_EMPR]`, `[VAR_SAFRA]`, `[VAR_DATA]`; solo se usa si falta el valor digitado).
   Implementado en `formula/dbselect.js`: una sola sentencia SELECT (sin ';', comentarios ni DML/DDL), sustitución de los
   marcadores, ejecución en transacción `READ ONLY` con tope de 30 s vía `break()` (`db.queryLectura`; `callTimeout` no sirve con el cliente 12.1) y resolución previa porque el evaluador
   es síncrono. Probar con `node tools/gpi-probar-dbselect.js <fecha>`. El SQL no filtra por fecha final (`>= [VAR_DATA]`),
   por eso solo es comparable en el día actual.
   **Estado de la prueba (26/10/2026):** ejecuta sin error. El 25/10 devuelve nulo porque la balanza no tiene entradas de caña
   desde el 21/10; su valor solo se puede comparar contra el VB6 en un día con molienda. Las 3 fórmulas toman primero el valor
   digitado (`Nvl(GetAnalise(...),-1)>-1`), por eso las validaciones históricas nunca pasan por `Db_Select`.
3. **Fórmula 5533** con error de sintaxis: el VB6 guardó 0. **Se deja como está por ahora**; se replica bien cuando se hable
   con un usuario del GATEC viejo.
4. Residuales: promedios de tiempos de cocción (`DUR M COC A/B/C`, diferencias de minutos), algunos totales entre
   planillas en días puntuales, `CANTIDMASA` (el día se sumó pese a ser tipo media).
5. **Acumulados y cierre diario**: reglas deducidas (92–100% por tipo) en `gpi-cierre.md`; quedan los pendientes allí listados.

## Cómo correr la validación (desde la raíz del repo)

```
node tools/gpi-validar-formulas.js 2026-10-01 2026-10-20            # empresa 1, zafra 2026
node tools/gpi-validar-formulas.js 2025-08-01 2025-08-10 1 2025     # otra zafra
SOBRANTES=UV node tools/gpi-validar-formulas.js ...                  # lista los sobrantes
HISTORIAL=0 node tools/gpi-validar-formulas.js ...                   # sin historial de fórmulas
node tools/gpi-analizar-faltantes.js <desde> <hasta> [empr] [safra]  # conflictos de valores faltantes
cd api && node ../tools/gpi-probar-funcion.js <idVar> [safra]        # candidatas de una función de dominio
```
Todas son de solo lectura y verifican que la conexión sea DESA (`DB_HOST_ESPERADO`).
