# Roadmap — lab-app (reescritura de GATEC)

Reescritura del sistema GATEC (VB6, fuente perdida) como app web, misma base Oracle,
mismas funcionalidades. Contexto en `README.md`, cómo correrlo en `CLAUDE.md`.

Un sprint ≈ 2 semanas. Los tamaños son formularios reales por módulo
(`GATEC_AGR.GAM_MODULOS_FORMS`) y por ejecutable (`docs/inventario/INVENTARIO.md`).

## Estado

- ✅ **Fase 0 — Inventario:** los **9 ejecutables** (GPI, Lab, Senha, Menu + los 5 chicos ASPack,
  volcados en ejecución) + PL/SQL y catálogo de la base. Detalle en `docs/inventario/INVENTARIO.md`.
- ✅ **Fase 1 — Base + login:** API + front, usuarios de `GAM_USUARIOS`, contraseñas bcrypt propias
  con reseteo en el primer ingreso, permisos efectivos por formulario, menú por módulo.
- 🟡 **Fase 2 — Módulos** (este roadmap):
  - ✅ **Sprint 1** — Tablas maestras (mód. 15): 14 pantallas + Tipos de Embalagem (mód. 91).
    Ver `docs/analisis/mapeo-tablas-maestras.md`.
  - ✅ **Sprint 2** — Básico / Agrícola (mód. 1): 30 tablas sobre el CRUD genérico (incluye `frmParam`).
    Ver `docs/analisis/mapeo-modulo-1.md`.
  - ✅ Validación técnica de ambos (mapeo por FKs/SQL, permisos, fidelidad de datos ida y vuelta):
    `docs/analisis/validacion-sprints-1-2.md`. Sus forms no están en los exe, así que no hay pantalla VB6 para
    comparar; ⏳ queda una checklist corta para un usuario del sistema viejo.
  - 🟡 **Sprint 3** — GPI · Carga diaria y variables (en curso):
    - ✅ Tablas del GPI (unidades, constantes, metodologías, ME alcohol, densidad Brix, tablas genéricas, granulometría)
      sobre el CRUD genérico, esquema `GATEC_GPI_NEW`.
    - ✅ Lançamento diário **en consulta**: árbol de análisis con accesos por usuario, grilla del día (horas/bateladas
      y resultado del día). Modelo en `docs/analisis/gpi-modelo.md`.
    - 🟡 Motor de fórmulas reescrito y validado contra el VB6 en 4 períodos (2025 y 2026): **99,4–99,6% de las
      celdas**, ~98,3–98,9% del resultado del día. Regla de faltantes resuelta (era el historial de fórmulas).
      Material en proceso hecho (Brix/Pol exactos; alcohol en dornas parcial) y `Db_Select` implementado (permitido). Pendientes en
      `docs/analisis/gpi-motor-formulas.md`: tanques de jugo en `GetAlcoolDorna`, fórmula 5533, acumulados y cierre.
    - ✅ Pantalla de consulta alineada con el GPI viejo (Ordem, filas calculadas en amarillo, navegación de fecha, día actual de digitación).
    - ⬜ Digitación (escritura) + recálculo — se habilita cuando el motor cierre los pendientes.
  - 🟡 **Sprint 4** — GPI · cierre, paradas, material en proceso (en curso):
    - ✅ 18 pantallas: paradas (grupo/local/motivo + historial de estado), reducción de moagem, materiales, tanques, productos;
      lançamentos y configuración de materiales en **solo consulta**. Mapeo en `docs/analisis/gpi-cierre.md`.
    - ✅ Análisis del cierre diario y de los **acumulados** (reglas por tipo de media, 92–100%): `docs/analisis/gpi-cierre.md`.
    - ⬜ Cierre (escritura), digitación de material en proceso (375 mil filas), validación del cierre.
    - ⬜ ABM de análisis/variables/fórmulas (`frmBolManut`, `frmVariavel`, `frmFormulas`).
  - 🟡 **Sprint 5** — GPI · consultas y supervisorio (en curso):
    - ✅ Valores de variables (diario/acumulado, gráfico, consultas guardadas, CSV) y Supervisorio (un gráfico por variable con límites). Ver `docs/analisis/gpi-consultas-supervisorio.md`.
    - ✅ Panel de información, CEP (carta X̄–R, Cp/Cpk) y correlación (Pearson) en solo consulta. Ver el mismo documento. No validados contra el GATEC (sin datos guardados).
    - ⬜ Reglas de diagnóstico del panel y configuración del panel (escritura).
  - 🟡 **Sprint 6** — GPI · reportes, metas, correo/SMS, Fermentec (en curso). Detalle y datos por área en `docs/analisis/gpi-sprint6-reportes.md`:
    - ✅ Informes configurables (30 informes, grilla variables × días, CSV).
    - ✅ Boletines (resumen del día y acumulado) y *Real x Metas* (diario, quincenal, mensual, acumulado) en solo consulta. Sin contrastar con el GATEC.
    - ⬜ Carga de metas (escritura) y meta semanal.
    - ⏸ Correo, SMS, Fermentec, recordes, diagnóstico: tablas vacías en DESA; no se recrean sin confirmar uso en producción.
  - 🟡 **Sprint 7** — Laboratorio de recepción / Pré y Pós-Colheita (en curso). Detalle en `docs/analisis/lab-sprint7-sonda.md`:
    - ✅ Análisis de caña (sonda): 884 mil análisis, búsqueda, resumen del período y detalle, en solo consulta. Motivos de cancelación (CRUD genérico).
    - ⏸ Pré-Colheita e Impurezas: tablas vacías en DESA, no se recrean. Aparato serial y código de barras: hardware local.
    - ⬜ Digitación de análisis de sonda (escritura en tabla compartida con el VB6).
  - 🟡 **Sprint 9** — Pre-Zafra, Config, Otros, Traducciones, Balanza (relevado). Ver `docs/analisis/sprint9-balanza-config.md`:
    - ✅ Entrada de caña (balanza ↔ análisis por acumulado) en solo consulta.
    - ⏸ Módulos 70, 307, 338 y 10: menús y contenedores de lo ya cubierto; traductor del VB6 no aplica; `Bal0015` (calidad por división agrícola) no se recrea (SQL de origen irrecuperable, sin referencia).
  - 🟡 **Sprint 10** — Administración (`GAtec_Senha`) y cubos, solo consulta. Ver `docs/analisis/sprint10-administracion.md`:
    - ✅ Usuarios, grupos, permisos efectivos, permisos por pantalla, historial de cambios y conexiones (sin contraseñas ni datos personales). Solo administradores o acceso total a «Controle de Accesos».
    - ⏸ Alta/baja/edición de usuarios, contraseñas y permisos (escritura de alto riesgo), cubos agrícolas (tablas vacías), infraestructura del VB6.
  - 🧭 **Plan posterior a la revisión completa (26/10/2026)** — hallazgos y detalle en `docs/revision-completa-y-plan.md`:
    - ✅ **Sprint 11** — Seguridad y estabilidad de la API (hecho el 26/10/2026, 6 commits, 40 pruebas automáticas con `npm test`): error de base que tiraba la API, maestras sin filtro de empresa/zafra al editar, condición de carrera en el bloqueo del login, errores que filtraban mensajes de Oracle, secreto JWT débil, validación de entradas, Express actualizado. Pendiente de este sprint: consultar si el GATEC restringe usuarios por empresa (A11), usuario de base de solo lectura (T4, DBA), reintento del bootstrap y 5 avisos de `npm audit` del front que pasan al Sprint 14. Detalle en `docs/revision-completa-y-plan.md`.
    - ✅ **Sprint 12** — Sesión y consistencia del frontend (hecho el 28/10/2026, 4 commits): sesión vencida (401), reinicio y error visible al cambiar de zafra, caché limpia entre usuarios, guarda de rutas por permiso, «Consultar» que refresca, URLs y CSV seguros, modal accesible, contraste y resumen del gráfico. Verificado en navegador: `node tools/e2e/sprint12.js` (31 comprobaciones) y `node tools/e2e/humo.js` (12 pantallas); `cd web && npm test` (10 pruebas). Pendiente: F11 (redibujado de gráficos), debounce y code-splitting pasan al Sprint 14.
    - 🟡 **Sprint 13** (en curso, 28/10/2026: glosario, catálogos, capa de traducción de títulos de la base, formato es-PY y controles `tools/verificar-idioma.js` / `tools/verificar-titulos.js` hechos; falta confirmar términos con un usuario del GATEC y revisar los mensajes restantes) — **Idioma: toda la interfaz en español** (55 de 72 títulos de catálogos y 113 títulos de pantallas de la base en portugués; glosario, capa de traducción sin tocar la base, formato es-PY y control automático).
    - ✅ **Sprint 14** — Rendimiento y deuda técnica (28/10/2026, 3 commits): `/maestras` 1,5 s → 0,07 s, `/entrada-cana` 2,9 s → 0,19 s, arranque del front 361 → 262 kB, buscadores con retardo, utilidades compartidas. Pendiente: virtualización (F21), F26-F28 y los avisos de `npm audit`. Detalle y tabla en `docs/revision-completa-y-plan.md`.
    - ✅ **Sprint 14b** — Tema visual AZPA (28/10/2026): marca en azul `#1A3A8F` con los mismos nombres de token, estados buenos en verde, Inter y Space Grotesk autoalojadas, contrastes recalculados (foco corregido). Detalle en `docs/revision-completa-y-plan.md`.
    - ✅ **Sprint 15** — Calidad: pruebas, CI y despliegue (28/10/2026): ESLint, `npm run ci` verde desde un clon limpio (78 pruebas), CI de GitHub Actions listo (falta el remoto), la API sirve el front compilado con `/api/ready` y registro JSON, `tools/e2e/run-all.js`, `docs/despliegue.md`. Pendiente: Prettier (a decidir), probar el CI en un remoto y T4.
    - ✅ **Sprint 16** — Endurecimiento del motor (28/10/2026, 4 commits): `Db_Select` con lista blanca y parámetros (batería de ~100 entradas hostiles), errores y límites controlados, AND/OR trivalente, dependencias y ciclos, texto guardado exacto (`aTextoGuardado`), validación exacta (octubre 99,63 % / 99,32 %). Supuestos en `docs/analisis/gpi-motor-supuestos.md`. Pendiente: T4 (DBA), `Round()` de VB6 (M7) y confirmar supuestos con un usuario.
    - 🟡 **Sprint 17** — Validación con usuarios y cierre de pendientes del motor. **Material preparado (28/10/2026):** guion de la sesión (`docs/sesion-validacion-sprint17.md`), checklist actualizado con 9 preguntas de decisión y 41 valores esperados re-verificados contra DESA (`tools/verificar-valores-esperados.js`). Falta realizar la sesión con el usuario del GATEC y el laboratorio.
    - 🟡 **Sprint 18** — Edición de la **Digitación diaria** (28/10/2026): base de escritura (interruptores apagados por defecto, transacciones, auditoría, concurrencia optimista) y edición con doble clic, probada en DESA (124 pruebas de API, 19 comprobaciones reales y 17 de navegador). No recalcula calculadas ni acumulados y no se enciende en producción hasta la sesión del Sprint 17. Ver `docs/analisis/gpi-digitacion-escritura.md`.
    - ⬜ **Sprint 19+** — Escritura (digitación GPI, cierre, sonda, metas, administración), con interruptores apagados por defecto.
  - 📋 **Validación con usuarios del GATEC**: checklist con valores esperados y preguntas abiertas en `docs/validacion-con-usuarios.md`.
  - ⏸ **Sprint 8** — Laboratorio (`GAtec_Lab`, 77 formularios): relevado, **absorbido por el Sprint 7** (23 de Pré-Colheita, 21 de Impurezas y 2 de Rastreabilidad sin datos en DESA; 14 de hardware e infraestructura VB6; el resto ya hecho o es escritura). Ver `docs/analisis/lab-sprint8-relevamiento.md`, que adelanta también el relevamiento de los Sprints 9 y 10.

### Los 5 exe chicos (ya inventariados)

| Exe | Forms | Qué es | Dónde entra |
|---|---|---|---|
| `GAtec_Lat` | 24 | Laboratorio de recepción: análisis de sonda, pre-análisis, lectura de aparato serial, código de barras | Sprint 7 (con Pre-Cosecha) |
| `GAtec_TRA` | 11 | Mantenimiento de traducciones (i18n), import/export | Sprint 9 |
| `Bal0015` | 11 | Balanza / reporte de acumulado | Sprint 9 |
| `gatec_cuboaco` (+`_semATR`) | 15 | Cubo agrícola OLAP (variantes con/sin ATR) | Sprint 10 (con el cubo) |

## Backlog por sprint

| Sprint | Área (módulo GATEC) | Forms | Notas |
|---|---|---|---|
| 1 | Tablas maestras (mód. **15** + **91**) | 32 | Fundos, variedades, clientes, productos, unidades. Base de todo lo operativo |
| 2 | Básico / Agrícola (mód. **1**) | 33 | Funcionarios, turnos, liberación, centros de costo, transbordo |
| 3 | GPI · Carga diaria y variables (mód. **90**, p.1) | ~40 | Entrada diaria, lanzamientos, variables, fórmulas — el núcleo |
| 4 | GPI · Cierre, paradas, material en proceso (mód. **90**, p.2) | ~35 | Fechamento diario, paradas, material procesado |
| 5 | GPI · Painel, cockpit, CEP, gráficos (mód. **90**, p.3) | ~35 | Tableros, control estadístico, gráficos de supervisión |
| 6 | GPI · Reportes, metas, correo/SMS, Fermentec (mód. **90**, p.4) | ~38 | 67 reportes ActiveReports, metas, integración Fermentec |
| 7 | Pre-Cosecha (mód. **6**) + Lab. recepción (`GAtec_Lat`) | 37 + 24 | Pre-análisis, prova em branco, rastreabilidad, AR, análisis de sonda y aparato serial |
| 8 | Laboratorio (`GAtec_Lab`) | 77 | Ejecutable propio; grande — puede necesitar un sprint 8-bis |
| 9 | Pre-Zafra (**70**) + Config (**307**) + Otros (**338**,**10**) + Traducciones (`GAtec_TRA`) + Balanza (`Bal0015`) | 17 + 11 + 11 | Módulos y utilitarios chicos, agrupados |
| 10 | Administración (`GAtec_Senha`): ABM usuarios/grupos/permisos + Cubo genérico + Cubo agrícola (`cuboaco`) | 32 + 15 | El login ya reusa sus tablas; falta la UI de administración y los cubos de datos |

**~10 sprints**, todos dimensionados. El módulo 90 (GPI) son 4 sprints (3→6).

## Criterios del orden

1. **Dependencias primero:** las tablas maestras (sprint 1) y lo básico/agrícola (sprint 2)
   son datos que la carga diaria del GPI necesita para poder probarse.
2. **Mayor uso antes:** el GPI (módulo 90, sprints 3-6) es el corazón del sistema.
3. **Lo transversal al final:** administración y cubo (sprint 10) cuando ya hay módulos que administrar.

**Alternativa "valor primero":** adelantar la carga diaria del GPI (sprint 3) al inicio
y cargar las tablas maestras mínimas sobre la marcha. Más vistoso, algo más de reproceso.

## Definición de "terminado" por sprint

Cada sprint entrega su área **funcionando contra la misma base** y **validada contra el VB6 viejo**:
1. Revisar el detalle en `docs/inventario/<EXE>.md` (pantallas, controles, SQL incrustado).
2. Confirmar tablas/columnas en `db/catalogo/` y reglas de negocio en `db/plsql/`.
3. API: módulo en `api/src/modules/<area>/`; Front: páginas en `web/src/pages/`, protegidas por permiso.
4. Probar lado a lado con el GATEC viejo que el comportamiento coincide.

## Inventario de los 5 exe ASPack (resuelto)

`GAtec_Lat`, `GAtec_TRA`, `Bal0015`, `gatec_cuboaco`, `gatec_cuboaco_semATR` estaban
empacados con ASPack; el desempaquetado por emulación no completaba.

Se resolvió ejecutándolos ~0,3–1 s (se auto-descomprimen en memoria antes del login) y volcando
su memoria con un script PowerShell/.NET (sin instalar nada), sin iniciar sesión. Los volcados quedan
en `docs/inventario/dumps/*.memdump` y se parsean con `tools/vb6_inventory.py`. Ya están
dimensionados y repartidos en los sprints 7, 9 y 10.
