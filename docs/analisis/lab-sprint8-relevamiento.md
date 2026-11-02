# Relevamiento del Sprint 8 (`GAtec_Lab`) y adelanto de los Sprints 9 y 10

Fecha del relevamiento: 26/10/2026, contra **DESA** (`oradesa`). Fuentes: `docs/inventario/GAtec_Lab.md` (77 formularios, 50 tablas referenciadas), conteo de filas en DESA
y `GAM_MODULOS_FORMS`. El criterio de decisión es el mismo de los sprints anteriores: **lo que está vacío en DESA no se recrea hasta confirmar con un usuario del GATEC
que se usa en producción** (DESA se recarga desde producción, así que vacío en DESA = vacío en producción a la fecha de la última carga).

## Conclusión

`GAtec_Lab` es el **ejecutable completo del laboratorio** (pre-cosecha, pos-cosecha, impurezas) y comparte formularios y tablas con `GAtec_Lat` (Sprint 7, recepción de caña).
De sus 77 formularios, **solo una docena trabaja sobre tablas con datos** (consulta y digitación de análisis de sonda, y el catálogo de motivos de cancelación) y esos ya están cubiertos o dependen de escribir en tablas compartidas con el VB6.
**El Sprint 8 queda prácticamente absorbido por el Sprint 7**: no hay una pantalla nueva con datos reales que construir en solo consulta.

| Resultado | Formularios |
|---|---|
| ✅ Ya hecho (Sprint 7) | `frmPesqPosAna`, `rptconsultaPos`, `rptConsultaPos2`, `rptconsulta` (consulta de análisis de sonda), `frmParamSonda` y `frmCadMotCanConsecana` (motivos de cancelación) |
| ⬜ Pendiente por ser **escritura** | `frmLancSonda`, `frmLancSondaBarra`, `frmLancSondaDigestor`, `frmLancAr` (digitación de análisis) |
| 🟡 Posible, bajo valor | `frmPesqEntradaCana` (entrada de caña con su análisis: cruzar balanza y sonda), `rptRelAr`, `frmTipoPre` (1 fila), `frmPadrao`, `frmTurma`/`frmTurnoTrabalho` (tablas vacías) |
| ⏸ Vacío en DESA, no se recrea | los 23 de **Pré-Colheita**, los 21 de **Impurezas** y los 2 de **Rastreabilidad** |
| ⏸ Hardware local o infraestructura VB6, no aplica a una web | los 3 de aparato serial / BA y los 11 de infraestructura |

## Los 77 formularios por grupo

| Grupo | N | Formularios | Tablas | Filas en DESA |
|---|---|---|---|---|
| **Pré-Colheita** (lanzamiento de pre-análisis, áreas, prova em branco, tipos, cartões) | 23 | `frmAreaFacil`, `frmAreaFacilCompleta`, `frmCadPreAnalise`, `frmFiltroPreAnali`, `frmFiltroPreAnaOutrasAreas`, `frmGerarAnalise`, `frmLancPreAna`, `frmLancPreAnaDigestor`, `frmLancPreAnaProvaBranco`, `frmLancPreAnaSemArea`, `frmParamPre`, `frmPesqPreAna`, `frmPreAnaCadastro`, `frmTipoPre`, `frmVariedadePre`, `rptCartaoPreAnalise` (+ 5 variantes por cliente: Alcidia, Balbo, Dasa, Ruette, Zilor), `rptPreAnaOutrasAreas`, `rptRelArPre` | `GA_PRE_ANALI`, `GA_MOV_PRE_ANALI`, `GA_PRE_ANALI_CADASTRO`, `GA_PRE_ANALI_OUTRAS_AREAS(_D4)`, `GA_TEMP_MEDIA_PRA` | **0** (`GA_TIPO_PRE_ANALI` tiene 1 fila de prueba, «TEST») |
| **Impurezas** (muestra de impurezas por frente, turno, operador, tipo de corte) | 21 | `frmImpureza`, `frmRecalcImp`, `frmImpEqpDia`, `frmImpOperDia`, `frmFiltroRel`, `frmFiltroBranco`, `frmFiltroDesc`, `frmListaProvaBranco`, `rptBranco`, `rptImpFrente`, `rptImpTipoCorteNovo`, `rptImpurezaCorte`, `rptImpurezaNovo`, `rptOperCarreg`, `rptPontDesca`, `rptRelImpureza`, `rptSoTurno`, `rptTQporHora`, `rptTQporTipCorte`, `rptTurnoOper`, `rptTurnoOperTurma` | `GA_IMPUREZA`, `GA_IMPUREZA_TOTAL`, `GA_IMPUREZA_TMP`, `GA_IMPUREZA_PROVA_BRANCO` | **0** |
| **Rastreabilidad** | 2 | `frmRast_Consulta`, `frmRast_Log` | `GA_RASTREABILIDADE` | **0** |
| **Pós-Colheita: digitación** | 4 | `frmLancSonda`, `frmLancSondaBarra`, `frmLancSondaDigestor`, `frmLancAr` | `GA_ANALI_SONDA` (+ factores de cálculo) | 883.962 |
| **Pós-Colheita: consulta y reportes** | 6 | `frmPesqPosAna`, `frmPesqEntradaCana`, `rptconsulta`, `rptconsultaPos`, `rptConsultaPos2`, `rptRelAr` | `GA_ANALI_SONDA`, balanza (`INV`) | 883.962 |
| **Catálogos y parámetros** | 7 | `frmParamSonda`, `frmCadMotCanConsecana`, `frmTurma`, `frmTurnoTrabalho`, `frmPadrao`, `frmCalcAux`, `frmCalcMedia` | `GA_MOTIV_CANCEL_ANA` (3), `GA_TURMA` (0), `GA_TURNO_TRABALHO` (0) | ver nota |
| **Aparato serial / hardware** | 3 | `frmApSerial`, `frmApSerialImpurezas`, `frmInclusaoBA` | `GA_CONF_APARELHO_SERIAL` | 0 |
| **Infraestructura VB6** | 11 | `mdiPrincipal`, `FrmConfig`, `frmGAtecConfigIni`, `frmGAtecErroActiveReport`, `frmGAtecPrinter`, `frmGAtecReport`, `frmGAtecSobre`, `frmGAtecTrataErro`, `frmNovaSafra`, `FrmPersistirG`, `FrmPesquisa` | `GA_CONTROLE_GRID` (0), `GA_MOD_CONFIG` (1.441) | — |
| **Total** | **77** | | | |

## Tablas con datos que usa `GAtec_Lab` (esquema `GATEC_AGR`)

| Tabla | Filas | Estado en la app nueva |
|---|---|---|
| `GA_ANALI_SONDA` | 883.962 | ✅ consulta (`/lab/sonda`) |
| `GA_ANALI_SONDA_PRIMARIA` | 9.547 | ✅ en el detalle del análisis |
| `GA_MOTIV_CANCEL_ANA` | 3 | ✅ CRUD genérico (`lab-motivo-cancelacion`) |
| `GA_PARAM_EMPR_SAFRA` | 21 | ✅ ya cubierta (`frmParam`, Sprint 2) |
| `GA_CONFI_EMPR_SAFRA` | 20 | usada para el contexto empresa/zafra |
| `GA_CONF_CPC` | 13 | ⬜ configuración de pago de caña por zafra (horarios, pesos mínimos y máximos, flags de la báscula); sin pantalla |
| `GA_TIPO_PRE_ANALI` | 1 | ⏸ una fila de prueba |
| `GA_SEQUENCES` | 3 | interna (contadores del VB6 para `GA_PRE_ANALI`) |
| `GA_AGR_ATU` | 72 | interna (historial de versiones del VB6) |
| `GA_MOD_CONFIG` | 1.441 | interna (configuración de grillas por usuario) |
| `GAM_*` | — | permisos: ya los usa el login |

**Tablas que el SQL menciona y no existen en DESA**: `GA_FATOR_POL` (Brix → factor) y `GA_FATOR_AR` (mililitros gastados → factor), que el VB6 usa para **calcular Pol y AR al digitar**;
`GA_DIVI1/2/4`, `GA_TIPO_CORTE`, `GA_VARIE_USINA`, `GA_VARIE_DIVI4` y `GA_VAR_CONTAINER` (en DESA solo existe `GA_VAR_CONTAINER_2`, con 44.121 filas). Los factores de Pol y AR
son un **requisito previo de la digitación de análisis**: hay que encontrar de dónde los lee el VB6 antes de poder replicar el cálculo.

## Pendiente real que sale de este relevamiento

1. **Digitación de análisis de sonda** (escritura en `GA_ANALI_SONDA`, tabla compartida con el VB6 en uso): bloqueada por (a) la convivencia con el VB6, (b) los factores de Pol y AR que no están en DESA,
   (c) la lectura del aparato serial / código de barras. Es el único trabajo grande del laboratorio.
2. Cruce de **entrada de caña** (balanza `INV.BA_MOVIMIENTOS_BASCULA`) con el análisis de sonda: `frmPesqEntradaCana`. Es consulta pura y accesible (el motor de fórmulas ya lee esa tabla en `Db_Select`).
3. Confirmar con el laboratorio que **Pré-Colheita, Impurezas y Rastreabilidad no se usan** (tablas vacías) y por qué el resultado de sonda se carga en solo ~60 % de los camiones desde 2024.

---

# Adelanto: Sprints 9 y 10

Mismo método (inventario + filas en DESA). **El Sprint 9 ya se relevó y se trabajó en detalle: ver `sprint9-balanza-config.md`** (esta sección queda como adelanto original).

## Sprint 9 — Pre-Zafra, Config, Otros, Traducciones, Balanza

| Exe / módulo | Formularios | Datos en DESA | Observación |
|---|---|---|---|
| `GAtec_TRA` (traducciones) | 11 | `GA_TRA_TEXTOS` 7.039, `GA_TRA_MODULOS` 5.251, `GA_TRA_USUARIOS` 14, `GA_TRA_LINGUAS` 2 | Herramienta para traducir pantallas del VB6 (2 idiomas). La app nueva no la necesita; **sí sirve como fuente de rótulos en español** de los formularios |
| `Bal0015` (balanza / acumulado) | 11 | `GA_ACUM_TMP_100` 975 | Reporte de caña acumulada: probablemente consulta sobre las tablas de balanza (`INV.BA_*`); por confirmar al relevarlo |
| Pre-Zafra (módulo 70), Config (307), Otros (338, 10) | 17 + 11 + 11 | por relevar tabla por tabla | Las pantallas están repartidas en los exes chicos; revisar `docs/inventario/INVENTARIO.md` |

## Sprint 10 — Administración y cubos

| Exe | Formularios | Datos en DESA | Observación |
|---|---|---|---|
| `GAtec_Senha` (usuarios, grupos, permisos) | 32 | `GAM_USUARIOS` 167, `GAM_GRUPOS` 11, `GAM_GRUPOS_USUARIOS` 144, `GAM_USUARIOS_FORM_ACESSOS` 6.611, `GAM_GRUPO_FORM_ACESSOS` 5.111, `GAM_USUARIO_FORM_HISTOR` 15.288, `GAM_CONTROLE_LOGON` 134.614, `GAM_SENHA_CONFIG_GERAL` 1 | Es lo que **ya lee el login**. La administración *escribe* permisos y usuarios compartidos con el VB6 y con el login por contraseña de Oracle: es de **alto riesgo**, hacerla al final y solo en consulta primero |
| `gatec_cuboaco` y `_semATR` (cubos agrícolas) | 15 + 15 | `GA_SAFRAS` 21, `GA_CUBO_VARIAVEIS` 4 + datos agrícolas | Cubos OLAP sobre tablas agrícolas; según el inventario, 8 a 11 de sus 19 a 22 tablas tienen datos en DESA: por relevar cuáles |
| `GATEC_MENU` | 13 | `GA_MENU_ARVORE` 9, `GA_MENU_ARV_EXE` 7, `GA_MENU_FAVORITO` 3, `GA_MENU_LOG` 11 | Lanzador de los exes; solo 7 programas registrados. Se reemplaza por el Inicio de la app nueva |

## Propuesta de orden

1. Cerrar el Sprint 8 **sin pantallas nuevas** (queda absorbido por el 7) y registrar los 3 pendientes de arriba.
2. Sprint 9: solo lo que tenga datos (Balanza/acumulado y lo que resulte de relevar los módulos 70, 307, 338 y 10).
3. Sprint 10: consulta de usuarios, grupos y permisos (sin escritura).
4. Retomar la **escritura** (digitación GPI y de sonda, cierre) solo después de hablar con laboratorio y de definir cómo conviven con el VB6.
