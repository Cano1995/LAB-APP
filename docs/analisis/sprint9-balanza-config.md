# Sprint 9 — Pre-Zafra, Config, Otros, Traducciones y Balanza

Relevado el 26/10/2026 contra DESA. Mismo criterio de siempre: lo que está vacío en DESA no se recrea hasta confirmar uso en producción.

## Conclusión

Los «módulos» 70, 307, 338 y 10 son casi todos **menús y contenedores** que apuntan a formularios que ya cubren otros sprints. La única pieza con datos propios es la
**balanza** (`Bal0015` y la entrada de caña). Se hizo **una pantalla nueva** (Entrada de caña); el resto se documenta como cubierto, no aplicable o no recreable.

| Módulo / exe | Qué es | Resultado |
|---|---|---|
| **70 Pre-Zafra** (5 formularios) | `frmLancPreAna` («Lançamento Pré-Safra»), `frmLancSondaPrimaria` («Pós-Safra»), `frmPesqPosAna` («Consulta»), `frmApSerial` (configuración de seguridad), `frmConfigTRD` | Son los mismos formularios del laboratorio: pre-análisis vacío (no se recrea), consulta de sonda ✅ (Sprint 7), serial/TRD = hardware local |
| **307 Config** (9 formularios) | `EmprSafra` («Troca de Empresa/Safra»), «Processo Industrial», «Controle de Acessos», «Configuración e pré-cosecha», `CUBO`/`CUBO S`, «Média para a Indústria», `EscEmpSaf_1`, `GATEC_LAB_AUTOMATICO` | Contenedores de menú. El cambio de empresa/zafra ya existe (selector del encabezado). Cubos y accesos son del Sprint 10 |
| **338 Otros** (2 formularios) | `frmManutTraducao` (mantenimiento del traductor), `frmImpExpCli` (importar/exportar traducciones) | No aplica: es la herramienta para traducir pantallas del VB6 |
| **10 General** | 1 objeto, 0 formularios | Nada que construir |
| **`GAtec_TRA`** (11 formularios) | Traductor del VB6 (`GA_TRA_TEXTOS` 7.039, `GA_TRA_MODULOS` 5.251, 2 idiomas) | No aplica. **Aprovechable**: `GA_TRA_TEXTOS` trae los rótulos en español de las pantallas del VB6 |
| **`Bal0015`** (11 formularios) | Reporte «Balanza acumulado»: calidad de caña ponderada por división agrícola y tiempo de quema | **No se recrea** (ver abajo) |
| **Entrada de caña** (`frmPesqEntradaCana`) | Pesadas de balanza con su cañero, origen y análisis | ✅ **Hecho** (`/lab/entrada-cana`) |

## Entrada de caña (`/lab/entrada-cana`, permiso 9905 o 9903)

- Fuente: `INV.BA_MOVIMIENTOS_BASCULA` + `INV.PERSONAS` (cañero) y, por acumulado, `GATEC_AGR.GA_ANALI_SONDA`. Mismos filtros que el GPI usa en sus fórmulas `Db_Select`:
  movimiento de compra, entrada de caña, movimiento válido, con peso de entrada y de salida. Peso neto = bruto − tara + descuentos (kilos de descuento, trash, impureza y cogollo).
- Filtros: rango de fechas (por defecto el último día con entradas), comprobante y nombre del cañero. Resumen (camiones, toneladas netas, cañeros) sobre **todas** las pesadas filtradas;
  la tabla muestra las 500 más recientes.
- `frmPesqEntradaCana` **no tiene formulario registrado** en `GAM_MODULOS_FORMS`: se usa el permiso de Pós-Colheita (9905 / 9903).
- Verificado: el 20/10/2026 da 207 camiones y 5.646,57 t, igual que la consulta SQL de control.

### Hallazgos de esta pantalla
- **`COD_ACUMULADO` agrupa, no relaciona uno a uno.** 19.568 pesadas y 16.364 análisis (acoplado 1) de la zafra 2026 se reparten en 8.596 acumulados: hasta 62 pesadas y 81 análisis
  comparten uno. Un acumulado es un lote (típicamente de un mismo cañero, parcela y día) cuya calidad se mide con varias muestras. Por eso la pantalla muestra el **promedio simple de los
  análisis completados del acumulado**, no «el análisis de ese camión». La ponderación real (por peso, para el pago de caña) no se pudo confirmar.
- **El peso de balanza no coincide con la «caña ingresada» del GPI**, que se digita aparte: el 20/10 la balanza suma 5.646,57 t (por fecha de salida) o 5.007,14 t (día de fábrica de 07:00 a 07:00)
  contra 5.788,65 t en el GPI; el 19/10, 1.557,68 t contra 1.804,35 t; el 21/10, 1.764,29 t contra 1.375,54 t (en ambos sentidos). Ninguna ventana horaria lo explica. **Pendiente de preguntar** a quien digita la entrada del GPI de dónde sale el número.
- 238 de los 16.364 análisis (acoplado 1) de la zafra 2026 no tienen `COD_ACUMULADO` y no se asocian a ninguna pesada.
- La tabla de balanza no tiene índice por `COD_ACUMULADO`: cruzarla sin filtro de fechas tarda minutos. La pantalla siempre filtra por fecha de salida.

## `Bal0015`: por qué no se recrea

- El reporte arma una **tabla temporal de trabajo** (`GA_ACUM_TMP_100`, 975 filas guardadas de la última corrida) por división agrícola (`COD_DIVI1..4`: fundo → gleba → talhão), fecha y tipo de corte,
  y la ajusta con ~15 sentencias `UPDATE` (Brix, LS, PBU y pH ponderados por producción, tiempo de quema, Pol de caña y pureza con dos fórmulas según la versión).
- El `INSERT` que la llena **no se pudo recuperar** completo del inventario (el SQL incrustado está cortado en fragmentos), así que no hay forma de replicar su origen ni de validar el resultado.
- Las tablas de estructura agrícola existen en DESA con otro nombre: `GA_DIVI1_2` (4.147), `GA_DIVI2_2` (12.632), `GA_DIVI3_2` (12.632), `GA_DIVI4_2` (68.734) y `GA_VAR_CONTAINER_2` (44.121);
  el VB6 las llama sin el `_2` (probablemente vistas o sinónimos en producción). `GA_FUNDO_AGRIC` y `GA_AREA_LIBER` están vacías.
- Si se necesitara, habría que reconstruirlo desde cero con las fórmulas de las 15 sentencias; sin un resultado de referencia no se puede validar. **Decisión pendiente**: ¿alguien usa este reporte?

## Pendiente que sale de este sprint
1. Preguntar de dónde sale la **caña ingresada digitada** del GPI (difiere de la balanza entre 2,5 % y 22 % según el día, en ambos sentidos).
2. Confirmar si se usa **`Bal0015`** (calidad por división agrícola) y, si sí, conseguir el SQL completo o un reporte impreso como referencia.
3. Mapear `GA_TRA_TEXTOS` si se quieren reutilizar los rótulos en español del GATEC.
