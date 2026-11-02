# lab-app

> **Proyecto genérico y configurable.** El nombre de la empresa, los textos, los logos y los iconos se cargan desde
> **Administración → Configuración** (sin recompilar). Sin configurar nada se ve como «Lab App» con logos neutros.
> Objetos de base de datos que hay que crear, y los que ya deben existir: [`docs/base-de-datos.md`](docs/base-de-datos.md).
> Esta copia nace de `azpa-lab`; los documentos de `docs/` describen esa implementación de referencia (empresa AZPA, Paraguay).

Reescritura del sistema **GATEC** (VB6, código fuente perdido) como aplicación web moderna,
manteniendo las mismas funcionalidades y la misma base Oracle.

## Sistema original

- Ejecutables en `C:\Gatec\Gatec` (VB6 compilado a código nativo; no hay fuente).
- Base: Oracle **DESA** (`10.213.52.25`, servidor `oradesa`, servicio `BDTEB`; se refresca a diario desde producción).
  Ojo: producción usa el mismo nombre de servicio `BDTEB` y es a donde apunta el `GAtec.ini` del VB6.
  Esquemas: `GATEC_AGR` (núcleo: usuarios, permisos, cubo, PL/SQL), `GATEC_GPI_NEW`
  y `GATEC_LAB` (proceso industrial / laboratorio; misma estructura), `GATEC_AZPA`.

| Ejecutable | Qué hace |
|---|---|
| `GATEC_MENU` | Lanzador / menú principal |
| `GATEC_GPI` | Gestión de Proceso Industrial: planillas, variables, fórmulas, fechamento diario, paradas, CEP, cockpit/painel, Fermentec, reportes |
| `GAtec_Lab` | Laboratorio |
| `GAtec_Senha` | Usuarios, grupos, permisos por form, cubo de datos |
| `GAtec_Lat`, `GAtec_TRA`, `Bal0015`, `gatec_cuboaco*` | Módulos menores (empaquetados con ASPack, inventario pendiente) |

## Stack del sistema nuevo

Mismo stack que el resto de AZPA, sin tecnologías nuevas:

- **Front:** React + Vite + TypeScript + Tailwind + shadcn/Radix + TanStack Query + Recharts (como `app-coa`).
- **API:** Node + Express + `oracledb` en modo thick (como `api-azpa-movil`).
- **Base:** las mismas tablas `GATEC_*`, sin migrar datos. El VB6 y la web conviven
  mientras se reemplaza módulo por módulo.

## Estructura

```
docs/estado-del-proyecto.md        estado consolidado: hecho, decisiones, hallazgos, bloqueos y herramientas
docs/inventario/INVENTARIO.md   resumen: exe, forms, reportes, controles, SQL, tablas
docs/inventario/<EXE>.md        cada form/reporte/módulo con sus métodos, controles y tablas
docs/inventario/raw/<EXE>.json  extracción completa (incluye todo el SQL incrustado)
db/plsql/<OWNER>/<TIPO>/*.sql   código PL/SQL y vistas de los esquemas GATEC_*
db/catalogo/<OWNER>.json        tablas: columnas, PK, FK, filas
tools/vb6_inventory.py          extractor de inventario desde un exe VB6
tools/export-db.js              exporta PL/SQL y catálogo desde DESA
tools/build-inventory.py        genera los .md del inventario
```

Regenerar:

```
python tools/vb6_inventory.py <exe> docs/inventario/raw/<EXE>.json   # exe desempaquetado
node tools/export-db.js
python tools/build-inventory.py
```

Los UPX se desempaquetan con `upx -d`; los ASPack, con unipacker.

## Plan

0. ✅ **Inventario:** pantallas, SQL y tablas de los 4 exe principales, más el PL/SQL de la base.
   Pendiente: los 5 exe chicos (ASPack; el desempaquetado automático falló — requiere volcado en ejecución).
1. ✅ **Base del proyecto:** API (`api/`) + front (`web/`). El usuario es el login del GATEC (`GAM_USUARIOS`) y la contraseña es la del
   usuario de Oracle del mismo nombre (la app no guarda contraseñas); permisos efectivos por formulario
   (`GAM_USUARIOS_FORM_ACESSOS` ∪ `GAM_GRUPO_FORM_ACESSOS`) y menú agrupado por módulo.
2. ✅ **Catálogos, GPI, laboratorio, balanza y administración en consulta** (sprints 1 a 10), con el motor de fórmulas del GPI validado contra el VB6.
3. ✅ **Revisión completa y endurecimiento** (sprints 11 a 15): seguridad de la API, sesión y consistencia del front, interfaz en español,
   rendimiento, calidad y despliegue. Detalle en `docs/revision-completa-y-plan.md`.
4. ⬜ **Siguiente:** endurecer el motor (16), validar con usuarios del GATEC (17) y recién después habilitar escritura (18 en adelante). Ver `ROADMAP.md`.

## Correrlo

- **Desarrollo:** ver `CLAUDE.md` (API en :3101 y front con recarga en :3100).
- **Producción / servidor:** `npm run build` y `cd api && npm start`: la API sirve el front compilado en un solo puerto. Guía completa, variables de entorno y recuperación en `docs/despliegue.md`.
- **Comprobar todo:** `npm run ci` (lint, idioma, pruebas y compilación; no necesita la base).

Índice de toda la documentación: `docs/README.md`.
