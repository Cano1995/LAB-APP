# gatec_cuboaco_semATR — proyecto `GAtec_CuboAco_SATR`

Compilado en **native**. 27 objetos.

## Formularios (15)

| Objeto | Métodos | Controles |
|---|---|---|
| `FrmConfig` | — | 11: AdoGrid, CmdCancela, Form, Frame1, Grid, LblCols, LblVis, Skin, cmdOk, mnuColunas, mnuColunasPopUp |
| `frmCuboAco` | — | 9: DCube, Form, GA_ToolBar1, Skin, chkFecSal, cmdArea, cmdExportChart, cmdExportExcel, skpToolBar |
| `frmGAtecChart` | AcertaTipoGraph | 19: Form, ISButton1, Image1, Picture1, Skin, TC, TChart1, TeeCommander, TeePreviewPanel1, fraGraph, mniLinSep, mnuColor, mnuConfig, mnuLinSepExibe, mnuLinSepFrente, mnuLogotipo, tblGrafico, tblGrafico2, tblTipoGrafico |
| `frmGAtecConfigIni` | — | 29: Form, Frame1, Label1, Label10, Label11, Label12, Label2, Label3, Label4, Label5, Label6, Label7, Label8, Label9, Picture1, Skin, cboBD, cboProvider, chkWindowsAuthentication, cmdGA, imgErro, picBar, txtCatalog, txtCodEmpresa, txtDataBase, txtEmpresa, txtSafra, txtSenha, txtUsuario |
| `frmGAtecCubeChart` | — | 3: Form, MSChart, Skin |
| `frmGAtecCuboTeeChart` | VisibleExemplo, CarregaListView | 19: Form, Label1, Skin, cmbInfo, cmdOk, cmdSair, cmdVisible, fraOpcoes, fraTipo, imgBarra, imgLinha, imgPizza, lblPontos, optTipoGrafico, tcCubo, tcNavigator, tcToolBar, txtPontos, txtTitulo |
| `frmGAtecErroActiveReport` | — | 5: Form, Skin, cmdPrinter, picPrinter, skpToolBar |
| `frmGAtecGridPesq` | cad1_MostrarSql | 29: DtGrid, Form, NumGrid, Skin, cad, cad1(1), cbocol, cmbDig, cmdCancel, cmdCombo, cmdMarca, cmdMarcaOK, cmdPesq, cmdPesqOK, cmdSel, cmdText, cmde, cmdou, cmdpard, cmdpare, fra, grid3, grid4, hrGrid, lstMediaSoma, t1, t2, txtDig, txtPesq |
| `frmGAtecPrinter` | GetPrinter | 25: Form, Frame1, Frame2, Frame3, ISFrame1, Label1, Label2, Label3, Label4, Label5, Label6, Skin, cboPagAte, cboPagDe, cmdCancel, cmdImpressora, cmdPagAtual, cmdPrint, optColor, optInterval, pctPrinter, txtOrientacion, txtPagTotal, txtPrinter, txtQuality |
| `frmGAtecReport` | — | 16: Cmd, Form, Label1, Label2, Label3, Label5, Skin, arvReport, cboPag, cboZoom, lblPag, lblPagTotal, mnuExport, mnuExportRel, mnuExportaPDF, picToolBar |
| `frmGAtecSomaAreaProd` | — | 10: Form, Frame1, Label1, Label2, Label4, Skin, cmdSair, lblArea, lblProd, lblSelec |
| `frmGAtecTrataErro` | — | 20: Form, Frame1, Label1, Label2, Label3, Label4, Label5, Label6, Skin, TxtVersao, cmdGA, lblFormFunc, picBar, txtArquivo, txtComputador, txtErl, txtFuncao, txtMensagem, txtSql, txtUsuario |
| `frmGridPesq` | — | 26: DtGrid, Form, NumGrid, cad, cad1, cbocol, cmbDig, cmdCombo, cmdMarca, cmdMarcaOK, cmdPesq, cmdPesqOK, cmdSel, cmdText, cmde, cmdou, cmdpard, cmdpare, fra, grid3, grid4, hrGrid, t1, t2, txtDig, txtPesq |
| `FrmPesquisa` | — | 11: AdoGrid, CmdCancela, Form, Frame1, Grid, Label1, Skin, Text1, TxtData, TxtNumber, cmdOk |
| `mdiPrincipal` | — | 12: MDIForm, Skin, Timer1, aniLogo, cmdEmpresa, cmdSafra, lblEmpresa, lblSafra, mnuCuboAcumulado, mnuCuboi, mnuSair, picToolBar |

## Reportes (ActiveReports) (1)

| Objeto | Métodos | Controles |
|---|---|---|
| `ActListagem` | ActiveReport_ReportEnd, ActiveReport_ReportStart, CarregaCabecalho | 6: ActiveReport(2), Cabecalho, Detail, GroupFooter1, PageFooter, PageHeader |

## Módulos (10)

| Objeto | Métodos | Controles |
|---|---|---|
| `basRJInf000140` | — | 0:  |
| `mdlCuboAco` | — | 0:  |
| `mdlGAtecChart` | — | 0:  |
| `mdlGAtecCube` | — | 0:  |
| `mdlGAtecGrid` | — | 0:  |
| `mdlGAtecPlanejamento` | — | 0:  |
| `mdlGAtecProjeto` | — | 0:  |
| `MdlGAtecTraducao` | — | 0:  |
| `MdlSqlServer` | — | 0:  |
| `ModVersao` | — | 0:  |

## Clases (1)

| Objeto | Métodos | Controles |
|---|---|---|
| `clsFormatColGrid` | Reset, ISSUGDataFilter_AfterGetValue, ISSUGDataFilter_BeforeSetValue, ColumnFormat, ColumnFormat, DataTypeFormat, DataTypeFormat, ApplyFormat, ApplyFormat | 0:  |

## Tablas referenciadas en el SQL (22)

| Tabla | Menciones | Esquema | Filas (stats) |
|---|---|---|---|
| `ALL_TAB_COLUMNS` | 1 | — | (no existe en DESA / temporal / otra base) |
| `ALL_VIEWS` | 1 | — | (no existe en DESA / temporal / otra base) |
| `GAM_GRUPO_FORM_ACESSOS` | 3 | GATEC_AGR | 5,111 |
| `GAM_MODULOS_FORMS` | 7 | GATEC_AGR | 551 |
| `GAM_USUARIOS` | 1 | GATEC_AGR | 167 |
| `GAM_USUARIOS_FORM_ACESSOS` | 3 | GATEC_AGR | 6,611 |
| `GAV_ACUM_CUBO` | 2 | — | (no existe en DESA / temporal / otra base) |
| `GA_ACUM_D4` | 3 | — | (no existe en DESA / temporal / otra base) |
| `GA_AREA_LIBER` | 1 | GATEC_AGR | 0 |
| `GA_DIVI4` | 1 | — | (no existe en DESA / temporal / otra base) |
| `GA_EMPR` | 2 | GATEC_AGR | 1 |
| `GA_ESTIM_DIVI4_ATIVA` | 1 | GATEC_AGR | 0 |
| `GA_MOD_CONFIG` | 3 | GATEC_AGR | 1,441 |
| `GA_SAFRAS` | 1 | GATEC_AGR | 21 |
| `GA_SOLOS_DIVI4` | 1 | — | (no existe en DESA / temporal / otra base) |
| `GA_TRA_LINGUAS` | 1 | GATEC_AGR, GATEC_GPI_NEW, GATEC_LAB | 2, 2, 2 |
| `GA_TRA_MODULOS` | 2 | GATEC_AGR, GATEC_AZPA, GATEC_GPI_NEW, GATEC_LAB | 5,251, 3,826, 2,682, 2,682 |
| `GA_TRA_TEXTOS` | 3 | GATEC_AGR, GATEC_AZPA, GATEC_GPI_NEW, GATEC_LAB | 7,039, 6,057, 4,963, 4,963 |
| `GA_TRA_USUARIOS` | 3 | GATEC_AGR, GATEC_GPI_NEW, GATEC_LAB | 14, 111, 108 |
| `GA_VARIE_DIVI4` | 1 | — | (no existe en DESA / temporal / otra base) |
| `SEQUENCES` | 1 | — | (no existe en DESA / temporal / otra base) |
| `SYSOBJECTS` | 2 | — | (no existe en DESA / temporal / otra base) |

El SQL incrustado completo (95 fragmentos) está en `raw/gatec_cuboaco_semATR.json` → `sql_fragments`.
