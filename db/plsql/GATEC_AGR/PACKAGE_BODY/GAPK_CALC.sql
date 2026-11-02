CREATE OR REPLACE package body gapk_calc as
     	function GAF_CalculaPre( nIdD4 in number,cTipo in varchar2) return number is
        Cursor curSafras Is
	  Select COD_EMPR,
	 	 SAF_ANO_SAFRA
	  From   GA_DIVI4
	  Where  id_divi4 	= nIDD4;
	 regSafras curSafras%ROWTYPE;
	 Cursor curDataPre Is
	  Select Max(A.PAN_DT) PAN_DT
	    From  GA_PRE_ANALI A,
		  GA_MOV_PRE_ANALI B
	      Where nvl(A.PAN_BRIX,0) <> 0
		And A.ID_PRE_ANALI    = B.ID_PRE_ANALI
		And B.ID_DIVI4        = nIDD4
		And B.MPA_FLAG_ORIGEM = 1
                And A.cod_empr 	      = regSafras.COD_EMPR
		And A.saf_ano_safra   = regSafras.SAF_ANO_SAFRA;
	 regDataPre curDataPre%ROWTYPE;
	 Cursor C1 Is
	  Select A.PAN_NUMER PAN_NUMER,
		 A.PAN_BRIX PAN_BRIX,
		 A.PAN_LS PAN_LS,
		 A.PAN_PBU PAN_PBU,
		 A.PAN_AR PAN_AR,
		 PAN_POL_CALDO PAN_POL_CALDO,
		 A.PAN_CLARIF
	    From  GA_PRE_ANALI A,
		  GA_MOV_PRE_ANALI B
	      Where nvl(A.PAN_BRIX,0) <> 0
		And A.ID_PRE_ANALI    = B.ID_PRE_ANALI
		And B.ID_DIVI4        = nIDD4
		And A.PAN_DT 	      = regDataPre.PAN_DT
		And A.cod_empr 	      = regSafras.COD_EMPR
		And A.saf_ano_safra   = regSafras.SAF_ANO_SAFRA
		And B.MPA_FLAG_ORIGEM = 1;
	 R1 C1%ROWTYPE;
	 -- Especialidade do Talhão Corrente e Periodo de ponderação
	 Cursor C2 Is
	  Select COD_ESPEC,
		  CES_PER_PONDE
	  From   GA_ESPEC,
		  GA_AGRUP,
		  GA_CONFI_EMPR_SAFRA
	        Where GA_ESPEC.ID_ESPEC   	      = GA_AGRUP.ID_ESPEC
		    And GA_AGRUP.ID_DIVI4    	      = nIDD4
		    And GA_ESPEC.COD_GRUPO            = GA_CONFI_EMPR_SAFRA.COD_GRUPO
		    And GA_ESPEC.COD_SUBGR   	      = GA_CONFI_EMPR_SAFRA.COD_SUBGR
		    And GA_CONFI_EMPR_SAFRA.COD_EMPR  = regSafras.COD_EMPR
		    And GA_CONFI_EMPR_SAFRA.SAF_ANO_SAFRA = regSafras.SAF_ANO_SAFRA;
	 R2 C2%ROWTYPE;
	 -- Intervalo de Datas para média
	 Cursor C3 Is
	  Select MAX(PAN_DT) MAIOR,
		(MAX(PAN_DT) - R2.CES_PER_PONDE) MENOR
	     from VIEW_BLOCO_PRE_ANALI
		Where COD_ESPEC     = R2.COD_ESPEC
		  And COD_EMPR      = regSafras.COD_EMPR
		  And SAF_ANO_SAFRA = regSafras.SAF_ANO_SAFRA;
	 R3 C3%ROWTYPE;
	 -- Média do Agrupamento
	 Cursor C4 Is
	  Select AVG(PAN_BRIX) PAN_BRIX,
		AVG(PAN_LS) PAN_LS,
		AVG(PAN_PBU) PAN_PBU,
		AVG(PAN_POL_CALDO) PAN_POL_CALDO,
		AVG(PAN_AR) PAN_AR
	     from VIEW_BLOCO_PRE_ANALI
		Where COD_ESPEC      = R2.COD_ESPEC
		  And COD_EMPR       = regSafras.COD_EMPR
		  And SAF_ANO_SAFRA  = regSafras.SAF_ANO_SAFRA
		  And PAN_DT BetWeen R3.MENOR
				 And R3.MAIOR;
	 R4 C4%ROWTYPE;
	 -- Clarificante será gravado na tabela de Pre Analise
	 -- mas quando for calculo por media usar CES_CLARIF da GA_CONFI_EMPR_SAFRA
	 Cursor C5 Is
	   Select CES_CLARIF
	     From GA_CONFI_EMPR_SAFRA
	       Where COD_EMPR      = regSafras.COD_EMPR
		 And SAF_ANO_SAFRA = regSafras.SAF_ANO_SAFRA;
	   R5 C5%ROWTYPE;
	   nRetorno number;
     	BEGIN
	   nRetorno := 0;
	   nId_divi4 := nIDD4;
	   Open curSafras;
	   Fetch curSafras Into regSafras;
	   Close curSafras;
	   Open curDataPre;
	   Fetch curDataPre Into regDataPre;
	   Close curDataPre;
	   Open C1;
	   Fetch C1 Into R1;
	   If C1%FOUND Then
              -- Atribuição de Valores repetitiva para poder utilizar a view de Calculo PreAnali
		nGP_Pbu 	:= R1.PAN_PBU;
		nGP_Brix	:= R1.PAN_BRIX;
		nGP_Ls		:= R1.PAN_LS;
		nGP_Clarif	:= R1.PAN_CLARIF;
		nPanNumer	:= R1.PAN_NUMER;
		if nGP_Clarif = 1 then
		   nGP_LSCor	:= nGP_Ls;
		else
		   nGP_LsCor	:= ((1.00621 * nGP_Ls ) + 0.05117);
		end if;
		nGP_Fibra	:= gaf_Fibra(nGP_Pbu) ;
		nGP_PolCaldo	:= gaf_PolCaldo(nGP_LsCor,nGP_Brix);
		nGP_Pureza	:= gaf_Pureza(nGP_Brix,nGP_PolCaldo);
		nGP_PolCana	:= gaf_PolCana(nGP_PolCaldo,nGP_Fibra,nGP_Pbu) ;
		nGP_Ar		:= gaf_ArCana(nGP_Pureza,nGP_Fibra);
		nGP_Atr		:= gaf_ATR(regSafras.Cod_Empr,regSafras.Saf_Ano_Safra,nGP_PolCana,nGP_Ar,1);
		nGP_AgioAtr	:= 0 ;
		nRetorno	:= 2;
	   -- Calculo da Media
	   Else
	     Open 	C2;
	     Fetch 	C2 Into R2;
	     If 	C2%FOUND Then
		  	Open C5;
			Fetch C5 Into nClarif;
			Close C5;
			Open C3;
			Fetch C3 Into R3;
			Close C3;
			Open C4;
			Fetch C4 Into R4;
			Close C4;
	-- Atribuição de Valores repetitiva para poder utilizar a view de Calculo PreAnali
			nGP_Pbu		:= R4.PAN_PBU;
			nGP_Brix	:= R4.PAN_BRIX;
			nGP_Ls		:= R4.PAN_LS;
			if 	nGP_Clarif	= 1 then
		   		nGP_LSCor	:= nGP_Ls;
			else
		   		nGP_LsCor	:= ((1.00621 * nGP_Ls ) + 0.05117);
			end if;
			nGP_Fibra	:= gaf_Fibra(nGP_Pbu) ;
			nGP_PolCaldo	:= gaf_PolCaldo(nGP_LsCor,nGP_Brix);
			nGP_Pureza	:= gaf_Pureza(nGP_Brix,nGP_PolCaldo);
			nGP_PolCana	:= gaf_PolCana(nGP_PolCaldo,nGP_Fibra,nGP_Pbu) ;
			nGP_Ar		:= gaf_ArCana(nGP_Pureza,nGP_Fibra);
			nGP_Atr		:= gaf_ATR(regSafras.Cod_Empr,regSafras.Saf_Ano_Safra,nGP_PolCana,nGP_Ar,1);
			nGP_AgioAtr	:= 0;
			nRetorno	:= 3;
	    	End If;
	    	Close C2;
	   End If;
	   Close C1;
	   nRetorno := GAF_RetPre(cTipo) ;
	   Return nRetorno;
 	Exception
    		When Others Then
			sErroSql := Substr(SqlErrm,1,240);
    			nRetorno := 999999.99;
  		      Return nRetorno;
 	End Gaf_CalculaPre;
----------------------------------------------------------------------
      Function GAF_RetPre(cTipo in varchar2) return number is
      nRetorno number;
      begin
	  If cTipo = 'PBU' Then
	     nRetorno := nGP_Pbu;
	  ElsIf cTipo = 'BRI' Then
	     nRetorno := nGP_Brix;
	  ElsIf cTipo = 'LS ' Then
	     nRetorno := nGP_Ls;
	  ElsIf cTipo = 'POL' Then
	     nRetorno := nGP_PolCaldo;
	  ElsIf cTipo = 'FIB' Then
	     nRetorno := nGP_Fibra;
	  ElsIf cTipo = 'AGI' Then
	     nRetorno := nGP_Agio;
	  ElsIf cTipo = 'PUR' Then
	     nRetorno := nGP_Pureza;
	  ElsIf cTipo = 'POC' Then
	     nRetorno := nGP_PolCana;
	  ElsIf cTipo = 'ATR' Then
	     nRetorno := nGP_Atr;
	  ElsIf cTipo = 'AR ' Then
	     nRetorno := nGP_Ar;
	  ---ElsIf cTipo = 'NUM' Then
	  ---   nRetorno := Nvl(,0);
	  ElsIf cTipo = 'AGATR' Then
	     nRetorno := nGP_AgioAtr;
	  End If;
          return nRetorno;
      end GAF_RetPre;
----------------------------------------------------------------------
	---------------------------------------------------------------------------------
	--- DADOS DE SONDA
	---------------------------------------------------------------------------------
     	function GAF_CalculaSonda( nIdD4 in number, cTipo in varchar2) return number is
	nRetorno number;
	nId_divi4 number;
	nProdu number;
	Cursor curSafras1 Is
	  Select COD_EMPR,
	 	 SAF_ANO_SAFRA
	  From   GA_DIVI4
	  Where  id_divi4 = nIDD4;
	 regSafras1 curSafras1%ROWTYPE;
	Cursor C2_Sonda Is
  	 	Select 	 nvl(SUM(AC_POND_BRIX  * AC_PROD ),0) PAN_BRIX,
          	  	 nvl(SUM(AC_POND_LS    * AC_PROD ),0) PAN_LS,
              	 	 nvl(SUM(AC_POND_PBU   * AC_PROD ),0) PAN_PBU,
         	  	 nvl(SUM(AC_POND_BRIX  * AC_PROD ),0) BRIX_T,
          	  	 nvl(SUM(AC_POND_LS    * AC_PROD ),0) LS_T,
          	  	 nvl(SUM(AC_POND_PBU   * AC_PROD ),0) PBU_T,
          	  	 NVL(SUM( AC_PROD ),0)         AC_PROD,
          	  	 NVL(SUM( AC_PROD ),0)               AC_PR_TOT
       		From    GA_ACUM_D4
		Where  ID_DIVI4 	= nIDD4
                And    cod_empr 	= regSafras1.COD_EMPR
		And    saf_ano_safra 	= regSafras1.SAF_ANO_SAFRA
	   	And    AC_POND_BRIX 	> 0
	   	And    AC_POND_LS	> 0
	   	And    AC_POND_PBU	> 0;
	R2_Sonda C2_Sonda%ROWTYPE;
	Cursor C3_Sonda Is
  	 	Select	nvl(SUM(AC_PROD),0) AC_PROD,
 	    		nvl(SUM(nvl(AC_POND_TEMP_QUEI,0) * AC_PROD ),0) TempoQueima,
	   		nvl(SUM(nvl(AC_POND_TEMP_CORTE,0) * AC_PROD ),0) TempoCorte
       		From   	GA_ACUM_D4
	 	Where  	ID_DIVI4 	= nIDD4
		And     cod_empr 	= regSafras1.COD_EMPR
		And     saf_ano_safra 	= regSafras1.SAF_ANO_SAFRA
	  	And  	(Nvl(AC_POND_TEMP_QUEI,0)  > 0 OR Nvl(AC_POND_TEMP_CORTE,0) > 0);
	R3_Sonda C3_Sonda%ROWTYPE;
	Cursor 	C4_Sonda Is
  	 	Select 	CES_CLARIF
	 	From   	GA_CONFI_EMPR_SAFRA
		Where   COD_EMPR 	= regSafras1.COD_EMPR
		  and   SAF_ANO_SAFRA	= regSafras1.SAF_ANO_SAFRA;
	R4_Sonda C4_Sonda%ROWTYPE;
	Begin
		nRetorno := 0;
		Open  curSafras1;
		Fetch curSafras1 Into regSafras1;
		Close curSafras1;
    		Open C2_Sonda;
		Fetch C2_Sonda Into R2_Sonda;
		if C2_Sonda%found then
      		   nProdu := R2_Sonda.AC_PROD;
		   If nProdu > 0 Then
         	      nGS_Brix := R2_Sonda.PAN_BRIX / nProdu;
         	      nGS_Ls   := R2_Sonda.PAN_LS   / nProdu;
         	      nGS_PBU  := R2_Sonda.PAN_PBU  / nProdu;
         	      Open   C4_Sonda;
	   	      Fetch  C4_Sonda Into R4_Sonda;
		      if     C4_Sonda%found then
	   	             ----Close 	C4_Sonda;
	   	             nGS_Clarif	:= R4_Sonda.CES_CLARIF;
	   	             if  nGS_Clarif      = 1 then
	      	                 nGS_LSCor   := nGS_Ls;
	   	             else
	      	                 nGS_LsCor   := ((1.00621 * nGS_Ls ) + 0.05117);
	   	             end if;
			     nGR_Prd      := R2_Sonda.AC_PR_TOT;
			     nGR_Pra      := R2_Sonda.AC_PROD;
	   	             nGS_Fibra 	  := gaf_Fibra(nGS_Pbu) ;
	   	             nGS_PolCaldo := gaf_PolCaldo(nGS_LsCor,nGS_Brix);
	   	   	     nGS_Pureza  := gaf_Pureza(nGS_Brix,nGS_PolCaldo);
	   	   	     nGS_PolCana := gaf_PolCana(nGS_PolCaldo,nGS_Fibra,nGS_Pbu);
	   	   	     nGS_Ar 	 := gaf_ArCana(nGS_Pureza,nGS_Fibra);
	   	   	     nGS_Atr 	 := gaf_ATR(regSafras1.Cod_Empr,regSafras1.Saf_Ano_Safra,nGS_PolCana,nGS_Ar,1);
	   	   	     nGS_AgioAtr := 0;
--gaf_AgioAtr(regSafras1.SAF_ANO_SAFRA,nGS_Atr);
           	   	     Open  C3_Sonda;
	   	   	     Fetch C3_Sonda Into R3_Sonda;
	   	   	     If  R3_Sonda.AC_PROD > 0 Then
	         	         nGS_TmpQuei := R3_Sonda.TempoQueima / R3_Sonda.AC_PROD;
				 nGS_TmpCorte := R3_Sonda.TempoCorte / R3_Sonda.AC_PROD;
			     else
			         nGS_TmpCorte := 0;
				 nGS_TmpQuei := 0;
	   	   	     End If;
 			     close C3_Sonda;
			     nRetorno := 4;
                       end if;
		       close C4_Sonda;
		    end if;
		 end if;
		 if  nRetorno > 0 then
  	             nRetorno := GAF_RetSonda(cTipo);
		 end if;
	         Return nRetorno;
	Exception
		---When eDadosTec Then
		---	sErroSql := Substr(SqlErrm,1,240);
    		---	nRetorno := 999999.99;
  		---     Return nRetorno;
   		When Others Then
			sErroSql := Substr(SqlErrm,1,240);
    			nRetorno := 999999.99;
  		      Return nRetorno;
   	end GAF_CalculaSonda;
----------------------------------------------------------------------
     	function GAF_CalculaSondaLiber( nIdLib in number, cTipo in varchar2) return number is
	nRetorno number;
	nId_divi4 number;
	nProdu number;
	Cursor curSafras1 Is
	  Select COD_EMPR,
	 	 SAF_ANO_SAFRA
	  From   GA_DIVI4, GA_AREA_LIBER A
	  Where  A.id_liber = nIdlib
	         and ga_divi4.id_divi4 = a.id_divi4;
	 regSafras1 curSafras1%ROWTYPE;
	Cursor C2_Sonda Is
  	 	Select 	 nvl(SUM(AC_POND_BRIX  * AC_PROD_ANALI ),0) PAN_BRIX,
          	  	 nvl(SUM(AC_POND_LS    * AC_PROD_ANALI ),0) PAN_LS,
              	 	 nvl(SUM(AC_POND_PBU   * AC_PROD_ANALI ),0) PAN_PBU,
         	  	 nvl(SUM(AC_POND_BRIX  * AC_PROD ),0) BRIX_T,
          	  	 nvl(SUM(AC_POND_LS    * AC_PROD ),0) LS_T,
          	  	 nvl(SUM(AC_POND_PBU   * AC_PROD ),0) PBU_T,
          	  	 NVL(SUM( AC_PROD_ANALI ),0)         AC_PROD,
          	  	 NVL(SUM( AC_PROD ),0)               AC_PR_TOT
       		From    GA_ACUM_D4
		Where  ID_LIBER 	= nIdLib
                And    cod_empr 	= regSafras1.COD_EMPR
		And    saf_ano_safra 	= regSafras1.SAF_ANO_SAFRA
	   	And    AC_POND_BRIX 	> 0
	   	And    AC_POND_LS	> 0
	   	And    AC_POND_PBU	> 0;
	R2_Sonda C2_Sonda%ROWTYPE;
	Cursor C3_Sonda Is
  	 	Select	nvl(SUM(AC_PROD),0) AC_PROD,
 	    		nvl(SUM(nvl(AC_POND_TEMP_QUEI,0) * AC_PROD ),0) TempoQueima,
	   		nvl(SUM(nvl(AC_POND_TEMP_CORTE,0) * AC_PROD ),0) TempoCorte
       		From   	GA_ACUM_D4
	 	Where  	ID_LIBER 	= nIdLib
		And     cod_empr 	= regSafras1.COD_EMPR
		And     saf_ano_safra 	= regSafras1.SAF_ANO_SAFRA
	  	And  	(Nvl(AC_POND_TEMP_QUEI,0)  > 0 OR Nvl(AC_POND_TEMP_CORTE,0) > 0);
	R3_Sonda C3_Sonda%ROWTYPE;
	Cursor 	C4_Sonda Is
  	 	Select 	CES_CLARIF
	 	From   	GA_CONFI_EMPR_SAFRA
		Where   COD_EMPR 	= regSafras1.COD_EMPR
		  and   SAF_ANO_SAFRA	= regSafras1.SAF_ANO_SAFRA;
	R4_Sonda C4_Sonda%ROWTYPE;
	Begin
		nRetorno := 0;
		Open  curSafras1;
		Fetch curSafras1 Into regSafras1;
		Close curSafras1;
    		Open C2_Sonda;
		Fetch C2_Sonda Into R2_Sonda;
		if C2_Sonda%found then
      		   nProdu := R2_Sonda.AC_PROD;
		   If nProdu > 0 Then
         	      nGS_Brix := R2_Sonda.PAN_BRIX / nProdu;
         	      nGS_Ls   := R2_Sonda.PAN_LS   / nProdu;
         	      nGS_PBU  := R2_Sonda.PAN_PBU  / nProdu;
         	      Open   C4_Sonda;
	   	      Fetch  C4_Sonda Into R4_Sonda;
		      if     C4_Sonda%found then
	   	             ----Close 	C4_Sonda;
	   	             nGS_Clarif	:= R4_Sonda.CES_CLARIF;
	   	             if  nGS_Clarif      = 1 then
	      	                 nGS_LSCor   := nGS_Ls;
	   	             else
	      	                 nGS_LsCor   := ((1.00621 * nGS_Ls ) + 0.05117);
	   	             end if;
			     nGR_Prd      := R2_Sonda.AC_PR_TOT;
			     nGR_Pra      := R2_Sonda.AC_PROD;
	   	             nGS_Fibra 	  := gaf_Fibra(nGS_Pbu) ;
	   	             nGS_PolCaldo := gaf_PolCaldo(nGS_LsCor,nGS_Brix);
	   	   	     nGS_Pureza  := gaf_Pureza(nGS_Brix,nGS_PolCaldo);
	   	   	     nGS_PolCana := gaf_PolCana(nGS_PolCaldo,nGS_Fibra,nGS_Pbu);
	   	   	     nGS_Ar 	 := gaf_ArCana(nGS_Pureza,nGS_Fibra);
	   	   	     nGS_Atr 	 := gaf_ATR(regSafras1.Cod_Empr,regSafras1.Saf_Ano_Safra,nGS_PolCana,nGS_Ar,1);
	   	   	     nGS_AgioAtr := 0;
--gaf_AgioAtr(regSafras1.SAF_ANO_SAFRA,nGS_Atr);
           	   	     Open  C3_Sonda;
	   	   	     Fetch C3_Sonda Into R3_Sonda;
	   	   	     If  R3_Sonda.AC_PROD > 0 Then
	         	         nGS_TmpQuei := R3_Sonda.TempoQueima / R3_Sonda.AC_PROD;
				 nGS_TmpCorte := R3_Sonda.TempoCorte / R3_Sonda.AC_PROD;
			     else
			         nGS_TmpCorte := 0;
				 nGS_TmpQuei := 0;
	   	   	     End If;
 			     close C3_Sonda;
			     nRetorno := 4;
                       end if;
		       close C4_Sonda;
		    end if;
		 end if;
		 if  nRetorno > 0 then
  	             nRetorno := GAF_RetSonda(cTipo);
		 end if;
	         Return nRetorno;
	Exception
		---When eDadosTec Then
		---	sErroSql := Substr(SqlErrm,1,240);
    		---	nRetorno := 999999.99;
  		---     Return nRetorno;
   		When Others Then
			sErroSql := Substr(SqlErrm,1,240);
    			nRetorno := 999999.99;
  		      Return nRetorno;
   	end GAF_CalculaSondaliber;
----------------------------------------------------------------------
	---------------------------------------------------------------------------------
	--- DADOS DE SONDA
	---------------------------------------------------------------------------------
     	function GAF_CalculaSonda_Filtro( nIdD4 in number, cTipo in varchar2, dDat1 in date , dDat2 in date , sFin in varchar2 , sTc in varchar2, sFrom in varchar2 ,sWhere in varchar2) return number is
	nRetorno number;
	nId_divi4 number;
	nProdu number;
	Cursor curSafras1 Is
	  Select COD_EMPR,
	 	 SAF_ANO_SAFRA
	  From   GA_DIVI4
	  Where  id_divi4 = nIDD4;
	 regSafras1 curSafras1%ROWTYPE;
	 Cursor C2_Sonda Is
  	 	Select 	 nvl(SUM(AC_POND_BRIX  * AC_PROD_ANALI ),0) PAN_BRIX,
          	  	 nvl(SUM(AC_POND_LS    * AC_PROD_ANALI ),0) PAN_LS,
              	 	 nvl(SUM(AC_POND_PBU   * AC_PROD_ANALI ),0) PAN_PBU,
         	  	 nvl(SUM(AC_POND_BRIX  * AC_PROD ),0) BRIX_T,
          	  	 nvl(SUM(AC_POND_LS    * AC_PROD ),0) LS_T,
          	  	 nvl(SUM(AC_POND_PBU   * AC_PROD ),0) PBU_T,
          	  	 NVL(SUM( AC_PROD_ANALI ),0)         AC_PROD,
          	  	 NVL(SUM( AC_PROD ),0)               AC_PR_TOT
       		From    GA_ACUM_D4
		Where  ID_DIVI4 	= nIDD4
                And    cod_empr 	= regSafras1.COD_EMPR
		And    saf_ano_safra 	= regSafras1.SAF_ANO_SAFRA
	   	And    AC_POND_BRIX 	> 0
	   	And    AC_POND_LS	> 0
	   	And    AC_POND_PBU	> 0;
	R2_Sonda C2_Sonda%ROWTYPE;
	Cursor C3_Sonda Is
  	 	Select	nvl(SUM(AC_PROD),0) AC_PROD,
 	    		nvl(SUM(nvl(AC_POND_TEMP_QUEI,0) * AC_PROD ),0) TempoQueima,
	   		nvl(SUM(nvl(AC_POND_TEMP_CORTE,0) * AC_PROD ),0) TempoCorte
       		From   	GA_ACUM_D4
	 	Where  	ID_DIVI4 	= nIDD4
		And     cod_empr 	= regSafras1.COD_EMPR
		And     saf_ano_safra 	= regSafras1.SAF_ANO_SAFRA
	  	And  	(Nvl(AC_POND_TEMP_QUEI,0)  > 0 OR Nvl(AC_POND_TEMP_CORTE,0) > 0);
	R3_Sonda C3_Sonda%ROWTYPE;
	Cursor 	C4_Sonda Is
  	 	Select 	CES_CLARIF
	 	From   	GA_CONFI_EMPR_SAFRA
		Where   COD_EMPR 	= regSafras1.COD_EMPR
		  and   SAF_ANO_SAFRA	= regSafras1.SAF_ANO_SAFRA;
	R4_Sonda C4_Sonda%ROWTYPE;
	Begin
		nRetorno := 0;
		Open  curSafras1;
		Fetch curSafras1 Into regSafras1;
		Close curSafras1;
    		Open C2_Sonda;
		Fetch C2_Sonda Into R2_Sonda;
		if C2_Sonda%found then
      		   nProdu := R2_Sonda.AC_PROD;
		   If nProdu > 0 Then
         	      nGS_Brix := R2_Sonda.PAN_BRIX / nProdu;
         	      nGS_Ls   := R2_Sonda.PAN_LS   / nProdu;
         	      nGS_PBU  := R2_Sonda.PAN_PBU  / nProdu;
         	      Open   C4_Sonda;
	   	      Fetch  C4_Sonda Into R4_Sonda;
		      if     C4_Sonda%found then
	   	             ----Close 	C4_Sonda;
	   	             nGS_Clarif	:= R4_Sonda.CES_CLARIF;
	   	             if  nGS_Clarif      = 1 then
	      	                 nGS_LSCor   := nGS_Ls;
	   	             else
	      	                 nGS_LsCor   := ((1.00621 * nGS_Ls ) + 0.05117);
	   	             end if;
			     nGR_Prd      := R2_Sonda.AC_PR_TOT;
			     nGR_Pra      := R2_Sonda.AC_PROD;
	   	             nGS_Fibra 	  := gaf_Fibra(nGS_Pbu) ;
	   	             nGS_PolCaldo := gaf_PolCaldo(nGS_LsCor,nGS_Brix);
	   	   	     nGS_Pureza  := gaf_Pureza(nGS_Brix,nGS_PolCaldo);
	   	   	     nGS_PolCana := gaf_PolCana(nGS_PolCaldo,nGS_Fibra,nGS_Pbu);
	   	   	     nGS_Ar 	 := gaf_ArCana(nGS_Pureza,nGS_Fibra);
	   	   	     nGS_Atr 	 := gaf_ATR(regSafras1.Cod_Empr,regSafras1.Saf_Ano_Safra,nGS_PolCana,nGS_Ar,1);
	   	   	     nGS_AgioAtr := 0;
--gaf_AgioAtr(regSafras1.SAF_ANO_SAFRA,nGS_Atr);
           	   	     Open  C3_Sonda;
	   	   	     Fetch C3_Sonda Into R3_Sonda;
	   	   	     If  R3_Sonda.AC_PROD > 0 Then
	         	         nGS_TmpQuei := R3_Sonda.TempoQueima / R3_Sonda.AC_PROD;
				 nGS_TmpCorte := R3_Sonda.TempoCorte / R3_Sonda.AC_PROD;
			     else
			         nGS_TmpCorte := 0;
				 nGS_TmpQuei := 0;
	   	   	     End If;
 			     close C3_Sonda;
			     nRetorno := 4;
                       end if;
		       close C4_Sonda;
		    end if;
		 end if;
		 if  nRetorno > 0 then
  	             nRetorno := GAF_RetSonda(cTipo);
		 end if;
	         Return nRetorno;
	Exception
		---When eDadosTec Then
		---	sErroSql := Substr(SqlErrm,1,240);
    		---	nRetorno := 999999.99;
  		---     Return nRetorno;
   		When Others Then
			sErroSql := Substr(SqlErrm,1,240);
    			nRetorno := 999999.99;
  		      Return nRetorno;
   	end GAF_CalculaSonda_Filtro;
----------------------------------------------------------------------
    	Function GAF_RetSonda(cTipo in varchar2) return number is
       	    nRetorno number;
     	begin
	    If cTipo = 'PBU' Then
	       nRetorno := nGS_Pbu;
	    ElsIf cTipo = 'BRI' Then
	       nRetorno := nGS_Brix;
	    ElsIf cTipo = 'LS ' Then
	       nRetorno := nGS_Ls;
	    ElsIf cTipo = 'POL' Then
	       nRetorno := nGS_PolCaldo;
	    ElsIf cTipo = 'FIB' Then
	       nRetorno := nGS_Fibra;
	    ElsIf cTipo = 'AGI' Then
	       nRetorno := nGS_Agio;
	    ElsIf cTipo = 'PUR' Then
	       nRetorno := nGS_Pureza;
	    ElsIf cTipo = 'POC' Then
	       nRetorno := nGS_PolCana;
	    ElsIf cTipo = 'ATR' Then
	       nRetorno := nGS_Atr;
	    ElsIf cTipo = 'AR ' Then
	       nRetorno := nGS_Ar;
	    ElsIf cTipo = 'AGATR' Then
	       nRetorno := nGS_AgioAtr;
	    ElsIf cTipo = 'TMQ' Then
	       nRetorno := nGS_TmpQuei;
	    ElsIf cTipo = 'TMC' Then
	       nRetorno := nGS_TmpCorte;
	    ElsIf cTipo = 'PRD' Then
	       nRetorno := nGR_Prd;
	    ElsIf cTipo = 'PRA' Then
	       nRetorno := nGR_PrA;
	    End If;
	    return nRetorno;
   	end GAF_RetSonda;
----------------------------------------------------------------------
	---------------------------------------------------------------------------------
	--- DADOS GERAIS
	---------------------------------------------------------------------------------
        function GAF_CalculaForm(nEmp in number, nSaf in number, nBrix in number, nLs in number, nPbu in number, cTipo in varchar2) return number is
	nRetorno number;
	Cursor 	C4_Sonda Is
  	 	Select 	CES_CLARIF
	 	From   	GA_CONFI_EMPR_SAFRA
		Where   COD_EMPR 	= nEmp
		  and   SAF_ANO_SAFRA	= nSaf;
	R4_Sonda C4_Sonda%ROWTYPE;
	Begin
		nRetorno := 0;
                nGS_Brix := nBrix;
                nGS_Ls   := nLs;
                nGS_PBU  := nPbu;
	        Open   C4_Sonda;
	        Fetch  C4_Sonda Into R4_Sonda;
	        if     C4_Sonda%found then
		     ----Close 	C4_Sonda;
		       nGS_Clarif	:= R4_Sonda.CES_CLARIF;
		       if  nGS_Clarif      = 1 then
		           nGS_LSCor   := nGS_Ls;
		       else
		           nGS_LsCor   := ((1.00621 * nGS_Ls ) + 0.05117);
		       end if;
		       nGS_Fibra    := gaf_Fibra(nGS_Pbu) ;
		       nGS_PolCaldo := gaf_PolCaldo(nGS_LsCor,nGS_Brix);
		       nGS_Pureza  := gaf_Pureza(nGS_Brix,nGS_PolCaldo);
		       nGS_PolCana := gaf_PolCana(nGS_PolCaldo,nGS_Fibra,nGS_Pbu);
		       nGS_Ar 	 := gaf_ArCana(nGS_Pureza,nGS_Fibra);
		       nGS_Atr 	 := gaf_ATR(nEmp,nSaf,nGS_PolCana,nGS_Ar,1);
		       nGS_AgioAtr := 0;
--gaf_AgioAtr(nSaf,nGS_Atr);
    		       nGS_TmpQuei := 0;
		       nGS_TmpCorte := 0;
		       nGR_Pra := 0;
		       nGR_Prd := 0;
   		       nRetorno := 4;
                       if ctipo = 'TMQ' then
                          nGS_TmpQuei  := nGS_Brix;
                          nGS_TmpCorte := nGS_LS;
                       end if ;
  	       end if;
	       close C4_Sonda;
     	       if  nRetorno > 0 then
  	           nRetorno := GAF_RetForm(cTipo);
	       end if;
	       Return nRetorno;
	Exception
		---When eDadosTec Then
		---	sErroSql := Substr(SqlErrm,1,240);
    		---	nRetorno := 999999.99;
  		---     Return nRetorno;
   		When Others Then
			sErroSql := Substr(SqlErrm,1,240);
    			nRetorno := 999999.99;
  		      Return nRetorno;
   	end GAF_CalculaForm;
----------------------------------------------------------------------
    	Function GAF_RetForm(cTipo in varchar2) return number is
       	    nRetorno number;
     	begin
	    If cTipo = 'PBU' Then
	       nRetorno := nGS_Pbu;
	    ElsIf cTipo = 'BRI' Then
	       nRetorno := nGS_Brix;
	    ElsIf cTipo = 'LS ' Then
	       nRetorno := nGS_Ls;
	    ElsIf cTipo = 'POL' Then
	       nRetorno := nGS_PolCaldo;
	    ElsIf cTipo = 'FIB' Then
	       nRetorno := nGS_Fibra;
	    ElsIf cTipo = 'AGI' Then
	       nRetorno := nGS_Agio;
	    ElsIf cTipo = 'PUR' Then
	       nRetorno := nGS_Pureza;
	    ElsIf cTipo = 'POC' Then
	       nRetorno := nGS_PolCana;
	    ElsIf cTipo = 'ATR' Then
	       nRetorno := nGS_Atr;
	    ElsIf cTipo = 'AR ' Then
	       nRetorno := nGS_Ar;
	    ElsIf cTipo = 'AGATR' Then
	       nRetorno := nGS_AgioAtr;
	    ElsIf cTipo = 'TMQ' Then
	       nRetorno := nGS_TmpQuei;
	    ElsIf cTipo = 'TMC' Then
	       nRetorno := nGS_TmpCorte;
	    ElsIf cTipo = 'PRD' Then
	       nRetorno := 0;
	    ElsIf cTipo = 'PRA' Then
	       nRetorno := 0;
	    End If;
	    return nRetorno;
   	end GAF_RetForm;
----------------------------------------------------------------------
	---------------------------------------------------------------------------------
	--- AREAS POR FINALIDADE DE CORTE
	---------------------------------------------------------------------------------
     	function GAF_CalculaFin( nIdD4 in number,nFinalid in number) return number is
		nRetorno number;
	begin
	    	if nFinalid = 0 then
	    	   begin
	    	      select sum( nvl(A.ed4_area_manual,0)+nvl(A.ed4_area_mecanica,0) )
	    	      into nRetorno
	    	      From ga_estim_divi4_ativa a
	    	      Where a.id_divi4 = nIDD4 and
	    	        a.cod_finalid in (1,2,3,4,5);
	    	   exception
   	    	     when others then
	    	      nRetorno := 0;
	    	   end;
	    	 else
	    	   begin
	    	      select sum( nvl(A.ed4_area_manual,0)+nvl(A.ed4_area_mecanica,0) )
	    	      into nRetorno
	    	      From ga_estim_divi4_ativa a
	    	      Where a.id_divi4 = nIDD4 and
	    	        a.cod_finalid = nFinalid;
	    	   exception
	    	     when others then
	    	      nRetorno := 0;
	    	   end;
	    	 end if;
		Return nRetorno;
        end GAF_CalculaFin;
----------------------------------------------------------------------
        Function GAF_CalculaSondaTVB( nIdD4 in number, cTipo in varchar2, cCorte in number) return number is
	nRetorno number;
	nId_divi4 number;
	nProdu number;
	Cursor curSafras1 Is
	  Select COD_EMPR,
	 	 SAF_ANO_SAFRA
	  From   GA_DIVI4
	  Where  id_divi4 = nIDD4;
	 regSafras1 curSafras1%ROWTYPE;
	Cursor C2_Sonda Is
  	 	Select 	 nvl(SUM(AC_POND_BRIX  * AC_PROD ),0) PAN_BRIX,
          	  	 nvl(SUM(AC_POND_LS    * AC_PROD ),0) PAN_LS,
              	 	 nvl(SUM(AC_POND_PBU   * AC_PROD ),0) PAN_PBU,
         	  	 nvl(SUM(AC_POND_BRIX  * AC_PROD ),0) BRIX_T,
          	  	 nvl(SUM(AC_POND_LS    * AC_PROD ),0) LS_T,
          	  	 nvl(SUM(AC_POND_PBU   * AC_PROD ),0) PBU_T,
          	  	 NVL(SUM( AC_PROD ),0)          AC_PROD,
          	  	 NVL(SUM( AC_PROD ),0)                AC_PR_TOT
       		From    GA_ACUM_D4
		Where  ID_DIVI4 	= nIDD4
                And    cod_empr 	= regSafras1.COD_EMPR
		And    saf_ano_safra 	= regSafras1.SAF_ANO_SAFRA
		And    COD_TIP_CORTE    = cCorte
	   	And    AC_POND_BRIX 	> 0
	   	And    AC_POND_LS	> 0
	   	And    AC_POND_PBU	> 0;
	R2_Sonda C2_Sonda%ROWTYPE;
	Cursor C3_Sonda Is
  	 	Select	nvl(SUM(AC_PROD),0) AC_PROD,
 	    		nvl(SUM(nvl(AC_POND_TEMP_QUEI,0) * AC_PROD ),0) TempoQueima,
	   		nvl(SUM(nvl(AC_POND_TEMP_CORTE,0) * AC_PROD ),0) TempoCorte
       		From   	GA_ACUM_D4
	 	Where  	ID_DIVI4 	= nIDD4
		And     cod_empr 	= regSafras1.COD_EMPR
		And     saf_ano_safra 	= regSafras1.SAF_ANO_SAFRA
		And     COD_TIP_CORTE   = cCorte
	  	And  	(Nvl(AC_POND_TEMP_QUEI,0)  > 0 OR Nvl(AC_POND_TEMP_CORTE,0) > 0);
	R3_Sonda C3_Sonda%ROWTYPE;
	Cursor 	C4_Sonda Is
  	 	Select 	CES_CLARIF
	 	From   	GA_CONFI_EMPR_SAFRA
		Where   COD_EMPR 	= regSafras1.COD_EMPR
		  and   SAF_ANO_SAFRA	= regSafras1.SAF_ANO_SAFRA;
	R4_Sonda C4_Sonda%ROWTYPE;
	Begin
		nRetorno := 0;
		Open  curSafras1;
		Fetch curSafras1 Into regSafras1;
		Close curSafras1;
    		Open C2_Sonda;
		Fetch C2_Sonda Into R2_Sonda;
		if C2_Sonda%found then
      		   nProdu := R2_Sonda.AC_PROD;
		   If nProdu > 0 Then
         	      nGS_Brix := R2_Sonda.PAN_BRIX / nProdu;
         	      nGS_Ls   := R2_Sonda.PAN_LS   / nProdu;
         	      nGS_PBU  := R2_Sonda.PAN_PBU  / nProdu;
         	      Open   C4_Sonda;
	   	      Fetch  C4_Sonda Into R4_Sonda;
		      if     C4_Sonda%found then
	   	             ----Close 	C4_Sonda;
	   	             nGS_Clarif	:= R4_Sonda.CES_CLARIF;
	   	             if  nGS_Clarif      = 1 then
	      	                 nGS_LSCor   := nGS_Ls;
	   	             else
	      	                 nGS_LsCor   := ((1.00621 * nGS_Ls ) + 0.05117);
	   	             end if;
			     nGR_Prd      := R2_Sonda.AC_PR_TOT;
			     nGR_Pra      := R2_Sonda.AC_PROD;
	   	             nGS_Fibra 	  := gaf_Fibra(nGS_Pbu) ;
	   	             nGS_PolCaldo := gaf_PolCaldo(nGS_LsCor,nGS_Brix);
	   	   	     nGS_Pureza  := gaf_Pureza(nGS_Brix,nGS_PolCaldo);
	   	   	     nGS_PolCana := gaf_PolCana(nGS_PolCaldo,nGS_Fibra,nGS_Pbu);
	   	   	     nGS_Ar 	 := gaf_ArCana(nGS_Pureza,nGS_Fibra);
	   	   	     nGS_Atr 	 := gaf_ATR(regSafras1.Cod_Empr,regSafras1.Saf_Ano_Safra,nGS_PolCana,nGS_Ar,1);
	   	   	     nGS_AgioAtr := 0;
           	   	     Open  C3_Sonda;
	   	   	     Fetch C3_Sonda Into R3_Sonda;
	   	   	     If  R3_Sonda.AC_PROD > 0 Then
	         	         nGS_TmpQuei := R3_Sonda.TempoQueima / R3_Sonda.AC_PROD;
				 nGS_TmpCorte := R3_Sonda.TempoCorte / R3_Sonda.AC_PROD;
			     else
			         nGS_TmpCorte := 0;
				 nGS_TmpQuei := 0;
	   	   	     End If;
 			     close C3_Sonda;
			     nRetorno := 4;
                       end if;
		       close C4_Sonda;
		    end if;
		 end if;
		 if  nRetorno > 0 then
  	             nRetorno := GAF_RetSonda(cTipo);
		 end if;
	         Return nRetorno;
	Exception
		---When eDadosTec Then
		---	sErroSql := Substr(SqlErrm,1,240);
    		---	nRetorno := 999999.99;
  		---     Return nRetorno;
   		When Others Then
			sErroSql := Substr(SqlErrm,1,240);
    			nRetorno := 999999.99;
  		      Return nRetorno;
	end GAF_CalculaSondaTVB;
----------------------------------------------------------------------
     	function GAF_CalculaLiberTVB(nIdLib in number, cTipo in varchar2, nIdD4 in number) return number is
	nRetorno number;
	nId_divi4 number;
	nProdu number;
	Cursor curSafras1 Is
	  Select COD_EMPR,
	 	 SAF_ANO_SAFRA
	  From   GA_DIVI4, GA_AREA_LIBER A
	  Where  A.id_liber = nIdlib
	  	 AND A.ID_DIVI4 = nIdD4
	         and ga_divi4.id_divi4 = a.id_divi4;
	 regSafras1 curSafras1%ROWTYPE;
	Cursor C2_Sonda Is
  	 	Select 	 nvl(SUM(AC_POND_BRIX  * AC_PROD ),0) PAN_BRIX,
          	  	 nvl(SUM(AC_POND_LS    * AC_PROD ),0) PAN_LS,
              	 	 nvl(SUM(AC_POND_PBU   * AC_PROD ),0) PAN_PBU,
         	  	 nvl(SUM(AC_POND_BRIX  * AC_PROD ),0) BRIX_T,
          	  	 nvl(SUM(AC_POND_LS    * AC_PROD ),0) LS_T,
          	  	 nvl(SUM(AC_POND_PBU   * AC_PROD ),0) PBU_T,
          	  	 NVL(SUM( AC_PROD ),0)         AC_PROD,
          	  	 NVL(SUM( AC_PROD ),0)               AC_PR_TOT
       		From    GA_ACUM_D4
		Where  ID_LIBER 	= nIdLib
		And    Id_Divi4         = nIdD4
                And    cod_empr 	= regSafras1.COD_EMPR
		And    saf_ano_safra 	= regSafras1.SAF_ANO_SAFRA
	   	And    AC_POND_BRIX 	> 0
	   	And    AC_POND_LS	> 0
	   	And    AC_POND_PBU	> 0;
	R2_Sonda C2_Sonda%ROWTYPE;
	Cursor C3_Sonda Is
  	 	Select	nvl(SUM(AC_PROD),0) AC_PROD,
 	    		nvl(SUM(nvl(AC_POND_TEMP_QUEI,0) * AC_PROD ),0) TempoQueima,
	   		nvl(SUM(nvl(AC_POND_TEMP_CORTE,0) * AC_PROD ),0) TempoCorte
       		From   	GA_ACUM_D4
	 	Where  	ID_LIBER 	= nIdLib
	 	And     Id_Divi4        = nIdD4
		And     cod_empr 	= regSafras1.COD_EMPR
		And     saf_ano_safra 	= regSafras1.SAF_ANO_SAFRA
	  	And  	(Nvl(AC_POND_TEMP_QUEI,0)  > 0 OR Nvl(AC_POND_TEMP_CORTE,0) > 0);
	R3_Sonda C3_Sonda%ROWTYPE;
	Cursor 	C4_Sonda Is
  	 	Select 	CES_CLARIF
	 	From   	GA_CONFI_EMPR_SAFRA
		Where   COD_EMPR 	= regSafras1.COD_EMPR
		  and   SAF_ANO_SAFRA	= regSafras1.SAF_ANO_SAFRA;
	R4_Sonda C4_Sonda%ROWTYPE;
	Begin
		nRetorno := 0;
		Open  curSafras1;
		Fetch curSafras1 Into regSafras1;
		Close curSafras1;
    		Open C2_Sonda;
		Fetch C2_Sonda Into R2_Sonda;
		if C2_Sonda%found then
      		   nProdu := R2_Sonda.AC_PROD;
		   If nProdu > 0 Then
         	      nGS_Brix := R2_Sonda.PAN_BRIX / nProdu;
         	      nGS_Ls   := R2_Sonda.PAN_LS   / nProdu;
         	      nGS_PBU  := R2_Sonda.PAN_PBU  / nProdu;
         	      Open   C4_Sonda;
	   	      Fetch  C4_Sonda Into R4_Sonda;
		      if     C4_Sonda%found then
	   	             nGS_Clarif	:= R4_Sonda.CES_CLARIF;
	   	             if  nGS_Clarif      = 1 then
	      	                 nGS_LSCor   := nGS_Ls;
	   	             else
	      	                 nGS_LsCor   := ((1.00621 * nGS_Ls ) + 0.05117);
	   	             end if;
			     nGR_Prd      := R2_Sonda.AC_PR_TOT;
			     nGR_Pra      := R2_Sonda.AC_PROD;
	   	             nGS_Fibra 	  := gaf_Fibra(nGS_Pbu) ;
	   	             nGS_PolCaldo := gaf_PolCaldo(nGS_LsCor,nGS_Brix);
	   	   	     nGS_Pureza  := gaf_Pureza(nGS_Brix,nGS_PolCaldo);
	   	   	     nGS_PolCana := gaf_PolCana(nGS_PolCaldo,nGS_Fibra,nGS_Pbu);
	   	   	     nGS_Ar 	 := gaf_ArCana(nGS_Pureza,nGS_Fibra);
	   	   	     nGS_Atr 	 := gaf_ATR(regSafras1.Cod_Empr,regSafras1.Saf_Ano_Safra,nGS_PolCana,nGS_Ar,1);
	   	   	     nGS_AgioAtr := 0;
           	   	     Open  C3_Sonda;
	   	   	     Fetch C3_Sonda Into R3_Sonda;
	   	   	     If  R3_Sonda.AC_PROD > 0 Then
	         	         nGS_TmpQuei := R3_Sonda.TempoQueima / R3_Sonda.AC_PROD;
				 nGS_TmpCorte := R3_Sonda.TempoCorte / R3_Sonda.AC_PROD;
			     else
			         nGS_TmpCorte := 0;
				 nGS_TmpQuei := 0;
	   	   	     End If;
 			     close C3_Sonda;
			     nRetorno := 4;
                       end if;
		       close C4_Sonda;
		    end if;
		 end if;
		 if  nRetorno > 0 then
  	             nRetorno := GAF_RetSonda(cTipo);
		 end if;
	         Return nRetorno;
	Exception
   		When Others Then
			sErroSql := Substr(SqlErrm,1,240);
    			nRetorno := 999999.99;
  	        Return nRetorno;
   	end GAF_CalculaLiberTVB;
----------------------------------------------------------------------
end gapk_calc;
