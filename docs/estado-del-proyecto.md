# Estado del proyecto lab-app (26/10/2026)

Reescritura web de **GATEC** (VB6, fuente perdida) sobre la misma base Oracle. Este documento resume **qué está hecho, qué no, por qué y qué decisiones se tomaron**.
Los detalles viven en los documentos enlazados; el plan por sprints está en `ROADMAP.md`.

## 1. Resumen en una tabla

| Sprint | Área | Estado | Alcance real |
|---|---|---|---|
| 1 | Tablas maestras (mód. 15 + 91) | ✅ | CRUD genérico, 14 pantallas + Tipos de Embalagem |
| 2 | Básico / Agrícola (mód. 1) | ✅ | CRUD genérico, 30 tablas |
| 3 | GPI · carga diaria y variables | 🟡 **solo consulta** | Lançamento diario + motor de fórmulas (99,6 % de las celdas); falta la digitación |
| 4 | GPI · cierre, paradas, material | 🟡 **solo consulta** | 18 catálogos; cierre y acumulados analizados; falta escribir el cierre |
| 5 | GPI · consultas, supervisorio, panel, CEP | 🟡 casi completo (consulta) | Valores, Supervisorio, Panel, CEP, Correlación |
| 6 | GPI · reportes y metas | 🟡 consulta | Informes, Boletines, Real x Metas; correo/SMS/Fermentec no se recrean |
| 7 | Laboratorio de recepción | 🟡 consulta | Análisis de sonda (884 mil filas) + motivos de cancelación |
| 8 | Laboratorio (`GAtec_Lab`) | ⏸ absorbido por el 7 | Relevado: casi todo vacío en DESA |
| 9 | Pre-Zafra, Config, Otros, Traducciones, Balanza | 🟡 consulta | Entrada de caña (balanza); resto son menús, traductor o no recreable |
| 10 | Administración y cubos | 🟡 consulta | Usuarios, grupos, permisos y conexiones (solo administradores); sin escritura; cubos sin datos |

**Hecho en toda la app: lectura.** Lo único que escribe hoy son los **catálogos** de los sprints 1, 2, 4 y 7 (CRUD genérico) y el registro de intentos de login (`LAB_APP_AUTH`).
**La digitación (GPI y laboratorio) y el cierre diario siguen deshabilitados** a propósito: ver sección 5.

## 2. Pantallas disponibles

| Ruta | Pantalla | Permiso (form VB6) | Documento |
|---|---|---|---|
| `/` | Inicio (enlaces filtrados por permiso) | — | `docs/ui-sistema-visual.md` |
| `/maestras/:recurso` | 72 catálogos (CRUD) | por recurso | `docs/analisis/mapeo-tablas-maestras.md`, `mapeo-modulo-1.md`, `gpi-cierre.md` |
| `/gpi/lancamento` | Lançamento diario (árbol + grilla del día) | 8420 | `docs/analisis/gpi-modelo.md` |
| `/gpi/valores` | Valores de variables (diario/acumulado, gráfico, CSV) | 8507 | `gpi-consultas-supervisorio.md` |
| `/gpi/supervisorio` | Supervisorio (gráficos con límites) | 8524 | idem |
| `/gpi/panel` | Panel de información personal | 9234 | idem |
| `/gpi/cep` | Control estadístico (carta X̄–R, Cp/Cpk) | 8510 / 10149 | idem |
| `/gpi/correlacion` | Correlación (Pearson) | 9995 / 10143 | idem |
| `/gpi/informes` | Informes configurables (30) | 8445 / 10050 | `gpi-sprint6-reportes.md` |
| `/gpi/boletines` | Boletines (6) | 8453 | idem |
| `/gpi/metas` | Real x Metas | 9984 / 10054 / 9990 | idem |
| `/lab/sonda` | Análisis de caña (sonda) | 9905 / 9903 | `lab-sprint7-sonda.md` |
| `/lab/entrada-cana` | Entrada de caña (balanza + análisis del acumulado) | 9905 / 9903 | `sprint9-balanza-config.md` |
| `/admin` | Usuarios, grupos, permisos por pantalla y conexiones | administrador o acceso total a 9680 | `sprint10-administracion.md` |

API: `/api/auth`, `/api/maestras`, `/api/contexto`, `/api/gpi/*`, `/api/lab/*`, `/api/admin/*` (lista en `CLAUDE.md`). Todo cuelga de `api/src/modules/<modulo>/`; front en `web/src/pages/`.

## 3. Decisiones tomadas (y por quién)

| Decisión | Detalle |
|---|---|
| **Solo DESA** | `Banco=BDTEB` del VB6 apunta a **producción**; la app y las herramientas solo a DESA (`oradesa`). La API no arranca si el servidor no coincide (`DB_HOST_ESPERADO`). |
| **No modificar tablas `GATEC_*`** salvo catálogos | El VB6 viejo sigue en uso en paralelo. |
| **Login** | Usuario del GATEC + contraseña de su usuario de Oracle (no se guarda ninguna). Bloqueo propio tras 2 fallos (15 min) para no bloquear cuentas Oracle. |
| **Permisos** | Como el GATEC: 1 total, 2 sin acceso, 3 parcial; directo pisa a grupos; entre grupos manda el mínimo. |
| **`Db_Select` permitido** | Una sola sentencia `SELECT`, transacción de solo lectura, 30 s. Implementado, sin comprobar su valor (necesita un día con molienda). |
| **Fórmula 5533** | Se deja como está hasta hablar con un usuario del GATEC. |
| **Margen de diferencia con el VB6** | Se acepta por ahora (ver 4). `GetAlcoolDorna` queda con el margen. |
| **Validación con laboratorio** | Postergada por el usuario. |
| **Lo vacío en DESA no se recrea** | Módulo 91, correo, SMS, Fermentec, recordes, Pré-Colheita, Impurezas, Rastreabilidad. Hay que confirmar con un usuario de GATEC que no se usan en producción. |
| **Sin librerías nuevas de UI**, solo React 18 / Tailwind 3; sin modo oscuro | `docs/ui-sistema-visual.md` |

## 4. Calidad del motor de fórmulas (GPI)

Comparado contra lo que calculó el VB6 (`node tools/gpi-validar-formulas.js <desde> <hasta>`):

| Período | Celdas | Resultado del día | Variables 100 % correctas |
|---|---|---|---|
| 1–20/10/2026 | **99,63 %** | 99,32 % | 1.107 / 1.128 |
| otros 3 períodos (2025 y 2026) | 99,4–99,6 % | 98,3–98,9 % | — |

Resuelto en esta etapa: funciones de Material en proceso (`GetMassaBrix` y `GetMassaPol` exactas en 15/15 días; `GetAlcoolDorna` 12/15) y **acumulados incrementales**
(`ACUM(D) = ACUM(D−1) ⊕ día D`, 100 % en media simple y suma, 99,6 % en ponderada). Detalle en `docs/analisis/gpi-motor-formulas.md` y `gpi-cierre.md`.

**Sin contrastar contra el GATEC viejo** (no hay resultados guardados): CEP, correlación, Informes (columnas de período), Boletines (día + acumulado) y Real x Metas (quincena y mes).

## 5. Por qué la escritura sigue bloqueada

| Bloqueo | Qué falta |
|---|---|
| Convivencia con el VB6 | Definir cómo no pisarse (candado `GI_LAB_CONTROLA_FECHAMENTO`, acumulados incrementales, un solo cierre por día) |
| Motor | Tanques de jugo en `GetAlcoolDorna`, fórmula 5533, residuos de acumulados tipo 2 (15 casos) y 5 (4–8 %), acumulados de zafra anterior y mensuales, `GetAcumulado*` |
| Cierre | Reproducir un cierre completo en DESA y compararlo fila a fila; validaciones previas (tablas vacías en DESA) |
| Digitación de sonda | Factores de Pol y AR (`GA_FATOR_POL`, `GA_FATOR_AR`) que **no existen en DESA**; lectura del aparato serial |
| Confirmación | Hablar con laboratorio y con un usuario del GATEC (postergado) |

## 6. Hallazgos que conviene recordar

- **Los acumulados son incrementales**: recalcular la zafra entera da 3–9 % de diferencia (las correcciones a días ya cerrados no se reflejan en lo guardado).
- **Acoplados**: casi nunca tienen análisis de sonda propio; desde 2024 solo ~60 % de los camiones tiene resultado (en 2022, 99 %).
- **DESA se recarga a diario** desde producción: lo creado a mano se pierde (la tabla propia `LAB_APP_AUTH` se recrea en el arranque).
- **Metas**: DESA no tiene metas de la zafra 2026 (sí de 2020, 2024 y 2025).
- **Cliente Oracle 12.1**: `callTimeout` no está disponible (se usa `break()` con temporizador).
- **`COD_ACUMULADO` agrupa pesadas y análisis** (lotes de un cañero/parcela/día): no hay un análisis por camión. Y la caña de balanza **no coincide** con la «caña ingresada» digitada del GPI (2,5–22 %, en ambos sentidos).
- Las tablas agrícolas existen con sufijo `_2` en DESA (`GA_DIVI4_2` 68 mil filas, `GA_VAR_CONTAINER_2` 44 mil); el VB6 las llama sin el sufijo.
- El GATEC tiene **dos generaciones de formularios** para algunas pantallas (CEP, correlación, informes): la API acepta el mayor permiso de cualquiera.

## 7. Herramientas (`tools/`, solo lectura contra DESA)

| Comando (desde la raíz) | Para qué |
|---|---|
| `node tools/gpi-validar-formulas.js <desde> <hasta>` | Valida el motor contra los valores del VB6 |
| `node tools/gpi-analizar-acumulados.js <fecha>` / `gpi-probar-acum-incremental.js <desde> <hasta>` | Reglas de acumulados |
| `node tools/gpi-analizar-media-dia.js`, `gpi-analizar-faltantes.js`, `gpi-probar-funcion.js <idVar>` | Análisis del motor |
| `node tools/gpi-probar-material.js <desde> <hasta>` | Deducción de las funciones de Material en proceso |
| `node tools/gpi-probar-dbselect.js <fecha>` | Prueba de `Db_Select` |
| `node api/src/modules/gpi/estadistica.test.js` | Casos de manual de CEP y correlación |
| `cd web && npm run build` | Compila el front (TypeScript estricto) |
| `tools/export-db.js` | Exporta PL/SQL y catálogo a `db/` |

## 8. Próximos pasos propuestos

1. Preguntas abiertas: de dónde sale la caña digitada del GPI, si se usa `Bal0015`, y si la administración con escritura debe vivir en esta app.
2. Con los 10 sprints relevados, el trabajo que queda es **de escritura** (ver 5) y de **validación** con usuarios del GATEC.
3. Hablar con **laboratorio y un usuario del GATEC**: confirmar lo que está vacío, validar las pantallas sin contraste y decidir cómo convive la escritura con el VB6.
4. Recién entonces: digitación GPI y de sonda, y cierre.

Relevamientos: `docs/analisis/lab-sprint8-relevamiento.md` (Sprint 8 y adelanto de 9 y 10).
**Revisión completa y plan de sprints 11 en adelante:** `docs/revision-completa-y-plan.md`.
**Validación con usuarios:** `docs/validacion-con-usuarios.md` (checklist con valores esperados y las preguntas abiertas que destraban la escritura).
