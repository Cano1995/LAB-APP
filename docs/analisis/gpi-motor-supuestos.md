# Motor de fórmulas del GPI: supuestos y su estado (Sprint 16)

El motor (`api/src/modules/gpi/formula/`) reimplementa el cálculo del VB6 sin tener su código. Cada comportamiento es **VERIFICADO** (coincide con
valores que guardó el VB6 en DESA) o **SUPUESTO** (razonable, pero sin dato que lo confirme). Los supuestos están fijados con pruebas
(`api/test/motor.test.js`, `api/test/reglas.test.js`): cambiarlos tiene que ser una decisión, no un accidente.

Uso en producción medido sobre las 1.521 fórmulas de `GI_LAB_VAR` (28/10/2026): `^` en 18 (ninguna lo encadena), `LogN` en 14, `Log` en 0, `Pot` en 2,
`Raiz` en 1, `Exp` y `Trunc` en 0, `AND`/`OR`/`&&`/`||` en 4, `Db_Select` en 3 (2 consultas distintas), la más larga tiene 1.691 caracteres.

| # | Comportamiento | Estado | Evidencia / riesgo | Para confirmar |
|---|---|---|---|---|
| 1 | Una operación con nulo da nulo; `Nvl` lo reemplaza; una comparación con nulo es nula y se toma como falsa | VERIFICADO | 99,63 % de las columnas coinciden (1-21/10/2026) | — |
| 2 | `AND`/`OR` con nulo siguen la lógica de tres valores de VB6 (`False And Null = False`, `True Or Null = True`) | SUPUESTO (semántica de VB6) | solo 4 fórmulas usan lógicos y todas coinciden; antes de Sprint 16 el resultado con nulo era siempre nulo | un caso real con nulo en un `AND`/`OR` |
| 3 | División por cero → nulo | SUPUESTO | el VB6 daría un error en tiempo de ejecución; no se sabe si no guarda nada o guarda otra cosa | qué guarda el GATEC cuando divide por cero |
| 4 | Desborde (`10^1000`, `0^-1`) → nulo, nunca `Infinity` | SUPUESTO | igual que el punto 3 | ídem |
| 5 | `^` asocia a derecha (`2^3^2 = 512`); el menos unario aplica después de la potencia (`-2^2 = -4`) | SUPUESTO | VB6 asocia a izquierda (`= 64`). **Sin efecto hoy**: ninguna fórmula encadena `^` | cambiar a izquierda si se agregan fórmulas con `^` encadenado |
| 6 | `'1' + '2'` con textos numéricos suma (3); con un texto no numérico concatena | SUPUESTO | VB6 concatenaría (`"12"`). Ninguna fórmula conocida lo hace; los valores guardados son texto y deben operarse como número | ídem |
| 7 | `Log` = logaritmo decimal; `LogN(valor, base)` = logaritmo en cualquier base; fuera de dominio → nulo | `LogN` VERIFICADO (14 fórmulas); `Log` SUPUESTO (0 fórmulas) | en VB6 `Log` es el logaritmo natural | decidir antes de usar `Log` |
| 8 | Funciones de tecnología azucarera (`Pol`, `PolCana`, `BrixCana`, `UmidadeCana`, `ExtrReduzND`, `BrixBagacoDig`, `FibraBagacoDig`, `EficCentrifVinho`) | VERIFICADO al 100 % | `tools/gpi-probar-funcion.js` | — |
| 9 | `Round()` de VB6 (búsquedas en tablas de masa específica y densidad): empate al par sobre el producto `x·10ⁿ` | **ABIERTO (M7)** | `99.85→99.8` y `0.25→0.2` coinciden con los datos; ningún dato guardado distingue «sobre el double» de «sobre el decimal» (p. ej. `1.15→1.1` ó `1.2`) | un caso real con entrada `x.x5` en `GetMEAlcool`/`GetDensBrix` |
| 10 | `Format()` de VB6 al guardar: mitad alejándose de cero sobre la representación decimal | VERIFICADO | comparación exacta: 99,63 % de columnas (oct.) y 99,54 % (sep.) | — |
| 11 | Texto guardado: decimales de la máscara, punto decimal, sin exponente ni `-0`, máximo 20 caracteres | VERIFICADO | 7.532 valores numéricos (15-18/10/2026), todos con los decimales de la máscara | — |
| 12 | Variables de hora: columnas en `h:mm`; **día** en horas decimales con hasta 3 decimales y sin ceros finales, sumando columnas ya redondeadas a 3 decimales (`11.917 + 11.917 = 23.834`) | VERIFICADO | 24 variables de hora el 1-21/10/2026; la medida exacta del día pasó de 96,84 % a 99,32 % | — |
| 13 | `Db_Select`: un solo `SELECT` sobre `ba_movimientos_bascula`, `personas` y `lc_tipos_cañeros` con funciones `SUM/COUNT/AVG/MIN/MAX/NVL/ROUND/TRUNC/ABS/TO_DATE/TO_NUMBER/BUSCA_PARAMETRO`; el resto se rechaza | VERIFICADO con las 3 fórmulas reales | batería de ~100 entradas hostiles en `api/test/dbselect.test.js` | si aparece una fórmula nueva con otra tabla o función, hay que ampliar la lista a conciencia |

## Límites y errores controlados (M9)

Fórmula: máximo 20.000 caracteres, 5.000 elementos y 100 niveles de anidación (el parser) y 200 (el evaluador). Cada función exige su cantidad mínima de
argumentos; las fechas se validan (`AAAA-MM-DD`) y los desplazamientos de días no pueden pasar de 100.000. Todo fallo interno sale como `ErrorFormula`
(sintaxis) o `ErrorEvaluacion` (evaluación) con mensaje claro, nunca como `TypeError`/`RangeError`.

## Dependencias y ciclos (M10)

`dependencias(ast)` devuelve los ids de todas las variables que lee una fórmula (`GetAnalise`, `GetMedia` y las funciones de dominio) y avisa si alguna
referencia es dinámica (el id no está escrito en la fórmula). `detectarCiclos(grafo)` encuentra ciclos directos, indirectos y autorreferencias. Hoy
nada los usa en la API (el motor corre solo en herramientas); son **obligatorios antes de escribir**.

## Línea base de validación contra el VB6 (Política UV, solo celdas guardadas)

| Período | Columnas | Día (col. 99) | Variables 100 % correctas | Comparación exacta |
|---|---|---|---|---|
| 1-21/10/2026 | 99,63 % (23.495/23.582) | 99,32 % (13.609/13.702) | 1.108/1.129 | igual |
| 1-30/09/2026 | 99,54 % (47.407/47.628) | 99,09 % (26.010/26.250) | 1.120/1.144 | igual |

«Comparación exacta» = el texto que se guardaría (`aTextoGuardado`) es idéntico al que guardó el VB6. Reproducir:
`node tools/gpi-validar-formulas.js 2026-10-01 2026-10-21` (con `EXACTO=UV` lista las diferencias que solo ve la comparación exacta).
Los pendientes que mueven estos números (5533, 289, tiempos de cocción, acumulados) siguen en `gpi-motor-formulas.md` y pasan al Sprint 17.
