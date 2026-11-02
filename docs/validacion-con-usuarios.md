# Checklist de validación: GATEC viejo vs. la app nueva

> Valores esperados **re-verificados contra DESA el 28/10/2026** (41 de 41 vigentes) con `node tools/verificar-valores-esperados.js`. Córralo el día antes de la sesión: DESA se recarga cada noche. Guía para quien conduce la sesión: `docs/sesion-validacion-sprint17.md`.

**Para quién:** un usuario del GATEC (y, en la parte 4, personal del laboratorio). **Cuánto lleva:** unas 2 horas. **Qué se pide:** abrir la misma pantalla en los dos sistemas y comprobar que los números coinciden.
Marque cada fila con ✔ (coincide), ✘ (no coincide) u ❓ (no sé) y anote lo que vea distinto.

## Antes de empezar (importante)

1. **La app nueva trabaja con DESA, una copia de la base que se actualiza cada noche. El GATEC viejo muestra producción en vivo.** Por eso compare **solo días ya cerrados** (los de este documento son de octubre de 2026,
   cuando la planta ya había cerrado el día). Si un día se corrigió en producción después de la última copia, puede haber una diferencia que no es un error de la app: anótela igual y marque «día corregido».
2. **No cargue ni modifique nada en ninguno de los dos sistemas.** La app nueva es solo de consulta (excepto los catálogos, que no se prueban acá). No presione Grabar, Cerrar ni Recalcular en el GATEC viejo.
3. **Ingreso a la app nueva:** su **usuario del GATEC** y la **contraseña de su usuario de Oracle** (la misma con la que entra al GATEC viejo). Si se equivoca 2 veces, la app espera 15 minutos antes de volver a intentar (protege su cuenta de Oracle).
4. Elija **AZPA · Zafra 2026/2027** arriba a la derecha (en el GATEC viejo, la misma empresa y zafra).
5. Si alguna pantalla no aparece en su Inicio, es porque su usuario no tiene permiso: anótelo, no es un error.

---

## Parte 1 — Proceso Industrial (GPI)

### 1.1 Digitación diaria · `Inicio → Digitación diaria`
En el GATEC viejo: *Proceso Industrial → Digitação das Análises*.

| Planilla / día | Variable | Debe dar | Su resultado |
|---|---|---|---|
| «Entrada caña», 20/10/2026 | Caña total ingresada (resultado del día) | **5.788,650** | |
| «Entrada caña», 20/10/2026 | Caña Propia / Caña Particulares / Caña de Asociados | **2.568,440** / **2.967,490** / **252,720** | |
| «Entrada caña», 21/10/2026 | Caña total ingresada | **1.375,540** | |

Compare además: el **orden** de las variables, las filas calculadas (en amarillo en la app nueva) y que las **horas** de cada columna sean las mismas. ¿Hay alguna variable que en el viejo está y en la nueva no (o al revés)?

### 1.2 Valores de variables · `Inicio → Valores de variables`
Elija las variables, marque **Acumulado de zafra**, desde 20/09/2026 hasta 21/10/2026.

| Variable | Fecha | Acumulado esperado | Su resultado |
|---|---|---|---|
| Vol. fermento cuba (Dornas fermentación caña) | 20/09/2026 | **25.185.472** | |
| Vol. total vino en dorna (Dornas fermentación caña) | 20/09/2026 | **175.388.400** | |

Pruebe también el cuadro **Consulta guardada**: cargue una de las suyas y confirme que trae las mismas variables.

### 1.3 Informes · `Inicio → Informes → «Informe diario» (#1)`, del 18 al 24/10/2026

| Variable | 18/10 | 19/10 | 20/10 | 21/10 | Su resultado |
|---|---|---|---|---|---|
| Días totales zafra | **166** | **167** | **168** | **169** | |
| Caña molida h efectiva (t/h) | **0,000** | **304,961** | **290,644** | **275,108** | |
| Caña total ingresada (t) | **0,000** | **1.804,350** | **5.788,650** | **1.375,540** | |

Pregunta clave: en el GATEC viejo, al imprimir este informe, **¿qué columnas salen?** (solo los días, o también promedios, acumulado, semana…). La app nueva muestra solo los días. Anote lo que imprime el viejo.

### 1.4 Boletines · `Inicio → Boletines → COPAC`, fecha 24/10/2026

| Concepto | Acumulado de zafra esperado | Su resultado |
|---|---|---|
| Días totales zafra | **172** | |
| Caña total ingresada | **536.727,560** | |

Pregunta clave: el boletín del viejo, **¿muestra el día, el acumulado, o los dos?** ¿Tiene otras columnas (por ejemplo, zafra anterior)?

### 1.5 Real x Metas · `Inicio → Real x Metas` (zafra 2025, día 20/10/2025)
En DESA la zafra 2026 no tiene metas cargadas; para esta prueba use **Zafra 2025** (o pida que se cargue una meta de prueba).

| Variable | Meta diaria | Real del día | Cumplimiento | Su resultado |
|---|---|---|---|---|
| Caña total ingresada | **8.000** | **1.448,83** | **18 %** | |
| Aprov. tiempo | **83,9** | **21,18** | **25 %** | |

Preguntas clave: (a) para metas **quincenal y mensual**, ¿el real del viejo es la **suma** o el **promedio**, y se compara con la meta del período completo o parcial? (b) ¿qué significa «Ideal» **s / i** en la carga de metas? (c) ¿cómo se define la semana para la meta semanal?

### 1.6 Supervisorio, Panel, CEP y Correlación
- **Supervisorio** · panel «% tenor alcohol en vinaza»: compare el gráfico de los últimos 3 días con el del viejo (valores y límites 0,01 a 0,09).
- **Panel de información**: ábralo con **su** usuario y compare, contra el panel del viejo, las variables de cada pestaña y la fecha por defecto.
- **CEP** (Control estadístico): elija una variable que usted ya grafique en el viejo, con el mismo rango y tamaño de subgrupo. Compare **media, límites de control (LCS/LCI) y Cp/Cpk**.
  *El viejo no guarda estos resultados, así que esta es la única forma de validar las fórmulas.*
- **Correlación**: elija 2 variables que ya correlacione en el viejo, mismo período, y compare el coeficiente.

---

## Parte 2 — Laboratorio de recepción

### 2.1 Análisis de caña (sonda) · `Inicio → Análisis de caña (sonda)`
En el viejo: *Pós-Colheita → Consulta* (`Pesquisa Análise Pós-Colheita`). Fecha **21/10/2026**, todos los estados.

| Dato | Debe dar | Su resultado |
|---|---|---|
| Total de análisis del día | **72** (20 completas, 33 sin resultado, 19 acoplados) | |
| Promedios de las 20 completas | Brix **19,22** · Pol caña **13,25** · Fibra **14,77** · ATR **127,77** | |
| Análisis del comprobante **1146514**, acoplado 1 | Brix **18,45** · Pol caña **12,81** · Fibra **14,01** · Pureza **84,93** · AR **0,595** · ATR **123,90** · operador Cameco | |

Preguntas clave para el laboratorio:
1. En la app nueva, el **acoplado 2 casi nunca tiene resultado propio**. ¿Es correcto? (¿el análisis es uno por camión con acoplados?)
2. Desde 2024 **solo ~60 %** de los camiones tiene resultado (en 2022 era 99 %). ¿Se analiza solo una muestra de los camiones? ¿Quién decide cuáles?
3. ¿Qué significa «sin resultado» para ustedes: ¿**pendiente de analizar** o **no se analiza**?

### 2.2 Entrada de caña · `Inicio → Entrada de caña`
En el viejo: la pesquisa de entrada de caña (balanza). Fecha 20/10/2026 y 21/10/2026.

| Día | Camiones | Toneladas netas | Cañeros | Su resultado |
|---|---|---|---|---|
| 20/10/2026 | **207** | **5.646,57** | **69** | |
| 21/10/2026 | **63** | **1.764,29** | **29** | |

Preguntas clave:
1. La **caña ingresada del GPI** no coincide con la balanza (20/10: 5.788,65 contra 5.646,57; 21/10: 1.375,54 contra 1.764,29). La fórmula de la variable «Caña total ingresada» (#46) dice: **si hay un valor digitado a mano (variable #8449), usa ese; si no, suma la balanza** (peso bruto − tara + descuentos, dividido 1.000). Entonces: **¿quién digita ese valor a mano y de qué papel o sistema lo toma?** ¿Es normal que difiera de la balanza? ¿Qué pasa en un día en que nadie lo digita?
2. ¿Qué es un **acumulado** (código largo, p. ej. 571021)? En la app nueva agrupa varias pesadas y varios análisis de un mismo cañero y parcela. ¿Cómo se calcula la **calidad que se paga**: promedio simple de los análisis del acumulado o ponderado por peso?
3. ¿Se usa el reporte **«Balanza acumulado» (Bal0015)** de calidad por división agrícola? Si sí, ¿puede facilitar una impresión de ejemplo?

---

## Parte 3 — Administración (solo si usted es administrador)
`Inicio → Usuarios, grupos y permisos` (no verá el enlace si no tiene acceso total a «Controle de Accesos»).

| Qué comprobar | Su resultado |
|---|---|
| Usuario **BOT**: grupo «Consulta» y el mismo estado (activo) que en el viejo | |
| Pestaña **Permisos por pantalla** → pantalla `#8420` (Digitación diaria; en el viejo «Lançamento diário»): los grupos con acceso coinciden con los del viejo | |
| Un usuario suyo: los **permisos efectivos** coinciden con lo que ve el usuario al entrar al viejo (la app nueva trata el acceso «Parcial» como solo consulta: ¿es lo que el viejo permite hacer con ese nivel?) | |
| **Conexiones**: sus ingresos de hoy figuran con el equipo correcto | |

---

## Parte 4 — Preguntas abiertas para decidir cómo seguir
Estas respuestas **destraban la escritura** (digitar análisis, cerrar el día). Anote las respuestas.

1. **Convivencia con el GATEC viejo:** cuando la app nueva pueda grabar, ¿se cerrará el día desde un solo sistema (el que se elija ese día) o se necesita usar los dos en paralelo?
2. **Fórmulas con diferencias conocidas** (el motor coincide en 99,6 % de las celdas; estas son las que no):
   - Variable **289 «ALC PROC DOR»** (alcohol en proceso de las dornas): el viejo suma además el alcohol de los **tanques de jugo** (tanques 224, 349 y 361, sin variable GL) con un valor que no logramos reproducir (aprox. 0,68 × la Pol del jugo clarificado, con ±1 %). **¿Cómo se calcula esa parte?**
   - Variable **5533 «SALI HD O100»**: el viejo guardó 0 porque la fórmula tiene un error de sintaxis. **¿Se debe corregir la fórmula o dejarla en 0?**
   - Tiempos de cocción **DUR M COC A/B/C**: diferencias de pocos minutos en algunos días (¿redondeo de horas?).
3. **Acumulados:** en el viejo, al corregir un día ya cerrado, ¿se **recalculan** los acumulados de ese día en adelante, o quedan como estaban? (La app nueva y los datos indican que quedan como estaban.)
4. **Digitación de análisis de sonda:** el cálculo de Pol y AR usa unas tablas de factores (`GA_FATOR_POL`, `GA_FATOR_AR`) que **no existen en DESA**. **¿Dónde están?** (¿otra base, otro esquema, un archivo?)
5. **Funciones sin datos en DESA** (correo, SMS, Fermentec, recordes, Pré-Colheita, impurezas, rastreabilidad): **¿se usan en producción?** Si alguna sí, indique cuál y la prioridad.
6. **Administración de usuarios con escritura** (altas, contraseñas, permisos): ¿debe pasar a la app nueva o sigue en `GAtec_Senha` hasta retirar el viejo?
7. **Metas:** la zafra 2026 no tiene metas cargadas. ¿Es normal (se cargan más adelante) o se perdieron?
8. **Orden de la edición (lo que la app nueva todavía NO hace):** hoy la app nueva solo consulta (salvo los catálogos). ¿Qué necesitan **poder cargar primero** para dejar de usar el viejo en ese trabajo? Ordene: (a) digitar análisis del GPI, (b) cerrar/validar el día, (c) cargar análisis de sonda del laboratorio, (d) cargar metas, (e) administrar usuarios y permisos, (f) otra. ¿Quién lo hace y a qué hora del día?
9. **Cómo calcula el GATEC viejo (para fijar reglas del motor).** Responde quien conozca el cálculo, o se prueba en un ambiente de prueba si existe (no en producción):
   - Si una fórmula **divide por cero**, ¿qué queda guardado: vacío, 0 o un mensaje de error?
   - Al redondear a 1 decimal, **1,15 → ¿1,1 o 1,2?** y **0,35 → ¿0,3 o 0,4?** (afecta la búsqueda en las tablas de masa específica del alcohol y densidad del Brix).
   - Si una variable depende de otra que está vacía y la fórmula usa «y» / «o», ¿se toma el vacío como falso?
   - ¿Hay fórmulas que se calculen en un orden que importe (una variable que dependa de otra que se calcula después)? ¿Qué hace el viejo si dos variables se refieren una a la otra?
10. **Qué pasa al grabar (la app nueva ya permite digitar en DESA, con un interruptor apagado en producción):** cuando el usuario graba una análisis en el GATEC viejo, ¿**quién recalcula** las variables calculadas que dependen de lo digitado: el propio sistema al grabar, o recién el **cierre del día**? ¿Y los acumulados? Hoy la app nueva guarda lo digitado y el resultado del día de esa variable, pero **no** recalcula las calculadas.
11. **Quién edita qué:** ¿el acceso «Parcial» permite digitar en el viejo o solo consultar? ¿Quién puede corregir un **día ya cerrado** y con qué aprobación? (La app nueva solo edita días posteriores al último cierre.)
12. **Probar la edición:** si hay una persona de digitación disponible, pedirle que pruebe en DESA la *Digitación diaria* (doble clic en una celda, Enter, Grabar) sobre la planilla que usa todos los días y anote si falta algo respecto del viejo (teclas, saltos entre celdas, avisos de fuera de especificación, pegar valores).

---

## Parte 5 — Menú del GPI y botones de la Digitación diaria (para quien use el GATEC a diario)

Abra **Entrada diaria** en el GATEC viejo y pruebe lo siguiente. Son preguntas cortas; con una captura de pantalla alcanza. Marque ✔ / ✘ / ❓ y anote lo que vea.

### 5.1 Botones de la barra de Digitación diaria

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | Botón **Sem**: ¿qué número muestra la columna «Semanal»? ¿Empieza la semana un día fijo (¿lunes?) o son los últimos 7 días contando el elegido? Para una variable de **suma**, ¿suma la semana?; para una de **media**, ¿promedia solo los días con dato? Anote 2 o 3 variables con el valor que ve en un día cerrado. | |
| 2 | Botón **Acum**: columna «Zafra». ¿Es el acumulado hasta el día elegido **incluyéndolo**? (la app lo toma de `ACU_MEDIA` de esa fecha). Anote 2 variables con su valor. | |
| 3 | Botones **«** y **»**: ¿a qué fecha va cada uno? (la app supone inicio de zafra y día actual de digitación). | |
| 4 | **Fixar data**: ¿qué cambia al marcarlo? Pruebe elegir una fecha vieja y cambiar de planilla con la casilla marcada y sin marcar. ¿En qué estado abre el GATEC? | |
| 5 | Botones **−7 / −1 / +1 / +7**: la app copia lo visto (−7 muestra 8 días desde la fecha nueva, −1 muestra 2, +1 y +7 al revés). ¿Es correcto? ¿Qué hace **+7** exactamente? | |
| 6 | **Imprimir** y **Excel**: compare con el PDF y el Excel de la app. ¿Falta algún dato o columna? En el PDF, ¿qué calcula la columna **Media** cuando hay varios días? | |
| 7 | **Id** y **Esp**: ¿muestran lo mismo que la app (número de variable; mínimo y máximo)? | |

### 5.2 Menús (la app los muestra con la marca «Pendiente» si todavía no existen)

| # | Pregunta | Respuesta |
|---|---|---|
| 8 | **Movimientos → Parada ▸**: ¿qué opciones tiene el submenú? (una captura abierto). | |
| 9 | Menús **Cierre**, **Tablas**, **Configuración**, **Consultas**, **Supervisor** y **Utilitarios**: una captura de cada uno desplegado, con sus submenús. | |
| 10 | **Informes → General**: ¿equivale a los «Informes» configurables (por ejemplo «Informe diario») de la app? ¿Qué muestran **General (multiempresa)**, **General (multizafra)** y **Mapas**? | |
| 11 | **Informes → Listado de variables**: ¿qué muestra? ¿Es distinto de «Valores de variables»? | |
| 12 | De los listados del menú Informes (anotaciones, falta de digitación, fuera de especificación, histórico de valor, de variables y de especificación, verificación de informes, paradas, lanzamiento de acción): ¿cuáles se usan en el día a día? Así se construyen primero esos. | |

### 5.2 bis Listados ya construidos (solo lectura): ¿coinciden con los del GATEC?

La app interpretó cada listado por el nombre de su formulario (no hay fuente del VB6). Compare con el listado del GATEC del mismo día cerrado.

| # | Listado | Qué hace la app | Pregunta | Respuesta |
|---|---|---|---|---|
| 12a | **Listado de variables** | Todas las variables de las planillas habilitadas: planilla, orden, id, descripción, unidad, digitada/calculada, tipo de media, mínimo y máximo. Filtros: texto, planilla, tipo, solo activas. | ¿Faltan columnas? ¿Muestra lo mismo el GATEC? | |
| 12b | **Falta de digitación** | Variables **digitadas y activas** sin ningún valor ese día, por planilla. Oculta por defecto las planillas sin **ningún** dato ese día (no se usaron). | ¿Considera el GATEC «falta» solo lo digitado en horas/tandas definidas? ¿Muestra también las planillas sin uso? Compare el total de un día cerrado. | |
| 12c | **Fuera de especificación** | Resultado del día (columna 99) fuera del mínimo o máximo de la variable (`GI_LAB_VAR_STATUS`), en un rango de hasta 62 días. | ¿Compara el GATEC el resultado del día o cada columna/hora? ¿Usa la especificación vigente en cada fecha (hay historial en `GI_LAB_LANC_ESPEC`)? | |

| 12d | **Listado de anotaciones** | Texto de `GI_LAB_ANOTACOES` por planilla y día, en un rango de hasta 400 días. | ¿Muestra el GATEC lo mismo (planilla, fecha, texto)? ¿Filtra por usuario? | |
| 12e | **Histórico de valor** | Bitácora `GI_LAB_RESP_LANC` de **una variable**: fecha del lanzamiento, fecha/hora del registro, usuario, columna, valor, operación (Alta / Cambio / Baja) y comentario. | En un cambio, ¿el valor guardado es el **anterior** o el nuevo? (la columna se llama `LAN_VALOR_ANT`; en las altas guarda el valor ingresado). | |
| 12f | **Histórico de variables** | `GI_LAB_RASTREA`: quién creó, cambió o borró la definición de una variable, con su fórmula. Solo variables que aún existen y que el usuario puede ver. | ¿Qué campos muestra el GATEC? ¿Aparecen también las variables borradas? | |
| 12g | **Histórico de especificación** | `GI_LAB_LANC_ESPEC`: límites mínimo y máximo vigentes desde cada fecha. En DESA solo hay 5 filas visibles, todas de 2019. | ¿Se sigue usando? ¿De dónde sale hoy la especificación (la app usa `GI_LAB_VAR_STATUS`)? | |

### 5.3 Qué se usa y qué no

| # | Pregunta | Respuesta |
|---|---|---|
| 13 | ¿Se usan en producción: correo automático, SMS, Fermentec, recordes, Pre-cosecha, Impurezas, Rastreabilidad, el módulo de Expedición y Certificados? (en DESA están vacíos y por eso no se recrean). | |
| 14 | ¿Quién usa **Cierre** y quién **Importar lanzamientos**? ¿A qué hora se cierra el día? ¿Puede haber alguien digitando en el GATEC viejo mientras se prueba la app nueva? | |

## Cómo devolver el resultado
Complete la columna «Su resultado» y envíe el documento (o una foto de las hojas) a quien coordina el proyecto. Si una pantalla **no abre**, **tarda más de unos segundos** o **muestra un error**, anote la pantalla, la fecha y la hora.
Para cada ✘, lo más útil es una **captura de la pantalla del GATEC viejo y de la app nueva** con la misma fecha.
