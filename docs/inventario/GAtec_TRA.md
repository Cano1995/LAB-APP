# GAtec_TRA — proyecto `GAtec_TRA`

Compilado en **native**. 31 objetos.

## Formularios (11)

| Objeto | Métodos | Controles |
|---|---|---|
| `FrmConfig` | — | 11: AdoGrid, CmdCancela, CmdOk, Form, Frame1, Grid, LblCols, LblVis, Skin, mnuColunas, mnuColunasPopUp |
| `frmGAtecConfigIni` | — | 29: Form, Frame1, Label1, Label10, Label11, Label12, Label2, Label3, Label4, Label5, Label6, Label7, Label8, Label9, Picture1, Skin, cboBD, cboProvider, chkWindowsAuthentication, cmdGA, imgErro, picBar, txtCatalog, txtCodEmpresa, txtDataBase, txtEmpresa, txtSafra, txtSenha, txtUsuario |
| `frmGAtecErroActiveReport` | — | 5: Form, Skin, cmdPrinter, picPrinter, skpToolBar |
| `frmGAtecPrinter` | GetPrinter | 25: Form, Frame1, Frame2, Frame3, ISFrame1, Label1, Label2, Label3, Label4, Label5, Label6, Skin, cboPagAte, cboPagDe, cmdCancel, cmdImpressora, cmdPagAtual, cmdPrint, optColor, optInterval, pctPrinter, txtOrientacion, txtPagTotal, txtPrinter, txtQuality |
| `frmGAtecReport` | — | 16: Cmd, Form, Label1, Label2, Label3, Label5, Skin, arvReport, cboPag, cboZoom, lblPag, lblPagTotal, mnuExport, mnuExportRel, mnuExportaPDF, picToolBar |
| `frmGAtecTrataErro` | — | 18: Form, Frame1, Label1, Label2, Label3, Label4, Label5, Skin, cmdGA, lblFormFunc, picBar, txtArquivo, txtComputador, txtErl, txtFuncao, txtMensagem, txtSql, txtUsuario |
| `frmImpExpCli` | — | 5: Form, FrameExpImp, PgBar, cmdExportar, cmdImportar |
| `frmManutTraducao` | sMontaGrid, sCalculaBrancos_e_Letras, sGravanoBanco, fContaEspacoBranco | 41: CmbLinguas, CmbModulos, CmdAjustarEspacos, CmdCopiar, CmdExpExcel, CmdExpXml, CmdGravar, CmdImpExcel, CmdImpXml, CmdSair, Form, FrameExpImp, GrdTextos, Label1, Label2, Label3, Label4, LblEspDirOri, LblEspEsqOri, LblLetrasTraduz, LblTraducao, PgBar, TxtOri, TxtTraduz, cmdAjustaEspacos, cmdCliente, cmdImpPlanExcelMlang, cmdLocalizar, lblEspDirTrad, lblEspDirTxtOri, lblEspDirTxtTra, lblEspEsqTrad, lblEspEsqTxtOri, lblEspEsqTxtTra, lblEspOri, lblEspTra, lblLetrasOri, lbltxtLetrasOri, lbltxtLetrasTra, optTextos … |
| `FrmPersistirG` | Fecha_Form | 10: CmdCadastrar, Cmd_Cancela, Cmd_OK, Form, GA_GridTool1, GrdPesq, Label1, Skin, SkinLabel1, txtSearch |
| `FrmPesquisa` | — | 11: AdoGrid, CmdCancela, CmdOk, Form, Frame1, Grid, Label1, Skin, Text1, TxtData, TxtNumber |
| `mdiPrincipal` | — | 1: MDIForm |

## Reportes (ActiveReports) (1)

| Objeto | Métodos | Controles |
|---|---|---|
| `ActListagem` | ActiveReport_ReportEnd, ActiveReport_ReportStart, CarregaCabecalho | 6: ActiveReport(2), Cabecalho, Detail, GroupFooter1, PageFooter, PageHeader |

## Módulos (8)

| Objeto | Métodos | Controles |
|---|---|---|
| `basRJInf000013` | — | 0:  |
| `mdlGAtecGrid` | — | 0:  |
| `mdlGAtecProjeto` | — | 0:  |
| `MdlGAtecTraducao` | — | 0:  |
| `MdlModulo` | — | 0:  |
| `mdlRegistro` | — | 0:  |
| `MdlSqlServer` | — | 0:  |
| `ModVersao` | — | 0:  |

## Clases (11)

| Objeto | Métodos | Controles |
|---|---|---|
| `clsFormatColGrid` | Reset, ISSUGDataFilter_AfterGetValue, ISSUGDataFilter_BeforeSetValue, ColumnFormat, ColumnFormat, DataTypeFormat, DataTypeFormat, ApplyFormat, ApplyFormat | 0:  |
| `Coluna` | consist, consist, grava, grava, Visivel, Visivel, Codigo_aut, Codigo_aut, EDITA, EDITA, recebe_valor, recebe_valor, recebe_pai, recebe_pai, dispmask, dispmask, titulo, titulo, editmask, editmask, estrut, estrut, combo, combo, check, check, ordem_desc, ordem_desc, chave, chave, Ordem, Ordem, ColTamanho, ColTamanho, Origem, Origem, carac_minusc, carac_minusc, Rec_Sequence, Rec_Sequence, ChaveComposta, ChaveComposta, alinhamento, alinhamento, GravaCheck, GravaCheck, GravaUnCheck, GravaUnCheck, CompletaCol, CompletaCol, Congela, Congela, Filtro, Filtro, calculo, calculo, CalculoMed, CalculoMed | 0:  |
| `colunas` | Add, iTem, Count, Remove, NewEnum | 0:  |
| `consist` | where, where, coluna_filtro, coluna_filtro, nome_coluna, nome_coluna, Tamanho, Tamanho, chave_tabela, chave_tabela, titulo, titulo, exibe_chave, exibe_chave, tabela, tabela, texto, texto, combo_display, combo_display, join, join, empsafra, empsafra, permitenull, permitenull, colunas, colunas, OrdenaCombo, OrdenaCombo | 0:  |
| `Detail` | classe, classe | 0:  |
| `Details` | Add, iTem, Count, Remove, NewEnum | 0:  |
| `GATecGRID` | ISSUGDataFilter_AfterGetValue, ISSUGDataFilter_BeforeSetValue, Deletar, salvar, desfazer, Create, BeforeCellUpdate, RowActivate, BeforeRowDeactivate, ToolBar, ToolBar, grava, grava, Resize, Resize, tabela, tabela, From, From, where, where, alinhamento, alinhamento, Grid, Grid, Rst, Rst, Master, Master, Details, Details, colunas, colunas, consist, consist, CodEmpr, CodEmpr, SafAnoSafra, SafAnoSafra, Conection, Conection, Form, Form, sql, sql, Incluir, Incluir, Excluir, Excluir, empsafra, empsafra, ChangingRow, ChangingRow, GridObj, GridObj, Alterou, Alterou, Bands, Bands, cClose, RegionScroll, EnterEditMode, PostMessageReceived, Processa_KeyDown, Processa_LostFocus, Processa_Validate, BeforeCellActivate, BtnPressioned, sApagaRow, Update, Update2, IsUpdating, fTiraColAlias, fTiraTabAlias, fCompletaCol, fValidaRow, BeforeRowCancelUpdate, TrataErroPadrao, fColSemAlias, KeyDown, DeletaTudo, sVerificaFocoAtivo | 0:  |
| `GridObj` | MoveFirst, MoveLast, MoveNext, MovePrevious, selectcol, numcols, cad, cad | 0:  |
| `join` | Add, iTem, Count, Remove, NewEnum | 0:  |
| `Master` | join, join | 0:  |
| `relac` | classe, classe, detail_col, detail_col, master_col, master_col | 0:  |

## Tablas referenciadas en el SQL (9)

| Tabla | Menciones | Esquema | Filas (stats) |
|---|---|---|---|
| `GAM_MODULOS_FORMS` | 5 | GATEC_AGR | 551 |
| `GAM_USUARIOS` | 1 | GATEC_AGR | 167 |
| `GA_CONTROLE_GRID` | 3 | GATEC_AGR | 0 |
| `GA_MOD_CONFIG` | 3 | GATEC_AGR | 1,441 |
| `GA_TRA_LINGUAS` | 4 | GATEC_AGR, GATEC_GPI_NEW, GATEC_LAB | 2, 2, 2 |
| `GA_TRA_MODULOS` | 5 | GATEC_AGR, GATEC_AZPA, GATEC_GPI_NEW, GATEC_LAB | 5,251, 3,826, 2,682, 2,682 |
| `GA_TRA_TEXTOS` | 18 | GATEC_AGR, GATEC_AZPA, GATEC_GPI_NEW, GATEC_LAB | 7,039, 6,057, 4,963, 4,963 |
| `GA_TRA_USUARIOS` | 3 | GATEC_AGR, GATEC_GPI_NEW, GATEC_LAB | 14, 111, 108 |
| `SEQUENCES` | 3 | — | (no existe en DESA / temporal / otra base) |

El SQL incrustado completo (97 fragmentos) está en `raw/GAtec_TRA.json` → `sql_fragments`.
