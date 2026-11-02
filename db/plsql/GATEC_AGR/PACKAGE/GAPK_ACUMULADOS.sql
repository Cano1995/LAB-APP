CREATE OR REPLACE package           gapk_acumulados as

type typAcumulado is table of varchar2( 2000 )
	index by BINARY_INTEGER;

TblAcum  typAcumulado;  -- Ira armazenar todos os Valores Explodido para Divisao4

Type typContainer Is Record (
	LIBE GA_LIBERACAO.ID_LIBER%TYPE            		,
	DTEN DATE                                  		,
	HREN DATE                                  		,
	DTCO DATE                                  		,
	HRCO DATE                                  		,
	DTTA DATE                                  		,
	HRTA DATE                                  		,
	PESO GA_VAR_CONTAINER.CONT_PESO_LIQUI%TYPE 		,
	QUEI GA_CARAC_CANA.CAR_TEMPO_QUEIM%TYPE    		,
	PERC GA_CARAC_CANA.CAR_TEMPO_PERCU%TYPE    		,
	TIPO_TC GA_TIPO_CORTE.COD_TIP_CALC_TC%TYPE		,
	VAL_TQ	GA_VAR_CONTAINER.CONT_TEMPO_QUEIM%TYPE    	,
	VAL_TC	GA_VAR_CONTAINER.CONT_TEMPO_CORTE%TYPE    	,
	CORT GA_VAR_CONTAINER.DIN_TIPO_CORTE_1%TYPE		,
	PSAN GA_VAR_CONTAINER.CONT_PESO_LIQUI%TYPE 		,
	BRIX GA_ANALI_SONDA.PAN_BRIX%TYPE          		,
	PBU  GA_ANALI_SONDA.PAN_PBU%TYPE           		,
	LS   GA_ANALI_SONDA.PAN_LS%TYPE            		,
	ID   GA_VAR_CONTAINER.ID_LANC_CONTA%TYPE   		,
	FLAG GA_VAR_CONTAINER.CONT_PROCE_PESAG%TYPE		,
	ANAL GA_ANALI_SONDA.ID_LANC_CONTA%TYPE	 		,
	CANC GA_ANALI_SONDA.COD_MOT_CAN%TYPE );

recContainer TypContainer;

-- Variaveis

	sErroSql	varchar2(240);
	sProcesso   varchar2(240);  		-- Rotina em atual processo --
	nEmpr		number(2);	    	-- Empresa para Atualizar --
	nSafra	number(4);	    		-- Usa para consultar --
	dDataIni    date;		    	-- Inicio da Data para processar acumulados --
	dDataFim    date;		    	-- Fim da Data para processar os acumulados --

	nLibNume    Number(12);	    		-- Numero da liberacao --

	nFalha      number(1);	    		-- Retorna o Erro na Procedure --

	nQuantos    number;	    		-- Indice quantas cargas foram processadas --

	dDiaCana    date;		    -- Dia Cana pata Atualizar --
	nTempoQue   Number;	    -- Tempo de Queima --
	nTempoCor   Number;	    -- Tempo de Corte  --
	nBrix		Number;	    -- Brix Acumulado  --
	nLs		Number;	    -- Ls Acumulado    --
	nPbu        Number;	    -- Pbu Acumulado   --
	nProd       number;	    -- Producao Total  --
	nAnali      number;	    -- Producao Analisada --
	nStatusContainer number;    -- Status que sera gravado no container
					    -- 0 - Nao Acum / 2 - Prod Total / 1 - Prod Analisado
					    -- Manteve esta ordem para nao alterar as outras coisas
	bInutiliza	Boolean;        -- Checa o tempo dado ao laboratorio

-- Cursor para identificar as Empresas
cursor curEmprSafra is
	Select 	COD_EMPR,
   	       	SAF_ANO_SAFRA,
		SAF_DT_INICIO,
		SAF_DT_FIM
	From 	GA_SAFRAS
	Where 	COD_EMPR = nEmpr
		and SAF_ANO_SAFRA = nSafra
	Order By COD_EMPR;
regEmprSafra curEmprSafra%ROWTYPE;

-- cursor para identificar as Horas Inicio/Fim
cursor curConfCpc is
	select 	CPC_HR_INI,
	       	CPC_HR_FIM,
		nvl(CPC_TEMPO_ACUM,4) 	    	TEMPOACUM,
		nvl(CPC_ORIG_TIPO_CORTE,0) 	TIPOCORTE,
		nvl(CPC_CONF_CALC_TQ_TC,1) 	CARAC_CANA,
		COD_MOT_CAN,
		nvl(CPC_PROC_ACUM,0)	    	PROCACUM
	from 	GA_CONF_CPC
	where 	COD_EMPR        	= regEmprSafra.COD_EMPR
	        and SAF_ANO_SAFRA   	= regEmprSafra.SAF_ANO_SAFRA;
regConfCpc curConfCpc%ROWTYPE;

-- cursor para identificar a Configuracao do Comunicado de Queima
cursor curConfSaf is
        select  nvl(CSA_COMUNIC_QUEIMA,0)   COM_QUEIMA
        from    GA_CONFI_SAFRA
	where 	COD_EMPR        	= regEmprSafra.COD_EMPR
	        and SAF_ANO_SAFRA   	= regEmprSafra.SAF_ANO_SAFRA;
regConfSaf curConfSaf%ROWTYPE;


-- Cursor que identifica os Containers do EntCana.
Cursor curContainer Is
	Select 	co.ID_LIBER               	   	LIBE, -- ID da Liberacao
		co.CONT_DATA_PESO      	   		DTEN, -- Data Balanca  (Entrada)
		co.CONT_DATA_HORA      	   		HREN, -- Hora Balanca  (Entrada)
		co.CONT_DATA_CORTE	   	   	DTCO, -- Data Corte
		co.CONT_HORA_CORTE  	   	   	HRCO, -- Hora Corte
		co.CONT_DATA_PESO_TARA		   	DTTA, -- Data de Taragem
		co.CONT_DATA_HORA_TARA          	HRTA, -- Hora de Taragem
		co.CONT_PESO_LIQUI	         	PESO, -- Peso liquido
		ca.CAR_TEMPO_QUEIM 		   	QUEI, -- Calculo para Carac. Cana
		ca.CAR_TEMPO_PERCU 		   	PERC, -- Calculo para Carac. Cana
		cr.COD_TIP_CALC_TC			TIPO_TC, -- Tipo de calculo do TC
		co.CONT_TEMPO_QUEIM 		   	VAL_TQ, -- Valor do TQ
		co.CONT_TEMPO_CORTE 		   	VAL_TC, -- Valor do TC
		nvl(co.DIN_TIPO_CORTE_1,0)	   	CORT, -- Tipo de Corte Real
		Nvl(decode( Nvl(an.PAN_BRIX,0),
		0,0,decode( nvl(cod_mot_can,0),
		0,co.CONT_PESO_LIQUI,0) ),0)            PSAN, -- Peso Analisado
		Nvl(an.PAN_BRIX,0)	   	   	BRIX, -- Brix
		Nvl(an.PAN_PBU ,0)	   	   	PBU,  -- Pbu
		decode(nvl(an.PAN_LS,0),0,0,decode(an.PAN_CLARIF,0,(an.PAN_LS*1.00621)+0.05117,an.PAN_LS))	   	LS,   -- Ls
		co.ID_LANC_CONTA                	ID,   -- GA_VAR_CONTAINER.ID_LANC_CONTA
		nvl(co.CONT_PROCE_PESAG,0)	   	FLAG, -- Flag de ja acumulado
		nvl(an.ID_LANC_CONTA,0)	   		ANAL, -- GA_ANALI_SONDA.ID_LANC_CONTA
		nvl(COD_MOT_CAN,0)		   	CANC  -- Analise cancelada
	from 	GA_CARAC_CANA    ca,
		GA_TIPO_CORTE    cr,
		GA_ANALI_SONDA   an,
                GA_VAR_CONTAINER co
	where 	ca.ID_CARAC(+)			= cr.ID_CARAC
		and cr.COD_TIP_CORTE(+)	 	= nvl(co.DIN_TIPO_CORTE_1,0)
		and co.ID_LANC_CONTA    	= an.ID_LANC_CONTA(+)
-- Flag que indica processo de acumulado ( 0-Nao Processado / 2-Prod Total / 1-Prod Analis )
		and nvl(CONT_PROCE_PESAG,0) 	in ( 0,2 )
		and CONT_DATA_PESO_TARA Is Not Null
                and ENT_COD_EMPR      	 	= regEmprSafra.COD_EMPR
		and ENT_SAF_ANO_SAFRA  	 	= regEmprSafra.SAF_ANO_SAFRA
		and co.CONT_DATA_HORA_TARA between
		dDataIni And dDataFim
order by 	1,2,3;

-- regContainer curContainer%ROWTYPE;

-- Cursor que identifica as cargas de uma unica liberacao
Cursor curContainerLiber Is
	Select	co.ID_LIBER               	   	LIBE, -- ID da Liberacao
		co.CONT_DATA_PESO      	   		DTEN, -- Data Balanca  (Entrada)
		co.CONT_DATA_HORA      	   		HREN, -- Hora Balanca  (Entrada)
		co.CONT_DATA_CORTE	   	   	DTCO, -- Data Corte
		co.CONT_HORA_CORTE  	   	   	HRCO, -- Hora Corte
		co.CONT_DATA_PESO_TARA		   	DTTA, -- Data de Taragem
		co.CONT_DATA_HORA_TARA          	HRTA, -- Hora de Taragem
		co.CONT_PESO_LIQUI	         	PESO, -- Peso liquido
		ca.CAR_TEMPO_QUEIM 		   	QUEI, -- Calculo para Carac. Cana
		ca.CAR_TEMPO_PERCU 		   	PERC, -- Calculo para Carac. Cana
		cr.COD_TIP_CALC_TC			TIPO_TC, -- Tipo de calculo do TC
		co.CONT_TEMPO_QUEIM 		   	VAL_TQ, -- Valor do TQ
		co.CONT_TEMPO_CORTE 		   	VAL_TC, -- Valor do TC
		nvl(co.DIN_TIPO_CORTE_1,0)	   	CORT, -- Tipo de Corte Real
		Nvl(decode( Nvl(an.PAN_BRIX,0),
		0,0,decode( nvl(cod_mot_can,0),
		0,co.CONT_PESO_LIQUI,0) ),0)            PSAN, -- Peso Analisado
		nvl(an.PAN_BRIX,0)	   	   	BRIX, -- Brix
		nvl(an.PAN_PBU ,0)	   	   	PBU,  -- Pbu
		decode(nvl(an.PAN_LS,0),0,0,decode(an.PAN_CLARIF,0,(an.PAN_LS*1.00621)+0.05117,an.PAN_LS))	   	LS,   -- Ls
		co.ID_LANC_CONTA                	ID,   -- ID Lancamento,
		nvl(co.CONT_PROCE_PESAG,0)	   	FLAG, -- Flag de ja acumulado
		nvl(an.ID_LANC_CONTA,0)	   		ANAL, -- GA_ANALI_SONDA.ID_LANC_CONTA
		nvl(COD_MOT_CAN,0)		   	CANC  -- Analise cancelada
	from 	GA_CARAC_CANA    ca,
		GA_TIPO_CORTE    cr,
		GA_LIBERACAO     li,
		GA_ANALI_SONDA   an,
                GA_VAR_CONTAINER co
	where 	ca.ID_CARAC(+)		 	= cr.ID_CARAC
		and cr.COD_TIP_CORTE(+)	 	= nvl(co.DIN_TIPO_CORTE_1,0)
		and co.ID_LANC_CONTA    	= an.ID_LANC_CONTA(+)
		and li.id_liber 		= nLibNume
		and li.SAF_ANO_SAFRA 	 	= regEmprSafra.SAF_ANO_SAFRA
		and co.ID_LIBER		 	= li.ID_LIBER
-- Flag que indica processo de acumulado ( 0-Nao Processado / 1-Prod Total / 2-Prod Analis )
		and nvl(CONT_PROCE_PESAG,0) in ( 0,2 )
		and co.CONT_DATA_HORA_TARA between
		dDataIni And dDataFim
	order by 1,2,3;


-- Cursor que identifica os valores da liberacao
Cursor curLiberacao Is
	select 	ID_LIBER,
		COD_EMPR,
		SAF_ANO_SAFRA,
		-- Pegar da Liberacao ou do Entrada de Cana
		decode( regConfCpc.TIPOCORTE,
			0, COD_TIP_CORTE,
			1, recContainer.CORT ) COD_TIP_CORTE,
		COD_FINALID ,
		-- Pegar da Liberacao ou do Tipo de Corte
		decode( regConfCpc.CARAC_CANA,
			1, CAR_TEMPO_QUEIM,
			0, recContainer.QUEI ) QUEIMA,
		decode( regConfCpc.CARAC_CANA,
			1, CAR_TEMPO_PERCU,
			0, recContainer.PERC ) CALC_CORTE,
		LIB_DT_ABERT,
		LIB_HR_ABERT,
		LIB_FOR_AREA_PREVI,
		LIB_STATUS_CORTE
	From 	GA_CARAC_CANA,
		GA_LIBERACAO
	Where 	GA_CARAC_CANA.ID_CARAC 	= GA_LIBERACAO.ID_CARAC and
		ID_LIBER 		= recContainer.LIBE;
regLiberacao curLiberacao%ROWTYPE;

      -- Proced. Principal --
	Procedure Gap_MainAcumulado(
					nParEmpr   In     Number,
					nParSafra  In     Number,
  					dParDtaIni In     Date  ,
					dParDtaFim In     Date  ,
				        cTipoAcu   In     Char  ,
  				        cTipoPro   In     Char  ,
		  			nParLibe   In     Number,
					nQuantos   In out Number,
					nRetorno   In out Number );

      -- Proced. para Calcular Liber --
	Procedure Gap_AcumLiberacao;

      -- Proced. para Calcular Cargas e Rateio --
	Procedure Gap_DistribuiCarga;

      -- Proced. para Calcular Divisao Um --
	Procedure Gap_AcumDivisaoUm( nIndice In Number );

      -- Proced. para Calcular Divisao Dois --
	Procedure Gap_AcumDivisaoDois( nIndice In Number );

      -- Proced. para Calcular Divisao Tres --
	Procedure Gap_AcumDivisaoTres( nIndice In Number );

      -- Proced. para Calcular Divisao Quatro --
	Procedure Gap_AcumDivisaoQuatro( nIndice In Number );

	-- Proced. para Atulizar Container --
	Procedure Gap_AtualizaContainer;

	-- Proced. para Calcular o Dia Cana --
      -- Procedure Gap_DiaCana;

	-- Proced. para Calcular o Tempo Queima --
	Procedure Gap_TempoQueima;

	-- Proced. para Calcular o Tempo Corte --
	Procedure Gap_TempoCorte;

	-- Proced. para Calcular os Valores de Analise --
	Procedure Gap_AcumDadosTecnologicos( cTipo In Char , nIndice In Number );

	-- Proced. para delelar o acumula do gravado na tabela
	Procedure Gap_DeletaAcumulado( cTipoAcu In Char );

	-- Retorna o Dia Balanca para deletar do Acumulado --
	Function  Gaf_DiaBalanca( dData In Date ) Return Date;

        -- Retorna o Dia/Hora Balanca para limpar a GA_VAR_CONTAINER
        Function Gaf_DiaHoraBal( dData In Date,cTip in char  ) Return Date;

End Gapk_Acumulados;

 
