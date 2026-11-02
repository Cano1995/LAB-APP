# GPI · Digitación diaria con edición (Sprint 18)

**Estado:** implementada y probada **solo en DESA**, con el interruptor `ESCRITURA_GPI_DIGITACION` apagado por defecto. No se enciende contra producción hasta cerrar la sesión de validación (Sprint 17).

## Cómo se usa
En *Digitación diaria*, con el interruptor encendido y acceso total a la pantalla: **doble clic** (o Enter / F2 con el teclado) sobre una celda blanca la abre para escribir; **Enter** o salir de la celda la confirma, **Esc** la cancela. Las celdas cambiadas se marcan en azul y aparece **Grabar (n)** / **Descartar**. Las filas amarillas son calculadas y no se digitan. Nada se guarda antes de «Grabar». Cambiar de día o de planilla con cambios pendientes pide confirmación.

## Qué graba
Tabla `GI_LAB_LANC_MOV_{e}_{s}` (valor por variable y columna) y, si el día de la planilla no existía, su cabecera `GI_LAB_LANC_{e}_{s}` (secuencia `GAS_LAB_ID_LANC`). Además, el **resultado del día (col. 99)** de cada variable tocada.

| Regla | Detalle |
|---|---|
| Quién | acceso **total** (código 1) al formulario 8420; el parcial sigue siendo consulta |
| Qué días | posteriores al último cierre (`PAR_DT_FECHA_REAL`), dentro de la zafra y hasta el día de digitación actual (`PAR_DT_FECHA`) |
| Qué variables | digitadas (`VAR_ORI_DADOS = 0`), activas, tipo 0 (numérico), 2 (texto) o 3 (hora). El tipo 4 (notación `168E8`) y el 1 se rechazan: no hay regla verificada |
| Valor | el mismo texto que guarda el VB6 (`reglas.aTextoGuardado`): decimales de la máscara, coma o punto al escribir, máximo de enteros de la máscara, hora `h:mm`, texto hasta 20 caracteres |
| Día (col. 99) | `reglas.agregarDia` + `aTextoGuardado`: suma (media 3) o promedio (1, 2, 4) de las columnas ya redondeadas; **100 % exacto contra el VB6** en variables digitadas (`node tools/gpi-probar-dia-digitadas.js 2026-10-01 2026-10-21`). Las de media 0 no llevan col. 99 (solo se mantiene si ya existía); las de hora lo llevan en horas decimales con 3 decimales |
| Concurrencia | cada celda trae el valor que el usuario vio (`anterior`); si ya cambió, se rechaza **todo** con 409 y la lista de celdas, y la pantalla recarga y descarta solo esas celdas del borrador |
| Atomicidad | una sola transacción; el día de la planilla se bloquea mientras se graba (`FOR UPDATE WAIT 10`) |
| Auditoría | una fila por cambio en `LAB_APP_AUDIT` (quién, tabla, clave, antes, después, empresa/zafra/planilla/día), en la misma transacción |
| Tope | 500 celdas por pedido |

## Qué NO hace (todavía)
- **No recalcula** las variables calculadas que dependen de lo digitado ni los **acumulados**: eso lo hace el cierre del día del VB6. La respuesta lo avisa y la pantalla muestra «se actualizan al cerrar el día». Antes de encenderlo en producción hay que decidir (pregunta 10 de la sesión) quién recalcula al grabar en el sistema viejo.
- No cierra días, no edita días cerrados, no digita columnas de variables tipo 4.

## Verificación
- `cd api && npm test`: 124 pruebas (reglas de día editable, normalización, planificación con día y concurrencia, ruta, interruptor y su protección contra bases que no son DESA).
- `node tools/probar-digitacion-real.js [plan] [variable]`: escribe de verdad en DESA y limpia (19 comprobaciones; probado con una variable de promedio y una de suma).
- `node tools/e2e/sprint18.js`: la pantalla en un navegador real (17 comprobaciones: doble clic, Esc, Enter, Grabar, conflicto con «otro usuario», confirmación al cambiar de día, teclado, día cerrado).
- Un usuario sin acceso total (403 y sin celdas editables) se prueba solo en la API: en esta copia de DESA ningún usuario activo lo tiene (BOT tiene acceso total a esa pantalla).

## Cómo apagarlo
Quitar `ESCRITURA_GPI_DIGITACION` del entorno y reiniciar la API: la ruta responde 403 y la pantalla vuelve a ser de solo consulta. El registro de auditoría permite revertir a mano cualquier cambio (valor anterior en `ANTES`).
