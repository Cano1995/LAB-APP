# Base de datos de lab-app: objetos a crear y objetos requeridos

lab-app trabaja sobre una base **Oracle** (cliente *thick*, `oracledb` 5.5). La base tiene dos tipos de objetos:

| Tipo | Quién los crea | Qué hace lab-app con ellos |
|------|----------------|----------------------------|
| **A. Tablas propias de la app** (`LAB_APP_*`) | lab-app, al arrancar (bootstrap) o con los scripts de `api/sql/` | Lee y escribe |
| **B. Esquemas del sistema GATEC** (`GATEC_AGR`, `GATEC_GPI_NEW`, …) | Ya existen en la base de la empresa; **no se crean desde aquí** | Lee casi todo; escribe solo donde se indica |

> lab-app **no incluye** las tablas del GATEC: son la base del sistema de gestión azucarero ya instalado. Un despliegue en otra empresa necesita ese mismo modelo (ver sección B), o adaptar los módulos `api/src/modules/*` a su propio esquema. Lo genérico de este proyecto es la **marca** (nombre, logos, iconos), la autenticación, la auditoría, las notificaciones y la administración.

---

## A. Objetos que hay que crear (esquema de la app)

Se crean en el esquema indicado por `APP_SCHEMA` (por defecto, el mismo usuario `DB_USER`). Hay dos formas, ambas idempotentes (se pueden repetir sin dañar nada):

1. **Automática:** al iniciar, la API ejecuta `api/src/lib/bootstrap.js` y crea lo que falte. Requiere que el usuario de la API tenga `CREATE TABLE` e `CREATE INDEX`.
2. **Manual (DBA):** ejecutar, en orden y conectado como dueño del esquema, los scripts `api/sql/001_app_auth.sql` … `004_app_config.sql`.

Resumen:

| # | Objeto | Tipo | Script | Para qué sirve |
|---|--------|------|--------|----------------|
| 1 | `LAB_APP_AUTH` | tabla | `001_app_auth.sql` | Credenciales propias (hash bcrypt), bloqueos y última empresa/zafra elegida |
| 2 | `LAB_APP_AUDIT` | tabla + índice `IX_LAB_APP_AUDIT_FECHA` | `002_app_audit.sql` | Auditoría de toda escritura de la app |
| 3 | `LAB_APP_NOTIF` | tabla + índice `IX_LAB_APP_NOTIF_USU` | `003_app_notif.sql` | Bandeja de notificaciones por usuario |
| 4 | `LAB_APP_CONFIG` | tabla | `004_app_config.sql` | **Configuración de marca (textos)**: nombre, empresa, lema… |
| 5 | `LAB_APP_ASSET` | tabla (con `BLOB`) | `004_app_config.sql` | **Configuración de marca (imágenes)**: logos, emblema, favicon |

No hay vistas, secuencias, paquetes ni triggers propios: las columnas `ID` usan `GENERATED ALWAYS AS IDENTITY` (Oracle 12c o superior).

### A.1 `LAB_APP_AUTH`

Una fila por usuario del GATEC que ya ingresó a lab-app. **No se modifica `GAM_USUARIOS`** (la comparte el sistema viejo). Enlaza por `ID_USUARIO`.

| Columna | Tipo | Nulo | Descripción |
|---------|------|------|-------------|
| `ID_USUARIO` | `NUMBER(5)` | no | PK. Es `GAM_USUARIOS.ID_USUARIO` |
| `SENHA_HASH` | `VARCHAR2(100)` | sí | bcrypt. `NULL` = aún no definió clave nueva |
| `REQUIERE_RESET` | `NUMBER(1)` | no, def. 1 | 1 = debe cambiar la clave en el próximo ingreso |
| `INTENTOS_FALLIDOS` | `NUMBER(3)` | no, def. 0 | Contador de intentos fallidos consecutivos |
| `BLOQUEADO` | `NUMBER(1)` | no, def. 0 | 1 = cuenta bloqueada |
| `ULTIMO_LOGIN` | `DATE` | sí | |
| `SEL_COD_EMPR` | `NUMBER(2)` | sí | Última empresa elegida |
| `SEL_SAF_ANO_SAFRA` | `NUMBER(4)` | sí | Última zafra elegida |
| `BLOQ_HASTA` | `DATE` | sí | Espera tras intentos fallidos |
| `FECHA_ACTUALIZ` | `DATE` | no, def. `SYSDATE` | |

```sql
CREATE TABLE LAB_APP_AUTH (
  ID_USUARIO         NUMBER(5)    NOT NULL,
  SENHA_HASH         VARCHAR2(100),
  REQUIERE_RESET     NUMBER(1)    DEFAULT 1 NOT NULL,
  INTENTOS_FALLIDOS  NUMBER(3)    DEFAULT 0 NOT NULL,
  BLOQUEADO          NUMBER(1)    DEFAULT 0 NOT NULL,
  ULTIMO_LOGIN       DATE,
  SEL_COD_EMPR       NUMBER(2),
  SEL_SAF_ANO_SAFRA  NUMBER(4),
  BLOQ_HASTA         DATE,
  FECHA_ACTUALIZ     DATE         DEFAULT SYSDATE NOT NULL,
  CONSTRAINT PK_LAB_APP_AUTH PRIMARY KEY (ID_USUARIO)
);
```

### A.2 `LAB_APP_AUDIT`

Una fila por cambio, grabada en **la misma transacción** que el cambio (si se revierte, el registro también). Hoy la usan la Digitación diaria y la configuración de marca.

```sql
CREATE TABLE LAB_APP_AUDIT (
  ID          NUMBER GENERATED ALWAYS AS IDENTITY,
  FECHA       TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  ID_USUARIO  NUMBER(5)     NOT NULL,
  USUARIO     VARCHAR2(40)  NOT NULL,
  ACCION      VARCHAR2(30)  NOT NULL,   -- insertar | actualizar | eliminar | config …
  TABLA       VARCHAR2(60)  NOT NULL,
  CLAVE       VARCHAR2(200) NOT NULL,
  ANTES       VARCHAR2(200),
  DESPUES     VARCHAR2(200),
  CONTEXTO    VARCHAR2(200),
  CONSTRAINT PK_LAB_APP_AUDIT PRIMARY KEY (ID)
);
CREATE INDEX IX_LAB_APP_AUDIT_FECHA ON LAB_APP_AUDIT (FECHA);
```

### A.3 `LAB_APP_NOTIF`

```sql
CREATE TABLE LAB_APP_NOTIF (
  ID           NUMBER GENERATED ALWAYS AS IDENTITY,
  FECHA        TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  ID_USUARIO   NUMBER(5)      NOT NULL,        -- destinatario
  TIPO         VARCHAR2(20)   DEFAULT 'info' NOT NULL,
  TITULO       VARCHAR2(120)  NOT NULL,
  MENSAJE      VARCHAR2(500),
  ENLACE       VARCHAR2(200),                  -- ruta interna de la app
  LEIDA_FECHA  TIMESTAMP,                      -- NULL = pendiente
  CONSTRAINT PK_LAB_APP_NOTIF PRIMARY KEY (ID)
);
CREATE INDEX IX_LAB_APP_NOTIF_USU ON LAB_APP_NOTIF (ID_USUARIO, LEIDA_FECHA);
```

### A.4 `LAB_APP_CONFIG` (configuración de marca: textos)

Clave/valor. Las claves válidas están fijadas en `api/src/modules/configuracion/configuracion.service.js` (`CAMPOS`); una clave que no está en esa lista se rechaza.

| Clave | Largo | Obligatoria | Uso |
|-------|-------|-------------|-----|
| `nombre` | 80 | sí | Título de la pestaña, ingreso y «Acerca de» |
| `nombre_corto` | 30 | sí | Junto al emblema en el menú lateral |
| `empresa` | 120 | no | Razón social / nombre comercial |
| `lema` | 160 | no | Texto alternativo del logo |
| `descripcion` | 400 | no | Texto de «Acerca de» |
| `pais` | 60 | no | |

```sql
CREATE TABLE LAB_APP_CONFIG (
  CLAVE       VARCHAR2(60)   NOT NULL,
  VALOR       VARCHAR2(500),
  ACTUALIZ    DATE           DEFAULT SYSDATE NOT NULL,
  ID_USUARIO  NUMBER(5),                       -- quién la cambió por última vez
  CONSTRAINT PK_LAB_APP_CONFIG PRIMARY KEY (CLAVE)
);
```

### A.5 `LAB_APP_ASSET` (configuración de marca: imágenes)

Claves válidas (`ASSETS` en el mismo servicio):

| Clave | Máx. | Formatos | Uso |
|-------|------|----------|-----|
| `logo_claro` | 1 MB | PNG, JPG, WEBP, SVG | Pantalla de ingreso, tema claro |
| `logo_oscuro` | 1 MB | PNG, JPG, WEBP, SVG | Ingreso, tema oscuro (si falta, se usa el claro) |
| `emblema` | 500 KB | PNG, JPG, WEBP, SVG | Icono junto al nombre en el menú |
| `favicon` | 200 KB | PNG, JPG, WEBP, SVG, ICO | Icono de la pestaña |

```sql
CREATE TABLE LAB_APP_ASSET (
  CLAVE       VARCHAR2(40)   NOT NULL,
  MIME        VARCHAR2(60)   NOT NULL,
  NOMBRE      VARCHAR2(120),                   -- nombre original del archivo
  DATOS       BLOB           NOT NULL,
  TAMANO      NUMBER(10)     NOT NULL,         -- bytes
  ACTUALIZ    DATE           DEFAULT SYSDATE NOT NULL,
  ID_USUARIO  NUMBER(5),
  CONSTRAINT PK_LAB_APP_ASSET PRIMARY KEY (CLAVE)
);
```

### A.6 Privilegios del usuario de la API

```sql
-- Como DBA, para el usuario que usa la API (DB_USER). Si APP_SCHEMA es otro esquema, el usuario necesita además
-- SELECT/INSERT/UPDATE/DELETE sobre sus LAB_APP_*.
GRANT CREATE SESSION, CREATE TABLE TO <DB_USER>;     -- CREATE TABLE solo si se usa el bootstrap automático
GRANT UNLIMITED TABLESPACE TO <DB_USER>;             -- o una cuota en el tablespace (LAB_APP_ASSET guarda imágenes)
```

Más los permisos de la sección B.

---

## B. Objetos requeridos que ya deben existir (sistema GATEC)

El esquema del núcleo se configura con `GATEC_SCHEMA` (por defecto `GATEC_AGR`). **Hoy hay nombres de esquema fijos en el código** (`GATEC_AGR` y `GATEC_GPI_NEW` en `admin.service.js`, `sonda.service.js` y `modules/gpi/*`); si la base de otra empresa los llama distinto hay que ajustarlos o crear sinónimos.

Catálogo completo y exportado de la base de referencia: `db/catalogo/*.json` (tablas y columnas) y `db/plsql/` (funciones, paquetes, vistas y triggers). Se regenera con `node tools/export-db.js`.

### B.1 Núcleo — `GATEC_AGR` (o `GATEC_SCHEMA`)

| Tabla | Acceso | Uso |
|-------|--------|-----|
| `GAM_USUARIOS` | lectura | Usuarios (nunca se leen las columnas de contraseña) |
| `GAM_GRUPOS`, `GAM_GRUPOS_USUARIOS` | lectura | Grupos y pertenencia |
| `GAM_MODULOS_FORMS` | lectura | Catálogo de formularios/pantallas |
| `GAM_USUARIOS_FORM_ACESSOS`, `GAM_GRUPO_FORM_ACESSOS` | lectura | Permisos por usuario y por grupo (1 total, 2 sin acceso, 3 parcial) |
| `GAM_USUARIO_FORM_HISTOR` | lectura | Historial de permisos |
| `GAM_CONTROLE_LOGON` | lectura | Conexiones (pantalla de administración) |
| `GA_EMPR`, `GA_SAFRAS`, `GA_CONFI_EMPR_SAFRA` | lectura (`GA_EMPR`/`GA_SAFRAS` también escritura vía maestras) | Empresas y zafras: selector de contexto |
| `GA_MENU_ARVORE`, `GA_MENU_ARV_EXE`, `GA_MENU_FAVORITO` | lectura | Menú lateral |
| `GA_ANALI_SONDA` | lectura | Sonda (laboratorio) |
| Tablas maestras (ver B.3) | lectura / escritura | ABM genérico |

### B.2 GPI — `GATEC_GPI_NEW`

Lectura, salvo la Digitación diaria y las maestras.

| Objeto | Acceso | Uso |
|--------|--------|-----|
| `GI_LAB_VAR`, `GI_LAB_VAR_STATUS`, `GI_LAB_UNIDADE` | lectura | Variables y unidades |
| `GI_LAB_PLAN_CONF_GERAL` | lectura | Planillas |
| `GI_LAB_LANC_ESPEC`, `GI_LAB_LANC_METAS`, `GI_LAB_LANC_METAS_VAR` | lectura | Especificaciones y metas |
| `GI_LAB_ANOTACOES`, `GI_LAB_RASTREA`, `GI_LAB_CONSULTA` | lectura | Anotaciones, trazabilidad, consultas |
| `GI_LAB_SUPERVISORIO`, `GI_LAB_SUP_VAR` | lectura | Supervisorio |
| `GI_LAB_PAINEL_CONF`, `GI_LAB_PAINEL_VAR`, `GI_LAB_PAINEL_CEP`, `GI_LAB_PAINEL_REL` | lectura | Panel y CEP |
| `GI_LAB_CONF_REL_LINHA`, `GI_LAB_CONF_REL_TIT`, `GI_LAB_REL_RESUMO`, `GI_LAB_REL_RES_ITEM` | lectura | Informes y boletines |
| `GI_LAB_PARAM_USINA` | lectura | Parámetros de la planta y cierre |
| `GA_ANALI_SONDA`, `GA_ANALI_SONDA_PRIMARIA`, `GA_MOTIV_CANCEL_ANA` | lectura | Sonda / análisis |
| `GAS_LAB_ID_LANC` | secuencia (uso: `NEXTVAL`) | Id de cada lanzamiento nuevo |
| **`GI_LAB_LANC_{empresa}_{zafra}`** y **`GI_LAB_LANC_MOV_{empresa}_{zafra}`** | lectura / **escritura** (Digitación diaria) | **Tablas dinámicas**: existe un par por empresa y zafra. La API consulta `all_tables` para saber si existen antes de usarlas |

### B.3 Tablas maestras editables (ABM genérico)

Definidas en `api/src/modules/maestras/recursos.js` (cada recurso indica su esquema: núcleo o `GATEC_GPI_NEW`); las columnas se leen del catálogo de Oracle al arrancar (`initRecursos`), así que siempre reflejan el esquema real. Cada recurso exige el permiso de su formulario. Tablas: `GA_CARAC_CANA_2`, `GA_CARAC_FUNDO`, `GA_CARGOS`, `GA_CENTR_CUSTO`, `GA_CENTR_CUSTO_AGREG`, `GA_CEP_MUNIC`, `GA_CLASSE_FUN`, `GA_CODIG_SERVI`, `GA_COMP_TRANSBORDO`, `GA_CPMIS_CLAS_EQUIP`, `GA_CPMIS_SUBCL_EQUIP`, `GA_CULTU_AGRIC`, `GA_DIVI1_2`…`GA_DIVI4_2`, `GA_EMPR`, `GA_EMPREIT`, `GA_ESTAG_COPER`, `GA_ESTAG_USINA`, `GA_FINALID_COPER`, `GA_FRENTE_EMPREIT`, `GA_FRENT_TRABA`, `GA_FUNCIONARIO`, `GA_FUNC_CCUSTO`, `GA_FUNDO_AGRIC`, `GA_MOTIV_CANCEL_ANA`, `GA_MOTIV_LIBER`, `GA_MUDAN_ESTAG`, `GA_PARAM_EMPR_SAFRA`, `GA_POP_EMBALAGEM`, `GA_PROPRIETARIO`, `GA_SAFRAS`, `GA_SOLOS_COPER`, `GA_TABGR_MOEDA`, `GA_TABGR_PROP_EQUIP`, `GA_TEXTURA_SOLO`, `GA_TIPO_COMPOSICAO`, `GA_TIPO_CORTE_2`, `GA_TIPO_EMPREITEIRO`, `GA_TIPO_FRENTE`, `GA_TURNO_TRABALHO`, `GA_UNIDADE`, `GA_VARIE_COPER`, `GA_VARIE_USINA_2`, y del laboratorio `GI_LAB_CAD_ACUCAR`, `GI_LAB_CAD_MATER_PROCESSO`, `GI_LAB_CAD_MATER_PROCESSO_GEN`, `GI_LAB_CONST`, `GI_LAB_GRUPO_PARADA(_STATUS)`, `GI_LAB_LOCAL_PARADA(_STATUS)`, `GI_LAB_METODO`, `GI_LAB_MOT_PARADA(_STATUS)`, `GI_LAB_PRODUTO_CATEG`, `GI_LAB_REDU_MOAGEM_*`, `GI_LAB_TAB_*`, `GI_LAB_TANQUE_EST`, `GI_LAB_TANQUE_MED`, `GI_LAB_UNIDADE`, `GI_MEQ_MIS`, `GI_MOT_PARADA_LANC`.

### B.4 PL/SQL del GATEC

lab-app **no invoca** procedimientos del GATEC directamente. Las fórmulas de las planillas guardan SQL (`Db_Select`) que el motor ejecuta en un pool de **solo lectura**, y ese SQL puede llamar a funciones `GAF_*` y vistas `GAV_*` del esquema `GATEC_AGR`. Por eso el usuario de la API necesita `EXECUTE` sobre las funciones y `SELECT` sobre las vistas que usen sus fórmulas. Los fuentes exportados están en `db/plsql/` (91 funciones, 9 paquetes `GAPK_*`, 11 procedimientos, 11 triggers y las vistas) como **referencia**: no hace falta recrearlos si la base ya es la del GATEC.

### B.5 Privilegios sobre el GATEC

```sql
-- Lectura de todo lo de B.1 y B.2:
GRANT SELECT ON GATEC_AGR.<tabla> TO <DB_USER>;            -- (o un rol de solo lectura con todas)
GRANT SELECT ON GATEC_GPI_NEW.<tabla> TO <DB_USER>;
GRANT SELECT ON GATEC_GPI_NEW.GAS_LAB_ID_LANC TO <DB_USER>; -- secuencia
-- Escritura (solo si se encienden los interruptores, ver abajo):
GRANT INSERT, UPDATE ON GATEC_GPI_NEW.GI_LAB_LANC_{e}_{z}, GATEC_GPI_NEW.GI_LAB_LANC_MOV_{e}_{z} TO <DB_USER>;
GRANT INSERT, UPDATE, DELETE ON GATEC_AGR.<tabla maestra> TO <DB_USER>;
```

La escritura sobre el GATEC está **apagada por defecto** (`ESCRITURA_GPI_DIGITACION=1` la enciende) y solo funciona contra el servidor declarado en `DB_HOST_ESPERADO`, salvo `ESCRITURA_EN_PRODUCCION=1`. Ver `docs/despliegue.md`.

---

## C. Variables de entorno relacionadas (`api/.env`)

| Variable | Descripción |
|----------|-------------|
| `DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING` | Conexión a Oracle |
| `ORACLE_CLIENT_LIB_DIR` | Carpeta del cliente Oracle (modo thick) |
| `DB_HOST_ESPERADO` | Servidor que se acepta (la API no inicia si no coincide) |
| `APP_SCHEMA` | Esquema de las tablas `LAB_APP_*` (por defecto `DB_USER`) |
| `GATEC_SCHEMA` | Esquema del núcleo GATEC (por defecto `GATEC_AGR`) |
| `APP_NOMBRE`, `APP_NOMBRE_CORTO`, `APP_EMPRESA`, `APP_LEMA`, `APP_DESCRIPCION`, `APP_PAIS` | Valores **por defecto** de la marca, usados mientras no haya nada guardado en `LAB_APP_CONFIG` |

## D. Verificación rápida

```sql
SELECT table_name FROM all_tables
 WHERE owner = UPPER('<APP_SCHEMA>') AND table_name LIKE 'LAB_APP_%' ORDER BY 1;
-- Debe listar: LAB_APP_ASSET, LAB_APP_AUDIT, LAB_APP_AUTH, LAB_APP_CONFIG, LAB_APP_NOTIF
```

## E. Migrar desde una instalación anterior (`azpa-lab`)

Las tablas se llamaban `AZPA_LAB_AUTH`, `AZPA_LAB_AUDIT` y `AZPA_LAB_NOTIF`. Si ya existen datos que se quieren conservar:

```sql
RENAME AZPA_LAB_AUTH  TO LAB_APP_AUTH;
RENAME AZPA_LAB_AUDIT TO LAB_APP_AUDIT;
RENAME AZPA_LAB_NOTIF TO LAB_APP_NOTIF;
-- Las PK y los índices conservan el nombre viejo; es solo cosmético (se pueden renombrar con ALTER INDEX / ALTER TABLE … RENAME CONSTRAINT).
```

Hacerlo antes del primer arranque de lab-app; si no, el bootstrap crea tablas nuevas y vacías (los usuarios tendrán que definir su clave de nuevo).
