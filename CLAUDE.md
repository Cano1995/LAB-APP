# lab-app — sistema de laboratorio configurable (nació como azpa-lab, reescritura de GATEC)

**Marca configurable:** nombre, textos, logos e iconos viven en `LAB_APP_CONFIG` / `LAB_APP_ASSET` y se editan en Administración → Configuración (`api/src/modules/configuracion/`, `web/src/lib/branding.ts`, `web/src/pages/ConfiguracionTab.tsx`). No escribir nombres de empresa ni rutas de logos en el código: usar `useMarca()`.
**Inventario de pantallas, API y base de datos:** `docs/INVENTARIO-APP.md`. **Objetos de base de datos:** `docs/base-de-datos.md` (scripts en `api/sql/`).

Reescritura del sistema **GATEC** (VB6, fuente perdida) como app web, manteniendo
funcionalidades y la misma base Oracle. Contexto completo en `README.md`.

## Documentación (todo lo referente a GATEC vive en este repo)

- `README.md` — contexto, stack, cómo correrlo.
- `ROADMAP.md` — plan por sprints, estado de cada módulo.
- `docs/revision-completa-y-plan.md` — revisión de código/seguridad/rendimiento (hallazgos A, F, M, T) y plan de sprints 11 en adelante.
- `docs/validacion-con-usuarios.md` — checklist para validar la app contra el GATEC viejo (valores esperados y preguntas abiertas).
- `docs/estado-del-proyecto.md` — **estado consolidado**: qué está hecho, decisiones, hallazgos, bloqueos de escritura y herramientas.
- `docs/inventario/INVENTARIO.md` — inventario de los 9 ejecutables (pantallas, SQL, tablas).
- `docs/inventario/raw/` y `docs/inventario/dumps/` — datos crudos del inventario.
- `docs/analisis/mapeo-tablas-maestras.md` — formularios ABM → tablas reales.
- `docs/analisis/decisiones-y-notas.md` — decisiones de diseño y trampas de datos.
- `db/plsql/` y `db/catalogo/` — PL/SQL y catálogo de tablas exportados de la base.

**Nota:** el módulo 91 (Expedición/Certificados) NO se recrea (sus forms no están en los
ejecutables y sus tablas están vacías en DESA). Detalle en `docs/analisis/decisiones-y-notas.md`.

## Estructura

- `api/` — API Node + Express + oracledb (modo thick). Login, permisos, y (más adelante) los módulos.
- `web/` — Front React + Vite + TS + Tailwind. Proxy `/api` → `http://localhost:3101`.
  Reglas visuales (paleta, tipografía, componentes, contraste): `docs/ui-sistema-visual.md`.
- `db/` — PL/SQL y catálogo de tablas exportados de los esquemas GATEC_* (ver `tools/export-db.js`).
- `docs/inventario/` — inventario de los exe VB6 (pantallas, SQL, tablas). Índice en `INVENTARIO.md`.
- `tools/` — extractores de inventario y export de la base.

## Comprobar todo

`npm run ci` desde la raíz (lint, idioma, pruebas de api y web, compilación; no usa la base). Despliegue y recuperación: `docs/despliegue.md`. Índice de la documentación: `docs/README.md`.

## Pruebas y seguridad de la API

- `cd api && npm test` — pruebas automáticas (`node --test`, sin base de datos): estabilidad, aislamiento por empresa/zafra, login, límites, validación.
- La API **no arranca** con un `JWT_SECRET` de menos de 32 caracteres ni con el valor de ejemplo. `CORS_ORIGIN` (lista separada por comas) define qué
  orígenes de navegador pueden llamarla; por defecto solo el front local.
- Entradas del cliente: siempre por `api/src/lib/validar.js` (fecha real, enteros/decimales estrictos, booleanos, límites). Los errores de la API nunca
  devuelven el mensaje interno (Oracle incluye esquema y tabla): el detalle queda en el registro del servidor.

## Pruebas del front

- `cd web && npm test` — utilidades (CSV, armado de URLs), sin navegador ni base.
- `node tools/medir-api.js [repeticiones]` — tiempos de los endpoints principales (solo lectura; API corriendo).
- `node tools/e2e/sprint12.js [carpeta]`, `node tools/e2e/sprint14.js` y `node tools/e2e/humo.js` — navegador real (Edge headless, sin dependencias); requieren API y front corriendo y la base DESA.

## Idioma

Toda la interfaz es en **español** (la base y el GATEC viejo están en portugués). Los títulos que vienen de la base se traducen al leer con `api/src/i18n/`
(glosario en `docs/glosario-es.md`); números y fechas con `web/src/lib/formato.ts` (`es-PY`). Controles: `node tools/verificar-idioma.js` y `node tools/verificar-titulos.js`.

## Correr en dev

```
cd api && npm install && cp .env.example .env   # completar DB_PASSWORD, etc.
npm run dev                                       # API en :3101
cd ../web && npm install && npm run dev           # front en :3100
```

Abrir http://localhost:3100.

## Base de datos

- **Para ejecutar consultas sueltas a la base** (análisis, verificación, exploración),
  usar el script de la carpeta vecina **`Agente-ia`**:
  ```
  cd C:\repositorios\azpa\Agente-ia && node db-query.js "SELECT ... FROM GATEC_AGR...."
  ```
  Ahí está configurada la conexión Oracle (modo thick, cliente 12.1) y el `.env` con las
  credenciales. Devuelve JSON. Las columnas CHAR vienen con espacios al final.
  La API de este proyecto (`api/`) tiene su propia conexión por pool para la app en sí.
- **Trabajamos contra DESA**: `10.213.52.25:1521/BDTEB`, servidor `oradesa` (alias `DESA` del tnsnames).
  **Producción usa el mismo nombre de servicio `BDTEB`** (servidor `10.213.52.70`), y el `Banco=BDTEB` del
  `GAtec.ini` del VB6 apunta a **producción**. La API verifica el servidor al arrancar (`DB_HOST_ESPERADO=oradesa`,
  en `api/src/db.js`) y no inicia si no coincide. Nunca apuntar la app ni las herramientas a producción.
- DESA se recarga a diario desde producción; lo creado a mano se pierde. Por eso la tabla propia de la app (`LAB_APP_AUTH`) la
  **recrea/evoluciona el bootstrap al arrancar** (`api/src/lib/bootstrap.js`), de forma idempotente.
- Esquemas núcleo: `GATEC_AGR` (usuarios `GAM_USUARIOS`, permisos `GAM_*_FORM_ACESSOS`,
  grupos, menú `GA_MENU_ARVORE`), `GATEC_GPI_NEW`, `GATEC_LAB`.
- **No se modifican las tablas `GATEC_*`**: las comparte el VB6 viejo en paralelo. **Excepciones**: (1) el CRUD genérico de catálogos (`/api/maestras`, solo
  recursos de `recursos.js` marcados con permiso de edición) escribe en `GATEC_AGR` y `GATEC_GPI_NEW`; siempre respeta la empresa/zafra del usuario;
  (2) la **Digitación diaria del GPI** (`PUT /api/gpi/planilhas/:id/lancamento`, Sprint 18), con interruptor APAGADO por defecto (`ESCRITURA_GPI_DIGITACION=1`),
  solo contra DESA, solo con acceso total, solo en días posteriores al último cierre y con auditoría en `LAB_APP_AUDIT`. Cualquier otra escritura es un sprint nuevo.

## Autenticación

- **Usuario** = login del GATEC (`GATEC_AGR.GAM_USUARIOS.DSC_USUARIO`, activo = `USE_ATIVO='1'`, superusuario = `USE_MASTER='1'`).
- **Contraseña** = la del **usuario de Oracle con el mismo nombre**. La API la valida abriendo una conexión a la base
  (DESA) y la cierra; **no guarda contraseñas**. Solo se intenta si el usuario existe y está activo en `GAM_USUARIOS`
  (la web no sirve para probar otras cuentas Oracle). Usuarios del GATEC sin cuenta Oracle no pueden ingresar.
- **Protección de cuentas Oracle**: los perfiles bloquean tras pocos fallos (p. ej. `BOT`: 3 intentos → 30 días). La app
  corta antes: tras 2 fallos seguidos no consulta a Oracle durante 15 min (`LAB_APP_AUTH.BLOQ_HASTA`). El intento se **reserva de forma atómica antes**
  de consultar a Oracle (`auth/intentos.js`), así una ráfaga nunca supera el tope; además hay un límite de 20 pedidos de login cada 5 min por IP.
- `LAB_APP_AUTH` solo guarda intentos, espera y el contexto empresa/zafra (columnas viejas de hash sin uso).
- **Permisos** (`FRM_ACESSOS`, rotulado en `GAtec_Senha.exe`): **1 = acceso total, 2 = sin acceso, 3 = acceso parcial**.
  Por formulario manda el permiso **directo** del usuario; si no hay, entre grupos se toma el **MIN** del código.
  Nivel interno de la app: 0 sin acceso · 1 consulta (parcial, tratado como solo lectura) · 3 total (`auth.service.js`).
  Verificado: el menú del GPI viejo para `bot` deshabilita justo los menús con código 2 (10/10).

## Endpoints

- `POST /api/auth/login` `{usuario, senha}` → `{token, perfil}`; 401 credenciales, 429 espera tras fallos, 503 base no disponible.
- `GET /api/auth/me` (Bearer) → `{perfil}`.

- `GET /api/maestras` y `/api/maestras/:recurso[/:id]` — CRUD genérico (definiciones en `api/src/modules/maestras/recursos.js`).
- `GET /api/gpi/arbol`, `/api/gpi/planilhas/:idPlan/lancamento?data=AAAA-MM-DD` (incluye `edicion`), `/api/gpi/planilhas/:idPlan/dias?mes=AAAA-MM`
  — GPI en solo consulta (salvo la digitación: `PUT …/lancamento`, ver `docs/analisis/gpi-digitacion-escritura.md`) (esquema `GATEC_GPI_NEW`; ver `docs/analisis/gpi-modelo.md`).
- `GET /api/gpi/{variaveis,consultas,valores,supervisorios,panel,cep,correlacion,informes,boletines,metas}` — consultas, supervisorio, panel, CEP y correlación
  en solo consulta (`docs/analisis/gpi-consultas-supervisorio.md`).
- `GET /api/admin/{usuarios,grupos,pantallas,conexiones}` — administración en solo consulta, exige administrador o acceso total a 9680; nunca expone contraseñas (`docs/analisis/sprint10-administracion.md`).
- `GET /api/lab/sonda[/:id]`, `GET /api/lab/entrada-cana` — laboratorio de recepción y balanza, solo consulta (`docs/analisis/lab-sprint7-sonda.md`, `sprint9-balanza-config.md`).

## GPI: motor de fórmulas

`api/src/modules/gpi/formula/` reimplementa el cálculo del VB6. Cualquier cambio se valida con
`node tools/gpi-validar-formulas.js <desde> <hasta>` desde la raíz (solo lectura; compara con lo que calculó el VB6).
Las reglas deducidas viven en `formula/reglas.js` y el arnés usa ese mismo código.
Reglas y pendientes en `docs/analisis/gpi-motor-formulas.md`; cierre y acumulados en `docs/analisis/gpi-cierre.md`
(`node tools/gpi-analizar-acumulados.js <fecha>`). **No habilitar escritura en el GPI** hasta cerrar esos pendientes.

- La validación compara además el **texto exacto** que se guardaría (`reglas.aTextoGuardado`); línea base: 99,63 % de columnas y 99,32 % del día (octubre 2026).
- `Db_Select` (SQL guardado en la base) solo se ejecuta tras pasar `formula/dbselect.js`: lista blanca de tablas y funciones, sin subconsultas, variables como parámetros, pool propio de solo lectura. Ampliar la lista es una decisión de seguridad, no un arreglo.
- Supuestos del motor (verificados o por confirmar): `docs/analisis/gpi-motor-supuestos.md`. `dependencias()` y `detectarCiclos()` son obligatorios antes de escribir.

## Convención al agregar un módulo

1. Revisar su detalle en `docs/inventario/<EXE>.md` (pantallas, controles, SQL incrustado).
2. Confirmar tablas/columnas reales en `db/catalogo/` y reglas en `db/plsql/`.
3. API: una carpeta en `api/src/modules/<modulo>/` (routes + service), montada en `server.js`.
4. Front: páginas en `web/src/pages/`, protegidas por permiso (`idForm`/`modulo`).
5. Validar contra el GATEC viejo que el comportamiento coincide.
