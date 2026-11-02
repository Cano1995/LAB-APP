# Sprint 10 — Administración (`GAtec_Senha`) y cubos, en solo consulta

Relevado y construido el 26/10/2026 contra DESA. **No se escribe ni se modifica nada** (usuarios, grupos, permisos, contraseñas): la administración que escribe queda fuera por riesgo (ver abajo).

## Qué hay (DESA)

| Tabla (`GATEC_AGR`) | Filas | Uso en la app nueva |
|---|---|---|
| `GAM_USUARIOS` | 168 (40 activos, 0 administradores) | ✅ lista y detalle (columnas seguras) |
| `GAM_GRUPOS` / `GAM_GRUPOS_USUARIOS` | 11 / 144 | ✅ grupos y miembros |
| `GAM_USUARIOS_FORM_ACESSOS` / `GAM_GRUPO_FORM_ACESSOS` | 6.611 / 5.111 | ✅ permisos directos y por grupo; «quién tiene acceso a una pantalla» |
| `GAM_USUARIO_FORM_HISTOR` | 15.288 | ✅ últimos cambios de permisos de un usuario |
| `GAM_CONTROLE_LOGON` | 134.614 | ✅ conexiones al sistema viejo (usuario, módulo, equipo, horas) |
| `GAM_SENHA_CONFIG_GERAL` | 1 | ya expuesta en `/auth/politica-senha` (solo reglas, sin credenciales) |
| `GAM_USUARIOS_SENHA_VALIDADE` | 385 | ⛔ no se lee (contiene contraseñas) |
| `GA_CUBO_VARIAVEIS`, cubos agrícolas | 4 / — | ⏸ ver «Cubos» |

## Pantalla `/admin` (4 pestañas)

1. **Usuarios**: buscador y filtro activos/inactivos; detalle con estado (activo, administrador, bloqueado), grupos, **permisos efectivos** (directo, por grupo y efectivo, con opción de ocultar «sin acceso»),
   últimos cambios de permisos (quién y cuándo) y últimas conexiones.
2. **Grupos**: miembros (con estado) y permisos del grupo.
3. **Permisos por pantalla**: se busca una pantalla del GATEC (por nombre o código) y se ve qué grupos y qué usuarios tienen acceso, con su permiso efectivo y su origen (directo o por grupo).
4. **Conexiones**: registro de ingresos al sistema viejo por rango de fechas (por defecto 7 días) y usuario; hasta 500 filas.

Regla del permiso efectivo (la misma del login): el directo del usuario pisa a los de grupo; entre varios grupos manda el código más restrictivo. Código de acceso: **1 total, 2 sin acceso, 3 parcial**.

## Seguridad (decisiones)

- **Quién puede entrar**: los formularios de `GAtec_Senha` **no están registrados** en `GAM_MODULOS_FORMS` (el VB6 solo deja correrlo a administradores). Como en DESA **no hay ningún usuario administrador** (`USE_MASTER`),
  se exige ser administrador **o tener acceso TOTAL a «Controle de Accesos»** (form 9680, módulo 307, concedido hoy a pocos usuarios y grupos). La API responde 403 al resto (verificado con BOT) y el Inicio no muestra el enlace.
  Es una decisión conservadora mía: si se prefiere otro criterio, se cambia en una línea (`admin.routes.js`).
- **Nunca se leen** columnas sensibles: `USE_SENHA`, `USE_SENHA_GDF`, `USE_SENHA_PROVISORIA`, `VAL_SENHA`, `CPF`, correo, observaciones, credenciales de sincronización con el directorio activo.
  Todas las consultas usan **listas de columnas explícitas** (nada de `SELECT *`). Se verificó que ninguna respuesta del servicio contenga claves con `senha`, `password`, `cpf`, `email`, `obs`, `secret` o `hash`
  y que la pantalla no muestre esas palabras.
- La pantalla muestra nombres de equipo y usuario del sistema operativo de las conexiones: son datos de auditoría para administradores.
- Probado sin dar permisos de administrador a ninguna cuenta: BOT confirma el 403; para ver la pantalla se inyectaron en el navegador las respuestas reales del servicio.

## Lo que NO se hizo (y por qué)

| Función del VB6 | Motivo |
|---|---|
| Alta, baja y edición de usuarios; cambio y reseteo de contraseña (`frmIncUsuario`, `frmIncAltSenhas`, `frmSenhas`, `FrmSenhasNew`) | Escribe en tablas compartidas con el VB6 y con el login de esta app (que valida contra el usuario de Oracle). **Alto riesgo**: un error bloquea cuentas |
| Otorgar permisos y copiar derechos entre usuarios/grupos (`frmDireitosAcessos`, `frmCopiarDireitos*`) | Escritura de permisos |
| Matar sesiones y limpiar inactivos (`frmKilledUser`) | Acción sobre sesiones del VB6 |
| Configuración general y licencias (`FrmConfigGeral`), ini (`frmGAtecConfigIni`) | Infraestructura del VB6 / licencia |
| **Cubos** (`frmCadCubo*`, `frmCuboAcesso`, `frmCuboLogBD` y los exes `gatec_cuboaco`, `gatec_cuboaco_semATR`) | Cubos OLAP sobre el módulo agrícola: dependen de `GA_ESTIM_DIVI4_ATIVA` y `GA_AREA_LIBER`, **vacías en DESA**; `GA_CUBO_VARIAVEIS` solo tiene 4 filas. Sin datos para construir ni validar |
| Splash, error, impresión, ayuda (`frmGASplash`, `frmGAtecTrataErro`, `frmGAtecPrinter`, …) | Infraestructura del VB6 |

## Observaciones
- Hay 168 usuarios y solo 40 activos; **ninguno es administrador (`USE_MASTER`)**: confirma por qué no pudimos probar nunca con un administrador y por qué el criterio de acceso no puede ser solo «master».
- Muchos permisos aparecen como **«sin acceso» (código 2)** explícito (por ejemplo, 469 filas efectivas para BOT, la mayoría sin acceso): el GATEC vuelve explícitas las negaciones. Por eso la pantalla las oculta por defecto.
- Pendiente de decidir con el equipo: **si la administración con escritura debe vivir en esta app** o seguir en `GAtec_Senha` hasta retirar el VB6.
