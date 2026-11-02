# Revisión completa del proyecto y plan de sprints 11 en adelante

Fecha: 26/10/2026. Alcance: API (`api/src`), frontend (`web/src`), motor de fórmulas y `tools/`, repositorio, dependencias, rendimiento y documentación.
Método: tres revisiones de código independientes (API, frontend, motor), mis verificaciones sobre el código y mediciones reales contra DESA. Nada se modificó durante la revisión.

**Cómo leer el estado de cada hallazgo:** ✔ = lo comprobé yo leyendo el código o midiendo; ◐ = lo reportó la revisión leyendo el código, sin ejecutarlo; ? = depende de datos o de un permiso que no pude ver.
Los Sprints 1 a 10 construyeron las pantallas (ver `docs/estado-del-proyecto.md`); este plan cubre lo que sigue.

## 1. Resumen ejecutivo

- **Lo bueno:** no se encontró inyección SQL en la API (los identificadores salen de definiciones estáticas o del catálogo y los valores van como binds); el JWT valida tipo, administrador y estado en cada pedido;
  el guard de servidor DESA falla en modo seguro; el motor y `Db_Select` no están conectados a ninguna ruta web; las pantallas nuevas no exponen contraseñas.
- **Lo urgente (3 fallas altas confirmadas en la API):** un error de base de datos en `/api/maestras` **puede tirar toda la API**; el CRUD de maestras **no aplica el filtro de empresa/zafra** al leer, editar y borrar un registro puntual;
  el **bloqueo propio del login tiene una condición de carrera** que permite bloquear cuentas de Oracle.
- **Lo más visible para el usuario:** una sesión vencida no se maneja (las pantallas muestran errores crudos), y **al cambiar de zafra quedan en pantalla datos de la zafra anterior**.
- **Lo estructural:** el repositorio **no tiene ningún commit**; no hay pruebas automáticas, lint ni CI; hay vulnerabilidades conocidas en dependencias; dos endpoints son lentos (1,6 s y 2,9 s).
- **Lo pendiente de producto:** toda la escritura (digitación, cierre, metas, administración) y la validación contra el GATEC viejo.
- **Idioma:** la aplicación debe estar toda en español; hoy hay portugués en 55 de 72 títulos de catálogos y en 113 títulos de pantallas que vienen de la base (sección 2.5, Sprint 13).

## 2. Hallazgos

### 2.1 Seguridad y estabilidad de la API

| ID | Sev. | Estado | Dónde | Falla | Arreglo |
|---|---|---|---|---|---|
| A1 | **Alta** | ✔ | `maestras/maestras.routes.js:12-23` | `cargarRecurso` es `async` sin `try/catch`; Express 4 no captura el rechazo y no hay `unhandledRejection`: un error de base **mata el proceso** | `try/catch` + `next(e)` y handler global de `unhandledRejection` |
| A2 | **Alta** | ✔ | `auth/auth.service.js:185-207` | Lee el estado de bloqueo, valida en Oracle y **recién después registra el intento**: logins en ráfaga con clave mala superan el límite del perfil Oracle y bloquean la cuenta. Además, `.env.example` usa `DB_USER=BOT`, que también es usuario del GATEC | Reservar el intento antes de consultar Oracle (contador atómico o mutex por usuario) y rechazar el login del usuario de servicio |
| A3 | **Alta** | ✔ | `maestras/maestras.service.js:157-263` | `obtener`, `actualizar` y `eliminar` usan solo la PK (no `scopeFiltro`): se puede leer, editar, borrar o **reasignar de empresa/zafra** un registro de otra empresa/zafra (`fundo-agricola`, `divisao-4`, `ccusto-funcionario`) | Agregar el filtro de scope a las tres operaciones e ignorar las columnas de scope en `actualizar` |
| A4 | Media | ✔ | `server.js:27-30` | El manejador de errores devuelve `detalle: err.message` (mensajes ORA con esquema/tabla/columna) y convierte los 400 de body-parser en 500 | Mensaje genérico al cliente, detalle solo en el log, respetar `err.status` |
| A5 | Media | ◐ | `auth.routes.js:10` | Login sin rate limit por IP; el estado «espera» solo existe para usuarios reales (permite enumerarlos) y cualquiera puede dejar a un usuario conocido 15 min sin acceso | `express-rate-limit` por IP y respuesta uniforme |
| A6 | Media | ◐ | `config.js:23` | `JWT_SECRET` solo se exige no vacío: se acepta el valor de ejemplo del `.env.example`; sin revocación, token de 8 h | Exigir ≥32 caracteres y rechazar el ejemplo; evaluar sesiones más cortas |
| A7 | Media | ✔ | `maestras.routes.js:34-41` | `GET /api/maestras` lanza ~70 consultas de permiso en paralelo (1,6 s medido; `poolMax` 10) | Una sola consulta de permisos del usuario, filtrar en memoria, caché corta |
| A8 | Media | ◐ | `lib/bootstrap.js:9` | Usa `process.env.APP_SCHEMA` en vez de `config.appSchema`; el DDL va sin prefijo de esquema | Usar `config.appSchema` y calificar |
| A9 | Media | ◐ | `gpi.service.js:76-98` | Falta la tabla `PLAN_CONF_{e}` o `INI` nulo → 500 en `/lancamento` | Devolver configuración vacía y proteger nulos |
| A10 | Media | ◐ | `consultas.service.js:68-85` | `buscarVariables` filtra planillas habilitadas **después** del tope de 300: un usuario no administrador puede ver resultados incompletos | Unir con `GI_LAB_ACESSOS_{e}` dentro del SQL |
| A11 | Media | ? | `contexto.service.js:61-67` | Cualquier usuario puede elegir cualquier empresa/zafra (solo se valida contra `GA_CONFI_EMPR_SAFRA`) | Verificar si el GATEC restringe por empresa; si sí, validar |
| A12 | Baja | ◐ | `maestras.routes.js:46-49` | `?limit` sin validar (NaN → 500; `0` podría significar sin tope); truncado silencioso a 5000 | Acotar y devolver bandera `truncado` |
| A13 | Baja | ◐ | varios servicios | Fechas validadas solo por forma (`2026-02-30` llega a `TO_DATE` y da 500); arrays en query; `Number("0x10")`; booleanos `"false"` se guardan como verdadero | Validador común de fecha real y tipos escalares; mapear ORA-01722/01847 a 400 |
| A14 | Baja | ◐ | `middleware/auth.js:15-17` | Una caída transitoria de la base devuelve 401 «Token inválido» (el cliente cierra la sesión) | Distinguir error de JWT (401) de error de base (503) |
| A15 | Baja | ◐ | `analitica.service.js:50`, `admin.service.js:13` | Fecha «hoy» en UTC: después de las 21:00 en Paraguay ya es mañana | Fecha local o `TRUNC(SYSDATE)` |
| A16 | Baja | ◐ | `server.js:15` | CORS abierto y sin `helmet` | Allowlist de origen y cabeceras de seguridad |
| A17 | Baja | ◐ | `lab/entrada.service.js:60-62` | La subconsulta de análisis agrupa toda la zafra en cada llamada (2,9 s medido) | Filtrar por rango de fechas/acumulados del resultado |
| A18 | Baja | ◐ | `lab/sonda.service.js:100-114` | `SELECT a.*` en el detalle: columnas DATE sin excluir se desfasan de hora | Lista explícita de columnas |
| A19 | Baja | ◐ | `bootstrap`, `gpi.service.js:24-32` | El bootstrap corre solo al arrancar (si DESA se recarga y se pierde `LAB_APP_AUTH`, el login da 500 hasta reiniciar); el caché de «no existe» es permanente | Reintento al fallar y caché con vencimiento |
| A20 | Info | ✔ | `server.js` | Sin servir el build del front, sin registro de pedidos, sin `/ready`; carpeta `modules/catalogo` vacía | Ver Sprint 15 |

### 2.2 Frontend

| ID | Sev. | Estado | Dónde | Falla | Arreglo |
|---|---|---|---|---|---|
| F1 | **Alta** | ✔ | `lib/api.ts:53-69`, `AuthContext.tsx:25-27` | Un **401 no se maneja**: con el token vencido cada pantalla muestra el error crudo y el usuario sigue «logueado»; `retry: 1` reintenta 401/403/429; `me()` borra el token ante cualquier error (incluso un 503) | Al 401: limpiar token y caché y volver al login; no reintentar 4xx |
| F2 | **Alta** | ✔ | `ContextoSelector.tsx:18-19` | Al cambiar de zafra solo se invalidan 4 claves: **Boletines, Sonda, Metas, Valores, Informes, Panel, Entrada de caña… siguen mostrando la zafra anterior** bajo el rótulo de la nueva | `invalidateQueries()` completo y reiniciar el estado de las páginas (`key` por zafra) |
| F3 | **Alta** | ◐ | `AuthContext.tsx:30-38` | Logout y login no limpian la caché de react-query: **en un PC compartido el usuario B ve un instante lo cacheado del A** (incluidas las pantallas de administración) | `queryClient.clear()` en ambos |
| F4 | **Alta** | ◐ | `App.tsx` | Las rutas no tienen guarda de permiso: `/admin`, `/gpi/*`, `/lab/*` se abren por URL (la API sí devuelve 403) | Componente `RutaProtegida` con la lógica de permisos que hoy está duplicada en el Inicio |
| F5 | Media | ◐ | `LabSondaPage`, `EntradaCanaPage`, `AdminPage`, `ConsultaValoresPage`, `CepPage` | «Consultar» con los mismos filtros **no refresca** (misma clave de react-query) | `refetch()` o contador en la clave |
| F6 | Media | ◐ | `CepPage.tsx:21`, `lib/api.ts` | `hasta`, `tam`, `estado` y otros se interpolan en la URL sin codificar (se pueden agregar parámetros con un enlace) | `URLSearchParams` y validación de fecha |
| F7 | Media | ◐ | `ConsultaValoresPage.tsx:266`, `InformesPage.tsx:174` | CSV con inyección de fórmulas (`= + - @`) y sin cita de `\r` | Prefijo `'` a textos peligrosos y una sola función `csv()` |
| F8 | Media | ◐ | `PanelPage.tsx:35-41` | Si fallan las consultas de valores, el panel muestra «—» como si no hubiera dato | Mostrar el error |
| F9 | Media | ◐ | `ConsultaValoresPage.tsx:55-66` | `cargarGuardada` async sin `try/catch` | Manejo de error |
| F10 | Media | ◐ | `ui.tsx:240-297` | Modal: se cierra al arrastrar el mouse desde un campo, sin focus trap ni bloqueo de scroll | Cierre por mousedown+mouseup sobre el fondo y focus trap |
| F11 | Media | ◐ | `LineChart.tsx:149,196` | Re-renderiza y reordena todas las series en cada `mousemove` | `useMemo`, `requestAnimationFrame` y límite de rango en Valores |
| F12 | Media | ◐ | `LineChart.tsx:28` | `aMs` da NaN si el formato trae segundos o `Z` | Normalizar y filtrar no finitos |
| F13 | Media | ? | `lib/api.ts:262-309` | Los tipos dicen `number` pero algunos endpoints devuelven texto | Un solo `num()` y `fmt()` central |
| F14 | Media | ◐ | `lib/api.ts:37-41` | Token en `localStorage` sin expiración local | `sessionStorage` o cookie httpOnly (decisión de diseño) |
| F15 | Media | ◐ | `ContextoSelector.tsx` | No se muestra el error al cambiar de zafra | Alerta |
| F16 | Media | ◐ | `LabSondaPage.tsx:122`, `GpiLancamentoPage.tsx` | Filas clicables sin Espacio ni nombre accesible; `aria-selected` inválido | Botón en la fila o `role="grid"` |
| F17 | Media | ◐ | `CorrelacionPage.tsx` | `text-muted` sobre celdas coloreadas (contraste ≈ 2-3): contradice `docs/ui-sistema-visual.md` | Texto más oscuro |
| F18 | Media | ◐ | `LineChart.tsx` | Gráfico solo accesible con mouse; los puntos fuera de control se distinguen solo por color | Tabla `sr-only` con los valores |
| F19 | Media | ◐ | `MaestraPage`, `BuscadorVariables`, `AdminPage` | Sin debounce ni cancelación en búsquedas; `MaestraPage` parpadea al buscar | `useDeferredValue`, `keepPreviousData`, `signal` |
| F20 | Baja | ✔ | `App.tsx` | Sin code-splitting (un solo chunk de 357 kB) | `React.lazy` por ruta |
| F21 | Baja | ◐ | tablas de maestras, valores, lançamento | Hasta 500-3000 filas sin virtualizar ni memoizar | `@tanstack/react-virtual` o paginar |
| F22 | Baja | ◐ | `AdminPage.tsx:19` | Fecha local vs UTC | Fecha local |
| F23 | Baja | ◐ | 6 páginas | Insignia roja copiada 6 veces | `Badge tone="danger"` |
| F24 | Baja | ◐ | varias páginas | `sumarDias` ×5, `aDMA` ×10, `fmt` ×6 variantes, `num` ×3, `Dato` ×3, panel izquierdo de lista ×4; buscador duplicado | `lib/fecha.ts`, `lib/num.ts` y componentes compartidos |
| F25 | Baja | ◐ | todas | `toLocaleString("es")` no agrupa miles de 4 dígitos; CSV con decimales distintos entre pantallas | Un formateador `es-PY` |
| F26 | Baja | ◐ | `GpiLancamentoPage.tsx:301`, `CepPage.tsx` | Parseo de coma inconsistente; límites del CEP con coma; varios `!` sobre `number\|null` | Normalizar |
| F27 | Baja | ◐ | varios | Claves duplicadas en `LineChart`; `Math.min(...ts)`; cast doble en `AdminPage`; `data as T` sin validar; hack `?x=1` | Limpiar |
| F28 | Baja | ◐ | varios | Estado que persiste al cambiar de recurso/planilla; `role="tab"` sin `tabpanel`; `hint` dentro del `<label>` | Pulir |

### 2.3 Motor de fórmulas y `tools/`

Hoy **no corre dentro de la API** (solo en `tools/`), por eso nada de esto es explotable todavía; **todo es requisito antes de habilitar escritura o de conectar `Db_Select` a una ruta**.

| ID | Sev. | Estado | Dónde | Falla | Arreglo |
|---|---|---|---|---|---|
| M1 | **Alta** | ◐ (probado por la revisión) | `formula/dbselect.js:5-16` | `sqlSeguro` es una lista negra sin lista blanca: pasan `dbms_pipe.receive_message(...)`, `utl_http.request(...)`, funciones de paquetes propios (una con `PRAGMA AUTONOMOUS_TRANSACTION` **escribe aunque la transacción sea READ ONLY**), `connect by level<1e9` y productos cartesianos | Lista blanca (`FROM ba_movimientos_bascula`), rechazar `paquete.función(` y `@`, y ejecutar con un usuario Oracle de solo `SELECT` sobre esa tabla |
| M2 | Media | ◐ | `dbselect.js:11` | La lista de palabras se evade con literales `q'[...]'` (esconde `for update`, `into`, `lock`) | Tokenizador real; dejar de confiar en el filtro (M1) |
| M3 | Media | ◐ | `dbselect.js:23`, `tools/lib/gpi-datos.js:113` | `[VAR_DATA]` interpola la fecha sin validar | Validar `AAAA-MM-DD` y usar binds |
| M4 | Media | ? | `db.js:70-82` | `queryLectura` usa el pool y el usuario de la app (que escribe en su esquema); solo la corta un temporizador de 30 s | Pool y usuario aparte, solo `SELECT`, con límites de recursos |
| M5 | Media | ◐ | `tools/gpi-validar-formulas.js:80`, `gpi-datos.js:206` | El comparador acepta hasta medio dígito de diferencia: el «99,5 % de celdas» **no prueba el redondeo** (solo la columna del día lo discrimina) | Comparar el texto que se guardaría con igualdad exacta |
| M6 | Media | ◐ | `formula/reglas.js:23-37` | Sin la función única «valor → texto a guardar» (máscara y largo ≤ 20 de `MOV_VALOR`): puede salir `0.30000000000000004` o `1e-7` | `aTextoGuardado(variable, n)` aplicado también al día |
| M7 | Media | ◐ | `formula/tablas.js:6-17` | `vbRound` redondea el producto, no el double (`1.15→1.2`) | Verificar con pares guardados y corregir |
| M8 | Media | ◐ | `evaluador.js:126-133` | `OR`/`AND` con nulo no siguen la lógica de VB6 (hoy 0 fórmulas con `OR`) | Lógica trivalente |
| M9 | Media | ◐ | `evaluador.js`, `parser.js` | Errores no controlados (`GetData` sin zafra, fechas enormes, argumentos faltantes, 20.000 paréntesis) escapan como `Error` genérico | Envolver `evaluar/parsear`, validar argumentos y limitar tamaño y profundidad |
| M10 | Media | ◐ | `parser.js:129-136` | `referencias()` omite los ids de las funciones de dominio y no hay detección de ciclos | Completar y detectar ciclos antes de escribir |
| M11 | Media | ◐ | `estadistica.js:41-63` | Con subgrupo incompleto la línea central usa los datos agrupados pero `media`, `desvío` y Cpk usan todos | Usar solo lo agrupado o informar el recorte |
| M12 | Media | ◐ | `tools/export-db.js:35` | **No verifica que la base sea DESA** y usa una ruta absoluta de otra carpeta | Repetir el chequeo de host |
| M13 | Baja | ◐ | `gpi-datos.js:178` | Bucle `GetMedia` sin tope ni validación de fechas | Validar y limitar |
| M14 | Baja | ◐ | `evaluador.js` | Supuestos presentados como regla: `"1"+"2"=3`, división por cero → nulo, `LOG` = log10, `^` asociativo a derecha, desbordes a `Infinity` | Contrastar con VB6 o documentar como supuesto |
| M15 | Baja | ◐ | `estadistica.test.js` | Pruebas tautológicas (recalculan con las mismas constantes) y fuera de `npm scripts` | Valores de manual independientes |
| M16 | Baja | ◐ | `tools/*` | Duplicación (5 tolerancias distintas, `chdir` global), argumentos sin validar, SQL interpolado desde argv, `catch { continue }` que sesga métricas | Parser de argumentos común y binds |
| M17 | Baja | ? | `gpi-datos.js:141-149` | `Db_Select` de fórmulas históricas (de `GI_LAB_RASTREA`) se resuelve a nulo en silencio | Precargar también las históricas o avisar |

### 2.4 Repositorio, operación y documentación (transversal)

| ID | Sev. | Estado | Falla | Arreglo |
|---|---|---|---|---|
| T1 | **Alta** | ✔ | **El repositorio no tiene ningún commit**: todo el trabajo (≈ 8.600 líneas de código, 42 documentos, 175 archivos de base) está sin versionar | Primer commit, rama `main`, `.gitignore` completo (`tsbuildinfo`, `scratchpad`) |
| T2 | **Alta** | ✔ | Sin pruebas automáticas (solo un script de estadística), sin lint ni formateo, sin CI | Ver Sprint 15 |
| T3 | Media | ✔ | `npm audit`: API **4 vulnerabilidades** (`qs` vía Express 4.21.2: 3 altas y 1 moderada, denegación de servicio); web **6** (`postcss`: 5 altas y 1 moderada, de compilación) | Actualizar Express a 4.22.x y `postcss`; revisar `npm audit` en CI |
| T4 | Media | ✔ | La API se conecta como **`INV`** (dueño del esquema de inventario/balanza): privilegios probablemente excesivos para una API de consulta | Usuario de solo lectura para consultas y otro para tablas propias |
| T5 | Media | ✔ | Rendimiento medido: `/maestras` 1,6 s, `/lab/entrada-cana` 2,9 s (3 semanas), `/informes/1` 0,76 s (65 kB), `/gpi/arbol` 0,56 s (40 kB), `/auth/me` 19 kB | Ver A7 y A17 y caché por usuario |
| T6 | Media | ✔ | `README.md` desactualizado: «inventario pendiente» de los exes menores (ya hecho) y un stack que no coincide (shadcn/Radix/Recharts no se usan) | Reescribir |
| T7 | Baja | ✔ | `docs/` mezcla estado, análisis y plan; algunos números envejecen (se recarga DESA a diario) | Índice `docs/README.md` y fecha en cada cifra |
| T8 | Baja | ✔ | No hay despliegue definido: la API no sirve el build del front, ni registro estructurado, ni proceso supervisado | Ver Sprint 15 |

### 2.5 Idioma (pedido: toda la aplicación en español)

Relevamiento del 26/10/2026 (conteos reproducibles con una búsqueda de vocabulario portugués sobre `recursos.js`, `web/src` y la base):

| ID | Sev. | Estado | Dónde | Hallazgo |
|---|---|---|---|---|
| L1 | Media | ✔ | `api/src/modules/maestras/recursos.js` | **55 de los 72 títulos de catálogos están en portugués** o mezclados: «Estágio de Corte», «Fundo Agrícola», «Redução de Moagem · Motivo», «Motivos de Liberação», «Safra», «Municípios», «Turno de Carregamento», «Empreiteiros»… (se ven en el Inicio, en los encabezados y en las migas) |
| L2 | Media | ✔ | `recursos.js` (rótulos de columnas) | 12 rótulos de columnas en portugués: «Estágio», «Setor», «Safra», «Característica», «Empreiteiro», «Motivo»… |
| L3 | Media | ✔ | `Dashboard.tsx:47`, `GpiLancamentoPage.tsx` | Textos fijos de la aplicación: «Lançamento diário» (enlace y pantalla) y la columna «Ordem» |
| L4 | **Alta** | ✔ | `GATEC_AGR.GAM_MODULOS_FORMS` | **113 de 542 títulos de pantallas y menús de la base tienen marcas de portugués** (más los que no llevan tilde): «Painel de Informação», «Análises de Pré-Colheita»… Se muestran en «Opciones habilitadas por módulo» del Inicio y en Administración. No se pueden cambiar en la base (la comparte el VB6) |
| L5 | Info | ✔ | base | Los nombres de variables ya son mayormente españoles (8 de 3.174 con tildes portuguesas, 548 con marcas de español); los grupos también. Son **datos de usuario**: no se traducen |
| L6 | Info | ✔ | `web/index.html` | `<html lang="es">` ya es correcto |
| L7 | Info | ✔ | `GA_TRA_TEXTOS` | El traductor del GATEC guarda **3.175 pares portugués→español** (1046 → 1034) listos para usar como punto de partida, pero de calidad despareja (p. ej. «Impureza Minerale e Vegetale», «Lanzamiento»): hay que depurarlos, no aplicarlos a ciegas |
| L8 | Baja | ◐ | `web`, `api` | No hay control automático: nada impide que vuelva a entrar portugués en un texto nuevo |

## 3. Pendientes de producto (de los sprints 1-10)

| Pendiente | Bloquea | Depende de |
|---|---|---|
| Digitación GPI (carga diaria y recálculo) | uso real del GPI | motor (M1-M10), convivencia con el VB6, validación |
| Cierre diario y acumulados | cierre | motor, candado, validaciones previas (tablas vacías en DESA), comparación fila a fila |
| Fórmulas con margen: variable 289 (tanques de jugo), 5533, tiempos de cocción, acumulados tipo 2 (15 casos) y 5 (4-8 %), `GetAcumulado*`, acumulados de zafra anterior y mensuales | exactitud 100 % | usuario del GATEC |
| Digitación de análisis de sonda | uso real del laboratorio | factores de Pol y AR (no existen en DESA), aparato serial |
| Carga de metas (escritura) y meta semanal | metas | definición del inicio de semana |
| Configuración del panel y reglas de diagnóstico | panel | escritura en tablas compartidas |
| Administración con escritura | retiro de `GAtec_Senha` | decisión de diseño |
| Validación contra el GATEC viejo (checklist listo) | todo | usuarios disponibles |
| Preguntas abiertas: caña digitada vs balanza, `Bal0015`, correo/SMS/Fermentec/Pré-Colheita en producción | alcance | usuarios |

## 4. Plan de sprints

Orden: primero lo que **protege los datos y la disponibilidad** (Sprint 11), luego lo que el usuario ve (12), el **idioma** (13, para que la validación con usuarios ya se haga en español), rendimiento (14), la base de calidad que evita regresiones (15), el endurecimiento del motor (16)
y recién después la validación (17) y la escritura (18+). Los sprints 11 y 15 pueden arrancar en paralelo porque no se pisan (T1 conviene hacerlo **antes de cualquier otro cambio**).

### Sprint 11 — Seguridad y estabilidad de la API
*Objetivo: que ninguna falla de base o de entrada tire la API ni permita tocar datos de otra empresa o bloquear cuentas.*
- T1 **primer commit** y rama `main` (previo a todo).
- A1 `try/catch` en `cargarRecurso` y `unhandledRejection`; A3 filtro de scope en obtener/actualizar/eliminar; A2 reserva atómica del intento de login y rechazo del usuario de servicio.
- A4 manejador de errores seguro; A6 validación del `JWT_SECRET`; A5 rate limit y A16 CORS/`helmet`; A14 503 vs 401.
- A13 validador común (fecha real, escalares, límites) y A12; A15 fechas locales; A8 bootstrap; A9 y A10 correcciones funcionales; A19 reintentos; A11 (consultar a un usuario del GATEC).
- T3 actualizar Express y `postcss`; T4 definir usuario de solo lectura.
- **Aceptación:** pruebas manuales documentadas de cada caso (error de base simulado, ráfaga de logins, edición cruzada de empresa); `npm audit` sin altas; ninguna respuesta de error contiene mensajes ORA.

**Resultado del Sprint 11 (26/10/2026): ✅ hecho, en 6 commits.** `cd api && npm test` ejecuta 40 pruebas automáticas (sin base de datos) y todas pasan.

| Hallazgo | Estado | Cómo se resolvió y cómo se verificó |
|---|---|---|
| T1 primer commit | ✅ | Rama `main`; se revisó antes que no entraran secretos ni credenciales (incluidos los volcados de memoria) |
| A1 | ✅ | `cargarRecurso` con `try/catch`; red de seguridad para `unhandledRejection`/`uncaughtException`. Prueba: un fallo de base responde 500 genérico y la API sigue viva (contra el código viejo el pedido quedaba colgado) |
| A2 | ✅ | Reserva **atómica** del intento antes de consultar a Oracle (`auth/intentos.js`). Contra DESA, con un usuario ficticio: 8 reservas simultáneas → exactamente 2 pasan (fila de prueba eliminada); pruebas del flujo con Oracle doblado |
| A3 | ✅ | `whereRegistro`: PK + filtro de empresa/zafra en leer, editar y borrar; no se reasigna empresa ni zafra. En vivo (solo lectura): con otra empresa ningún registro se encuentra |
| A4 | ✅ | Manejador de errores sin mensajes internos y que respeta los 4xx (JSON inválido, parámetro malformado) |
| A5 | ✅ | 20 pedidos de login cada 5 minutos por IP, con 429 y `Retry-After` |
| A6 | ✅ | La API no arranca con un `JWT_SECRET` de menos de 32 caracteres ni con el valor de ejemplo |
| A8, A9, A10 | ✅ | Bootstrap con `config.appSchema` y DDL calificado; lançamento sin 500 si falta la configuración; búsqueda de variables filtra las planillas habilitadas dentro del SQL |
| A12, A13 | ✅ | `lib/validar.js`: fecha real del calendario, enteros y decimales estrictos, booleanos explícitos y escalares; `?limit` acotado y `truncado` en la respuesta. En vivo: `2026-02-30` y `?fecha=a&fecha=b` dan 400 |
| A14 | ✅ | Una caída de la base al validar el token responde 503 y no 401 |
| A15 | ✅ | «Hoy» en hora local del servidor, no UTC |
| A16 | ✅ | Cabeceras de seguridad, sin `X-Powered-By`, límite de 100 kB al JSON y CORS con lista blanca (`CORS_ORIGIN`) |
| A19 | 🟡 parcial | El caché de «la tabla no existe» vence a los 60 s. **Queda:** que el bootstrap se reintente si DESA se recarga con la API encendida (hoy exige reiniciar) |
| T3 | 🟡 parcial | API: `npm audit` en 0 (Express 4.22.3). Web: de 6 a 5 avisos; los restantes piden Vite 8 (solo servidor de desarrollo) y React Router 7 (redirección abierta en `<Link>`, que no se usa con direcciones externas): pasan al Sprint 14 |
| A11 | ⏳ pendiente | Requiere preguntar a un usuario del GATEC si el sistema viejo restringe usuarios por empresa |
| T4 | ⏳ pendiente | Requiere al DBA: crear un usuario de solo lectura (hoy la API se conecta como `INV`) |
| A7, A17, A18 | ➡️ Sprint 14 | Son de rendimiento y están en ese sprint |

**Decisiones tomadas durante el sprint**
- No se rechaza el login del usuario de servicio (`DB_USER`): se podía usar para entrar y el nuevo tope (2 intentos) queda por debajo de los 3 que bloquean el perfil de Oracle.
- El límite de pedidos es **en memoria** (un solo proceso de la API); con varios procesos habría que moverlo a la base o a un proxy.
- El bloqueo de 15 minutos tras 2 fallos sigue permitiendo que alguien deje sin acceso a un usuario conocido (es inherente a cualquier bloqueo); el límite por IP lo hace más costoso.

### Sprint 12 — Sesión y consistencia del frontend
*Objetivo: que lo que se ve corresponde siempre al usuario, la empresa y la zafra activos.*
- F1 manejo de 401 (login y limpieza de caché) y `retry` solo para errores de red; F3 limpiar caché; F2 reinicio completo al cambiar de zafra (y F15 mostrar el error); F4 `RutaProtegida`.
- F5 «Consultar» refresca; F6 `URLSearchParams`; F7 CSV seguro; F8 y F9 manejo de errores; F10 modal; F12 `aMs`.
- F16-F18 accesibilidad (filas, contraste, tabla `sr-only` del gráfico); F13 tipos numéricos con verificación endpoint por endpoint.
- **Aceptación:** guion de pruebas (sesión vencida, cambio de zafra en cada pantalla, salir/entrar con otro usuario, URL directa sin permiso, reintento de Consultar) ejecutado en el navegador con capturas.

**Resultado del Sprint 12 (28/10/2026): ✅ hecho, en 4 commits.** Verificado en navegador real (Edge headless): `node tools/e2e/sprint12.js` 31/31, `node tools/e2e/humo.js` 12/12 pantallas sin errores, `cd web && npm test` 10 pruebas.

| Bloque | Hallazgos | Resultado |
|---|---|---|
| 1 · Sesión | F1, F3, F14 | 401 lleva al login con aviso; `retry` solo en errores de red/5xx; caché limpia al entrar y salir |
| 2 · Zafra y rutas | F2, F4, F15 | Cambio de zafra reinicia las pantallas y muestra el error si falla; guarda de rutas por permiso (`lib/pantallas.ts`) |
| 3 · Consultas | F5–F9, F12, F13 | «Consultar» refresca; URLs con `URLSearchParams`; CSV a prueba de fórmulas y con coma decimal; errores visibles |
| 4 · Accesibilidad | F10, F16–F18 | Modal sin cierre por arrastre, con foco atrapado y scroll bloqueado; filas con botón real; contraste AA; resumen del gráfico para lectores de pantalla |

**Pasan al Sprint 14:** F11 (redibujado de gráficos), debounce de búsquedas, code-splitting.

### Sprint 13 — Idioma: toda la interfaz en español
*Objetivo: que ninguna pantalla, menú, catálogo, mensaje ni exportación muestre portugués, sin modificar la base (la comparte el VB6).*
1. **Glosario oficial** (decisión con usuarios): partir de los 3.175 pares de `GA_TRA_TEXTOS` y depurarlos en un archivo versionado (`api/src/i18n/glosario-es.json` + `docs/glosario-es.md`). Primeros términos a decidir:
   | Portugués | Propuesta | A confirmar |
   |---|---|---|
   | Safra | Zafra | — (ya se usa) |
   | Lançamento | Digitación (o «Carga») | el GATEC viejo en español usa «Lanzamiento» |
   | Colheita / Pré- / Pós-Colheita | Cosecha / Precosecha / Poscosecha | — (coincide con el traductor del GATEC) |
   | Talhão · Fazenda · Setor · Lote | Parcela o lote · Finca · Sector · Lote | cómo los llaman en la usina |
   | Estágio (de corte) | Etapa o estadio de corte | cómo lo llaman en la usina |
   | Empreiteiro · Frente de trabalho · Moagem · Redução | Contratista · Frente de trabajo · Molienda · Reducción | — |
   | Painel · Boletim · Informação | Panel · Boletín · Información | — |
2. **Catálogos** (L1, L2): traducir los 55 títulos y los 12 rótulos de `recursos.js` según el glosario (afecta Inicio, encabezados y migas).
3. **Textos de la aplicación** (L3): «Lançamento diário» → el término acordado, «Ordem» → «Orden»; revisar todos los mensajes, encabezados de CSV, descripciones accesibles (`aria-label`), mensajes de la API y la documentación visible al usuario.
4. **Títulos que vienen de la base** (L4): una **capa de traducción en la API** (archivo versionado, sin tocar la base) que reemplaza el título portugués de cada pantalla o menú por su versión en español en `/auth/me`, Inicio y Administración. Si falta la traducción se muestra el original y se **registra como faltante** para completarla.
   Opcional, a decidir: mostrar entre paréntesis o como ayuda el nombre original del GATEC, para que quien valida pueda ubicar la pantalla en el sistema viejo.
5. **Formato regional** (junto con F25): un solo formateador `es-PY` para números y fechas (miles con punto, decimales con coma) y la misma política en todos los CSV.
6. **Control automático**: `tools/verificar-idioma.js`, que falla si encuentra tildes o vocabulario portugués en los textos de `web/src`, en `recursos.js` o títulos sin traducir en el glosario; con lista blanca para nombres propios. Se engancha al CI del Sprint 15 y se puede correr desde ya a mano.
7. **Guía de estilo** breve: español neutro, trato impersonal («Seleccione», no «Seleccioná»), ortografía de la RAE, sin mezclar con portugués ni con anglicismos innecesarios.
- **Fuera de alcance:** los datos que cargan los usuarios (nombres de variables, planillas, cañeros), los nombres técnicos de tablas y columnas y los mensajes de Oracle (ya salen en español).
- **Decisiones que necesito de usted/usuarios:** (a) confirmar los términos de la tabla anterior; (b) si se muestra el nombre original del GATEC como ayuda; (c) quién aprueba el glosario.
- **Aceptación:** recorrido de **todas** las pantallas y menús sin portugués (verificación automática en cero y capturas revisadas); 0 faltantes de traducción para los títulos de las pantallas que el usuario realmente puede abrir; glosario aprobado por un usuario del GATEC. Esfuerzo estimado: 3 a 4 días.

### Sprint 14 — Rendimiento y deuda técnica
*Objetivo: pantallas fluidas y código sin duplicación.*
- A7 permisos en una consulta + caché por usuario (`/maestras` < 300 ms); A17 subconsulta filtrada (`/entrada-cana` < 1 s); `/auth/me` más liviano; A18.
- F20 code-splitting; F11 y F19 gráfico, debounce y `keepPreviousData`; F21 virtualización o paginación; F22-F28 y limpieza.
- Utilidades compartidas: `lib/fecha.ts`, `lib/num.ts`, formateador `es-PY`; componentes `Dato`, `ListaSeleccionable`, `Badge danger`, buscador único; util común de validación en la API (M16 y duplicados de servicios).
- **Aceptación:** tiempos medidos antes y después (misma tabla que la sección 2.4); chunk inicial < 200 kB; cero utilidades duplicadas.

**Resultado del Sprint 14 (28/10/2026): ✅ hecho en lo medible, en 3 commits.** Se mide con `node tools/medir-api.js` (API) y `node tools/e2e/sprint14.js` (front); pruebas: API 44, front 14.

| Medida | Antes | Después | Cómo |
|---|---|---|---|
| `GET /api/maestras` (arranque en frío) | 1,5 s | 0,07 s | una sola consulta de permisos (A7) |
| `GET /api/lab/entrada-cana` | 2,9 s | 0,19 s (mismo resultado) | `BUSCA_PARAMETRO` es una función PL/SQL: suelta se evalúa por fila, dentro de `(SELECT … FROM DUAL)` una sola vez (A17) |
| Pedidos al escribir 13 letras en el buscador | 11 | 1 | retardo de 300 ms (F19) |
| JS de arranque | 361 kB (105 kB gzip) | 262 kB (83 kB gzip): app 29 kB + librerías 232 kB en archivo aparte | `React.lazy` por pantalla (F20) |
| Gráfico al mover el mouse | recalculaba ejes y series | la capa fija se conserva (verificado) | `useMemo` (F11) |

Otros: A18 (un `Date` crudo no se serializa), F22 (fecha local), F23 (`Badge danger`), F24 (`lib/fecha.ts`, `lib/num.ts`, `Dato`, buscador único), M16 parcial (`api/src/lib/util.js`).
**Hallazgo útil:** el cuello de botella de `entrada-cana` NO era la subconsulta que decía A17 (reescribirla la empeoró de 1,2 a 4 s); era `BUSCA_PARAMETRO` por fila. Conviene revisar lo mismo en cualquier consulta con funciones PL/SQL en el `WHERE`.
**No se hizo / queda:** el arranque no baja de 200 kB en total (las librerías son 232 kB; solo el código propio es 29 kB); F21 virtualización (hasta 500 filas por tabla, sin lentitud medida); F26-F28; `/gpi/arbol` (0,44 s, 39 kB) y `/gpi/variaveis` (0,29 s) quedan como están; los 5 avisos de `npm audit` (esbuild/Vite solo afecta al servidor de desarrollo; React Router 7 es un cambio mayor) se deciden aparte.

### Sprint 14b — Tema visual AZPA (azul corporativo)
*Objetivo: pasar la marca de verde a azul AZPA sin perder el estilo sobrio ni el contraste verificado.* Decidido el 28/10/2026: opción A (solo paleta y tipografía).
- Insumo: `docs/lab-app-theme.css` (Tailwind 4, azul `oklch(0.36 0.16 264)` ≈ `#1A3A8F`, Space Grotesk + Inter). **No se importa tal cual**: el proyecto usa Tailwind 3.4 y nombres propios (`brand`, `ink`, `muted`, `line`, `control`, `calc`), y `text-muted` (79 usos) cambiaría de significado con los tokens semánticos del tema.
- Reemplazar la escala `brand` de `web/tailwind.config.ts` por una azul derivada del hue 264, **manteniendo los nombres**; los 22 archivos con clases `brand-*` no se tocan salvo ajustes puntuales.
- Separar los roles que hoy comparte el verde (acción primaria, selección de filas/árbol, encabezado de fecha en grillas, foco) y decidir cuáles pasan a azul; `success` sigue verde (estado, no marca).
- Tipografía: Space Grotesk solo en títulos (`.page-title`, `.panel-title` si aplica) y Inter en el resto; **autoalojar** las fuentes (sin Google Fonts: la intranet puede bloquearlo) con fallback actual.
- **Se mantiene** lo sobrio: sin gradientes, `glass`, `glow` ni sombras (salvo diálogos), radios 6/8 px, solo tema claro, escritorio.
- Recalcular **todos** los contrastes WCAG (tabla de `docs/ui-sistema-visual.md`): texto en `brand-*`, blanco sobre primario, selección, foco, `calc`; `warning` sigue sin ser texto.
- Actualizar `docs/ui-sistema-visual.md` (paleta, tabla de contraste, principio "acción primaria verde") y el comentario de `tailwind.config.ts`; revisar `LineChart.tsx` y gráficos con colores fijos.
- Prerrequisito: cerrar/commitear los cambios pendientes de UI (`ui.tsx`, `LineChart.tsx`, `MaestraPage`, `GpiLancamentoPage`, `LabSondaPage`, `CorrelacionPage`).
- **Decisiones que necesito de usted:** (a) el tono exacto del azul si difiere de `#1A3A8F`; (b) qué usos pasan a azul y cuáles quedan en verde; (c) si Space Grotesk va también en cabeceras de tabla.
- **Aceptación:** recorrido de todas las pantallas con capturas antes/después; contrastes ≥ 4,5 (texto) y ≥ 3 (controles) documentados; cero clases o colores verdes de marca residuales; build y pruebas verdes. Esfuerzo estimado: 1 a 2 días.

**Resultado del Sprint 14b (28/10/2026): ✅ hecho con las opciones por defecto del plan** (azul `#1A3A8F`; el usuario no indicó otro tono ni una separación de roles).
- Escala `brand` de `tailwind.config.ts` pasada a azul (matiz 264) **con los mismos nombres**: las clases `brand-*` no se tocaron. El botón primario, la selección, el foco y los encabezados de fecha quedan en azul; `success` sigue verde.
- Los estados buenos que usaban el verde de marca (Activo, Total, Completa, Cumple, Dentro) pasan a `Badge tone="success"` (verde): el azul ya no significa «bien».
- Barra de selección lateral y primera serie de los gráficos con el azul de marca; el verde pasa al segundo color de la paleta de series (el azul anterior se parecía al nuevo).
- Inter (antes no se cargaba: caía a Segoe UI) y Space Grotesk solo en `.page-title`, ambas **autoalojadas** con `@fontsource` (5 archivos woff2, ~100 kB; sin Google Fonts).
- Contrastes recalculados en `docs/ui-sistema-visual.md`: blanco sobre primario 10,27; selección 8,62; **el anillo de foco se corrigió** (al 50 % de opacidad daba 2,30:1; ahora es pleno, 6,57:1).
- Verificado con capturas de las pantallas principales y los guiones de navegador (humo 12/12, sprint12 31/31, sprint14 6/6).
- **Queda a decidir:** si se prefiere otro tono, o separar roles (p. ej. selección en un azul más claro o gris) — se cambia en un solo lugar (`tailwind.config.ts`).

### Sprint 15 — Calidad: pruebas, CI y despliegue
*Objetivo: poder cambiar sin miedo y poder desplegar.*
- ESLint + Prettier; `npm run test`, `lint`, `build` en la raíz; CI (compilar, pruebas, `npm audit`).
- Pruebas de API (rutas con base simulada): matriz de permisos, scope de maestras, login, errores; pruebas del motor con **valores de referencia reales** (no recalculados) y de estadística con casos de manual (M15).
- Convertir los guiones de navegador de esta etapa en `tools/e2e` reutilizables; prueba de humo contra DESA.
- Despliegue: la API sirve el build, proceso supervisado, `/ready`, registro estructurado, variables de entorno documentadas, guía de arranque y recuperación (T8); T6 README y T7 índice de `docs/`.
- **Aceptación:** CI verde desde un clon limpio; cobertura mínima acordada de permisos y login.

**Resultado del Sprint 15 (28/10/2026): ✅ hecho en lo acordado.** `npm run ci` pasa desde un **clon limpio** (`npm ci` + lint + idioma + 78 pruebas + compilación) y los guiones de navegador pasan contra el front **compilado servido por la API** en DESA.

| Punto del plan | Resultado |
|---|---|
| ESLint | ESLint 9 (flat config) para api, web y tools; 0 errores y 0 avisos. Prettier **no** se agregó (reformatearía todo el repositorio y ensuciaría el historial; se decide aparte) |
| `test`, `lint`, `build` en la raíz | `package.json` raíz: `test`, `lint`, `build`, `idioma`, `audit`, `ci` |
| CI | `.github/workflows/ci.yml` (GitHub Actions). **El repositorio todavía no tiene remoto**: el archivo queda listo y se probó el mismo comando en un clon limpio |
| Pruebas de API | matriz de permisos (401 sin sesión, 403 sin acceso en las 27 rutas de GPI y Laboratorio, Administración solo con acceso total o master, sin rutas de escritura), despliegue y registro: 64 pruebas de API |
| Estadística (M15) | las pruebas «de manual» estaban fuera de `npm test` y recalculaban con las mismas constantes; ahora corren y usan valores calculados a mano o publicados (Anscombe 0,81642; X̄–R con A2 = 0,577; Cp = 1,163) |
| Motor de fórmulas | **no cubierto en CI** (necesita datos de DESA): se valida con `tools/gpi-validar-formulas.js`. Sus «valores de referencia reales» quedan para el Sprint 16 |
| e2e | `tools/e2e/run-all.js [--base URL]` corre humo, sprint12 y sprint14 |
| Despliegue (T8) | la API sirve `web/dist` (CSP, caché por archivo, rutas del front), `/api/ready`, registro JSON, cierre ordenado y rutas `/api` inexistentes en 404 JSON; guía en `docs/despliegue.md` |
| T6 / T7 | README actualizado e índice en `docs/README.md` |

**Queda:** probar el CI en un remoto real, decidir Prettier, y el usuario de base de solo lectura (T4).

### Sprint 16 — Endurecimiento del motor de fórmulas (previo a escribir)
*Objetivo: que el motor pueda correr dentro de la API sin riesgo y con exactitud verificable.*
- M1-M4 `Db_Select`: lista blanca, usuario Oracle de solo `SELECT`, tokenizador, binds y pool aparte.
- M5 validación con igualdad exacta del texto a guardar; M6 `aTextoGuardado`; M7 `vbRound`; M8 lógica trivalente; M9 errores controlados, límites de tamaño y profundidad; M10 referencias completas y ciclos; M11; M13; M14 contrastar los supuestos con el GATEC; M12 y M16-M17 en `tools/`.
- Re-ejecutar la validación del motor y registrar la **nueva línea base** (hoy 99,63 % de celdas, pero sin discriminar redondeo).
- **Aceptación:** batería de entradas hostiles para `Db_Select` y evaluador sin escapes; validación exacta ≥ la línea base; documento de supuestos contrastados.

**Resultado del Sprint 16 (28/10/2026): ✅ hecho, en 4 commits.** 106 pruebas de API (eran 64). Detalle de supuestos y línea base en `docs/analisis/gpi-motor-supuestos.md`.

| Hallazgo | Resultado |
|---|---|
| M1-M3 `Db_Select` | lista negra reemplazada por **tokenizador + lista blanca** (un SELECT, sin subconsultas, solo las 3 tablas y las funciones de las fórmulas reales, sin reservadas de Oracle, comentarios, `q'…'`, enlaces de base ni funciones de paquete) y variables como **parámetros** validados. La batería de ~100 entradas hostiles encontró 3 huecos del primer borrador (comentario `/* */`, `dbms_random.value` sin paréntesis, `for update`), ya cerrados |
| M4 | `queryLectura` con **pool propio** (2 conexiones) y tope de 10 filas. El usuario de Oracle de solo `SELECT` (T4) sigue pendiente: requiere un DBA |
| M5 | el validador compara el **texto exacto** que se guardaría. Resultado: igual que la medida con tolerancia (99,63 % columnas, 99,32 % día), es decir, ninguna celda aceptada dependía de un redondeo mal hecho |
| M6 | `reglas.aTextoGuardado`, deducida de 7.532 valores reales. **Hallazgo:** el día de las variables de hora se guarda en horas decimales con 3 decimales sin ceros finales, sumando columnas ya redondeadas a 3 decimales; con la regla anterior la medida exacta del día era 96,84 % |
| M7 | **abierto**: ningún dato guardado discrimina el `Round()` de VB6; se fija el comportamiento actual con pruebas y queda como pregunta |
| M8-M10 | AND/OR con lógica de tres valores; límites de largo, elementos y anidación; errores controlados (`ErrorFormula`/`ErrorEvaluacion`); mínimo de argumentos por función; `dependencias()` completo y `detectarCiclos()` |
| M11 | estadística con subgrupo incompleto: todo sobre los datos agrupados e informa `descartados` |
| M12, M13, M16, M17 | `export-db` verifica DESA; `GetMedia` acotado; argumentos validados y tolerancia única en `tools/`; `Db_Select` no precargado ya no da nulo en silencio |
| M14 | 13 comportamientos catalogados como VERIFICADO o SUPUESTO, fijados con pruebas |

**Línea base nueva:** octubre 99,63 % / 99,32 %; septiembre 99,54 % / 99,09 % (columnas / día, comparación exacta igual a la tolerante). El hardening no cambió ningún resultado.
**Queda:** T4, la pregunta del punto M7 y los supuestos 3 a 6 del documento (los confirma un usuario del GATEC en el Sprint 17); conectar `detectarCiclos` al orden de cálculo cuando el motor corra dentro de la API.

### Sprint 17 — Validación con usuarios y cierre de pendientes del motor
*Objetivo: salir de «parece que coincide» a «coincide, verificado por quien usa el sistema».*
- **Preparado (28/10/2026):** guion de la sesión en `docs/sesion-validacion-sprint17.md`; checklist con 41 valores esperados re-verificados (`node tools/verificar-valores-esperados.js`) y preguntas de decisión 1 a 9 (incluye el orden de prioridad de la edición y las reglas de cálculo del viejo).
- Ejecutar `docs/validacion-con-usuarios.md` con un usuario del GATEC y con laboratorio; registrar resultados.
- Resolver con sus respuestas: variable 289, 5533, tiempos de cocción, acumulados tipo 2 y 5, caña digitada vs balanza, `Bal0015`, funciones sin datos, metas 2026, administración.
- Ajustar pantallas según las diferencias; decidir qué sprints de escritura se construyen y en qué orden.
- **Aceptación:** checklist completo firmado; lista cerrada de diferencias aceptadas, corregidas o descartadas.

### Sprint 18 en adelante — Escritura (condicionado a 16 y 17)
Cada ítem con **interruptor de funcionalidad apagado por defecto**, pruebas en DESA y comparación contra el VB6 antes de encender.
1. **Digitación GPI** y recálculo (convivencia con el VB6, candado, bitácora de cambios).
2. **Cierre diario** (candado `GI_LAB_CONTROLA_FECHAMENTO`, acumulados incrementales, validaciones previas, reproducción de un cierre completo en DESA comparado fila a fila).
3. **Digitación de análisis de sonda** (factores de Pol y AR, aparato serial / código de barras si se confirma su uso).
4. **Carga de metas**, configuración del panel y consultas guardadas.
5. **Administración con escritura** (usuarios, permisos) — solo si se decide traerla a esta app; con aprobación de dos personas y registro de auditoría.

## 5. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Perder el trabajo (sin ningún commit) | Media | **Alto** | Primer commit hoy (T1) |
| Que el motor escriba algo mal en datos compartidos con el VB6 | Baja (aún no escribe) | **Alto** | Sprint 16, interruptores apagados, comparación fila a fila |
| Bloqueo masivo de cuentas Oracle por ráfaga de logins | Media | Alto | A2 y A5 |
| Que los usuarios vean datos de otra zafra o de otro usuario | Media | Medio-alto | F1-F4 |
| DESA cambia cada noche y las cifras de validación envejecen | Alta | Medio | Comparar solo días cerrados; fechar las cifras |
| Que la validación con usuarios se siga postergando | Alta | Alto | Sprint 17 como condición para cualquier escritura |
| Que los usuarios no reconozcan las pantallas al traducirlas (nombres que ya conocen en portugués) | Media | Medio | Glosario aprobado por usuarios y nombre original del GATEC como ayuda opcional |
