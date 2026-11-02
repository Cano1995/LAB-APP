# Despliegue, arranque y recuperación

Una sola aplicación Node sirve la API y el front compilado: **un proceso, un puerto, un origen** (sin CORS ni proxy).

## Requisitos del servidor

- Node 24 (el mismo con el que se prueba).
- Cliente Oracle **12.1** instalado (la API usa `oracledb` en modo *thick*) y acceso de red a la base.
- Acceso a la base **DESA** mientras la app esté en etapa de validación. **Nunca producción** (`10.213.52.70`): la API verifica el servidor al arrancar (`DB_HOST_ESPERADO`) y no inicia si no coincide.

## Instalar y compilar

```
npm ci                       # raíz (ESLint)
npm ci --prefix api
npm ci --prefix web
npm run build                # genera web/dist
```

## Variables de entorno (`api/.env`, ver `api/.env.example`)

| Variable | Obligatoria | Para qué |
|---|---|---|
| `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING` | sí | cuenta de servicio y conexión a Oracle |
| `JWT_SECRET` | sí | firma de las sesiones: mínimo 32 caracteres, aleatorio, distinto en cada entorno (la API **no arranca** con uno corto ni con el de ejemplo) |
| `DB_HOST_ESPERADO` | no (`oradesa`) | servidor de base que se acepta |
| `ORACLE_CLIENT_LIB_DIR` | según el servidor | carpeta del cliente Oracle |
| `APP_SCHEMA` | no (= `DB_USER`) | esquema donde se crea la tabla propia `LAB_APP_AUTH` |
| `GATEC_SCHEMA` | no (`GATEC_AGR`) | esquema del núcleo GATEC |
| `PORT` | no (`3101`) | puerto |
| `JWT_EXPIRES` | no (`8h`) | duración de la sesión |
| `CORS_ORIGIN` | no | orígenes de navegador permitidos (lista con comas). Con el front servido por la misma API no hace falta |
| `FRONT_DIR` | no (`web/dist`) | carpeta del front compilado; vacía = no servir el front |
| `ESCRITURA_GPI_DIGITACION` | no (apagada) | `1` habilita la edición de la Digitación diaria (solo con acceso total, en días abiertos). Solo funciona contra DESA |
| `ESCRITURA_EN_PRODUCCION` | no (apagada) | `1` permite encender las funciones de edición contra una base que no es DESA. **No usar** sin una decisión explícita y la validación del Sprint 17 |

## Arrancar

```
cd api && npm start          # node src/server.js
```

Abrir `http://<servidor>:3101`. Para dejarlo supervisado (reinicio automático al caerse), usar el supervisor del servidor (Servicio de Windows con NSSM, `pm2`, systemd…); la API se cierra ordenadamente con `SIGINT`/`SIGTERM` (espera los pedidos en curso hasta 10 s y cierra el pool).

## Comprobar que está sano

| Dirección | Significa |
|---|---|
| `GET /api/health` | el proceso vive (no mira la base) |
| `GET /api/ready` | además la base responde (200) o no (503): es lo que debe mirar un balanceador o un supervisor |

Registro: una línea JSON por pedido en la salida estándar (`t`, `nivel`, `metodo`, `ruta` sin consulta, `estado`, `ms`, `usuario`); nunca guarda cuerpos ni credenciales. Los errores internos del servidor van a la salida de error con el detalle (el cliente solo recibe «Error interno»). Redirigir ambas a un archivo con rotación o al recolector del servidor.

## Prueba de humo después de desplegar

Con la API corriendo y Microsoft Edge instalado:

```
node tools/e2e/run-all.js --base http://localhost:3101
```

Recorre las pantallas con datos reales de DESA y verifica sesión, permisos, buscadores y gráficos.

## Recuperación

| Síntoma | Qué mirar |
|---|---|
| La API no inicia: «JWT_SECRET debe tener…» | el secreto del `.env` es corto o es el de ejemplo |
| La API no inicia: servidor de base no esperado | `DB_CONNECT_STRING` apunta a otro servidor que el de `DB_HOST_ESPERADO` (¡puede ser producción!) |
| `/api/ready` da 503 | la base no responde o venció la cuenta de servicio; ver la salida de error |
| Todos los ingresos fallan con «Espere…» | tope de intentos de login (2 fallos → 15 min); las cuentas de Oracle bloquean con 3. Ver `CLAUDE.md` («Protección de cuentas Oracle») |
| La tabla `LAB_APP_AUTH` no existe | DESA se recarga cada noche: la API la vuelve a crear al arrancar (reiniciar el proceso) |
| Pantalla en blanco tras un despliegue | caché del navegador: `index.html` no se guarda en caché y los archivos de `assets/` llevan hash; recargar con Ctrl+F5 |

## Pendientes conocidos

- El límite de pedidos y el bloqueo por intentos viven en la memoria del proceso: con **varios procesos** habría que moverlos a la base o a un proxy.
- Usuario de base de solo lectura para la API (T4, requiere un DBA).
- HTTPS: si no hay un proxy delante, la sesión viaja en claro dentro de la red; conviene publicar detrás de un proxy con TLS.
