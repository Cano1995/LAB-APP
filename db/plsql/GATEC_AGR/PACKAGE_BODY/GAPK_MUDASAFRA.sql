CREATE OR REPLACE Package Body Gapk_MudaSafra As
Procedure Gap_DuplicaMain( sWhere    In     varchar2,
				   sWhereDel In     varchar2,
				   nRepro    In     number,
				   nQuantos  In Out number,
				   nDeletado In Out number,
				 sErro   In Out varchar2,
				   nRetorno  In Out number ) Is
sSelect varchar2(2000) := ' Select ID_DIVI4 From GA_DIVI4 ';
sOrder  varchar2(2000) := ' GA_DIVI4.COD_EMPR,
				    GA_DIVI4.SAF_ANO_SAFRA,
				    GA_DIVI4.COD_DIVI1,
				    GA_DIVI4.COD_DIVI2,
				    GA_DIVI4.COD_DIVI3,
				    GA_DIVI4.COD_DIVI4 ';
nID_DIVI4   number;
curGA_DIVI4 Number;
dat2_corte_plant  date;
dat_corte_plant	  date;
Begin
	nRetorno := 0;
	nFalha   := 0;
	If nRepro = 1 Then
		Gap_DuplicaDeleta( sWhereDel, nFalha );
	End If;
	nDeletado := nLinhas;
	If nFalha = 0 Then
		sSelect := ' Select ID_DIVI4 From GA_DIVI4 Where ' || sWhere || ' Order By ' || sOrder;
		-- Pegando um Handle para o cursor
		curGA_DIVI4 := DBMS_SQL.OPEN_CURSOR;
		-- Executando a comando select contido em sSelect e habilitando curGA_DIVI4
		DBMS_SQL.PARSE( curGA_DIVI4, sSelect, DBMS_SQL.V7 );
		-- Definindo a Colunas/Intos do cursor
		DBMS_SQL.DEFINE_COLUMN( curGA_DIVI4, 1, 6 );
		nLinhas := DBMS_SQL.EXECUTE( curGA_DIVI4 );
		Loop
			Exit When DBMS_SQL.FETCH_ROWS( curGA_DIVI4 )= 0;
			nQuantos := nQuantos + 1;
			DBMS_SQL.COLUMN_VALUE( curGA_DIVI4, 1, nID_DIVI4 );
			Gap_DuplicaInicio( nID_DIVI4, nFalha );
			If nFalha != 0 Then
				Insert Into Log_Erro Values ('Falha na Procedure Gap_DuplicaInicio ' || ' ' ||
							USER || ' ' || to_char( SYSDATE , 'DD-MM-YY HH24:MI:SS ' ) || ' ' ||
									sProcesso || 'nID_DIVI4 =  ' || nID_DIVI4 ||' ' ||
									sErroSql );
				nQuantos := nQuantos - 1;
			End If;
		End Loop;
		DBMS_SQL.CLOSE_CURSOR( curGA_DIVI4 );
		Commit;
	End If;
	nRetorno := nFalha;
	sErro := sErroSql;
	Exception
		When Others Then
			nRetorno := 1;
		  sErroSql := substr(SqlErrm,1,240);
			sErro := sErroSql;
			RollBack;
			Insert Into Log_Erro Values ('Falha na Procedure Gap_DuplicaMain ' || ' ' ||
						  USER || ' ' || to_char( SYSDATE , 'DD-MM-YY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;
End Gap_DuplicaMain;
Procedure Gap_DuplicaInicio( nID_DIVI4 In     Number,
				     nRetorno  in Out Number ) Is
nID_FUNDO_AGRIC  GA_FUNDO_AGRIC.ID_FUNDO_AGRIC%TYPE;
nDIVI4       GA_DIVI4.ID_DIVI4%TYPE;
nID_PART         GA_PART.ID_PART%TYPE;
nCOD_ESTAG_USINA GA_ESTAG_USINA.COD_ESTAG_USINA%TYPE;
nDelReforma number;
Cursor curGA_DIVI4 Is
	Select *
		From GA_DIVI4
		   Where ID_DIVI4 = nID_DIVI4;
regGA_DIVI4 curGA_DIVI4%ROWTYPE;
Cursor curGA_SAFRAS Is
	Select *
		From GA_SAFRAS
		   Where COD_EMPR      = regGA_DIVI4.COD_EMPR
		     And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA + 1;
regGA_SAFRAS curGA_SAFRAS%ROWTYPE;
Cursor curGA_CONF_CPC Is
	Select *
		From GA_CONF_CPC
		   Where COD_EMPR      = regGA_DIVI4.COD_EMPR
		     And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA + 1;
regGA_CONF_CPC curGA_CONF_CPC%ROWTYPE;
Cursor curGA_CONFI_SAFRA Is
	Select *
		From GA_CONFI_SAFRA
		   Where COD_EMPR      = regGA_DIVI4.COD_EMPR
		     And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA + 1;
regGA_CONFI_SAFRA curGA_CONFI_SAFRA%ROWTYPE;
Cursor curGA_PONTO_DESCA Is
	Select *
		From GA_PONTO_DESCA
		   Where COD_EMPR      = regGA_DIVI4.COD_EMPR
		     And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA + 1;
regGA_PONTO_DESCA curGA_PONTO_DESCA%ROWTYPE;
Cursor curGA_CONFI_EMPR_SAFRA Is
	Select *
		From GA_CONFI_EMPR_SAFRA
		   Where COD_EMPR      = regGA_DIVI4.COD_EMPR
		     And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA + 1;
regGA_CONFI_EMPR_SAFRA curGA_CONFI_EMPR_SAFRA%ROWTYPE;
Cursor curGA_PARAM_EMPR_SAFRA Is
	Select *
		From GA_PARAM_EMPR_SAFRA
		   Where COD_EMPR      = regGA_DIVI4.COD_EMPR
		     And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA + 1;
regGA_PARAM_EMPR_SAFRA curGA_PARAM_EMPR_SAFRA%ROWTYPE;
Cursor curGA_DIVI1 Is
	Select *
		From GA_DIVI1
		   Where COD_EMPR      = regGA_DIVI4.COD_EMPR
		     And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA + 1
		     And COD_DIVI1     = regGA_DIVI4.COD_DIVI1;
regGA_DIVI1 curGA_DIVI1%ROWTYPE;
Cursor curGA_DIVI2 Is
	Select *
		From GA_DIVI2
		   Where COD_EMPR      = regGA_DIVI4.COD_EMPR
		     And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA + 1
		     And COD_DIVI1     = regGA_DIVI4.COD_DIVI1
		     And COD_DIVI2     = regGA_DIVI4.COD_DIVI2;
regGA_DIVI2 curGA_DIVI2%ROWTYPE;
Cursor curGA_DIVI3 Is
	Select *
		From GA_DIVI3
		   Where COD_EMPR      = regGA_DIVI4.COD_EMPR
		     And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA + 1
		     And COD_DIVI1     = regGA_DIVI4.COD_DIVI1
		     And COD_DIVI2     = regGA_DIVI4.COD_DIVI2
		     And COD_DIVI3     = regGA_DIVI4.COD_DIVI3;
regGA_DIVI3 curGA_DIVI3%ROWTYPE;
-- seleciona talhoes da safra nova que nao tenham talhoes para reforma na safra anterior --
-- implemetado o select (not in) em 21/03/2001 - paulo - PMedeiros --
Cursor curGA_DIVI4_NEW Is
	Select *
	      From GA_DIVI4
		   Where COD_EMPR      = regGA_DIVI4.COD_EMPR
		     And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA + 1
		     And COD_DIVI1     = regGA_DIVI4.COD_DIVI1
		     And COD_DIVI2     = regGA_DIVI4.COD_DIVI2
		     And COD_DIVI3     = regGA_DIVI4.COD_DIVI3
		     And COD_DIVI4     = regGA_DIVI4.COD_DIVI4;
              /*       And cod_divi4 
					 NOT IN (SELECT D4.COD_DIVI4
					FROM GA_AGRUP A, GA_GRUPOS B, GA_ESPEC C, GA_DIVI4 D4
					WHERE A.COD_EMPR = regGA_DIVI4.COD_EMPR
					AND A.SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA
					AND A.ID_ESPEC = C.ID_ESPEC
					AND C.COD_GRUPO = B.COD_GRUPO
					AND B.COD_GRUPO_PADR = 4
					AND C.abv_espec in ('REF','R','SIM','S')
					AND A.ID_DIVI4 = D4.ID_DIVI4
					AND D4.COD_DIVI1     = regGA_DIVI4.COD_DIVI1
     					AND D4.COD_DIVI2     = regGA_DIVI4.COD_DIVI2
					AND D4.COD_DIVI3     = regGA_DIVI4.COD_DIVI3
					AND D4.COD_DIVI4     = regGA_DIVI4.COD_DIVI4) ;
				*/	
regGA_DIVI4_NEW curGA_DIVI4_NEW%ROWTYPE;
Cursor curGA_FUNDO_AGRIC Is
	Select SAF_ANO_SAFRA,
		 COD_FUNDO_AGRIC
		From GA_FUNDO_AGRIC
		   Where ID_FUNDO_AGRIC = regGA_DIVI4.ID_FUNDO_AGRIC;
regGA_FUNDO_AGRIC curGA_FUNDO_AGRIC%ROWTYPE;
Cursor curID_FUNDO_AGRIC Is
	Select ID_FUNDO_AGRIC
		From GA_FUNDO_AGRIC
		   Where COD_FUNDO_AGRIC = regGA_FUNDO_AGRIC.COD_FUNDO_AGRIC
		     And SAF_ANO_SAFRA   = regGA_FUNDO_AGRIC.SAF_ANO_SAFRA + 1;
regID_FUNDO_AGRIC curID_FUNDO_AGRIC%ROWTYPE;
Cursor curGA_MUDAN_ESTAG Is
	Select *
		From GA_MUDAN_ESTAG
		   Where COD_ESTAG_USINA = regGA_DIVI4.COD_ESTAG_USINA;
regGA_MUDAN_ESTAG curGA_MUDAN_ESTAG%ROWTYPE;
Cursor curGA_SOLOS_DIVI4 Is
	Select *
		From GA_SOLOS_DIVI4
		   Where ID_DIVI4 = nDIVI4;
regGA_SOLOS_DIVI4 curGA_SOLOS_DIVI4%ROWTYPE;
Cursor curGA_VARIE_DIVI4 Is
	Select *
		From GA_VARIE_DIVI4
		   Where ID_DIVI4 = nDIVI4;
regGA_VARIE_DIVI4 curGA_VARIE_DIVI4%ROWTYPE;
Cursor curGA_ROTA_CANA Is
	Select *
		From GA_ROTA_CANA
		   Where ID_DIVI4 = nDIVI4;
regGA_ROTA_CANA curGA_ROTA_CANA%ROWTYPE;
Cursor curGA_ROTA_DIVI4 Is
	Select *
		From GA_ROTA_DIVI4
		   Where ID_DIVI4 = nDIVI4;
regGA_ROTA_DIVI4 curGA_ROTA_DIVI4%ROWTYPE;
Cursor curGA_ROTA_DIVER Is
	Select *
		From GA_ROTA_DIVER
		   Where ID_DIVI4 = nDIVI4;
regGA_ROTA_DIVER curGA_ROTA_DIVER%ROWTYPE;
Cursor curGA_ROTA_DIVI4_DIVI4 Is
	Select *
		From GA_ROTA_DIVI4_DIVI4
		   Where ID_DIVI4 = nDIVI4;
regGA_ROTA_DIVI4_DIVI4 curGA_ROTA_DIVI4_DIVI4%ROWTYPE;
Cursor curGA_AGRUP Is
	Select *
		From GA_AGRUP
		   Where ID_DIVI4 = nDIVI4;
regGA_AGRUP curGA_AGRUP%ROWTYPE;
Cursor curGA_ARRENDAMENTOS Is
	Select *
		From GA_ARRENDAMENTOS
		   Where ID_DIVI4 = nDIVI4;
regGA_ARRENDAMENTOS curGA_ARRENDAMENTOS%ROWTYPE;
Cursor curGA_DIVI4_PART Is
	Select *
		From GA_DIVI4_PART
		   Where ID_DIVI4 = nDIVI4;
regGA_DIVI4_PART curGA_DIVI4_PART%ROWTYPE;
Cursor curGA_DIVI4_PART_ATUAL Is
	Select *
		From GA_DIVI4_PART
		   Where ID_DIVI4 = nID_DIVI4;
regGA_DIVI4_PART_ATUAL curGA_DIVI4_PART_ATUAL%ROWTYPE;
Cursor curGA_PESSO_PART Is
	Select *
		From GA_PESSO_PART
		   Where ID_PART = regGA_DIVI4_PART_ATUAL.ID_PART;
regGA_PESSO_PART curGA_PESSO_PART%ROWTYPE;
cursor curGA_PART is
	select *
		from GA_PART
		   where ID_PART = regGA_DIVI4_PART_ATUAL.ID_PART;
regGA_PART curGA_PART%ROWTYPE;
cursor curGA_PCTS_CONFIG is
       select   *
	 from   GA_PCTS_CONFIG
	 Where  COD_EMPR      = regGA_DIVI4.COD_EMPR
	   And  SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA + 1;
regGA_PCTS_CONFIG curGA_PCTS_CONFIG%ROWTYPE;
Begin
	nRetorno := 0;
	Open curGA_DIVI4;
	Fetch curGA_DIVI4 Into regGA_DIVI4;
	-- Replicando em GA_SAFRAS
	sProcesso := 'Abrindo curGA_SAFRAS';
	Open curGA_SAFRAS;
	Fetch curGA_SAFRAS Into regGA_SAFRAS;
	If curGA_SAFRAS%NOTFOUND Then
		sProcesso := 'Inserindo em GA_SAFRAS';
		Insert Into GA_SAFRAS
		    (    COD_EMPR                       ,
			 SAF_ANO_SAFRA                  ,
			 SAF_SAFRA_EDIT                 ,
			 SAF_DT_INICIO                  ,
			 SAF_DT_FIM                     ,
			 SAF_UNID_MEDID                 ,
			 SAF_DIVI1_SING                 ,
			 SAF_DIVI1_PLUR                 ,
			 SAF_DIVI2_SING                 ,
			 SAF_DIVI2_PLUR                 ,
			 SAF_DIVI3_SING                 ,
			 SAF_DIVI3_PLUR                 ,
			 SAF_DIVI4_SING                 ,
			 SAF_DIVI4_PLUR                 ,
			 SAF_LOGOT                      ,
			 SAF_DT_INI_HOR_ALTER           ,
			 SAF_HR_INI_HOR_ALTER           ,
			 SAF_DT_FIM_HOR_ALTER           ,
			 SAF_HR_FIM_HOR_ALTER           ,
			 SAF_QTD_HR_ALTER               ,
			 SAF_CTRL_HR_ALTER              ,
			 SAF_CTRL_D4_UNICO              ,
			 SAF_D2_IGUAL_FA                ,
                         SAF_D3_IGUAL_D4		,
                         SAF_BUSCA_D3		        ,
			 SAF_ACUM_TON_PROP              ,
			 SAF_ACUM_TON_FORN              ,
			 SAF_ACUM_VIAG_PROP             ,
			 SAF_ACUM_VIAG_FORN)
		   (
			Select
			COD_EMPR                     ,
				 regGA_DIVI4.SAF_ANO_SAFRA + 1,
				 SAF_SAFRA_EDIT                 ,
				 SAF_DT_INICIO                  ,
				 SAF_DT_FIM                     ,
				 SAF_UNID_MEDID                 ,
				 SAF_DIVI1_SING                 ,
				 SAF_DIVI1_PLUR                 ,
				 SAF_DIVI2_SING                 ,
				 SAF_DIVI2_PLUR                 ,
				 SAF_DIVI3_SING                 ,
				 SAF_DIVI3_PLUR                 ,
				 SAF_DIVI4_SING                 ,
				 SAF_DIVI4_PLUR                 ,
				 SAF_LOGOT                      ,
				 SAF_DT_INI_HOR_ALTER + 365     ,
				 SAF_HR_INI_HOR_ALTER           ,
				 SAF_DT_FIM_HOR_ALTER + 365     ,
				 SAF_HR_FIM_HOR_ALTER           ,
				 SAF_QTD_HR_ALTER               ,
				 SAF_CTRL_HR_ALTER              ,
				 SAF_CTRL_D4_UNICO              ,
				 SAF_D2_IGUAL_FA                ,
				 SAF_D3_IGUAL_D4		,
				 SAF_BUSCA_D3		        ,
				 SAF_ACUM_TON_PROP            	,
				 SAF_ACUM_TON_FORN              ,
				 SAF_ACUM_VIAG_PROP             ,
				 SAF_ACUM_VIAG_FORN
			     From GA_SAFRAS
				Where COD_EMPR      = regGA_DIVI4.COD_EMPR
				  And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA);
	End If;
	Close curGA_SAFRAS;
	-- Replicando GA_CONF_CPC
	sProcesso := 'Abrindo curGA_CONF_CPC';
	Open curGA_CONF_CPC;
	Fetch curGA_CONF_CPC Into regGA_CONF_CPC;
	If curGA_CONF_CPC%NOTFOUND Then
		sProcesso := 'Inserindo em GA_CONF_CPC';
		begin
			Insert Into GA_CONF_CPC (
				 COD_EMPR         ,
				 SAF_ANO_SAFRA    ,
				 CPC_HR_INI       ,
				 CPC_HR_FIM       ,
				 CPC_BRUT_TARA  ,
				 CPC_MAX_QC             ,
				 CPC_MIN_QC             ,
				 CPC_CONV_PCTS  ,
				 CPC_PES_MIN_BAL        ,
				 CPC_PES_MAX_BAL        ,
				 CPC_CTR_FUN_PCTS       ,
				 CPC_HR_INI_PCTS        ,
				 CPC_HR_FIM_PCTS  ,
				 CPC_CER_NUMER    ,
				 CPC_TEMPO_ACUM   ,
				 CPC_MODO_SORTEIO ,
				 CPC_INCLUI_CARGAS,
				 CPC_AUTENTICA_AUTOM,
				 CPC_CHK_ESTOURO_ESTIM,
				 CPC_CHK_PTO_DESCARREG,
				 CPC_MOTORISTA    ,
				 CPC_COD_FUNC     ,
				 CPC_INFORMA_BA   ,
				 CPC_IMP_COMP_FORN,
				 CPC_IMP_COMP_TERC,
				 CPC_IMP_COMP_PROPIA,
				 CPC_CTRL_TRAFEGO ,
				 CPC_CTRL_TARA    ,
				 CPC_ALERT_TARA   ,
				 CPC_PERCENT_ALERT_TARA,
				 CPC_FECHA_VIAGEM ,
				 CPC_BLOQUEIA_LIB_ENCER,
				 CPC_ORIG_TIPO_CORTE,
				 CPC_CHK_COL_DIN        ,
				 CPC_LIMPA_VAL_INCORR,
				 COD_MOT_CAN      ,
				 CPC_USA_COL_DT_CARREG,
				 CPC_USA_COL_HR_CARREG,
				 CPC_PROC_ACUM    ,
				 CPC_ATIV_DISPLA_SAIDA,
				 CPC_TIPO_CORTE_LIBER,
				 CPC_FRENTE_TRABA_LIBER,
				 CPC_CALC_TC_LIBER,
				 CPC_CONF_CALC_TQ_TC,
				 CPC_TEMPO_SORT_SONDA,
				 CPC_CHK_PTO_DESC ,
				 CPC_PTO_DESC     ,
				 CPC_DIGIT_CEC    ,
				 CPC_CARAC_CANA_TQ_TC,
				 CPC_BA_JULIETA   ,
				 CPC_NOME_USINA          )
			Select COD_EMPR         ,
				 SAF_ANO_SAFRA + 1,
				 CPC_HR_INI       ,
				 CPC_HR_FIM       ,
				 CPC_BRUT_TARA    ,
				 CPC_MAX_QC             ,
				 CPC_MIN_QC             ,
				 CPC_CONV_PCTS  ,
				 CPC_PES_MIN_BAL        ,
				 CPC_PES_MAX_BAL        ,
				 CPC_CTR_FUN_PCTS       ,
				 CPC_HR_INI_PCTS        ,
				 CPC_HR_FIM_PCTS  ,
				 CPC_CER_NUMER    ,
				 CPC_TEMPO_ACUM   ,
				 CPC_MODO_SORTEIO ,
				 CPC_INCLUI_CARGAS,
				 CPC_AUTENTICA_AUTOM,
				 CPC_CHK_ESTOURO_ESTIM,
				 CPC_CHK_PTO_DESCARREG,
				 CPC_MOTORISTA    ,
				 CPC_COD_FUNC     ,
				 CPC_INFORMA_BA   ,
				 CPC_IMP_COMP_FORN,
				 CPC_IMP_COMP_TERC,
				 CPC_IMP_COMP_PROPIA,
				 CPC_CTRL_TRAFEGO ,
				 CPC_CTRL_TARA    ,
				 CPC_ALERT_TARA   ,
				 CPC_PERCENT_ALERT_TARA,
				 CPC_FECHA_VIAGEM ,
				 CPC_BLOQUEIA_LIB_ENCER,
				 CPC_ORIG_TIPO_CORTE,
				 CPC_CHK_COL_DIN        ,
				 CPC_LIMPA_VAL_INCORR,
				 COD_MOT_CAN      ,
				 CPC_USA_COL_DT_CARREG,
				 CPC_USA_COL_HR_CARREG,
				 CPC_PROC_ACUM    ,
				 CPC_ATIV_DISPLA_SAIDA,
				 CPC_TIPO_CORTE_LIBER,
				 CPC_FRENTE_TRABA_LIBER,
				 CPC_CALC_TC_LIBER,
				 CPC_CONF_CALC_TQ_TC,
				 CPC_TEMPO_SORT_SONDA,
				 CPC_CHK_PTO_DESC ,
				 CPC_PTO_DESC     ,
				 CPC_DIGIT_CEC    ,
				 CPC_CARAC_CANA_TQ_TC,
				 CPC_BA_JULIETA   ,
				 CPC_NOME_USINA
				From GA_CONF_CPC
				   Where COD_EMPR      = regGA_DIVI4.COD_EMPR
				     And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA;
		Exception
		When Others Then
			nFalha := 5;
		  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
			Insert Into Log_Erro Values ('Falha no Insert ga_conf_cpc ' || ' ' ||
						  USER || ' ' || to_char( SYSDATE , 'DD-MM-YY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
		return;
		end;
	End If;
	Close curGA_CONF_CPC;
	-- Replicando GA_CONFI_SAFRA
	sProcesso := 'Abrindo curGA_CONFI_SAFRA';
	Open curGA_CONFI_SAFRA;
	Fetch curGA_CONFI_SAFRA Into regGA_CONFI_SAFRA;
	If curGA_CONFI_SAFRA%NOTFOUND Then
		sProcesso := 'Inserindo em GA_CONFI_SAFRA';
		begin
		insert Into GA_CONFI_SAFRA (
				 COD_EMPR                    ,
				 SAF_ANO_SAFRA               ,
				 CSA_NUMER_LIBER             ,
				 CSA_NIVEL_DIGIT_AREAS       ,
				 CSA_DIGIT_CONTR             ,
				 CSA_DIGIT_FUNCI             ,
				 CSA_DIGIT_MIS               ,
				 CSA_LIBERA_CRACHA           ,
				 CSA_QTDE_AREA               ,
				 CSA_OBTER_FUNDO             ,
				 CSA_LIMITE_DATA             ,
				 CSA_DIGITA_BROCA            ,
				 CSA_MONTA_NUMERO            ,
				 CSA_MONTA_CRACHA            ,
				 CSA_CORTE_MAN               ,
				 CSA_CORTE_MEC               ,
				 CSA_CONS_CRACHA             ,
				 CSA_TAM_D1                  ,
				 CSA_TAM_D2                  ,
				 CSA_TAM_D3                  ,
				 CSA_TAM_D4                  ,
				 CSA_TAM_SEQ                 ,
				 CSA_COMUNIC_QUEIMA          ,
				 CSA_CICLO_DIFER             ,
				 CSA_MASC_CGC                ,
				 CSA_MASC_IE                 ,
				 CSA_AUTORIZ                 ,
				 CSA_PCTS                    ,
         CSA_MASC_CPF                ,
         CSA_MASC_PCTS               ,
         GA_TAM_D3                   ,
         GA_TAM_D2                   ,
         GA_TAM_D1                   ,
         CSA_CONS_FREN_CRACHA        ,
         CONS_REDE                   ,
         CSA_PONDERA_DT_ULT_CORTE    ,
         CSA_MASC_INCRA              ,
         CSA_CRIA_LIB_IGUAL_OS       ,
         CSA_NIVEL_SUBPRO_GRUPO      ,
         CSA_CONS_REDE               ,
         CSA_ID_CARGO                ,
         CSA_CRIA_OS                 ,
         CSA_CARENCIA_PRODU_APLICADOS)
			select COD_EMPR                ,
				 SAF_ANO_SAFRA + 1           ,
				 CSA_NUMER_LIBER             ,
				 CSA_NIVEL_DIGIT_AREAS       ,
				 CSA_DIGIT_CONTR             ,
				 CSA_DIGIT_FUNCI             ,
				 CSA_DIGIT_MIS               ,
				 CSA_LIBERA_CRACHA           ,
				 CSA_QTDE_AREA               ,
				 CSA_OBTER_FUNDO             ,
				 CSA_LIMITE_DATA             ,
				 CSA_DIGITA_BROCA            ,
				 CSA_MONTA_NUMERO            ,
				 CSA_MONTA_CRACHA            ,
				 CSA_CORTE_MAN               ,
				 CSA_CORTE_MEC               ,
				 CSA_CONS_CRACHA             ,
				 CSA_TAM_D1                  ,
				 CSA_TAM_D2                  ,
				 CSA_TAM_D3                  ,
				 CSA_TAM_D4                  ,
				 CSA_TAM_SEQ                 ,
				 CSA_COMUNIC_QUEIMA          ,
				 CSA_CICLO_DIFER             ,
				 CSA_MASC_CGC                ,
				 CSA_MASC_IE                 ,
				 CSA_AUTORIZ                 ,
				 CSA_PCTS                    ,
         CSA_MASC_CPF                ,
         CSA_MASC_PCTS               ,
         GA_TAM_D3                   ,
         GA_TAM_D2                   ,
         GA_TAM_D1                   ,
         CSA_CONS_FREN_CRACHA        ,
         CONS_REDE                   ,
         CSA_PONDERA_DT_ULT_CORTE    ,
         CSA_MASC_INCRA              ,
         CSA_CRIA_LIB_IGUAL_OS       ,
         CSA_NIVEL_SUBPRO_GRUPO      ,
         CSA_CONS_REDE               ,
         CSA_ID_CARGO                ,
         CSA_CRIA_OS                 ,
         CSA_CARENCIA_PRODU_APLICADOS
				from GA_CONFI_SAFRA
				   where COD_EMPR      = regGA_DIVI4.COD_EMPR
				     and SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA;
		Exception
		When Others Then
			nFalha := 5;
		  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
			Insert Into Log_Erro Values ('Falha no Insert ga_confi_safra ' || ' ' ||
						  USER || ' ' || to_char( SYSDATE , 'DD-MM-YY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
		return;
		end;
	End If;
	Close curGA_CONFI_SAFRA;
dbms_output.put_line('Replica GA_CONFI_EMPR_SAFRA ') ;
	-- Replicando GA_CONFI_EMPR_SAFRA
	sProcesso := 'Abrindo curGA_CONFI_EMPR_SAFRA';
	Open curGA_CONFI_EMPR_SAFRA;
	Fetch curGA_CONFI_EMPR_SAFRA Into regGA_CONFI_EMPR_SAFRA;
	If curGA_CONFI_EMPR_SAFRA%NOTFOUND Then
		sProcesso := 'Inserindo em GA_CONFI_EMPR_SAFRA';
		Insert Into GA_CONFI_EMPR_SAFRA
		  ( COD_EMPR        ,
		   SAF_ANO_SAFRA    ,
		   COD_GRUPO        ,
		   COD_SUBGR        ,
		   COD_GRUPO_ESTIM  ,
		   COD_SUBGR_ESTIM  ,
		   CES_NUMER_AUTOM  ,
		   CES_VOL_TITUL    ,
		   CES_LS           ,
		   CES_AR           ,
		   CES_CLARIF       ,
		   CES_PER_PONDE    ,
		   CES_CONF_ROTA    ,
		   CES_MARGE_SEGUR  ,
		   CES_TONEL_PREVI  ,
		   CES_DISTAN_AUTOM ,
		   CES_AMOSTRA_MIN  ,
		   CES_NUM_AMOSTRA  ,
		   CES_CALC_MED_PRE )
		       ( Select   COD_EMPR         ,
				 SAF_ANO_SAFRA + 1,
				 COD_GRUPO        ,
				 COD_SUBGR        ,
				 COD_GRUPO_ESTIM  ,
				 COD_SUBGR_ESTIM  ,
				 CES_NUMER_AUTOM  ,
				 CES_VOL_TITUL    ,
				 CES_LS           ,
				 CES_AR           ,
				 CES_CLARIF       ,
				 CES_PER_PONDE    ,
				 CES_CONF_ROTA    ,
				 CES_MARGE_SEGUR  ,
				 CES_TONEL_PREVI  ,
				 CES_DISTAN_AUTOM ,
				 CES_AMOSTRA_MIN  ,
				 CES_NUM_AMOSTRA  ,
				 CES_CALC_MED_PRE
				From GA_CONFI_EMPR_SAFRA
				   Where COD_EMPR      = regGA_DIVI4.COD_EMPR
				     And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA);
	End If;
	Close curGA_CONFI_EMPR_SAFRA;
-- Replicando GA_PONTO_DESCA
	sProcesso := 'Abrindo curGA_PONTO_DESCA';
	Open curGA_PONTO_DESCA;
	Fetch curGA_PONTO_DESCA Into regGA_PONTO_DESCA;
	If curGA_PONTO_DESCA%NOTFOUND Then
			sProcesso := 'Inserindo em GA_PONTO_DESCA';
			Insert Into GA_PONTO_DESCA
			(COD_EMPR               ,
			 SAF_ANO_SAFRA          ,
			 ID_HILO                ,
			 DSC_HILO               ,
			 ABV_HILO               ,
			 HIL_CAPAC              ,
			 FLAG_ESTOQ_PONTO       ,
			 PTO_PONTO_MOAGEM       )
			       ( Select
					COD_EMPR 	,
					SAF_ANO_SAFRA+1 ,
					ID_HILO         ,
					DSC_HILO        ,
					ABV_HILO        ,
					HIL_CAPAC       ,
					FLAG_ESTOQ_PONTO,
					PTO_PONTO_MOAGEM
				 From 	GA_PONTO_DESCA
				 Where 	COD_EMPR      = regGA_DIVI4.COD_EMPR
			         And 	SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA);
	End If;
	Close curGA_PONTO_DESCA;
-- Replicando GA_PARAM_EMPR_SAFRA
	sProcesso := 'Abrindo curGA_PARAM_EMPR_SAFRA';
	Open curGA_PARAM_EMPR_SAFRA;
	Fetch curGA_PARAM_EMPR_SAFRA Into regGA_PARAM_EMPR_SAFRA;
	If curGA_PARAM_EMPR_SAFRA%NOTFOUND Then
		sProcesso := 'Inserindo em GA_PARAM_EMPR_SAFRA';
		Insert Into GA_PARAM_EMPR_SAFRA
		       (COD_EMPR             ,
			SAF_ANO_SAFRA        ,
			PAR_BRIX_MINIM       ,
			PAR_BRIX_MAXIM       ,
			PAR_LS_MINIM         ,
			PAR_LS_MAXIM         ,
			PAR_PBU_MINIM        ,
			PAR_PBU_MAXIM        ,
			PAR_AR_MINIM         ,
			PAR_AR_MAXIM         ,
			PAR_VOLUM_DILUI_MINIM,
			PAR_VOLUM_DILUI_MAXIM,
			PAR_TITUL_MINIM      ,
			PAR_TITUL_MAXIM      ,
			PAR_PUREZ_MINIM      ,
			PAR_PUREZ_MAXIM      ,
			PAR_POL_CALDO_MINIM  ,
			PAR_POL_CALDO_MAXIM  ,
			PAR_EST_PROD_MINIM   ,
			PAR_EST_PROD_MAXIM   ,
				PAR_PBU_DESFIBRADO_MIN  ,
			PAR_PBU_DESFIBRADO_MAX  ,
				PAR_BRIX_MINIM_CTC      ,
				PAR_BRIX_MAXIM_CTC      ,
				PAR_LS_MINIM_CTC        ,
				PAR_LS_MAXIM_CTC        ,
				PAR_PBU_MINIM_CTC       ,
				PAR_PBU_MAXIM_CTC       ,
				PAR_AR_MINIM_CTC        ,
				PAR_AR_MAXIM_CTC        ,
				PAR_VOLUM_DILUI_MINIM_CTC,
				PAR_VOLUM_DILUI_MAXIM_CTC,
				PAR_TITUL_MINIM_CTC     ,
				PAR_TITUL_MAXIM_CTC     ,
				PAR_PUREZ_MINIM_CTC     ,
				PAR_PUREZ_MAXIM_CTC     ,
				PAR_POL_CALDO_MINIM_CTC ,
				PAR_POL_CALDO_MAXIM_CTC ,
				PAR_EST_PROD_MINIM_CTC  ,
				PAR_EST_PROD_MAXIM_CTC  ,
				PAR_PBU_DESFIBRADO_MIN_CTC,
				PAR_PBU_DESFIBRADO_MAX_CTC                    )
				(Select
					COD_EMPR             ,
						SAF_ANO_SAFRA + 1    ,
						PAR_BRIX_MINIM       ,
						PAR_BRIX_MAXIM       ,
						PAR_LS_MINIM         ,
						PAR_LS_MAXIM         ,
						PAR_PBU_MINIM        ,
						PAR_PBU_MAXIM        ,
						PAR_AR_MINIM         ,
						PAR_AR_MAXIM         ,
						PAR_VOLUM_DILUI_MINIM,
						PAR_VOLUM_DILUI_MAXIM,
						PAR_TITUL_MINIM      ,
						PAR_TITUL_MAXIM      ,
						PAR_PUREZ_MINIM      ,
						PAR_PUREZ_MAXIM      ,
						PAR_POL_CALDO_MINIM  ,
						PAR_POL_CALDO_MAXIM  ,
						PAR_EST_PROD_MINIM   ,
					PAR_EST_PROD_MAXIM   ,
						PAR_PBU_DESFIBRADO_MIN  ,
					PAR_PBU_DESFIBRADO_MAX  ,
						PAR_BRIX_MINIM_CTC      ,
						PAR_BRIX_MAXIM_CTC      ,
						PAR_LS_MINIM_CTC        ,
						PAR_LS_MAXIM_CTC        ,
						PAR_PBU_MINIM_CTC       ,
						PAR_PBU_MAXIM_CTC       ,
						PAR_AR_MINIM_CTC        ,
						PAR_AR_MAXIM_CTC        ,
						PAR_VOLUM_DILUI_MINIM_CTC,
						PAR_VOLUM_DILUI_MAXIM_CTC,
						PAR_TITUL_MINIM_CTC     ,
						PAR_TITUL_MAXIM_CTC     ,
						PAR_PUREZ_MINIM_CTC     ,
						PAR_PUREZ_MAXIM_CTC     ,
						PAR_POL_CALDO_MINIM_CTC ,
						PAR_POL_CALDO_MAXIM_CTC ,
						PAR_EST_PROD_MINIM_CTC  ,
						PAR_EST_PROD_MAXIM_CTC  ,
						PAR_PBU_DESFIBRADO_MIN_CTC,
						PAR_PBU_DESFIBRADO_MAX_CTC
					From  GA_PARAM_EMPR_SAFRA
					Where COD_EMPR      = regGA_DIVI4.COD_EMPR
				And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA);
	End If;
	Close curGA_PARAM_EMPR_SAFRA;
	-- Replicando GA_DIVI1
	sProcesso := 'Abrindo curGA_DIVI1';
	Open curGA_DIVI1;
	Fetch curGA_DIVI1 Into regGA_DIVI1;
	If curGA_DIVI1%NOTFOUND Then
		sProcesso := 'Inserindo em GA_DIVI1';
		Insert Into GA_DIVI1
			Select COD_EMPR         ,
				 SAF_ANO_SAFRA + 1,
				 COD_DIVI1            ,
				 DSC_DIVI1        ,
				 ABV_DIVI1
			    From GA_DIVI1
			       Where COD_EMPR      = regGA_DIVI4.COD_EMPR
				   And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA
				   And COD_DIVI1     = regGA_DIVI4.COD_DIVI1;
	End If;
	Close curGA_DIVI1;
	-- Replicando GA_DIVI2
	sProcesso := 'Abrindo curGA_DIVI2';
	Open curGA_DIVI2;
	Fetch curGA_DIVI2 Into regGA_DIVI2;
	If curGA_DIVI2%NOTFOUND Then
		sProcesso := 'Inserindo em GA_DIVI2';
		         Insert Into GA_DIVI2
				(COD_EMPR,
				 SAF_ANO_SAFRA,
				 COD_DIVI1,
				 COD_DIVI2,
				 DSC_DIVI2,
				 ABV_DIVI2,
				 DI2_DIST_MED_T1,
				 DI2_DIST_MED_T2,
				 DI2_DIST_MED_ASF,
				 DI2_SALDO_PRODU,
				 ID_FUNDO_AGRIC)
			 (Select  COD_EMPR         ,
				SAF_ANO_SAFRA + 1,
				COD_DIVI1            ,
				COD_DIVI2              ,
				DSC_DIVI2        ,
				ABV_DIVI2              ,
				DI2_DIST_MED_T1  ,
				DI2_DIST_MED_T2  ,
				DI2_DIST_MED_ASF ,
				DI2_SALDO_PRODU,
				ID_FUNDO_AGRIC
			 From   GA_DIVI2
			 Where COD_EMPR      = regGA_DIVI4.COD_EMPR
				   And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA
				   And COD_DIVI1     = regGA_DIVI4.COD_DIVI1
				   And COD_DIVI2     = regGA_DIVI4.COD_DIVI2);
	End If;
	Close curGA_DIVI2;
	-- Replicando GA_DIVI3
	sProcesso := 'Abrindo em curGA_DIVI3';
	Open curGA_DIVI3;
	Fetch curGA_DIVI3 Into regGA_DIVI3;
	If curGA_DIVI3%NOTFOUND Then
		sProcesso := 'Inserindo em GA_DIVI3';
		Insert Into GA_DIVI3
			Select COD_EMPR         ,
				 SAF_ANO_SAFRA + 1,
				 COD_DIVI1            ,
				 COD_DIVI2              ,
				 COD_DIVI3              ,
				 DSC_DIVI3        ,
				 ABV_DIVI3
			    From GA_DIVI3
			       Where COD_EMPR      = regGA_DIVI4.COD_EMPR
				   And SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA
				   And COD_DIVI1     = regGA_DIVI4.COD_DIVI1
				   And COD_DIVI2     = regGA_DIVI4.COD_DIVI2
				   And COD_DIVI3     = regGA_DIVI4.COD_DIVI3;
	End If;
	Close curGA_DIVI3;
	-- Replicando Fundo Agricola
	sProcesso := 'Abrindo curGA_FUNDO_AGRIC';
	Open curGA_FUNDO_AGRIC;
	Fetch curGA_FUNDO_AGRIC Into regGA_FUNDO_AGRIC;
	Open curID_FUNDO_AGRIC;
	Fetch curID_FUNDO_AGRIC Into regID_FUNDO_AGRIC;
	If curID_FUNDO_AGRIC%NOTFOUND Then
		nID_FUNDO_AGRIC := Gaf_Sequencia( 'GA_FUNDO_AGRIC','ID_FUNDO_AGRIC', 5 ) + 1;
		sProcesso := 'Inserindo em GA_FUNDO_AGRIC';
		Insert Into GA_FUNDO_AGRIC
			(ID_FUNDO_AGRIC, COD_EMPR, SAF_ANO_SAFRA, COD_PAGTO_FORNEC,
			 COD_FUNDO_AGRIC, COD_PROP, MUN_CEP, ID_CARAC, ID_PREVID,
			 FAG_NOME, FAG_ABREV, FAG_UF, FAG_INSC_ESTAD, FAG_CGC,
			 FAG_CPF, FAG_INSC_IAA, FAG_INSC_INCRA, FAG_COTA,FAG_CTRL_AREA,
			 ID_ASSOC_FORNEC,COD_SERVI,FAG_FK_72,FAG_FK_120,FAG_NAT_OPERAC,COD_PROP_TERRA,
			 FAG_PCO_FIXO,FAG_PERC_NF,FAG_COND_PAGTO, ID_FUNDO_AGRIC_COND,
			 ID_FUNDO_AGRIC_NF)
			(Select nID_FUNDO_AGRIC,
				 COD_EMPR,
				 SAF_ANO_SAFRA + 1,
				 COD_PAGTO_FORNEC,
			      	 COD_FUNDO_AGRIC,
				 COD_PROP,
				 MUN_CEP,
				 ID_CARAC,
				 ID_PREVID,
				 FAG_NOME,
				 FAG_ABREV,
				 FAG_UF,
				 FAG_INSC_ESTAD,
				 FAG_CGC,
				 FAG_CPF,
				 FAG_INSC_IAA,
			    	 FAG_INSC_INCRA,
				 FAG_COTA,
				 FAG_CTRL_AREA,
				 ID_ASSOC_FORNEC,
				 COD_SERVI,
				 FAG_FK_72,
				 FAG_FK_120,
				 FAG_NAT_OPERAC,
				 COD_PROP_TERRA,
				 FAG_PCO_FIXO,
				 FAG_PERC_NF,
				 FAG_COND_PAGTO,
				 ID_FUNDO_AGRIC_COND,
				 ID_FUNDO_AGRIC_NF
			     From GA_FUNDO_AGRIC
				  Where ID_FUNDO_AGRIC = regGA_DIVI4.ID_FUNDO_AGRIC);
	Else
		nID_FUNDO_AGRIC := regID_FUNDO_AGRIC.ID_FUNDO_AGRIC;
	End If;
	Close curGA_FUNDO_AGRIC;
	Close curID_FUNDO_AGRIC;
	-- Replicando GA_DIVI4
	sProcesso := 'Abrindo curGA_DIVI4_NEW';
	Open curGA_DIVI4_NEW;
	Fetch curGA_DIVI4_NEW Into regGA_DIVI4_NEW;
	If curGA_DIVI4_NEW%NOTFOUND Then
		sProcesso := 'Abrindo curGA_MUDAN_ESTAG';
		Open curGA_MUDAN_ESTAG;
		Fetch curGA_MUDAN_ESTAG Into regGA_MUDAN_ESTAG;
		-- Ver qual o proximo estágio de corte utilizado pela quadra
		-- A consistencia anterior era regGA_DIVI4.DI4_DT_CORTE_ATUAL = null
		-- Mesmo o campo estando null, nao retorna verdadeiro, talvez por ser do tipo data,
		-- usando nvl(TO_CHAR(regGA_DIVI4.DI4_DT_CORTE_ATUAL),'NAO TEM') = 'NAO TEM'
		-- para evitar esta problema
		If curGA_MUDAN_ESTAG%FOUND Then
			If nvl(TO_CHAR(regGA_DIVI4.DI4_DT_CORTE_ATUAL),'NAO TEM') = 'NAO TEM' Then
				nCOD_ESTAG_USINA := regGA_MUDAN_ESTAG.COD_SC_ESTAG_USINA;
			Else
				nCOD_ESTAG_USINA := regGA_MUDAN_ESTAG.COD_CC_ESTAG_USINA;
			End If;
		Else
			nCOD_ESTAG_USINA := regGA_DIVI4.COD_ESTAG_USINA;
		End If;
		Close curGA_MUDAN_ESTAG;
		nDIVI4 := Gaf_Sequencia( 'GA_DIVI4' , 'ID_DIVI4', 6 ) + 1;
		sProcesso := 'Inserindo em GA_DIVI4';
		Insert Into GA_DIVI4
		   (ID_DIVI4,
		    COD_EMPR,
		    SAF_ANO_SAFRA,
		    COD_DIVI1,
		    COD_DIVI2,
		    COD_DIVI3,
		    COD_DIVI4,
		    ID_FUNDO_AGRIC,
		    COD_ESTAG_USINA,
		    MUN_CEP,
		    DI4_AREA_TOTAL,
		    DI4_AREA_INUTI,
		    DI4_AREA_CARRE,
		    DI4_ESPAC,
		    DI4_DECLI,
		    DI4_SITUA,
		    DI4_DT_PLANT,
		    DI4_DT_CORTE_ANTER,
		    DI4_DT_PRIM_CORTE,
		    DI4_DT_CORTE_ATUAL,
		    DI4_LATIT,
		    DI4_LONG,
		    DI4_ALTIT,
		    DI4_COORD_ORTOG_X,
		    DI4_COORD_ORTOG_Y,
		    DI4_COORD_ORTOG_Z,
		    DI4_PER_URB_LEGAL,
		    DI4_PER_URB_EFET,
		    DI4_DT_DIGIT,
		    DI4_HR_DIGIT,
		    DI4_OPER_DIGIT,
		    DI4_PERC_MEC,
        DI4_ESPAC2,
        COD_CULTU_AGRIC)
			    (Select
			      nDIVI4                    ,
			      COD_EMPR                  ,
			      SAF_ANO_SAFRA + 1         ,
			      COD_DIVI1                 ,
			      COD_DIVI2,
			      COD_DIVI3,
			      COD_DIVI4,
			      nID_FUNDO_AGRIC,
			      nCOD_ESTAG_USINA,
			      MUN_CEP,
			      DI4_AREA_TOTAL,
			      DI4_AREA_INUTI,
			      DI4_AREA_CARRE,
			      DI4_ESPAC,
			      DI4_DECLI,
			      0,
			      DI4_DT_PLANT,
			      nvl( DI4_DT_CORTE_ATUAL,DI4_DT_CORTE_ANTER ),
			      DI4_DT_PRIM_CORTE,
			      NULL,
			      DI4_LATIT,
			      DI4_LONG,
			      DI4_ALTIT,
			      DI4_COORD_ORTOG_X,
			      DI4_COORD_ORTOG_Y,
			      DI4_COORD_ORTOG_Z,
			      DI4_PER_URB_LEGAL,
			      DI4_PER_URB_EFET,
			      DI4_DT_DIGIT,
			      DI4_HR_DIGIT,
			      DI4_OPER_DIGIT,
			      DI4_PERC_MEC,
            DI4_ESPAC2,
            COD_CULTU_AGRIC
			    From GA_DIVI4
		      Where ID_DIVI4 = nID_DIVI4);
	        close curGA_DIVI4_NEW;
		Open curGA_DIVI4_NEW;
		Fetch curGA_DIVI4_NEW Into regGA_DIVI4_NEW;
	Else
		nDIVI4 := regGA_DIVI4_NEW.ID_DIVI4;
		sProcesso := 'Abrindo curGA_MUDAN_ESTAG';
		Open curGA_MUDAN_ESTAG;
		Fetch curGA_MUDAN_ESTAG Into regGA_MUDAN_ESTAG;
		If curGA_MUDAN_ESTAG%FOUND Then
			If nvl(TO_CHAR(regGA_DIVI4.DI4_DT_CORTE_ATUAL),'NAO TEM') = 'NAO TEM' Then
				nCOD_ESTAG_USINA := regGA_MUDAN_ESTAG.COD_SC_ESTAG_USINA;
			Else
				nCOD_ESTAG_USINA := regGA_MUDAN_ESTAG.COD_CC_ESTAG_USINA;
			End If;
		Else
			nCOD_ESTAG_USINA := regGA_DIVI4.COD_ESTAG_USINA;
		End If;
		Close curGA_MUDAN_ESTAG;
            ---  Se Talhão já duplicado anteriormente p/próxima safra,
            ---  atualizar a data do corte anterior igual a data do corte atual
            ---  do mesmo talhão da safra anterior
            declare
                 dat_corte_atu         date;
            begin
                 select DI4_DT_CORTE_ATUAL
                 into   dat_corte_atu
                 from   GA_DIVI4
                 WHERE  cod_divi1 = regGA_DIVI4_NEW.cod_divi1
                   and  cod_divi2 = regGA_DIVI4_NEW.cod_divi2
                   and  cod_divi3 = regGA_DIVI4_NEW.cod_divi3
                   and  cod_divi4 = regGA_DIVI4_NEW.cod_divi4
                   and  cod_empr  = regGA_DIVI4_NEW.cod_empr
                   and  saf_ano_safra = (regGA_DIVI4_NEW.saf_ano_safra -1);
             -----
                 Update GA_DIVI4
                 Set    DI4_DT_CORTE_ANTER = dat_corte_atu,
                        DI4_DT_CORTE_ATUAL = Null,
		  	COD_ESTAG_USINA    = nCOD_ESTAG_USINA
                 where  ID_DIVI4 = regGA_DIVI4_NEW.ID_DIVI4;
		Exception
		When Others Then
			nFalha := 5;
		  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
			Insert Into Log_Erro Values ('Falha na data de Corte ' || ' ' ||
						  USER || ' ' || to_char( SYSDATE , 'DD-MM-YY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
		return;
            end;
        End If;
	-- Duplicando variedades
	sProcesso := 'Abrindo curGA_VARIE_DIVI4';
	Open curGA_VARIE_DIVI4;
	Fetch curGA_VARIE_DIVI4 Into regGA_VARIE_DIVI4;
	If curGA_VARIE_DIVI4%NOTFOUND Then
		sProcesso := 'Inserindo em GA_VARIE_DIVI4';
		Insert Into GA_VARIE_DIVI4
			Select COD_VARIE_USINA,
				 nDIVI4,
				 VAR_AREA
				From GA_VARIE_DIVI4
				   Where ID_DIVI4 = regGA_DIVI4.ID_DIVI4;
	End If;
	Close curGA_VARIE_DIVI4;
	-- Duplicando Solos
	sProcesso := 'Abrindo curGA_SOLOS_DIVI4';
	Open curGA_SOLOS_DIVI4;
	Fetch curGA_SOLOS_DIVI4 Into regGA_SOLOS_DIVI4;
	If curGA_SOLOS_DIVI4%NOTFOUND Then
		sProcesso := 'Inserindo em GA_SOLOS_DIVI4';
		Insert Into GA_SOLOS_DIVI4
			Select nDIVI4,
				 COD_SOLO_USINA,
				 SOL_AREA
				From GA_SOLOS_DIVI4
				   Where ID_DIVI4 = regGA_DIVI4.ID_DIVI4;
	End If;
	Close curGA_SOLOS_DIVI4;
	-- Duplicando as Rotas
	sProcesso := 'Abrindo curGA_ROTA_DIVI4';
	Open curGA_ROTA_DIVI4;
	Fetch curGA_ROTA_DIVI4 Into regGA_ROTA_DIVI4;
	If curGA_ROTA_DIVI4%NOTFOUND Then
		sProcesso := 'Inserindo em GA_ROTA_DIVI4';
		Insert Into GA_ROTA_DIVI4
			Select COD_ROT_DIVER,
				 nDIVI4       ,
				 DSC_ROT_DIVER,
				 ABV_ROT_DIVER,
				 RTD_ASFAL    ,
			       RTD_TERR1    ,
				 RTD_TERR2    ,
				 RTD_PATH_ARQ ,
				 RTD_OBSER    ,
				 RTD_DESEN
				From GA_ROTA_DIVI4
				   Where ID_DIVI4 = regGA_DIVI4.ID_DIVI4;
	End If;
	Close curGA_ROTA_DIVI4;
	sProcesso := 'Abrindo curGA_ROTA_CANA';
	Open curGA_ROTA_CANA;
	Fetch curGA_ROTA_CANA Into regGA_ROTA_CANA;
	If curGA_ROTA_CANA%NOTFOUND Then
		sProcesso := 'Inserindo em GA_ROTA_CANA';
		Insert Into GA_ROTA_CANA
			Select COD_ROTA     ,
				 COD_EMPR_DEST,
				 nDIVI4       ,
				 ROC_PRINCIPAL
				From GA_ROTA_CANA
				   Where ID_DIVI4 = regGA_DIVI4.ID_DIVI4;
	End If;
	Close curGA_ROTA_CANA;
	sProcesso := 'Abrindo curGA_ROTA_DIVER';
	Open curGA_ROTA_DIVER;
	Fetch curGA_ROTA_DIVER Into regGA_ROTA_DIVER;
	If curGA_ROTA_DIVER%NOTFOUND Then
		sProcesso := 'Inserindo em GA_ROTA_DIVER';
		Insert Into GA_ROTA_DIVER
			Select nDIVI4          ,
				 COD_PONTO_DIV   ,
				 COD_ROTA_PTO    ,
				 COD_ROTA_FINALID
				From GA_ROTA_DIVER
				   Where ID_DIVI4 = regGA_DIVI4.ID_DIVI4;
		sProcesso := 'Inserindo em GA_VALID_ROT_DIVER';
		Insert Into GA_VALID_ROT_DIVER
			Select nDIVI4,
				 GA_VALID_ROT_DIVER.COD_PONTO_DIV   ,
				 GA_VALID_ROT_DIVER.COD_ROTA_PTO    ,
				 GA_VALID_ROT_DIVER.VDP_DT_INICIO   ,
				 GA_VALID_ROT_DIVER.COD_ROTA_FINALID
				From GA_VALID_ROT_DIVER,
				     GA_ROTA_DIVER
					Where GA_ROTA_DIVER.ID_DIVI4 = regGA_DIVI4.ID_DIVI4
					  And GA_ROTA_DIVER.ID_DIVI4 = GA_VALID_ROT_DIVER.ID_DIVI4;
	End If;
	Close curGA_ROTA_DIVER;
	sProcesso := 'Abrindo curGA_ROTA_DIVI4_DIVI4';
	Open curGA_ROTA_DIVI4_DIVI4;
	Fetch curGA_ROTA_DIVI4_DIVI4 Into regGA_ROTA_DIVI4_DIVI4;
	If curGA_ROTA_DIVI4_DIVI4%NOTFOUND Then
		sProcesso := 'Inserindo em GA_ROTA_DIVI4_DIVI4';
		Insert Into GA_ROTA_DIVI4_DIVI4
			Select COD_ROT_DIVER   ,
				 nDIVI4          ,
				 COD_ROTA_FINALID
				From GA_ROTA_DIVI4_DIVI4
					Where ID_DIVI4 = regGA_DIVI4.ID_DIVI4;
		sProcesso := 'Inserindo em GA_VALID_ROTA_DIVI4';
		Insert Into GA_VALID_ROTA_DIVI4
			Select GA_VALID_ROTA_DIVI4.COD_ROTA_FINALID,
				 GA_VALID_ROTA_DIVI4.COD_ROT_DIVER   ,
				 GA_VALID_ROTA_DIVI4.ID_DIVI4        ,
				 GA_VALID_ROTA_DIVI4.VD4_DT_INICIO   ,
				 GA_VALID_ROTA_DIVI4.VD4_DT_FINAL    ,
				 GA_VALID_ROTA_DIVI4.VD4_OBSER
				From GA_VALID_ROTA_DIVI4,
				     GA_ROTA_DIVI4_DIVI4
				   Where GA_ROTA_DIVI4_DIVI4.ID_DIVI4 = regGA_DIVI4.ID_DIVI4
				     And GA_ROTA_DIVI4_DIVI4.ID_DIVI4 = GA_VALID_ROTA_DIVI4.ID_DIVI4;
	          commit;
	End If;
	Close curGA_ROTA_DIVI4_DIVI4;
	-- Duplicando Especialização
	sProcesso := 'Abrindo curGA_AGRUP';
	Open curGA_AGRUP;
	Fetch curGA_AGRUP Into regGA_AGRUP;
	If curGA_AGRUP%NOTFOUND Then
		sProcesso := 'Inserindo em GA_AGRUP';
		Insert Into GA_AGRUP
			Select ID_ESPEC,
				 nDIVI4,         
				 COD_EMPR,
				 SAF_ANO_SAFRA + 1,
         NULL
				From GA_AGRUP
				   Where ID_DIVI4 = regGA_DIVI4.ID_DIVI4;
	         commit;
	End If;
	Close curGA_AGRUP;
	-- Duplicando Arrendamentos
	sProcesso := 'Abrindo curGA_ARRENDAMENTOS';
	Open curGA_ARRENDAMENTOS;
	Fetch curGA_ARRENDAMENTOS Into regGA_ARRENDAMENTOS;
	If curGA_ARRENDAMENTOS%NOTFOUND Then
		sProcesso := 'Inserindo em GA_ARRENDAMENTOS';
		Insert Into GA_ARRENDAMENTOS
			Select COD_EMPR      ,
				 CNT_NUMER     ,
				 nDIVI4        ,
				 ARR_AREA_CONTR
				From GA_ARRENDAMENTOS
				   Where ID_DIVI4 = regGA_DIVI4.ID_DIVI4;
		 commit;
	End If;
	Close curGA_ARRENDAMENTOS;
	sProcesso := 'Abrindo curGA_PCTS_CONFIG';
      Open curGA_PCTS_CONFIG;
	Fetch curGA_PCTS_CONFIG Into regGA_PCTS_CONFIG;
	If curGA_PCTS_CONFIG%NOTFOUND Then
		sProcesso := 'Inserindo em GA_PCTS_CONFIG';
		Insert Into GA_PCTS_CONFIG
			 (COD_EMPR,
			  SAF_ANO_SAFRA   ,
			  CONF_INIC_MOAGEM,
			  CONF_COD_COFINS ,
			  CONF_COD_PIS    ,
			  CONF_INI_QUINZE ,
			  CONF_CLA_FISCAL ,
			  CONF_SERV_AGLUT ,
			  CONF_DATA_CONTAINER)
			 (Select        COD_EMPR,
					SAF_ANO_SAFRA + 1,
					CONF_INIC_MOAGEM,
					CONF_COD_COFINS,
					CONF_COD_PIS,
					CONF_INI_QUINZE,
					CONF_CLA_FISCAL,
					CONF_SERV_AGLUT,
					CONF_DATA_CONTAINER
			  From  GA_PCTS_CONFIG
			  Where         COD_EMPR      = regGA_DIVI4.COD_EMPR
			    And         SAF_ANO_SAFRA = regGA_DIVI4.SAF_ANO_SAFRA);
	      commit;
      end if;
	Close curGA_PCTS_CONFIG;
	-- 22/03/2001 - PAULO/ALEXANDRE
	-- Comentado devido ao processo da não inclusão de talhões de reforma
	-- estarem contemplados no cursor curGA_DIVI4_NEW
         -- executa o processo de delecao de reformados/erradicados --
            declare
                 dat2_corte_plant         date;
                 dat_corte_plant	  date;
	         nID_DIVI4_DELETAR        NUMBER;
            begin
                 select DI4_DT_PLANT
		 into   dat_corte_plant
		 from   GA_DIVI4
		 WHERE  cod_divi1 = regGA_DIVI4.cod_divi1
		 and  cod_divi2 = regGA_DIVI4.cod_divi2
		 and  cod_divi3 = regGA_DIVI4.cod_divi3
		 and  cod_divi4 = regGA_DIVI4.cod_divi4
		 and  cod_empr  = regGA_DIVI4.cod_empr
                 and  saf_ano_safra = regGA_DIVI4.saf_ano_safra ;
		select DI4_DT_PLANT, ID_DIVI4
		 into   dat2_corte_plant, nID_DIVI4_DELETAR
		 from   GA_DIVI4
		 WHERE  cod_divi1 = regGA_DIVI4.cod_divi1
		 and  cod_divi2 = regGA_DIVI4.cod_divi2
		 and  cod_divi3 = regGA_DIVI4.cod_divi3
		 and  cod_divi4 = regGA_DIVI4.cod_divi4
		 and  cod_empr  = regGA_DIVI4.cod_empr
                 and  saf_ano_safra = regGA_DIVI4.saf_ano_safra +1 ;
--                  sProcesso := 'talhão de reforma ';
                 If dat2_corte_plant = dat_corte_plant Then
		    select 	nvl(SAF_MUDA_D4_REFORMA,0) 
		into 	nDelReforma 
		from 	ga_safras 
		where 	saf_ano_safra = regGA_DIVI4.SAF_ANO_SAFRA;

		if nDelReforma = 0 then 
		     Delete GA_DIVI4
		     Where id_divi4 = nID_DIVI4_DELETAR		  
		     and EXISTS  ( Select a.cod_divi4
		  	               From ga_divi4 a, ga_agrup b, ga_espec c, ga_grupos d
		  	               Where a.id_divi4 = b.id_divi4
		             	          and a.id_divi4 = nID_DIVI4_DELETAR
		  	               and b.id_espec = c.id_espec
		  	               and d.cod_grupo = c.cod_grupo
		  	               and d.cod_grupo_padr = 4
		  	               and c.abv_espec in ('REF','R','SIM','S'));
		end if;		  	               
		
		      COMMIT;                
	         End If;  
	      Exception
	      When Others Then
		nFalha := 0;
		sErroSql := Substr(SqlErrm,1,240);
		RollBack;
		Insert Into Log_Erro Values ('Falha na deleção da GA_DIVI4 ' || ' ' ||
						  USER || ' ' || to_char( SYSDATE , 'DD-MM-YY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
          return;
          end;
	Close curGA_DIVI4_NEW;
	Close curGA_DIVI4;
	Commit;
	Exception
	   When Others Then
		nRetorno := 2;
		sErroSql := Substr(SqlErrm,1,240);
		RollBack;
		Insert Into Log_Erro Values ('Falha na Procedure Gap_DuplicaInicio ' || ' ' ||
						  USER || ' ' || to_char( SYSDATE , 'DD-MM-YY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
		Commit;
End Gap_DuplicaInicio;
Function Gaf_Sequencia( sTabela  in varchar2,
				sColuna  in varchar2,
				nTamCol  in number )
Return Number Is
nLinhas      Number;
nMAX         Number;
curSequencia Number;
sSelect      varchar2(100);
Begin
	Delete From SEQUENCIA
		Where OBJETO = sTabela
		  And COLUNA = sColuna;
	sProcesso := 'Montando comando Select';
	sSelect   := 'Select Max(' || sColuna || ') nRetorno From ' || sTabela;
	curSequencia := DBMS_SQL.OPEN_CURSOR;
	DBMS_SQL.PARSE( curSequencia, sSelect, DBMS_SQL.V7 );
	DBMS_SQL.DEFINE_COLUMN( curSequencia, 1, nTamCol );
	nLinhas := DBMS_SQL.EXECUTE( curSequencia );
	If DBMS_SQL.FETCH_ROWS( curSequencia ) != 0 Then
		DBMS_SQL.COLUMN_VALUE( curSequencia, 1, nMAX );
	Else
		nMAX := 1;
	End If;
	DBMS_SQL.CLOSE_CURSOR( curSequencia );
	Return nMAX;
	Exception
		When Others Then
			nFalha := 5;
		  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
			Insert Into Log_Erro Values ('Falha na Função Gaf_Sequencia ' || ' ' ||
						  USER || ' ' || to_char( SYSDATE , 'DD-MM-YY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;
End Gaf_Sequencia;
Procedure Gap_DuplicaDeleta( sWhere   In     varchar2,
				     nRetorno In Out number ) Is
curDelecao  number;
sSelect     varchar2(2000);
Begin
	sProcesso   := 'Abrindo o cursor';
	curDelecao  := DBMS_SQL.OPEN_CURSOR;
	sSelect     := 'Delete from GA_DIVI4 Where ' || sWhere;
	DBMS_SQL.PARSE( curDelecao, sSelect, DBMS_SQL.V7 );
	sProcesso := 'Executando o Comando em Gap_DuplicaDeleta';
	nLinhas   := DBMS_SQL.EXECUTE( curDelecao );
	Commit;
	sProcesso := 'Fechando o Cursor curDelecao';
	DBMS_SQL.CLOSE_CURSOR( curDelecao );
	Exception
		When Others Then
			nRetorno := 3;
		  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
			Insert Into Log_Erro Values ('Falha na Procedure Gap_DuplicaDeleta ' || ' ' ||
						  USER || ' ' || to_char( SYSDATE , 'DD-MM-YY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;
End Gap_DuplicaDeleta;
End Gapk_MudaSafra;
