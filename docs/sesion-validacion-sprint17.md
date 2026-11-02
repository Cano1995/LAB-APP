# Guía de la sesión de validación (Sprint 17)

**Para quién:** quien conduce la sesión con el usuario del GATEC y con el laboratorio. El documento que completan *ellos* es
[`validacion-con-usuarios.md`](validacion-con-usuarios.md); este es el guion de quien lo conduce: qué preparar, en qué orden, qué decidir con cada respuesta y cómo dejar todo registrado.

**Objetivo:** pasar de «parece que coincide» a «coincide, verificado por quien usa el sistema», y conseguir las respuestas que destraban la edición.
**Quiénes:** un usuario del GATEC con permiso en el GPI (idealmente quien digita o cierra el día), una persona del laboratorio de recepción (parte 2) y, si hay, un administrador del GATEC (parte 3). Quien conduce y una persona que anote.
**Cuánto:** unas 3 horas en una sola sesión (o dos de 90 minutos: «GPI» y «laboratorio + decisiones»).

---

## 1. Preparación (el día anterior)

| Qué | Cómo | Listo |
|---|---|---|
| Que los números esperados sigan vigentes | `node tools/verificar-valores-esperados.js` (API y DESA arriba). Debe decir «Los 41 valores esperados siguen vigentes». Si alguno falla, **actualizar `validacion-con-usuarios.md`** antes de la sesión (DESA se recarga cada noche; un día corregido en producción cambia el valor) | ☐ |
| Que todo funcione | `npm run ci` y `node tools/e2e/run-all.js` (humo contra DESA) | ☐ |
| Levantar la app para la sesión | `npm run build` y `cd api && npm start`; abrir `http://<servidor>:3101` (ver `docs/despliegue.md`). Mejor que el modo desarrollo: es lo que verán en producción | ☐ |
| Cuentas | el usuario del GATEC entra con **su usuario y la contraseña de su usuario de Oracle**. **2 fallos seguidos bloquean el ingreso 15 minutos** (protege su cuenta de Oracle: avisarles antes) | ☐ |
| Permisos | que el usuario vea en el Inicio las pantallas que se van a probar (si no aparece una, es falta de permiso, no un error) | ☐ |
| Dos pantallas | el GATEC viejo (producción, **solo mirar**) y la app nueva lado a lado, misma empresa y zafra (AZPA, 2026/2027) | ☐ |
| Impresiones del viejo | llevar impreso (o en PDF) el **Informe diario**, un **boletín** y la **pesquisa de entrada de caña** de los días 20 y 21/10/2026: sirven para comparar columnas y formato | ☐ |
| Para anotar | imprimir `validacion-con-usuarios.md` y la hoja de registro (sección 4 de esta guía), o abrirlos en una pantalla aparte | ☐ |

**Reglas de la sesión (decirlas al empezar):** no se carga ni se modifica nada en ninguno de los dos sistemas (en el viejo, no presionar Grabar, Cerrar ni Recalcular); se comparan **solo días ya cerrados**; un ✘ no es un fracaso, es el dato que buscamos.

## 2. Agenda sugerida (≈ 3 h)

| Min | Bloque | Qué se hace | Qué se obtiene |
|---|---|---|---|
| 0-10 | **Apertura** | objetivo; reglas; mostrar el Inicio y qué hay hecho (todo en consulta) | acuerdo sobre cómo se marcan ✔ ✘ ❓ |
| 10-25 | **¿Y la edición?** | explicar con claridad: **hoy la app nueva solo consulta** (salvo catálogos). El viejo sí graba; para que la nueva grabe hace falta cerrar las dudas de hoy. Pedir el **orden de prioridades** (pregunta 8) | prioridad de los sprints de edición |
| 25-75 | **GPI 1.1 a 1.4** | Digitación diaria, Valores, Informes y Boletines: valores, orden de variables, filas calculadas, columnas que imprime el viejo | ✔/✘ + las preguntas clave de 1.3 y 1.4 |
| 75-100 | **GPI 1.5 y 1.6** | Metas (con zafra 2025), Supervisorio, Panel, **CEP y Correlación** (única validación posible de esas fórmulas) | ✔/✘ + definición de metas quincenal/mensual |
| 100-110 | *Pausa* | | |
| 110-145 | **Laboratorio 2.1 y 2.2** | Sonda y balanza con el personal de laboratorio; preguntas sobre acoplados, muestreo, «sin resultado», acumulados y **Bal0015** | ✔/✘ + reglas del laboratorio |
| 145-160 | **Administración** (parte 3) | solo con un administrador: usuarios, grupos, permisos efectivos, conexiones | ✔/✘ |
| 160-185 | **Decisiones (parte 4)** | recorrer las preguntas 1 a 12 en el orden de la sección 3 de esta guía; **cada respuesta se anota con su nombre y fecha** | tabla de decisiones |
| 185-195 | **Cierre** | leer en voz alta la lista de ✘ y ❓ y de decisiones; acordar quién responde lo pendiente y para cuándo | lista cerrada |

## 3. Qué se hace con cada respuesta

Orden recomendado para la parte 4 (primero lo que más cambia el plan):

| # | Pregunta (parte 4) | Si la respuesta es… | Consecuencia |
|---|---|---|---|
| 8 | Orden de la edición | un orden de prioridad y quién lo usa | define el orden de los sprints 18 en adelante |
| 1 | Convivencia con el viejo | «un solo sistema por día» / «los dos en paralelo» | con un solo sistema alcanza un interruptor por día; en paralelo hace falta bloqueo de escritura y recálculo coordinado (más trabajo, más riesgo) |
| 3 | ¿Se recalculan los acumulados al corregir un día cerrado? | «quedan como estaban» | se confirma la regla actual del motor (`docs/analisis/gpi-cierre.md`); si «se recalculan», hay que implementar el recálculo hacia adelante antes de cerrar días |
| 4 | Dónde están `GA_FATOR_POL` y `GA_FATOR_AR` | otra base / archivo / esquema | sin esas tablas **no se puede calcular Pol ni AR en la digitación de sonda**: es bloqueante para ese sprint |
| 2 | Variable 289, 5533 y tiempos de cocción | cómo se calcula la parte de los tanques de jugo; si 5533 se corrige o queda en 0; el redondeo de horas | cerrar las diferencias del motor (hoy 99,63 % de columnas y 99,32 % del día) |
| 9 | Cómo calcula el viejo (división por cero, `Round`, `y`/`o` con vacío, ciclos) | respuestas concretas | se convierten en reglas verificadas en `docs/analisis/gpi-motor-supuestos.md` (supuestos 2 a 6 y 9) |
| 5 | Funciones sin datos (correo, SMS, Fermentec, recordes…) | «se usa» o «no» | lo que no se use **no se construye**; lo que se use entra al plan con prioridad |
| 6 | Administración con escritura | «en la app nueva» o «sigue en GAtec_Senha» | decide si se construye (es de alto riesgo: contraseñas y permisos) |
| 10 | ¿Quién recalcula las calculadas y los acumulados al grabar? | «el sistema al grabar» / «recién el cierre» | decide si la app puede grabar solo lo digitado (como hoy) o debe recalcular al grabar; con «al grabar» hay que replicar ese cálculo y el de acumulados antes de encender la edición en producción |
| 11 | Parcial, y edición de días cerrados | permisos y aprobación | ajusta la regla de «quién y qué días» (hoy: acceso total y día posterior al último cierre) |
| 12 | Prueba de la edición con un digitador | comentarios | lista de mejoras de la pantalla de digitación (teclas, saltos, pegado, avisos) |
| 7 | Metas 2026 vacías | «normal» o «se perdieron» | si se perdieron hay que avisar a producción, no es un problema de la app |

Las preguntas clave de cada pantalla (1.3 columnas del informe, 1.4 boletín, 1.5 metas, 2.1 y 2.2 laboratorio y balanza) se anotan en la misma hoja.

## 4. Hoja de registro

**Resultados (una fila por comprobación; copiar de `validacion-con-usuarios.md`):**

| Sección | Qué se comparó | Esperado | En el viejo | En la app | ✔ ✘ ❓ | Nota / captura |
|---|---|---|---|---|---|---|
| 1.1 | | | | | | |

**Diferencias (una por cada ✘; para cada una se decide si se *acepta*, se *corrige* o se *descarta*):**

| # | Dónde | Qué se ve distinto | Causa probable (día corregido, fórmula, formato…) | Decisión | Quién | Para cuándo |
|---|---|---|---|---|---|---|
| D1 | | | | aceptada / a corregir / descartada | | |

**Decisiones (una por pregunta de la parte 4):**

| # | Pregunta | Respuesta | Quién respondió | Fecha | Consecuencia en el plan |
|---|---|---|---|---|---|
| 1 | | | | | |

## 5. Si algo no coincide

1. Antes de marcar ✘, **mirar la fecha y la hora**: ¿el día se corrigió en producción después de la última copia a DESA? (Marcar «día corregido».)
2. Pedir una **captura de las dos pantallas** con la misma fecha (la del viejo y la de la app).
3. Si falla una pantalla (no abre, tarda más de unos segundos, muestra un error), anotar pantalla, fecha y hora: queda en el registro del servidor (una línea JSON por pedido).
4. No intentar arreglarlo en la sesión; se anota y se resuelve después.

## 6. Después de la sesión (48 horas)

- Pasar la hoja de registro a limpio y dejarla en `docs/` (por ejemplo `validacion-resultados-AAAA-MM-DD.md`).
- Actualizar `docs/analisis/gpi-motor-supuestos.md`: cada supuesto confirmado pasa a VERIFICADO; cada uno desmentido se **corrige en el motor** y se vuelve a medir con `node tools/gpi-validar-formulas.js` (la línea base no puede bajar).
- Cargar en el plan (`docs/revision-completa-y-plan.md`) el orden de los sprints de edición y las decisiones.
- **Criterio de cierre del Sprint 17:** checklist completo y firmado por el usuario; lista cerrada de diferencias (aceptadas, corregidas o descartadas); decisiones 1 a 12 respondidas o con responsable y fecha.

## 7. Lo que ya está resuelto (para no preguntarlo de nuevo)

- Los **41 valores** del checklist coinciden hoy con DESA (verificado el 28/10/2026).
- El motor coincide con el cálculo del VB6 en **99,63 %** de las columnas y **99,32 %** del día (octubre), y en 99,54 % / 99,09 % (septiembre); la comparación es del **texto exacto** que se guardaría.
- La variable «Caña total ingresada» (#46) usa **lo digitado a mano si existe y, si no, la balanza**: la diferencia con la balanza viene de ahí (pregunta 2.2).
- Seguridad, permisos, idioma y rendimiento ya fueron revisados (sprints 11 a 16); no son tema de la sesión.
