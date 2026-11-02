# Inventario del sistema GATEC (VB6)

Generado por `tools/build-inventory.py` desde los ejecutables de `C:\Gatec\Gatec` y el catálogo de DESA. Detalle por ejecutable en los archivos enlazados.

| Ejecutable | Proyecto VB | Compilación | Forms | Reportes | Módulos/Clases | Controles | SQL | Tablas |
|---|---|---|---|---|---|---|---|---|
| [Bal0015](Bal0015.md) | Bal0015 | native | 11 | 1 | 10 | 153 | 82 | 14 |
| [GATEC_GPI](GATEC_GPI.md) | GAtec_GPI | native | 250 | 67 | 48 | 6070 | 3816 | 281 |
| [GATEC_MENU](GATEC_MENU.md) | GAtec_Menu | native | 13 | 0 | 10 | 207 | 213 | 29 |
| [GAtec_Lab](GAtec_Lab.md) | GAtec_Laboratório | native | 77 | 2 | 20 | 2181 | 435 | 50 |
| [GAtec_Lat](GAtec_Lat.md) | GAtec_Lat_Spn | native | 24 | 1 | 22 | 708 | 216 | 37 |
| [GAtec_Senha](GAtec_Senha.md) | PrjSenhas | native | 32 | 14 | 27 | 720 | 737 | 69 |
| [GAtec_TRA](GAtec_TRA.md) | GAtec_TRA | native | 11 | 1 | 19 | 178 | 97 | 9 |
| [gatec_cuboaco](gatec_cuboaco.md) | GAtec_CuboAco | native | 15 | 1 | 11 | 248 | 83 | 19 |
| [gatec_cuboaco_semATR](gatec_cuboaco_semATR.md) | GAtec_CuboAco_SATR | native | 15 | 1 | 11 | 250 | 95 | 22 |

## Tablas usadas por más de un ejecutable

| Tabla | Ejecutables |
|---|---|
| `ALL_INDEXES` | GATEC_GPI, GAtec_Senha |
| `ALL_IND_EXPRESSIONS` | GATEC_GPI, GAtec_Senha |
| `ALL_OBJECTS` | GATEC_GPI, GATEC_MENU, GAtec_Lab |
| `ALL_TABLES` | GATEC_GPI, GAtec_Lab, GAtec_Lat, GAtec_Senha |
| `ALL_TAB_COLUMNS` | GATEC_GPI, GAtec_Lab, GAtec_Lat, GAtec_Senha, gatec_cuboaco, gatec_cuboaco_semATR |
| `ALL_VIEWS` | GATEC_GPI, GAtec_Senha, gatec_cuboaco, gatec_cuboaco_semATR |
| `CONSTRAINT_COLUMN_USAGE` | GATEC_GPI, GAtec_Senha |
| `DM_EXEC_CONNECTIONS` | GATEC_GPI, GATEC_MENU, GAtec_Senha |
| `DM_EXEC_SESSIONS` | GATEC_GPI, GATEC_MENU, GAtec_Senha |
| `FOREIGN_KEYS` | GATEC_GPI, GAtec_Senha |
| `GAM_CONTROLE_LOGON` | GATEC_GPI, GATEC_MENU, GAtec_Senha |
| `GAM_GRUPOS_USUARIOS` | GATEC_GPI, GAtec_Senha |
| `GAM_GRUPO_FORM_ACESSOS` | GATEC_GPI, GATEC_MENU, GAtec_Lab, GAtec_Lat, GAtec_Senha, gatec_cuboaco_semATR |
| `GAM_LOG_ATUALIZABD` | GATEC_GPI, GAtec_Senha |
| `GAM_LOG_ATUALIZABD_SCRIPT` | GATEC_GPI, GAtec_Senha |
| `GAM_MODULOS_FORMS` | Bal0015, GATEC_GPI, GATEC_MENU, GAtec_Lab, GAtec_Lat, GAtec_Senha, GAtec_TRA, gatec_cuboaco, gatec_cuboaco_semATR |
| `GAM_MODULOS_FORMS_HELP` | GATEC_GPI, GAtec_Lab, GAtec_Lat |
| `GAM_SENHA_CONFIG_GERAL` | GATEC_GPI, GATEC_MENU, GAtec_Senha |
| `GAM_USUARIOS` | GATEC_GPI, GATEC_MENU, GAtec_Lat, GAtec_Senha, GAtec_TRA, gatec_cuboaco_semATR |
| `GAM_USUARIOS_FORM_ACESSOS` | GATEC_GPI, GATEC_MENU, GAtec_Lab, GAtec_Lat, GAtec_Senha, gatec_cuboaco_semATR |
| `GAM_USUARIOS_SENHA_VALIDADE` | GATEC_GPI, GATEC_MENU, GAtec_Senha |
| `GAV_ACUM_CUBO` | gatec_cuboaco, gatec_cuboaco_semATR |
| `GAV_CUBO_` | GATEC_GPI, GAtec_Senha |
| `GA_ACUM_D4` | gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_AGR_ATU` | GATEC_GPI, GATEC_MENU, GAtec_Lab, GAtec_Lat, GAtec_Senha |
| `GA_ANALI_SONDA` | GAtec_Lab, GAtec_Lat |
| `GA_AREA_LIBER` | GAtec_Lab, GAtec_Lat, gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_CONFI_EMPR_SAFRA` | Bal0015, GATEC_GPI, GAtec_Lab, GAtec_Lat, GAtec_Senha |
| `GA_CONF_APARELHO_SERIAL` | GAtec_Lab, GAtec_Lat |
| `GA_CONF_CPC` | GAtec_Lab, GAtec_Lat |
| `GA_CONTROLE_GRID` | GATEC_GPI, GAtec_Lab, GAtec_Lat, GAtec_Senha, GAtec_TRA |
| `GA_CUBO` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_ACESSOS` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_FILTRO` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_FILTRO_ITEM` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_GRUPO` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_LAYOUT` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_QUERY` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_QUERY_CONEXAO` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_QUERY_FILTRO` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_QUERY_FILTRO_DEP` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_QUERY_LAYOUT` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_QUERY_MODULO` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_TMP_FILTRO_AREA` | GATEC_GPI, GAtec_Senha |
| `GA_CUBO_VARIAVEIS` | GATEC_GPI, GAtec_Senha |
| `GA_DIVI1` | GATEC_GPI, GAtec_Lab, GAtec_Senha |
| `GA_DIVI4` | GATEC_GPI, GAtec_Lab, GAtec_Lat, GAtec_Senha, gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_EMPR` | Bal0015, GATEC_GPI, GATEC_MENU, GAtec_Lab, GAtec_Lat, GAtec_Senha, gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_ESPEC` | GATEC_GPI, GAtec_Senha |
| `GA_ESTIM_DIVI4_ATIVA` | gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_GRUPOS` | GATEC_GPI, GAtec_Senha |
| `GA_IMPUREZA_TOTAL` | GAtec_Lab, GAtec_Lat |
| `GA_MOD_CONFIG` | Bal0015, GATEC_GPI, GAtec_Lab, GAtec_Lat, GAtec_Senha, GAtec_TRA, gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_MOTIV_CANCEL_ANA` | GAtec_Lab, GAtec_Lat |
| `GA_MOV_PRE_ANALI` | GAtec_Lab, GAtec_Lat |
| `GA_PARAM_EMPR_SAFRA` | GAtec_Lab, GAtec_Lat |
| `GA_PRE_ANALI` | GAtec_Lab, GAtec_Lat |
| `GA_RASTREABILIDADE` | GATEC_GPI, GAtec_Lab |
| `GA_SAFRAS` | GATEC_GPI, GATEC_MENU, gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_SGF_DEPOSITO` | GATEC_GPI, GAtec_Senha |
| `GA_SGF_FERRAMENTA` | GATEC_GPI, GAtec_Senha |
| `GA_SOLOS_DIVI4` | gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_SUBGRUPOS` | GATEC_GPI, GAtec_Senha |
| `GA_TABGR_MOEDA` | GATEC_GPI, GAtec_Senha |
| `GA_TEMP_MEDIA_PRA` | GAtec_Lab, GAtec_Lat |
| `GA_TRA_LINGUAS` | Bal0015, GATEC_GPI, GATEC_MENU, GAtec_Lat, GAtec_Senha, GAtec_TRA, gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_TRA_MODULOS` | Bal0015, GATEC_GPI, GATEC_MENU, GAtec_Lat, GAtec_Senha, GAtec_TRA, gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_TRA_TEXTOS` | Bal0015, GATEC_GPI, GATEC_MENU, GAtec_Lat, GAtec_Senha, GAtec_TRA, gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_TRA_USUARIOS` | Bal0015, GATEC_GPI, GATEC_MENU, GAtec_Lat, GAtec_Senha, GAtec_TRA, gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_VARIE_DIVI4` | GAtec_Lab, gatec_cuboaco, gatec_cuboaco_semATR |
| `GA_VAR_CONTAINER` | GAtec_Lab, GAtec_Lat |
| `GI_LAB_MENS_CABEC` | GATEC_GPI, GAtec_Lat |
| `GI_LAB_MENS_DETALHE` | GATEC_GPI, GAtec_Lat |
| `GV$PROCESS` | GATEC_GPI, GATEC_MENU, GAtec_Senha |
| `GV$SESSION` | GATEC_GPI, GATEC_MENU, GAtec_Senha |
| `KEY_COLUMN_USAGE` | GATEC_GPI, GAtec_Senha |
| `KEY_CONSTRAINTS` | GATEC_GPI, GAtec_Senha |
| `SEQUENCES` | Bal0015, GATEC_GPI, GATEC_MENU, GAtec_Lab, GAtec_Lat, GAtec_Senha, GAtec_TRA, gatec_cuboaco, gatec_cuboaco_semATR |
| `SYSCOLUMNS` | GATEC_GPI, GAtec_Senha |
| `SYSINDEXES` | GATEC_GPI, GAtec_Lab, GAtec_Senha |
| `SYSOBJECTS` | Bal0015, GATEC_GPI, GATEC_MENU, GAtec_Lab, GAtec_Lat, GAtec_Senha, gatec_cuboaco, gatec_cuboaco_semATR |
| `SYSPROCESSES` | GATEC_GPI, GATEC_MENU, GAtec_Senha |
| `TABLES` | GATEC_GPI, GAtec_Senha |
| `TABLE_CONSTRAINTS` | GATEC_GPI, GAtec_Senha |
| `USER_CONSTRAINTS` | GATEC_GPI, GAtec_Lab |
| `USER_INDEXES` | GATEC_GPI, GAtec_Lab |
| `USER_SEQUENCES` | GATEC_GPI, GAtec_Senha |
| `USER_TABLES` | Bal0015, GATEC_GPI, GAtec_Senha |
| `USER_TAB_COLUMNS` | Bal0015, GATEC_GPI, GAtec_Lab, GAtec_Senha |
| `V$PROCESS` | GATEC_GPI, GATEC_MENU, GAtec_Senha |
| `V$SESSION` | GATEC_GPI, GATEC_MENU, GAtec_Senha |

## Tablas con datos que ningún ejecutable menciona literalmente (149)

Pueden usarse vía PL/SQL, SQL armado dinámicamente (nombres concatenados) o por los ejecutables ASPack aún no analizados.

| Tabla | Esquema | Filas |
|---|---|---|
| `BA_ACOPLADOS_SORTEADOS2` | GATEC_AGR | 46 |
| `BA_BASCULA_ANALISIS2` | GATEC_AGR | 36 |
| `BA_MOVIMIENTOS_BASCULA2` | GATEC_AGR | 56 |
| `BA_MOVIMIENTOS_PORTERIA2` | GATEC_AGR | 34,718 |
| `BA_MOVIMIENTOS_PORT_30042007` | GATEC_AGR | 34,694 |
| `GA_ACUM_D4_2` | GATEC_AGR | 81,046 |
| `GA_ANALI_SONDA2` | GATEC_AGR | 57 |
| `GA_CARAC_CANA_2` | GATEC_AGR | 5 |
| `GA_CES_TIP_CORTE` | GATEC_AGR | 18 |
| `GA_DIVI1_2` | GATEC_AGR | 4,147 |
| `GA_DIVI2_2` | GATEC_AGR | 12,632 |
| `GA_DIVI3_2` | GATEC_AGR | 12,632 |
| `GA_DIVI4_2` | GATEC_AGR | 68,734 |
| `GA_ERROR_PROCEDURES` | GATEC_AGR | 112,062 |
| `GA_ESTAG_COPER` | GATEC_AGR | 20 |
| `GA_ESTAG_USINA` | GATEC_AGR | 20 |
| `GA_LIBERACAO` | GATEC_AGR | 1 |
| `GA_SOLOS_DIVI4_2` | GATEC_AGR | 68,734 |
| `GA_SOLOS_USINA_2` | GATEC_AGR | 1 |
| `GA_TIPO_CORTE_2` | GATEC_AGR | 23 |
| `GA_TIPO_LIBER` | GATEC_AGR | 1 |
| `GA_TRA_MODULOS_COP` | GATEC_AGR | 3,269 |
| `GA_TRA_TEXTOS_COP` | GATEC_AGR | 5,404 |
| `GA_VARIE_DIVI4_2` | GATEC_AGR | 68,734 |
| `GA_VARIE_USINA_2` | GATEC_AGR | 79 |
| `GA_VAR_CONTAINER_2` | GATEC_AGR | 44,121 |
| `GI_LAB_ACESSOS_1` | GATEC_GPI_NEW | 30,199 |
| `GI_LAB_ACESSOS_1` | GATEC_LAB | 28,649 |
| `GI_LAB_ACUM_1_2007` | GATEC_LAB | 447,022 |
| `GI_LAB_ACUM_1_2008` | GATEC_LAB | 704,634 |
| `GI_LAB_ACUM_1_2009` | GATEC_LAB | 631,870 |
| `GI_LAB_ACUM_1_2010` | GATEC_LAB | 467,899 |
| `GI_LAB_ACUM_1_2011` | GATEC_LAB | 641,219 |
| `GI_LAB_ACUM_1_2012` | GATEC_LAB | 780,052 |
| `GI_LAB_ACUM_1_2013` | GATEC_LAB | 918,375 |
| `GI_LAB_ACUM_1_2014` | GATEC_LAB | 550,949 |
| `GI_LAB_ACUM_1_2015` | GATEC_GPI_NEW | 418,877 |
| `GI_LAB_ACUM_1_2015` | GATEC_LAB | 618,404 |
| `GI_LAB_ACUM_1_2016` | GATEC_GPI_NEW | 640,937 |
| `GI_LAB_ACUM_1_2016` | GATEC_LAB | 943,132 |
| `GI_LAB_ACUM_1_2017` | GATEC_GPI_NEW | 617,310 |
| `GI_LAB_ACUM_1_2017` | GATEC_LAB | 895,698 |
| `GI_LAB_ACUM_1_2018` | GATEC_GPI_NEW | 704,711 |
| `GI_LAB_ACUM_1_2018` | GATEC_LAB | 999,200 |
| `GI_LAB_ACUM_1_2019` | GATEC_GPI_NEW | 716,633 |
| `GI_LAB_ACUM_1_2019` | GATEC_LAB | 1,006,887 |
| `GI_LAB_ACUM_1_2020` | GATEC_GPI_NEW | 711,243 |
| `GI_LAB_ACUM_1_2020` | GATEC_LAB | 994,387 |
| `GI_LAB_ACUM_1_2021` | GATEC_GPI_NEW | 731,756 |
| `GI_LAB_ACUM_1_2021` | GATEC_LAB | 1,021,201 |
| `GI_LAB_ACUM_1_2022` | GATEC_GPI_NEW | 4,192 |
| `GI_LAB_ACUM_1_2022` | GATEC_LAB | 951,196 |
| `GI_LAB_ACUM_1_2023` | GATEC_GPI_NEW | 668,657 |
| `GI_LAB_ACUM_1_2024` | GATEC_GPI_NEW | 736,586 |
| `GI_LAB_ACUM_1_2025` | GATEC_GPI_NEW | 823,799 |
| `GI_LAB_ACUM_1_2026` | GATEC_GPI_NEW | 379,157 |
| `GI_LAB_CONF_FUNCOES` | GATEC_GPI_NEW | 37 |
| `GI_LAB_CONF_FUNCOES` | GATEC_LAB | 37 |
| `GI_LAB_LANC_1_2006` | GATEC_LAB | 9 |
| `GI_LAB_LANC_1_2007` | GATEC_LAB | 43,743 |
| `GI_LAB_LANC_1_2008` | GATEC_LAB | 60,161 |
| `GI_LAB_LANC_1_2009` | GATEC_LAB | 52,751 |
| `GI_LAB_LANC_1_2010` | GATEC_LAB | 44,145 |
| `GI_LAB_LANC_1_2011` | GATEC_LAB | 54,683 |
| `GI_LAB_LANC_1_2012` | GATEC_LAB | 42,684 |
| `GI_LAB_LANC_1_2013` | GATEC_LAB | 67,083 |
| `GI_LAB_LANC_1_2014` | GATEC_LAB | 49,841 |
| `GI_LAB_LANC_1_2015` | GATEC_GPI_NEW | 57,298 |
| `GI_LAB_LANC_1_2015` | GATEC_LAB | 54,289 |
| `GI_LAB_LANC_1_2016` | GATEC_GPI_NEW | 69,738 |
| `GI_LAB_LANC_1_2016` | GATEC_LAB | 66,236 |
| `GI_LAB_LANC_1_2017` | GATEC_GPI_NEW | 62,541 |
| `GI_LAB_LANC_1_2017` | GATEC_LAB | 58,993 |
| `GI_LAB_LANC_1_2018` | GATEC_GPI_NEW | 68,357 |
| `GI_LAB_LANC_1_2018` | GATEC_LAB | 64,822 |
| `GI_LAB_LANC_1_2019` | GATEC_GPI_NEW | 71,273 |
| `GI_LAB_LANC_1_2019` | GATEC_LAB | 67,686 |
| `GI_LAB_LANC_1_2020` | GATEC_GPI_NEW | 68,205 |
| `GI_LAB_LANC_1_2020` | GATEC_LAB | 64,955 |
| `GI_LAB_LANC_1_2021` | GATEC_GPI_NEW | 67,424 |
| `GI_LAB_LANC_1_2021` | GATEC_LAB | 64,120 |
| `GI_LAB_LANC_1_2022` | GATEC_GPI_NEW | 4,474 |
| `GI_LAB_LANC_1_2022` | GATEC_LAB | 60,798 |
| `GI_LAB_LANC_1_2023` | GATEC_GPI_NEW | 56,499 |
| `GI_LAB_LANC_1_2024` | GATEC_GPI_NEW | 55,711 |
| `GI_LAB_LANC_1_2025` | GATEC_GPI_NEW | 57,497 |
| `GI_LAB_LANC_1_2026` | GATEC_GPI_NEW | 30,114 |
| `GI_LAB_LANC_MOV_1_2006` | GATEC_LAB | 571 |
| `GI_LAB_LANC_MOV_1_2007` | GATEC_LAB | 1,033,729 |
| `GI_LAB_LANC_MOV_1_2008` | GATEC_LAB | 1,338,388 |
| `GI_LAB_LANC_MOV_1_2009` | GATEC_LAB | 1,392,562 |
| `GI_LAB_LANC_MOV_1_2010` | GATEC_LAB | 1,270,901 |
| `GI_LAB_LANC_MOV_1_2011` | GATEC_LAB | 1,429,625 |
| `GI_LAB_LANC_MOV_1_2012` | GATEC_LAB | 1,190,347 |
| `GI_LAB_LANC_MOV_1_2013` | GATEC_LAB | 1,807,079 |
| `GI_LAB_LANC_MOV_1_2014` | GATEC_LAB | 1,733,066 |
| `GI_LAB_LANC_MOV_1_2015` | GATEC_GPI_NEW | 1,765,380 |
| `GI_LAB_LANC_MOV_1_2015` | GATEC_LAB | 1,974,417 |
| `GI_LAB_LANC_MOV_1_2016` | GATEC_GPI_NEW | 1,850,580 |
| `GI_LAB_LANC_MOV_1_2016` | GATEC_LAB | 2,055,487 |
| `GI_LAB_LANC_MOV_1_2017` | GATEC_GPI_NEW | 1,414,604 |
| `GI_LAB_LANC_MOV_1_2017` | GATEC_LAB | 1,595,896 |
| `GI_LAB_LANC_MOV_1_2018` | GATEC_GPI_NEW | 1,741,605 |
| `GI_LAB_LANC_MOV_1_2018` | GATEC_LAB | 1,824,596 |
| `GI_LAB_LANC_MOV_1_2019` | GATEC_GPI_NEW | 1,969,027 |
| `GI_LAB_LANC_MOV_1_2019` | GATEC_LAB | 2,064,254 |
| `GI_LAB_LANC_MOV_1_2020` | GATEC_GPI_NEW | 1,925,905 |
| `GI_LAB_LANC_MOV_1_2020` | GATEC_LAB | 2,045,288 |
| `GI_LAB_LANC_MOV_1_2021` | GATEC_GPI_NEW | 1,984,076 |
| `GI_LAB_LANC_MOV_1_2021` | GATEC_LAB | 2,088,462 |
| `GI_LAB_LANC_MOV_1_2022` | GATEC_GPI_NEW | 65,058 |
| `GI_LAB_LANC_MOV_1_2022` | GATEC_LAB | 2,137,383 |
| `GI_LAB_LANC_MOV_1_2023` | GATEC_GPI_NEW | 1,832,771 |
| `GI_LAB_LANC_MOV_1_2024` | GATEC_GPI_NEW | 1,500,575 |
| `GI_LAB_LANC_MOV_1_2025` | GATEC_GPI_NEW | 1,467,598 |
| `GI_LAB_LANC_MOV_1_2026` | GATEC_GPI_NEW | 722,546 |
| `GI_LAB_NO_PLAN_1` | GATEC_GPI_NEW | 407 |
| `GI_LAB_NO_PLAN_1` | GATEC_LAB | 599 |
| `GI_LAB_PLAN_CONF_1` | GATEC_GPI_NEW | 311 |
| `GI_LAB_PLAN_CONF_1` | GATEC_LAB | 416 |
| `GI_LAB_RESP_LANC_1_2006` | GATEC_LAB | 539 |
| `GI_LAB_RESP_LANC_1_2007` | GATEC_LAB | 401,682 |
| `GI_LAB_RESP_LANC_1_2008` | GATEC_LAB | 505,687 |
| `GI_LAB_RESP_LANC_1_2010` | GATEC_LAB | 571,242 |
| `GI_LAB_RESP_LANC_1_2011` | GATEC_LAB | 647,929 |
| `GI_LAB_RESP_LANC_1_2012` | GATEC_LAB | 532,697 |
| `GI_LAB_RESP_LANC_1_2013` | GATEC_LAB | 338,917 |
| `GI_LAB_RESP_LANC_1_2014` | GATEC_LAB | 871,646 |
| `GI_LAB_RESP_LANC_1_2015` | GATEC_GPI_NEW | 848,404 |
| `GI_LAB_RESP_LANC_1_2015` | GATEC_LAB | 937,780 |
| `GI_LAB_RESP_LANC_1_2018` | GATEC_GPI_NEW | 869,661 |
| `GI_LAB_RESP_LANC_1_2018` | GATEC_LAB | 875,437 |
| `GI_LAB_RESP_LANC_1_2019` | GATEC_GPI_NEW | 998,501 |
| `GI_LAB_RESP_LANC_1_2019` | GATEC_LAB | 1,003,304 |
| `GI_LAB_RESP_LANC_1_2020` | GATEC_GPI_NEW | 949,618 |
| `GI_LAB_RESP_LANC_1_2020` | GATEC_LAB | 955,612 |
| `GI_LAB_RESP_LANC_1_2021` | GATEC_GPI_NEW | 993,767 |
| `GI_LAB_RESP_LANC_1_2021` | GATEC_LAB | 1,000,775 |
| `GI_LAB_RESP_LANC_1_2022` | GATEC_GPI_NEW | 614 |
| `GI_LAB_RESP_LANC_1_2022` | GATEC_LAB | 1,123,373 |
| `GI_LAB_RESP_LANC_1_2023` | GATEC_GPI_NEW | 901,930 |
| `GI_LAB_RESP_LANC_1_2024` | GATEC_GPI_NEW | 602,585 |
| `GI_LAB_RESP_LANC_1_2025` | GATEC_GPI_NEW | 567,691 |
| `GI_LAB_RESP_LANC_1_2026` | GATEC_GPI_NEW | 284,131 |
| `GI_LAB_SUGAR_LAB` | GATEC_GPI_NEW | 2,924 |
| `GI_LAB_SUGAR_LAB` | GATEC_LAB | 2,924 |
| `INT_PORT_LABOR` | GATEC_AZPA | 914,783 |
| `JACK` | GATEC_AGR | 1 |
| `X1` | GATEC_AGR | 189 |

## Versiones y huella de los ejecutables analizados

Versión registrada en GATEC_AGR.GA_AGR_ATU (ATU_MODULO / ATU_VERSAO, última por módulo, consultada el 30/10/2026). null = sin fila en esa tabla.

| Ejecutable | Módulo | Versión | Fecha de la versión | Tamaño | Modificado | SHA-256 |
|---|---|---|---|---|---|---|
| Bal0015 | — | sin registro | — | 154,624 | 2026-10-21 15:10 | `a47b4659e9a9a50eb6459731231f97d02239d314bf66e374c12f4b488dfdf1d6` |
| gatec_cuboaco | — | sin registro | — | 207,872 | 2026-10-21 15:10 | `197fe03ed82cacb6daf3ef162f56584972d26894e1f6145e1eb6906d47b75f3a` |
| gatec_cuboaco_semATR | — | sin registro | — | 208,384 | 2026-10-21 15:10 | `c28c72f00471b37e8202a5b773296efad0ac8306cfe16ca6d516502f82123cd9` |
| GATEC_GPI | — | sin registro | — | 25,247,744 | 2026-10-21 15:10 | `a2206b5a686d452bceceae47b689813cd0d22878c3788cf82a353a11f5c4053b` |
| GAtec_Lab | GATEC_LAB | 5.01.53 (verificada en pantalla) | 2009-04-22 | 892,928 | 2026-10-21 15:10 | `535bf61f2e95bd57df95a6b8d0fb96ac3f9b28acac7e91e181054a12394a8cb8` |
| GAtec_Lat | GATEC_LAT | 5.01.29 | 2015-10-01 | 379,904 | 2026-10-21 15:10 | `6e755a029353f7af08d0c32f7ec77d039bfb17ebfdc4fcef752c9d1d31600ae0` |
| GATEC_MENU | GATEC_MNU | 5.03.00.0039 | 2022-03-02 | 448,000 | 2026-10-21 15:10 | `edc45d8002992978c6703965ae937592ed1e62e4cc0955568cf2a5f3847f34fe` |
| GAtec_Senha | GATEC_SNH | 5.02.03.0053 | 2022-03-03 | 4,395,008 | 2026-10-21 15:10 | `3ad8968d5afac861f3c39a3fec776bf08d47c5ef45b0eff5b2e6e4423dcf1a4b` |
| GAtec_TRA | — | sin registro | — | 201,728 | 2026-10-21 15:10 | `1ac77a83a731cd29d0137bb5687e2a5509a36cbe289c625cb9c6b918e36a5cf7` |

El número que muestra cada programa sale de `GA_AGR_ATU`, no del recurso de versión del exe (en GAtec_Lab dice `1.00`). `GI_LAB_CONTROLE_VERSAO` (5.40.45.0411) y `GAM_LOG_ATUALIZABD` (5.40.46.0411) corresponden al módulo de proceso industrial (GPI).
