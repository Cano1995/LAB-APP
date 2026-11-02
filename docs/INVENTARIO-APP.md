# Inventario de lab-app: pantallas, API y objetos de base de datos

Documento de referencia único. Complementa `docs/base-de-datos.md` (DDL, privilegios e instalación). Si se agrega una pantalla, un endpoint o una tabla, **actualizar este archivo**.

Convenciones: `APP` = esquema de la app (`APP_SCHEMA`); `AGR` = núcleo GATEC (`GATEC_SCHEMA`, por defecto `GATEC_AGR`); `GPI` = `GATEC_GPI_NEW`. **R** = lectura, **W** = escritura. Permiso = `idForm` del formulario equivalente en `GAM_MODULOS_FORMS` (varios = vale cualquiera; nivel 1 consulta, 2 edita, 3 elimina/total). Tablas dinámicas: `GI_LAB_{base}_{empresa}[_{zafra}]` en `GPI` (sección 3.3).

---

## 1. Pantallas del front (`web/src/App.tsx`; catálogo de permisos en `web/src/lib/pantallas.ts`)

### 1.1 Generales

| Ruta | Archivo (`web/src/pages/`) | Qué es | Acceso | API | Objetos de BD |
|------|---------|--------|--------|-----|---------------|
| (sin sesión) | `Login.tsx` | Ingreso; muestra logo y nombre configurados | público | `POST /api/auth/login`, `GET /api/branding` | R `AGR.GAM_USUARIOS`, grupos y permisos; R/W `APP.LAB_APP_AUTH`; R `APP.LAB_APP_CONFIG`, `LAB_APP_ASSET`; la contraseña se valida contra Oracle |
| `/` | `Dashboard.tsx` | Inicio: caña recibida y análisis, accesos permitidos y recientes | cualquier usuario | `GET /api/inicio`, `GET /api/contexto/opciones` | R `AGR.GA_ANALI_SONDA`, `GA_EMPR`, `GA_SAFRAS`, `GA_CONFI_EMPR_SAFRA`, permisos |
| `/acerca` | `AcercaPage.tsx` | Wiki de uso y manual PDF; usa nombre y descripción de la marca | cualquier usuario | `GET /api/branding` | R `APP.LAB_APP_CONFIG` |
| `/maestras/:recurso` | `MaestraPage.tsx` | ABM genérico de tablas maestras (sección 3.4) | permiso del recurso; crear nivel 2, eliminar nivel 3 | `/api/maestras/…` | R/W tabla del recurso |

### 1.2 Componentes transversales (no son rutas)

| Componente (`web/src/components/`) | Función | API | Objetos de BD |
|------------|---------|-----|---------------|
| `Sidebar.tsx` | Menú lateral, buscador, marca (emblema + nombre corto) | `GET /api/menu`, `GET /api/maestras` | R `AGR.GA_MENU_ARVORE`, `GA_MENU_ARV_EXE`, `GA_MENU_FAVORITO` |
| `AppHeader.tsx` | Barra superior | — | — |
| `ContextoSelector.tsx` | Elegir empresa y zafra | `GET /api/contexto/opciones`, `POST /api/contexto` | R `GA_EMPR`, `GA_SAFRAS`, `GA_CONFI_EMPR_SAFRA`; W `APP.LAB_APP_AUTH` (`SEL_*`) |
| `NotificationBell.tsx` | Campana de notificaciones | `GET /api/notificaciones`, `POST …/:id/leida`, `POST …/leidas` | R/W `APP.LAB_APP_NOTIF` |
| `TemaToggle.tsx` | Tema claro/oscuro | — (`localStorage`: `lab_app_tema`) | — |
| `BuscadorVariables`, `BarrasDiarias`, `LineChart`, `BarraHerramientas`, `ui.tsx` | Piezas visuales reutilizables | — | — |

### 1.3 GPI (proceso industrial) — grupo `gpi`

Todas requieren el contexto empresa + zafra elegido. Son **solo lectura**, salvo la digitación (escritura solo con `ESCRITURA_GPI_DIGITACION=1`).

| Ruta | Archivo | Pantalla | Permiso (idForm) | Endpoint `/api/gpi/…` | Objetos de BD (GPI) |
|------|---------|----------|------------------|-----------------------|---------------------|
| `/gpi/lancamento` | `GpiLancamentoPage.tsx` | Digitación diaria | 8420 | `arbol`, `planilhas/:id/variaveis`, `planilhas/:id/lancamento` (GET y **PUT**), `planilhas/:id/dias`, `safra` | R `GI_LAB_VAR`, `GI_LAB_VAR_STATUS`, `GI_LAB_UNIDADE`, `GI_LAB_PLAN_CONF_GERAL`, `GI_LAB_PARAM_USINA`, dinámicas `NO_PLAN`, `PLAN_CONF`, `ACESSOS`, `LANC`, `LANC_MOV`, `ACUM`; **W** `LANC`, `LANC_MOV`, secuencia `GAS_LAB_ID_LANC`; **W** `APP.LAB_APP_AUDIT` |
| `/gpi/valores` | `ConsultaValoresPage.tsx` | Valores de variables | 8507 | `variaveis`, `consultas`, `valores` | R `GI_LAB_CONSULTA`, `GI_LAB_VAR`, `GI_LAB_VAR_STATUS`, `GI_LAB_UNIDADE`, `LANC`, `LANC_MOV`, `ACUM`, `NO_PLAN`, `ACESSOS` |
| `/gpi/supervisorio` | `SupervisorioPage.tsx` | Supervisorio | 8524 | `supervisorios`, `supervisorios/:codigo/serie` | R `GI_LAB_SUPERVISORIO`, `GI_LAB_SUP_VAR`, `GI_LAB_VAR`, `LANC`, `LANC_MOV` |
| `/gpi/panel` | `PanelPage.tsx` | Panel de información | 9234 | `panel` | R `GI_LAB_PAINEL_CONF`, `GI_LAB_PAINEL_VAR`, `GI_LAB_PAINEL_CEP`, `GI_LAB_PAINEL_REL`, `GI_LAB_SUPERVISORIO`, `GI_LAB_LANC_ESPEC` |
| `/gpi/cep` | `CepPage.tsx` | Control estadístico (CEP) | 8510, 10149 | `cep`, `variaveis` | R variables, `LANC`, `LANC_MOV`, `GI_LAB_LANC_ESPEC` |
| `/gpi/correlacion` | `CorrelacionPage.tsx` | Correlación | 9995, 10143 | `correlacion`, `variaveis` | R variables, `LANC`, `LANC_MOV` |
| `/gpi/informes` | `InformesPage.tsx` | Informes configurables | 8445, 10050 | `informes`, `informes/:id` | R `GI_LAB_CONF_REL_TIT`, `GI_LAB_CONF_REL_LINHA` + valores |
| `/gpi/boletines` | `BoletinesPage.tsx` | Boletines | 8453 | `boletines`, `boletines/:id` | R `GI_LAB_REL_RESUMO`, `GI_LAB_REL_RES_ITEM` + valores y `ACUM` |
| `/gpi/metas` | `MetasPage.tsx` | Real x Metas | 9984, 10054, 9990 | `metas` | R `GI_LAB_LANC_METAS`, `GI_LAB_LANC_METAS_VAR` + valores |
| `/gpi/listados/variables` | `ListadosGpiPage.tsx` | Listado de variables | 8457 | `listados/variables` | R `GI_LAB_VAR`, `GI_LAB_VAR_STATUS`, `GI_LAB_UNIDADE`, `GI_LAB_LANC_ESPEC`, `NO_PLAN` |
| `/gpi/listados/falta-digitacion` | `ListadosGpiPage.tsx` | Falta de digitación | 8978, 10078 | `listados/falta-digitacion` | R `NO_PLAN`, `LANC`, `LANC_MOV`, variables |
| `/gpi/listados/fuera-especificacion` | `ListadosGpiPage.tsx` | Fuera de especificación | 10126, 10107 | `listados/fuera-especificacion` | R `GI_LAB_LANC_ESPEC`, `LANC`, `LANC_MOV`, variables |
| `/gpi/listados/anotaciones` | `ListadosHistoricoGpiPage.tsx` | Anotaciones | 8455 | `listados/anotaciones` | R `GI_LAB_ANOTACOES`, `NO_PLAN` |
| `/gpi/listados/historico-valor` | `ListadosHistoricoGpiPage.tsx` | Histórico de valor | 8648 | `listados/historico-valor` | R `LANC`, `RESP_LANC`, variables |
| `/gpi/listados/historico-variables` | `ListadosHistoricoGpiPage.tsx` | Histórico de variables | 10130 | `listados/historico-variables` | R `GI_LAB_RASTREA`, `GI_LAB_VAR` |
| `/gpi/listados/historico-especificacion` | `ListadosHistoricoGpiPage.tsx` | Histórico de especificación | 10122 | `listados/historico-especificacion` | R `GI_LAB_LANC_ESPEC`, `GI_LAB_VAR` |

Los cálculos de las variables los hace el motor de fórmulas (`api/src/modules/gpi/formula/`), que ejecuta el SQL guardado en las fórmulas en un pool de solo lectura (puede usar funciones `GAF_*` y vistas `GAV_*` del núcleo).

### 1.4 Laboratorio — grupo `lab`

| Ruta | Archivo | Pantalla | Permiso | Endpoint | Objetos de BD |
|------|---------|----------|---------|----------|---------------|
| `/lab/sonda` | `LabSondaPage.tsx` | Análisis de caña (sonda) | 9905, 9903 | `GET /api/lab/sonda`, `/sonda/:id` | R `AGR.GA_ANALI_SONDA`; R `GPI.GA_ANALI_SONDA`, `GA_ANALI_SONDA_PRIMARIA`, `GA_MOTIV_CANCEL_ANA` |
| `/lab/entrada-cana` | `EntradaCanaPage.tsx` | Entrada de caña | 9905, 9903 | `GET /api/lab/entrada-cana` | R `AGR.GA_ANALI_SONDA` |

### 1.5 Administración — grupo `admin` (solo administradores: `USE_MASTER` o acceso total al form 9680)

Una sola ruta, `/admin` (`AdminPage.tsx`), con cinco pestañas:

| Pestaña | Endpoint `/api/admin/…` | Objetos de BD | Escribe |
|---------|-------------------------|---------------|---------|
| Usuarios | `usuarios`, `usuarios/:id` | R `AGR.GAM_USUARIOS`, `GAM_GRUPOS`, `GAM_GRUPOS_USUARIOS`, `GAM_MODULOS_FORMS`, `GAM_USUARIOS_FORM_ACESSOS`, `GAM_GRUPO_FORM_ACESSOS`, `GAM_USUARIO_FORM_HISTOR`, `GAM_CONTROLE_LOGON` (nunca columnas de contraseña) | no |
| Grupos | `grupos`, `grupos/:id` | R `GAM_GRUPOS`, `GAM_GRUPOS_USUARIOS`, `GAM_GRUPO_FORM_ACESSOS`, `GAM_MODULOS_FORMS` | no |
| Permisos por pantalla | `pantallas`, `pantallas/:id/permisos` | R `GAM_MODULOS_FORMS`, `GAM_USUARIOS_FORM_ACESSOS`, `GAM_GRUPO_FORM_ACESSOS` | no |
| Conexiones | `conexiones` | R `GAM_CONTROLE_LOGON`, `GAM_USUARIOS` | no |
| **Configuración** (`ConfiguracionTab.tsx`) | `GET/PUT configuracion`, `PUT/DELETE configuracion/assets/:clave` | **R/W `APP.LAB_APP_CONFIG`, `APP.LAB_APP_ASSET`; W `APP.LAB_APP_AUDIT`** | **sí** |

---

## 2. API (`api/src/app.js`)

| Prefijo | Módulo | Autenticación | Endpoints |
|---------|--------|---------------|-----------|
| `/api/health`, `/api/ready` | `app.js` | público | proceso vivo / base disponible |
| `/api/branding` | `configuracion/branding.routes.js` | **público** | `GET /` (textos + URL de imágenes), `GET /asset/:clave` (imagen, caché 1 día) |
| `/api/auth` | `auth/` | login público; `me` con token | `POST /login` (limitado por IP e intentos), `GET /me` |
| `/api/contexto` | `contexto/` | sesión | `GET /`, `GET /opciones`, `POST /` |
| `/api/menu` | `menu/` | sesión | `GET /` |
| `/api/inicio` | `inicio/` | sesión | `GET /` |
| `/api/notificaciones` | `notificaciones/` | sesión | `GET /`, `POST /leidas`, `POST /:id/leida` |
| `/api/maestras` | `maestras/` | sesión + permiso por recurso | `GET /`, `GET /:recurso`, `GET /:recurso/:id`, `POST /:recurso`, `PUT /:recurso/:id`, `DELETE /:recurso/:id` |
| `/api/gpi` | `gpi/` | sesión + permiso por pantalla | ver 1.3 |
| `/api/lab` | `lab/` | sesión + permiso | ver 1.4 |
| `/api/admin` | `admin/` | administrador | ver 1.5 |

---

## 3. Objetos de base de datos

### 3.1 Propios de la app (esquema `APP`): se crean con `api/sql/` o por bootstrap

| Objeto | Tipo | Script | Quién lo usa | R/W |
|--------|------|--------|--------------|-----|
| `LAB_APP_AUTH` | tabla | `001_app_auth.sql` | Login, selector de contexto (`auth.service`, `contexto.service`, `intentos.js`) | R/W |
| `LAB_APP_AUDIT` + índice `IX_LAB_APP_AUDIT_FECHA` | tabla | `002_app_audit.sql` | Digitación diaria, Configuración (`lib/auditoria.js`) | W |
| `LAB_APP_NOTIF` + índice `IX_LAB_APP_NOTIF_USU` | tabla | `003_app_notif.sql` | Campana de notificaciones | R/W |
| `LAB_APP_CONFIG` | tabla | `004_app_config.sql` | Configuración (textos), Login, Acerca, título de pestaña | R/W |
| `LAB_APP_ASSET` | tabla (BLOB) | `004_app_config.sql` | Configuración (logos/iconos), Login, menú, favicon | R/W |

### 3.2 Núcleo GATEC (`AGR`): ya existen (ver `docs/base-de-datos.md` §B.1)

| Tabla | Acceso | Pantallas / módulos que la usan |
|-------|--------|----------------------------------|
| `GAM_USUARIOS` | R | Login, permisos, Administración |
| `GAM_GRUPOS`, `GAM_GRUPOS_USUARIOS` | R | Login (permisos), Administración |
| `GAM_MODULOS_FORMS` | R | Permisos, Administración |
| `GAM_USUARIOS_FORM_ACESSOS`, `GAM_GRUPO_FORM_ACESSOS` | R | Permisos, Administración |
| `GAM_USUARIO_FORM_HISTOR`, `GAM_CONTROLE_LOGON` | R | Administración |
| `GA_EMPR`, `GA_SAFRAS`, `GA_CONFI_EMPR_SAFRA` | R (y W vía las maestras `empresa` y `safra`) | Selector de contexto, Inicio |
| `GA_MENU_ARVORE`, `GA_MENU_ARV_EXE`, `GA_MENU_FAVORITO` | R | Menú lateral |
| `GA_ANALI_SONDA` | R | Sonda, Entrada de caña, Inicio |

### 3.3 GPI (`GATEC_GPI_NEW`; ver `docs/base-de-datos.md` §B.2)

Estáticas (R): `GI_LAB_VAR`, `GI_LAB_VAR_STATUS`, `GI_LAB_UNIDADE`, `GI_LAB_PLAN_CONF_GERAL`, `GI_LAB_PARAM_USINA`, `GI_LAB_CONSULTA`, `GI_LAB_SUPERVISORIO`, `GI_LAB_SUP_VAR`, `GI_LAB_PAINEL_CONF`, `GI_LAB_PAINEL_VAR`, `GI_LAB_PAINEL_CEP`, `GI_LAB_PAINEL_REL`, `GI_LAB_CONF_REL_TIT`, `GI_LAB_CONF_REL_LINHA`, `GI_LAB_REL_RESUMO`, `GI_LAB_REL_RES_ITEM`, `GI_LAB_LANC_ESPEC`, `GI_LAB_LANC_METAS`, `GI_LAB_LANC_METAS_VAR`, `GI_LAB_ANOTACOES`, `GI_LAB_RASTREA`, `GA_ANALI_SONDA`, `GA_ANALI_SONDA_PRIMARIA`, `GA_MOTIV_CANCEL_ANA`.

Secuencia: `GAS_LAB_ID_LANC` (id de cada lanzamiento nuevo).

Dinámicas (la API comprueba en `all_tables` si existen antes de usarlas):

| Tabla | Sufijo | R/W |
|-------|--------|-----|
| `GI_LAB_LANC_{e}_{z}` | empresa + zafra | R, **W** (digitación) |
| `GI_LAB_LANC_MOV_{e}_{z}` | empresa + zafra | R, **W** (digitación) |
| `GI_LAB_ACUM_{e}_{z}` | empresa + zafra | R |
| `GI_LAB_RESP_LANC_{e}_{z}` | empresa + zafra | R |
| `GI_LAB_NO_PLAN_{e}` | empresa | R |
| `GI_LAB_PLAN_CONF_{e}` | empresa | R |
| `GI_LAB_ACESSOS_{e}` | empresa | R |

### 3.4 Tablas maestras editables (72 recursos de `api/src/modules/maestras/recursos.js`; pantalla `/maestras/:recurso`)

Tabla generada desde el código. «Zafra» = el recurso se filtra por la zafra elegida. Módulo = carpeta del menú; idForm = permiso (nivel 2 para crear/editar, 3 para eliminar).

| Recurso (`:recurso`) | Título | Esquema | Tabla | Módulo | idForm | Zafra |
|----------------------|--------|---------|-------|--------|--------|-------|
| estagio-corte-usina | Etapa de corte (Usina) | GATEC_AGR (`GATEC_SCHEMA`) | GA_ESTAG_USINA | 15 | 9770 |  |
| estagio-corte-padrao | Etapa de corte (Padrón) | GATEC_AGR (`GATEC_SCHEMA`) | GA_ESTAG_COPER | 15 | 9768 |  |
| variedade-padrao | Variedad (Padrón) | GATEC_AGR (`GATEC_SCHEMA`) | GA_VARIE_COPER | 15 | 9773 |  |
| variedade-usina | Variedad (Usina) | GATEC_AGR (`GATEC_SCHEMA`) | GA_VARIE_USINA_2 | 15 | 9775 |  |
| solos-padrao | Suelos (Padrón) | GATEC_AGR (`GATEC_SCHEMA`) | GA_SOLOS_COPER | 15 | 9778 |  |
| textura-solo | Texturas de suelo | GATEC_AGR (`GATEC_SCHEMA`) | GA_TEXTURA_SOLO | 15 | 9782 |  |
| proprietarios | Propietarios | GATEC_AGR (`GATEC_SCHEMA`) | GA_PROPRIETARIO | 15 | 9760 |  |
| caracteristicas-fundo | Características de la finca | GATEC_AGR (`GATEC_SCHEMA`) | GA_CARAC_FUNDO | 15 | 9764 |  |
| fundo-agricola | Finca agrícola | GATEC_AGR (`GATEC_SCHEMA`) | GA_FUNDO_AGRIC | 15 | 9762 | sí |
| mudanca-estagio | Cambio de etapa | GATEC_AGR (`GATEC_SCHEMA`) | GA_MUDAN_ESTAG | 15 | 9784 |  |
| tipo-embalagem | Tipos de embalaje | GATEC_AGR (`GATEC_SCHEMA`) | GA_POP_EMBALAGEM | 91 | 10034 |  |
| divisao-1 | División 1 (Sector) | GATEC_AGR (`GATEC_SCHEMA`) | GA_DIVI1_2 | 15 | 9787 | sí |
| divisao-2 | División 2 (Finca) | GATEC_AGR (`GATEC_SCHEMA`) | GA_DIVI2_2 | 15 | 9789 | sí |
| divisao-3 | División 3 (Lote) | GATEC_AGR (`GATEC_SCHEMA`) | GA_DIVI3_2 | 15 | 9791 | sí |
| divisao-4 | División 4 (Parcela) | GATEC_AGR (`GATEC_SCHEMA`) | GA_DIVI4_2 | 15 | 9793 | sí |
| empresa | Empresa | GATEC_AGR (`GATEC_SCHEMA`) | GA_EMPR | 1 | 9684 |  |
| safra | Zafra | GATEC_AGR (`GATEC_SCHEMA`) | GA_SAFRAS | 1 | 9686 |  |
| cultura-agricola | Culturas Agrícolas | GATEC_AGR (`GATEC_SCHEMA`) | GA_CULTU_AGRIC | 1 | 9688 |  |
| unidade-medida | Unidad de medida | GATEC_AGR (`GATEC_SCHEMA`) | GA_UNIDADE | 1 | 9692 |  |
| municipio | Municipios | GATEC_AGR (`GATEC_SCHEMA`) | GA_CEP_MUNIC | 1 | 9694 |  |
| turno-carregamento | Turno de carga | GATEC_AGR (`GATEC_SCHEMA`) | GA_TURNO_TRABALHO | 1 | 9696 |  |
| moeda | Moneda | GATEC_AGR (`GATEC_SCHEMA`) | GA_TABGR_MOEDA | 1 | 9698 |  |
| tipo-composicao | Tipo de composición | GATEC_AGR (`GATEC_SCHEMA`) | GA_TIPO_COMPOSICAO | 1 | 9700 |  |
| transbordo | Transbordo (Composición) | GATEC_AGR (`GATEC_SCHEMA`) | GA_COMP_TRANSBORDO | 1 | 9704 |  |
| tipo-frente | Tipo de frente | GATEC_AGR (`GATEC_SCHEMA`) | GA_TIPO_FRENTE | 1 | 9708 |  |
| frente-trabalho | Frente de trabajo | GATEC_AGR (`GATEC_SCHEMA`) | GA_FRENT_TRABA | 1 | 9710 |  |
| finalidade | Finalidad | GATEC_AGR (`GATEC_SCHEMA`) | GA_FINALID_COPER | 1 | 9712 |  |
| caracteristica-cana | Característica de la caña | GATEC_AGR (`GATEC_SCHEMA`) | GA_CARAC_CANA_2 | 1 | 9714 |  |
| motivo-liberacao | Motivos de liberación | GATEC_AGR (`GATEC_SCHEMA`) | GA_MOTIV_LIBER | 1 | 9716 |  |
| servicos | Servicios | GATEC_AGR (`GATEC_SCHEMA`) | GA_CODIG_SERVI | 1 | 9718 |  |
| tipo-corte | Tipo de corte | GATEC_AGR (`GATEC_SCHEMA`) | GA_TIPO_CORTE_2 | 1 | 9720 |  |
| cargos | Cargos | GATEC_AGR (`GATEC_SCHEMA`) | GA_CARGOS | 1 | 9725 |  |
| funcionarios | Funcionarios | GATEC_AGR (`GATEC_SCHEMA`) | GA_FUNCIONARIO | 1 | 9727 |  |
| classe-funcionario | Clase por funcionario | GATEC_AGR (`GATEC_SCHEMA`) | GA_CLASSE_FUN | 1 | 9730 |  |
| ccusto-funcionario | Centro de costo por funcionario | GATEC_AGR (`GATEC_SCHEMA`) | GA_FUNC_CCUSTO | 1 | 9732 |  |
| tipo-empreiteiro | Tipo de contratista | GATEC_AGR (`GATEC_SCHEMA`) | GA_TIPO_EMPREITEIRO | 1 | 9735 |  |
| empreiteiros | Contratistas | GATEC_AGR (`GATEC_SCHEMA`) | GA_EMPREIT | 1 | 9737 |  |
| frente-empreiteiro | Frente de trabajo por contratista | GATEC_AGR (`GATEC_SCHEMA`) | GA_FRENTE_EMPREIT | 1 | 9739 |  |
| centro-custo | Centro de costo | GATEC_AGR (`GATEC_SCHEMA`) | GA_CENTR_CUSTO | 1 | 9742 |  |
| centro-custo-agregado | Centro de costo agregado | GATEC_AGR (`GATEC_SCHEMA`) | GA_CENTR_CUSTO_AGREG | 1 | 9744 |  |
| proprietario-equipamento | Propietarios de equipo | GATEC_AGR (`GATEC_SCHEMA`) | GA_TABGR_PROP_EQUIP | 1 | 9747 |  |
| equipamentos | Equipos | GATEC_AGR (`GATEC_SCHEMA`) | GI_MEQ_MIS | 1 | 9749 |  |
| classe-equipamento | Clase de equipo | GATEC_AGR (`GATEC_SCHEMA`) | GA_CPMIS_CLAS_EQUIP | 1 | 9751 |  |
| subclasse-equipamento | Subclase de equipo | GATEC_AGR (`GATEC_SCHEMA`) | GA_CPMIS_SUBCL_EQUIP | 1 | 9751 |  |
| parametros | Parámetros (empresa/zafra) | GATEC_AGR (`GATEC_SCHEMA`) | GA_PARAM_EMPR_SAFRA | 1 | 9754 | sí |
| gpi-unidade | Unidad de medida (GPI) | GATEC_GPI_NEW | GI_LAB_UNIDADE | 90 | 8491 |  |
| gpi-constantes | Constantes | GATEC_GPI_NEW | GI_LAB_CONST | 90 | 8493 |  |
| gpi-metodologia | Metodologías | GATEC_GPI_NEW | GI_LAB_METODO | 90 | 8495 |  |
| gpi-me-alcool | Masa específica del alcohol | GATEC_GPI_NEW | GI_LAB_TAB_ME_ALCOOL | 90 | 8497 |  |
| gpi-dens-brix | Densidad del Brix | GATEC_GPI_NEW | GI_LAB_TAB_DENS_BRIX | 90 | 8499 |  |
| gpi-tab-generica-conf | Tablas Genéricas · Configuración | GATEC_GPI_NEW | GI_LAB_TAB_GENERICA_CAD | 90 | 8502 |  |
| gpi-tab-generica | Tablas Genéricas · Mantenimiento | GATEC_GPI_NEW | GI_LAB_TAB_GENERICA | 90 | 8504 |  |
| gpi-granulometria | Granulometría (peso y abertura de tamices) | GATEC_GPI_NEW | GI_LAB_TAB_GRANULOMETRIA | 90 | 9582 |  |
| lab-motivo-cancelacion | Motivo de Cancelación de Análisis | GATEC_AGR (`GATEC_SCHEMA`) | GA_MOTIV_CANCEL_ANA | 6 | 9912 |  |
| gpi-parada-grupo | Parada · Grupo | GATEC_GPI_NEW | GI_LAB_GRUPO_PARADA | 90 | 8431 |  |
| gpi-parada-grupo-estado | Parada · Grupo · Historial de estado | GATEC_GPI_NEW | GI_LAB_GRUPO_PARADA_STATUS | 90 | 8431 |  |
| gpi-parada-local | Parada · Local | GATEC_GPI_NEW | GI_LAB_LOCAL_PARADA | 90 | 8433 |  |
| gpi-parada-local-estado | Parada · Local · Historial de estado | GATEC_GPI_NEW | GI_LAB_LOCAL_PARADA_STATUS | 90 | 8433 |  |
| gpi-parada-motivo | Parada · Motivo | GATEC_GPI_NEW | GI_LAB_MOT_PARADA | 90 | 8435 |  |
| gpi-parada-motivo-estado | Parada · Motivo · Historial de estado | GATEC_GPI_NEW | GI_LAB_MOT_PARADA_STATUS | 90 | 8435 |  |
| gpi-parada-lanc | Parada · Digitación (consulta) | GATEC_GPI_NEW | GI_MOT_PARADA_LANC | 90 | 8437 |  |
| gpi-redu-grupo | Reducción de molienda · Grupo | GATEC_GPI_NEW | GI_LAB_REDU_MOAGEM_GRUPO | 90 | 10112 |  |
| gpi-redu-local | Reducción de molienda · Local solicitante | GATEC_GPI_NEW | GI_LAB_REDU_MOAGEM_LOCAL | 90 | 10114 |  |
| gpi-redu-motivo | Reducción de molienda · Motivo | GATEC_GPI_NEW | GI_LAB_REDU_MOAGEM_MOTIVO | 90 | 10116 |  |
| gpi-redu-equipo | Reducción de molienda · Equipo | GATEC_GPI_NEW | GI_LAB_REDU_MOAGEM_EQPTO | 90 | 10110 |  |
| gpi-redu-lanc | Reducción de molienda · Digitación (consulta) | GATEC_GPI_NEW | GI_LAB_REDU_MOAGEM_LANC | 90 | 10118 |  |
| gpi-material | Registro de materiales | GATEC_GPI_NEW | GI_LAB_CAD_MATER_PROCESSO_GEN | 90 | 8481 |  |
| gpi-material-config | Configuración de materiales (consulta) | GATEC_GPI_NEW | GI_LAB_CAD_MATER_PROCESSO | 90 | 8483 |  |
| gpi-tanque-medicion | Tanques · Medición | GATEC_GPI_NEW | GI_LAB_TANQUE_MED | 90 | 8486 |  |
| gpi-tanque-estocagem | Tanques · Almacenamiento | GATEC_GPI_NEW | GI_LAB_TANQUE_EST | 90 | 8488 |  |
| gpi-producto-categoria | Productos · Categorías | GATEC_GPI_NEW | GI_LAB_PRODUTO_CATEG | 90 | 8474 |  |
| gpi-producto | Productos | GATEC_GPI_NEW | GI_LAB_CAD_ACUCAR | 90 | 8476 |  |

---

## 4. Archivos de apoyo en el repositorio

| Ruta | Contenido |
|------|-----------|
| `api/sql/001…004_*.sql` | Scripts idempotentes de las tablas `LAB_APP_*` |
| `db/catalogo/*.json` | Catálogo (tablas y columnas) exportado de `GATEC_AGR`, `GATEC_GPI_NEW`, `GATEC_LAB`, `GATEC_AZPA` |
| `db/plsql/` | Fuentes PL/SQL exportados (funciones, paquetes, procedimientos, triggers, vistas): referencia |
| `tools/export-db.js` | Regenera `db/` desde la base |
| `tools/e2e/` | Pruebas de recorrido de pantallas contra una base real |
| `docs/inventario/` | Inventario del sistema VB6 original (pantallas, SQL, tablas) |
| `docs/base-de-datos.md` | DDL, privilegios, variables de entorno, migración |
