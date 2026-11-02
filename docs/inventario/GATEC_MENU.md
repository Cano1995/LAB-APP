# GATEC_MENU — proyecto `GAtec_Menu`

Compilado en **native**. 23 objetos.

## Formularios (13)

| Objeto | Métodos | Controles |
|---|---|---|
| `frmConfiguracao` | sAnalisaArvoreeAjusta, fMontaArvoreAcesso, fHierarquiaTreeView, fDelCascade_TabMenuArvore | 12: Form, ListView1, Picture1, Tree, cmdAlterar, cmdExcluir, cmdLog, cmdNovoExe, cmdNovoMenu, cmdNovoSMenu, cmdSair, fmeBotoes |
| `frmFiltro` | R | 17: Form, Frame1, Label1, Label2, chkOperA, chkOperE, chkOperI, chkTipoE, chkTipoP, cmdImprimir, cmdSair, frameDetalhado, framePeriodo, frameStatus, lstUsuarios, txtDataFim, txtDataIni |
| `frmGa` | — | 1: Form |
| `frmGAEmpresa` | GetSafraEmpresa, SetSafraEmpresa | 10: CboSafra, Form, Frame1, Label2, Label5, Label6, cboCodigo, cboEmpresa, cmdGA, picBar |
| `frmGaPassword` | — | 11: Form, Frame1, Skin, cmdGA, lblAntiga, lblConfirmar, lblSenha, picBar, txtAntiga, txtConfirmar, txtSenha |
| `frmGAtecCadUser` | — | 24: Form, Frame1, Label1, Label2, Label3, Label4, Label5, Label6, Label7, Label8, Label9, Skin, TxtUser, cmdGA, cmdSave, fraUser, lblStep3, pb, picBar, picDesc, txtID, txtPWD, txtPWDC, txtRamal |
| `frmGAtecConfigIni` | — | 28: Form, Frame1, Label1, Label10, Label11, Label12, Label2, Label3, Label4, Label5, Label6, Label7, Label8, Label9, Picture1, cboBD, cboProvider, chkWindowsAuthentication, cmdGA, imgErro, picBar, txtCatalog, txtCodEmpresa, txtDataBase, txtEmpresa, txtSafra, txtSenha, txtUsuario |
| `frmGaTecLock` | CreateArqLock, GAtecCrypto, GAtecCryptoOld, GAtecDesCrypto, GAtecDesCryptoOld, FindArray, GAtecShowPassword | 13: Form, Frame1, Label1, Label3, Label7, Label8, Label9, Picture1, cmdGA, imgVal, picBar, txtSenha, txtUsuario |
| `frmGAtecSplashLogin` | SetChangePassword, cmdOK_Click, MsgLostPassword, OKUser, ConfigPicRed | 18: Form, SkinForm1, TxtUser, cmdClose, cmdOk, lblEsqueceuSenha, lblINI, lblLegenda, lblLogin, lblSenha, lblalteruser, picRED, sspBarraProgresso, txtAbout, txtClose, txtLei, txtModulo, txtPWD |
| `frmGAtecTrataErro` | — | 20: Form, Frame1, Label1, Label2, Label3, Label4, Label5, Label6, Skin, TxtVersao, cmdGA, lblFormFunc, picBar, txtArquivo, txtComputador, txtErl, txtFuncao, txtMensagem, txtSql, txtUsuario |
| `FrmGAtecValida` | — | 13: Form, Frame1, Label1, Label3, Label8, Label9, LblValida, Picture1, cmdGA, imgVal, picBar, txtSenha, txtUsuario |
| `frmMenuPrincipal` | Form_Load, HabDesabAcessoControles, sCarregaFavoritos, Tree_Click, sSetaEmpresaSafraUsuario, fAcertaTexto, sTiraFoco, sAcertaSubMenu | 37: Form, Frame1, Frame2, Frame3, Label1, Label2, Label3, LblUsuario, ListFav, ListView1, Picture1, Tree, cmdConf, cmdEmpresa, cmdSafra, cmdSair, cmdTpExibFav, cmdTpExiblstArq, cmdUser, fraToolTip, lblData, lblEmpresa, lblLocal, lblSafra, lblSize, lblTipo, mnuIco, mnuIcoArq, mnuLado, mnuLadoArq, mnuLista, mnuListaArq, mnuTpExib, mnuTpExibArq, picLixeira, tmrCargaIcones, tmrLogon |
| `rptRelLog` | Detail_Format | 3: ActiveReport, Detail(1), PageFooter |

## Módulos (9)

| Objeto | Métodos | Controles |
|---|---|---|
| `basRJInf000072` | — | 0:  |
| `mdlDAMReduzido` | — | 0:  |
| `mdlGatecCons` | — | 0:  |
| `mdlGatecTraducaoMenu` | — | 0:  |
| `mdlMenu` | — | 0:  |
| `mdlProjetoReduzido` | — | 0:  |
| `mdlRegistro` | — | 0:  |
| `MdlSqlServer` | — | 0:  |
| `ModVersao` | — | 0:  |

## Clases (1)

| Objeto | Métodos | Controles |
|---|---|---|
| `MD5` | RegisterA, RegisterB, RegisterC, RegisterD, DigestFileToHexStr, DigestStrToHexStr, GetValues, MD5Init, MD5Final, MD5Update, LongLeftRotate | 0:  |

## Tablas referenciadas en el SQL (29)

| Tabla | Menciones | Esquema | Filas (stats) |
|---|---|---|---|
| `ALL_OBJECTS` | 1 | — | (no existe en DESA / temporal / otra base) |
| `DM_EXEC_CONNECTIONS` | 1 | — | (no existe en DESA / temporal / otra base) |
| `DM_EXEC_SESSIONS` | 1 | — | (no existe en DESA / temporal / otra base) |
| `GAM_CONTROLE_LOGON` | 7 | GATEC_AGR | 134,614 |
| `GAM_GRUPO_FORM_ACESSOS` | 4 | GATEC_AGR | 5,111 |
| `GAM_MODULOS_FORMS` | 13 | GATEC_AGR | 551 |
| `GAM_SENHA_CONFIG_GERAL` | 13 | GATEC_AGR | 1 |
| `GAM_USUARIOS` | 11 | GATEC_AGR | 167 |
| `GAM_USUARIOS_FORM_ACESSOS` | 4 | GATEC_AGR | 6,611 |
| `GAM_USUARIOS_SENHA_VALIDADE` | 4 | GATEC_AGR | 385 |
| `GA_AGR_ATU` | 6 | GATEC_AGR | 72 |
| `GA_EMPR` | 3 | GATEC_AGR | 1 |
| `GA_MENU_ARVORE` | 16 | GATEC_AGR | 9 |
| `GA_MENU_ARV_EXE` | 11 | GATEC_AGR | 7 |
| `GA_MENU_FAVORITO` | 5 | GATEC_AGR | 3 |
| `GA_MENU_LOG` | 2 | GATEC_AGR | 11 |
| `GA_MENU_PARAMETROS` | 1 | GATEC_AGR | 1 |
| `GA_SAFRAS` | 1 | GATEC_AGR | 21 |
| `GA_TRA_LINGUAS` | 1 | GATEC_AGR, GATEC_GPI_NEW, GATEC_LAB | 2, 2, 2 |
| `GA_TRA_MODULOS` | 2 | GATEC_AGR, GATEC_AZPA, GATEC_GPI_NEW, GATEC_LAB | 5,251, 3,826, 2,682, 2,682 |
| `GA_TRA_TEXTOS` | 4 | GATEC_AGR, GATEC_AZPA, GATEC_GPI_NEW, GATEC_LAB | 7,039, 6,057, 4,963, 4,963 |
| `GA_TRA_USUARIOS` | 3 | GATEC_AGR, GATEC_GPI_NEW, GATEC_LAB | 14, 111, 108 |
| `GV$PROCESS` | 1 | — | (no existe en DESA / temporal / otra base) |
| `GV$SESSION` | 1 | — | (no existe en DESA / temporal / otra base) |
| `SEQUENCES` | 4 | — | (no existe en DESA / temporal / otra base) |
| `SYSOBJECTS` | 1 | — | (no existe en DESA / temporal / otra base) |
| `SYSPROCESSES` | 2 | — | (no existe en DESA / temporal / otra base) |
| `V$PROCESS` | 2 | — | (no existe en DESA / temporal / otra base) |
| `V$SESSION` | 2 | — | (no existe en DESA / temporal / otra base) |

El SQL incrustado completo (213 fragmentos) está en `raw/GATEC_MENU.json` → `sql_fragments`.
