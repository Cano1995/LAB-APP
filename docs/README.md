# Índice de la documentación

| Documento | Para qué sirve |
|---|---|
| [`INVENTARIO-APP.md`](INVENTARIO-APP.md) | inventario único: pantallas, endpoints y objetos de base de datos por pantalla |
| [`base-de-datos.md`](base-de-datos.md) | objetos de base de datos a crear (`LAB_APP_*`) y los requeridos del GATEC, privilegios, marca configurable |
| [`../README.md`](../README.md) | qué es el proyecto, el sistema original y cómo se corre |
| [`../CLAUDE.md`](../CLAUDE.md) | reglas de trabajo, autenticación, permisos, endpoints y convenciones (lo lee el asistente en cada sesión) |
| [`../ROADMAP.md`](../ROADMAP.md) | plan por sprints y estado de cada uno |
| [`estado-del-proyecto.md`](estado-del-proyecto.md) | estado consolidado: qué está hecho, decisiones, hallazgos y bloqueos |
| [`revision-completa-y-plan.md`](revision-completa-y-plan.md) | revisión de código, seguridad y rendimiento (hallazgos A, F, M, T) y plan de los sprints 11 en adelante, con sus resultados |
| [`despliegue.md`](despliegue.md) | instalar, configurar, arrancar, comprobar y recuperar la aplicación |
| [`validacion-con-usuarios.md`](validacion-con-usuarios.md) | lista para validar la app contra el GATEC viejo (valores esperados y preguntas abiertas) |
| [`sesion-validacion-sprint17.md`](sesion-validacion-sprint17.md) | guion de quien conduce la sesión de validación: preparación, agenda, decisiones y hoja de registro |
| [`glosario-es.md`](glosario-es.md) | glosario portugués → español y guía de estilo |
| [`ui-sistema-visual.md`](ui-sistema-visual.md) | paleta, tipografía, componentes y contraste |
| [`lab-app-theme.css`](lab-app-theme.css) | insumo del tema visual AZPA (Sprint 14b) |
| `analisis/` | decisiones y análisis por módulo: mapeo de tablas, modelo del GPI, motor de fórmulas y sus supuestos (`gpi-motor-supuestos.md`), cierre, edición de la digitación (`gpi-digitacion-escritura.md`), laboratorio, balanza, administración |
| `inventario/` | inventario de los ejecutables VB6: pantallas, controles, SQL incrustado y tablas (`INVENTARIO.md` es el índice; `raw/` y `dumps/` son datos crudos) |
| `planificacion/` | calendario de sprints para presentar |

Pruebas y controles (todos desde la raíz):

| Comando | Qué hace |
|---|---|
| `npm run ci` | lo mismo que el CI: lint, control de idioma, pruebas y compilación |
| `npm test` | pruebas de la API (124, sin base de datos) y del front (14) |
| `npm run lint` · `npm run idioma` · `npm run audit` | ESLint, portugués en la interfaz y vulnerabilidades de producción |
| `node tools/verificar-titulos.js` | títulos de la base sin traducir (usa DESA, solo lectura) |
| `node tools/medir-api.js` | tiempos de los endpoints principales |
| `node tools/verificar-valores-esperados.js` | comprueba que los valores del checklist de validación siguen vigentes en DESA |
| `node tools/e2e/run-all.js` | guiones de navegador contra DESA |
| `node tools/gpi-validar-formulas.js <desde> <hasta>` | validación del motor de fórmulas contra lo que calculó el VB6 |
