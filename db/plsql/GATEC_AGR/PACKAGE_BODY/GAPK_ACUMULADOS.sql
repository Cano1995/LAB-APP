CREATE OR REPLACE package body gapk_acumulados As

-- MainAcumulados --
Procedure Gap_MainAcumulado (	nParEmpr   In     Number,
				nParSafra  In     Number,
				dParDtaIni In     Date  ,
				dParDtaFim In     Date  ,
				cTipoAcu   In     Char  ,
  				cTipoPro   In     Char  ,
				nParLibe   In     Number,
				nQuantos   In Out Number,
				nRetorno   In Out Number ) Is

/*
nParEmpr  : Empresa
nParSafra : Safra
dParData  : Data limite para processo de acumulado
cTipoAuc  : Tipo de Liberacao a Processar
			'GER' - Todas as cargas
			'UMA' - Reprocessa uma liberacao especifica
				  Quando for uma deve indica qual o nomero
cTipoPro  : Tipo de Processo a executar
			'ATU' - Atualiza o Acumulado
  			'REP' - Reprocessao Acumulado Geral
nParLibe  : Numero da Liberacao a Processar
nQuantos  : Retorna o numero de viagens processadas
nRetorno  : Retorno
*/

Cursor curReprocessa Is
        select  id_liber     LIBER,
                rowid        NUMROW,
                rep_data     DATA
        from    ga_acum_rep      ac
        where   rep_ok is null and
                rep_tip = 'N';
regReprocessa curReprocessa%ROWTYPE;

dMenorData  date;
dMaiorData  date;
type Variaveis IS RECORD
(   id_liber       number(12)  );
type Array_variaveis IS TABLE OF Variaveis
        index by BINARY_INTEGER;
aLiber     Array_variaveis;
i           number;
nCopLibe    Number;
sRow        varchar2(19);

   Begin

        begin
         select 0 into nRetorno from GA_ACUM_D1 where rownum = 1 for update;
        exception
         when others then
           nRetorno := 0;
        end;
      i         := 0;
      nSafra    := nParSafra;
      nEmpr     := nParEmpr;
      nLibNume  := nParLibe;
      if nLibNume is not null then
         begin
           select id_liber into nLibNume from ga_liberacao
           where lib_numero = nParLibe and nSafra = saf_ano_safra and cod_empr = nEmpr;
         exception
          when others then
            nLibNume := 0;
         end;
         i := i + 1;
         aLiber(i).id_liber := nLibNume;
      end if;
	sProcesso := 'curEmprSafra';
	Open curEmprSafra;
	Loop
		Fetch curEmprSafra Into regEmprSafra;
		Exit When curEmprSafra%NOTFOUND;

                sProcesso := 'curConfSaf';
                Open curConfSaf;
                Fetch curConfSaf Into regConfSaf;
                Close curConfSaf;

		sProcesso := 'curConfCpc';
		Open curConfCpc;
		Fetch curConfCpc Into regConfCpc;

                dDataIni := Gaf_DiaHoraBal( Gaf_DiaBalanca(dParDtaIni),'I' );
                dDataFim := Gaf_DiaHoraBal( Gaf_DiaBalanca(dParDtaFim),'F' );

		if regConfCpc.PROCACUM = 1 then

			If cTipoPro = 'REP' Then
					sProcesso := 'Chamando delecao';
					Gap_DeletaAcumulado( cTipoAcu );
			End If;

                        sProcesso := 'Reprocessando Table GA_ACUM_REP';
                        open curReprocessa;
                        nCopLibe := nLibNume;
                        dMenorData  := dDataIni;
                        dMaiorData  := dDataFim;
                        loop
                           fetch curReprocessa into regReprocessa;
                             exit when curReprocessa%NOTFOUND;
                           nLibNume := regReprocessa.Liber;
                           dDataIni := Gaf_DiaHoraBal(regReprocessa.Data,'I');
                           dDataFim := Gaf_DiaHoraBal(regReprocessa.Data,'F');
                           if dDataIni < dMenorData then
                              dMenorData := dDataIni;
                           end if;
                           if dDataFim > dMaiorData then
                              dMaiorData := dDataFim;
                           end if;
                           sRow     := regReprocessa.NumRow;
                           Gap_DeletaAcumulado('UMA');
                           update ga_acum_rep set rep_ok = 'X'
                             where rowid = sRow;
                           i := i + 1;
                           aLiber(i).id_liber := nLibNume;
                        end loop;
                        nLibNume := nCopLibe;
                        dDataIni := dMenorData;
                        dDataFim := dMaiorData;
                        close curReprocessa;


                        i := 0;
                        loop
                           i := i + 1;
                           if cTipoAcu = 'GER' then
                              exit when i = 2;
  		              sProcesso := 'curContainer - Acumulado GERAL';
			      Open curContainer;
                           else
                              exit when i > aLiber.count;
                              sProcesso := 'curContainerLiber - Acumulado por uma Liberacao';
  			      Open curContainerLiber;
                              nLibNume := aLiber(i).id_liber;
                           end if;

			Loop

				If    cTipoAcu = 'GER' Then
					sProcesso := 'Fetch curContainer';
					Fetch curContainer Into 	recContainer.LIBE,
									recContainer.DTEN,
									recContainer.HREN,
									recContainer.DTCO,
									recContainer.HRCO,
									recContainer.DTTA,
									recContainer.HRTA,
									recContainer.PESO,
									recContainer.QUEI,
									recContainer.PERC,
									recContainer.TIPO_TC,
									recContainer.VAL_TQ,
									recContainer.VAL_TC,
									recContainer.CORT,
									recContainer.PSAN,
									recContainer.BRIX,
									recContainer.PBU,
									recContainer.LS,
									recContainer.ID,
									recContainer.FLAG,
									recContainer.ANAL,
									recContainer.CANC;
					Exit When curContainer%NOTFOUND;
				ElsIf cTipoAcu = 'UMA' Then
					sProcesso := 'Fetch curContainerLiber';
					Fetch curContainerLiber Into 	recContainer.LIBE,
									recContainer.DTEN,
									recContainer.HREN,
									recContainer.DTCO,
									recContainer.HRCO,
									recContainer.DTTA,
									recContainer.HRTA,
									recContainer.PESO,
									recContainer.QUEI,
									recContainer.PERC,
									recContainer.TIPO_TC,
									recContainer.VAL_TQ,
									recContainer.VAL_TC,
									recContainer.CORT,
									recContainer.PSAN,
									recContainer.BRIX,
									recContainer.PBU,
									recContainer.LS,
									recContainer.ID,
									recContainer.FLAG,
									recContainer.ANAL,
									recContainer.CANC;
					Exit When curContainerLiber%NOTFOUND;

				End If;

				sProcesso := 'curLiberacao';

			      	Open curLiberacao;
				Fetch curLiberacao Into regLiberacao;

				nFalha := 0;

				bInutiliza := FALSE;

				sProcesso := 'Testando se existe analise';
				if recContainer.ANAL > 0 then
                                        if recContainer.BRIX > 0 AND recContainer.CANC = 0 then
						-- Atualizado por completo
						nStatusContainer := 1;
					else
						-- Verifica se analise esta Cancelada
						sProcesso := 'Verifica se analise esta cancelada';
						if recContainer.CANC = 0 then
							-- Aguardar analise
							nStatusContainer := 2;
							-- Determina do tempo limite para atuacao do lab. analise
							-- Somar Prod para Data/Hora Tara < 4 Horas
							If ( ( SYSDATE - recContainer.HRTA ) * 24 ) > regConfCpc.TEMPOACUM Then
								sProcesso := 'Nao Faz';
								nStatusContainer := 1;
								bInutiliza := TRUE;
							end if;
						else
							sProcesso := 'Nao Faz analise inutilizada';
							nStatusContainer := 1;
						end if;
					end if;
				else
					-- Nao ira exitir analise
					nStatusContainer := 1;
				end if;

				Gap_AcumLiberacao;

				Gap_DistribuiCarga;

	                 	If nFalha = 0 Then
					Gap_AtualizaContainer;
				Else
					nRetorno := nFalha;
			          	insert into log_erro
						values ('Falha no Processo de Calculo de Acumulados ' || ' ' ||
                                         	USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
							sProcesso || ' ' ||
							'COD_EMPR     ->' || regLiberacao.COD_EMPR 	|| ' ' ||
							'SAF_ANO_SAFRA->' || regLiberacao.SAF_ANO_SAFRA || ' ' ||
							'ID_LIBER	  ->' || regLiberacao.ID_LIBER 	|| ' ' ||
							'COD_TIP_CORTE->' || regLiberacao.COD_TIP_CORTE || ' ' ||
							'DIACANA	  ->' || dDiaCana 			|| ' ' ||
							'ID_LANC_CONTA->' || recContainer.ID		|| ' ' ||
							sErroSql );
				end if;

				close curLiberacao;

		End Loop;

		sProcesso := 'Ver nQuantos';
		If cTipoAcu = 'GER' then
			nQuantos := curContainer%ROWCOUNT;
			Close	curContainer;
		ElsIf cTipoAcu = 'UMA' Then
                        if i = 1 then
   			   nQuantos := curContainerLiber%ROWCOUNT;
                        end if;
			Close	curContainerLiber;
		End If;

                End loop;

	End If;

	Close curConfCpc;

	End Loop;

	Close curEmprSafra;

	commit;

	Exception
		When Others Then
			nFalha := 1;
      	      sErroSql := Substr(SqlErrm,1,240);
	          	Insert Into Log_Erro Values ('Falha na Procedure Gap_MainAcumulados ' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
   End Gap_MainAcumulado;

-- Processo de Acumulo da Liberacao
Procedure Gap_AcumLiberacao Is
Cursor curAcumLiber Is
	Select *
	    From GA_ACUM_LIBER
		 Where COD_EMPR       = regLiberacao.COD_EMPR
		   And SAF_ANO_SAFRA  = regLiberacao.SAF_ANO_SAFRA
		   And ID_LIBER       = regLiberacao.ID_LIBER
		   And COD_TIP_CORTE  = regLiberacao.COD_TIP_CORTE
		   And AC_DT_ACUM     = dDiaCana
	    For Update;

regAcumLiber curAcumLiber%ROWTYPE;

   Begin

      	sProcesso := 'Gap_AcumLiberacao - Inicio';

	dDiaCana := Gaf_DiaBalanca( recContainer.HRTA );

      nTempoQue := 0;
      nTempoCor := 0;
 	If regLiberacao.QUEIMA = 'S' Then
           Gap_TempoQueima;
	end if;

	if regLiberacao.CALC_CORTE = 'S' Then
           Gap_TempoCorte;
	End If;

	Gap_AcumDadosTecnologicos( 'LIBE' , 0 );

	Open curAcumLiber;
	Fetch curAcumLiber Into regAcumLiber;

	If curAcumLiber%FOUND Then
		sProcesso := 'Update em AcumLiber';
		-- Brix maior que zero e analise cancelada
		If recContainer.PSAN > 0 and recContainer.CANC = 0 Then
			nBrix :=
				(( Nvl(regAcumLiber.AC_POND_BRIX,0) * Nvl(regAcumLiber.AC_PROD_ANALI,0) ) +
					nBrix  ) /
	 		       ( regAcumLiber.AC_PROD_ANALI + recContainer.PSAN );

			nPbu  :=
				(( Nvl(regAcumLiber.AC_POND_PBU,0)  * Nvl(regAcumLiber.AC_PROD_ANALI,0) ) +
					nPbu  ) /
				( regAcumLiber.AC_PROD_ANALI + recContainer.PSAN );

			nLs   :=
			      (( Nvl(regAcumLiber.AC_POND_LS,0)   * Nvl(regAcumLiber.AC_PROD_ANALI,0) ) +
					nLs  ) /
			      ( regAcumLiber.AC_PROD_ANALI + recContainer.PSAN );
			nAnali := regAcumLiber.AC_PROD_ANALI + recContainer.PSAN;
		Else
			nBrix    := regAcumLiber.AC_POND_BRIX;
			nPbu     := regAcumLiber.AC_POND_PBU;
			nLS      := regAcumLiber.AC_POND_LS;
			nAnali   := regAcumLiber.AC_PROD_ANALI;
		End If;

		sProcesso := 'Verificando flag do container - ACUMLIBER';


		if recContainer.FLAG = 0 then

			If nTempoQue > 0 Then
				nTempoQue := ( ( regAcumLiber.AC_POND_TEMP_QUEI  * regAcumLiber.AC_PROD ) +
						   ( nTempoQue * recContainer.PESO ) ) /
						   ( nvl(regAcumLiber.AC_PROD,0) + recContainer.PESO );
				If nTempoQue > 999 Then
					nTempoQue := 999;
				End If;

                        Else
                           nTempoQue := regAcumLiber.AC_POND_TEMP_QUEI;
 			End If;
			If nTempoCor > 0 Then
				nTempoCor := ( ( regAcumLiber.AC_POND_TEMP_CORTE * regAcumLiber.AC_PROD ) +
						   ( nTempoCor * recContainer.PESO ) ) /
						   ( nvl(regAcumLiber.AC_PROD,0) + recContainer.PESO );
				If nTempoCor > 999 Then
					nTempoCor := 999;
				End If;
                        else
                           nTempoCor := regAcumLiber.AC_POND_TEMP_CORTE;
 			End If;
			nProd     := regAcumLiber.AC_PROD + recContainer.PESO;
		else
			-- mantem os valores atuais para cargas
			--insert into log_erro values ( 'MANTEM' );
			nProd     := regAcumLiber.AC_PROD;
			nTempoQue := regAcumLiber.AC_POND_TEMP_QUEI;
			nTempoCor := regAcumLiber.AC_POND_TEMP_CORTE;
		end if;

		Update GA_ACUM_LIBER Set
						AC_PROD 	       	= nProd,
						AC_PROD_ANALI      	= nAnali,
						AC_POND_BRIX	 	= nBrix,
						AC_POND_PBU		= nPbu,
						AC_POND_LS		= nLS,
						AC_POND_TEMP_QUEI  	= nTempoQue,
                                                AC_POND_TEMP_CORTE        = nTempoCor

                                Where current of curAcumLiber;

	Else

	--insert into log_erro values ('Empresa: '|| regLiberacao.COD_EMPR ||' Safra: ' || regLiberacao.SAF_ANO_SAFRA || ' Liberacao: ' || regLiberacao.ID_LIBER || ' Tipo Corte: ' || regLiberacao.COD_TIP_CORTE || ' Data: ' || dDiaCana || ' Producao: ' || recContainer.PESO|| ' Alt1' );

		sProcesso := 'Inclusao em AcumLiber';
		Insert Into GA_ACUM_LIBER ( COD_EMPR,
						    SAF_ANO_SAFRA,
						    ID_LIBER,
						    COD_TIP_CORTE,
						    AC_DT_ACUM,
						    AC_PROD,
						    AC_PROD_ANALI,
						    AC_POND_BRIX,
						    AC_POND_LS,
						    AC_POND_PBU,
						    AC_POND_TEMP_QUEI,
						    AC_POND_AR,
						    AC_POND_TEMP_CORTE )
  					Values  ( regLiberacao.COD_EMPR,
						    regLiberacao.SAF_ANO_SAFRA,
						    regLiberacao.ID_LIBER,
						    regLiberacao.COD_TIP_CORTE,
						    dDiaCana,
						    recContainer.PESO,
						    recContainer.PSAN,
						    recContainer.BRIX,
						    recContainer.LS ,
						    recContainer.PBU,
						    nTempoQue,
						    0,
						    nTempoCor );
	End If;

	Close curAcumLiber;

	Exception
		When Others Then
			nFalha := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
			nFalha := 1;
 	          	Insert Into Log_Erro Values ('Falha na Procedure Gap_AcumLiberacao ' || ' ' ||
	                                          USER || ' ' ||
								to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;

   End Gap_AcumLiberacao;

Procedure Gap_TempoQueima Is

nDia   Number;
nHora  Number;
nMinu  Number;
nRet   Number;

   Begin

	sProcesso := 'Calculando Tempo Queima';
	-- Resultado Em Horas
--        if regConfSaf.COM_QUEIMA = 1 Then
--           Gap_TmpQueComunic( regEmprSafra.COD_EMPR,regEmprSafra.SAF_ANO_SAFRA,sysdate,sysdate,recContainer.ID,0,nRet ) ;
--        else

--         if recContainer.VAL_TQ is null Then

                   nDia     := ( recContainer.DTEN - regLiberacao.LIB_DT_ABERT ) * 24;

                   nHora    := ( to_number( to_char( recContainer.HREN , 'HH24' ) ) -
                                     to_number( to_char( regLiberacao.LIB_HR_ABERT , 'HH24' ) ) );

                   nMinu    := ( to_number( to_char( recContainer.HREN , 'MI' ) ) -
                                     to_number( to_char( regLiberacao.LIB_HR_ABERT , 'MI' ) ) ) / 60;

                   nTempoQue := Round(Nvl(nDia + nHora + round(nMinu,8),0),8);

                   if nTempoQue > 999 Then
                           nTempoQue := 999;
                   end if;

--           else
--                   nTempoQue := recContainer.VAL_TQ;
--           end if;
 --     end if;


	Exception
		When Others Then
			nFalha := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
 	          	Insert Into Log_Erro Values ('Falha na Procedure Gap_TempoQueima ' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;
   End;

Procedure Gap_TempoCorte Is

nDia   Number;
nHora  Number;
nMinu  Number;

   Begin

 	sProcesso := 'Calculando Tempo Corte';
	-- Resultado Em Horas

--	if recContainer.VAL_TC is null Then

		if recContainer.TIPO_TC = 0 Then
			nDia     := ( recContainer.DTEN - nvl(recContainer.DTCO,regLiberacao.LIB_DT_ABERT) ) * 24;

			nHora    := ( to_number( to_char( recContainer.HREN , 'HH24' ) ) -
					  to_number( to_char( nvl(recContainer.HRCO,regLiberacao.LIB_HR_ABERT ), 'HH24' ) ) );
			nMinu    := ( to_number( to_char( recContainer.HREN,  'MI' ) ) -
					  to_number( to_char( nvl(recContainer.HRCO,regLiberacao.LIB_HR_ABERT ), 'MI' ) ) ) / 60;
		else
			nDia     := ( recContainer.DTEN - regLiberacao.LIB_DT_ABERT ) * 24;

			nHora    := ( to_number( to_char( recContainer.HREN , 'HH24' ) ) -
					  to_number( to_char( regLiberacao.LIB_HR_ABERT, 'HH24' ) ) );
			nMinu    := ( to_number( to_char( recContainer.HREN,  'MI' ) ) -
					  to_number( to_char( regLiberacao.LIB_HR_ABERT, 'MI' ) ) ) / 60;
		end if;


		nTempoCor := Round(Nvl(nDia + nHora + round(nMinu,8),0),0);

		if nTempoCor > 999 then
			nTempoCor := 999;
		end if;

--	else
--		nTempoCor := recContainer.VAL_TC;
--	end if;


	Exception
		When Others Then
			nFalha := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
 	          	Insert Into Log_Erro Values ('Falha na Procedure Gap_TempoCorte ' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;
   End;



Procedure  Gap_AcumDadosTecnologicos( cTipo   In Char ,
						  nIndice In Number ) Is

   Begin

    If recContainer.PSAN <> 0 Then
	If cTipo = 'LIBE' Then
		nBrix := recContainer.BRIX * recContainer.PSAN;
		nPbu  := recContainer.PBU  * recContainer.PSAN;
		nLs   := recContainer.Ls   * recContainer.PSAN;
	ElsIf cTipo = 'DIVI' Then
		nBrix := TblAcum( nIndice+13+100*nIndice ) * TblAcum( nIndice+12+100*nIndice );
		nLs   := TblAcum( nIndice+14+100*nIndice ) * TblAcum( nIndice+12+100*nIndice );
		nPbu  := TblAcum( nIndice+15+100*nIndice ) * TblAcum( nIndice+12+100*nIndice );
	End If;
    End If;

   End;

Procedure  Gap_DistribuiCarga Is
Cursor curAreasLiber Is
	Select li.COD_EMPR,
		 li.SAF_ANO_SAFRA,
		 la.ID_LIBER ,
		 d4.ID_DIVI4 ,
		 d4.COD_DIVI1,
		 d4.COD_DIVI2,
		 d4.COD_DIVI3,
		 d4.COD_DIVI4,
		 la.TAL_AREA_LIB
	    From GA_LIBERACAO   li,
		   GA_AREA_LIBER  la,
		   GA_DIVI4       d4
		 Where li.ID_LIBER	=     regLiberacao.ID_LIBER
		   And li.ID_LIBER 	= 	la.ID_LIBER
		   And la.ID_DIVI4	=     d4.ID_DIVI4
  	    Order By 1,3,4,5,6;
regAreasLiber curAreasLiber%ROWTYPE;

Cursor curSomaAreas Is
	Select Count(*)               TOTAL,
		 Sum( la.TAL_AREA_LIB ) SOMA
	    From GA_LIBERACAO  li,
		   GA_AREA_LIBER la
		 Where li.ID_LIBER	=    regLiberacao.ID_LIBER
		   And li.ID_LIBER      =    la.ID_LIBER;
regSomaAreas curSomaAreas%ROWTYPE;

nCont 	Number := 0;
nTotal 	Number := 0;
nSomaProdu  Number := 0;
nSomaAnali  Number := 0;
nFator      Number := 0;

   Begin

	sProcesso := 'Abrindo curSomaAreas';

	Open curSomaAreas;
	Fetch curSomaAreas Into regSomaAreas;
	Close curSomaAreas;

	sProcesso := 'Abrindo curAreasLiber';
	Open curAreasLiber;

	nSomaProdu := 0;
	nSomaAnali := 0;

	Loop

		Fetch curAreasLiber Into regAreasLiber;
		Exit When curAreasLiber%NOTFOUND;

		nCont := nCont + 1;

		sProcesso := 'Montando Vetor para Explosao das Areas';

		TblAcum(nCont+01+100*nCont)      := regLiberacao.COD_EMPR;
		TblAcum(nCont+02+100*nCont)      := regLiberacao.SAF_ANO_SAFRA;
		TblAcum(nCont+03+100*nCont)      := regAreasLiber.COD_DIVI1;
		TblAcum(nCont+04+100*nCont)      := regAreasLiber.COD_DIVI2;
		TblAcum(nCont+05+100*nCont)      := regAreasLiber.COD_DIVI3;
		TblAcum(nCont+06+100*nCont)      := regAreasLiber.COD_DIVI4;
		TblAcum(nCont+07+100*nCont)      := regAreasLiber.ID_LIBER;
		TblAcum(nCont+08+100*nCont)      := regLiberacao.COD_TIP_CORTE;
		TblAcum(nCont+09+100*nCont)      := dDiaCana;
		TblAcum(nCont+10+100*nCont)      := regAreasLiber.ID_DIVI4;

 		-- Fator para descobrir a Producao por d4 --
		If nCont <> regSomaAreas.TOTAL Then
			sProcesso := 'Calculando Producao para Quadra para nCont <> regSomaAreas.TOTAL';
			nFator    := round(( regAreasLiber.TAL_AREA_LIB / regSomaAreas.SOMA ),6);
			TblAcum(nCont+11+100*nCont) := round(nFator * ( recContainer.PESO ),0);
			nSomaProdu :=  nSomaProdu + TblAcum(nCont+11+100*nCont);
		Else
			sProcesso := 'Calculando Producao para Quadra para nCont =  regSomaAreas.TOTAL';
			If regSomaAreas.TOTAL  = 1 Then
				nFator := round(( regAreasLiber.TAL_AREA_LIB / regSomaAreas.SOMA  ),6);
				TblAcum(nCont+11+100*nCont) := nFator * ( recContainer.PESO );
			Else
				TblAcum(nCont+11+100*nCont) := ( recContainer.PESO - nSomaProdu );
			End If;
		End If;

		-- Fator para descobrir a Producao por d4 Analise --
		If nCont <> regSomaAreas.TOTAL Then
			sProcesso := 'Calculando Producao Anali para Quadra para nCont <> regSomaAreas.TOTAL';
			nFator    := round(( regAreasLiber.TAL_AREA_LIB / regSomaAreas.SOMA ),6);
			TblAcum(nCont+12+100*nCont) := round(nFator * ( recContainer.PSAN ),0);
			nSomaAnali := nSomaAnali + TblAcum(nCont+12+100*nCont);
		Else
			sProcesso := 'Calculando Producao Anali para Quadra para nCont =  regSomaAreas.TOTAL';
			If regSomaAreas.TOTAL = 1 Then
				nFator := round(( regAreasLiber.TAL_AREA_LIB / regSomaAreas.SOMA  ),6);
				TblAcum(nCont+12+100*nCont) := nFator * ( recContainer.PSAN );
			Else
				TblAcum(nCont+12+100*nCont) := ( recContainer.PSAN - nSomaAnali );
			End If;
		End If;

		TblAcum(nCont+13+100*nCont) := recContainer.BRIX;
		TblAcum(nCont+14+100*nCont) := recContainer.LS;
		TblAcum(nCont+15+100*nCont) := recContainer.PBU;
		TblAcum(nCont+16+100*nCont) := nTempoQue;
		TblAcum(nCont+17+100*nCont) := 0;
		TblAcum(nCont+18+100*nCont) := nTempoCor;

	End Loop;
	For nCont In 1..curAreasLiber%ROWCOUNT Loop

		sProcesso := 'Loop para Calcular as Divisoes ';
		Gap_AcumDivisaoUm( nCont );
		Gap_AcumDivisaoDois( nCont );
		Gap_AcumDivisaoTres( nCont );
		Gap_AcumDivisaoQuatro( nCont );

	End Loop;

	Close curAreasLiber;

	Exception
		When Others Then
			nFalha := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
 	          	Insert Into Log_Erro Values ('Falha na Procedure Gap_DistribuiCarga ' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;

   End;

Procedure Gap_AcumDivisaoUm( nIndice In Number ) Is
Cursor curAcumDiviUm Is
	Select *
	    From GA_ACUM_D1
		 Where COD_EMPR       = TblAcum( nIndice+01+100*nIndice )
		   And SAF_ANO_SAFRA  = TblAcum( nIndice+02+100*nIndice )
                   And COD_DIVI1      = TblAcum( nIndice+03+100*nIndice )
                   And ID_LIBER       = TblAcum( nIndice+07+100*nIndice )
		   And COD_TIP_CORTE  = TblAcum( nIndice+08+100*nIndice )
		   And AC_DT_ACUM     = dDiaCana
--		   And AC_DT_ACUM     = TblAcum( nIndice+09+100*nIndice )
  	  For Update;
regAcumDiviUm curAcumDiviUm%ROWTYPE;

   Begin

	sProcesso := 'Abrindo curAcumDiviUm';
	Open curAcumDiviUm;
	Fetch curAcumDiviUm Into regAcumDiviUm;

	Gap_AcumDadosTecnologicos( 'DIVI' , nIndice );

	If curAcumDiviUm%FOUND Then
		sProcesso := 'Update Em curAcumDiviUm';
		If recContainer.PSAN > 0 and recContainer.CANC = 0 Then
			nBrix :=
    			      (( Nvl(regAcumDiviUm.AC_POND_BRIX,0) * Nvl(regAcumDiviUm.AC_PROD_ANALI,0) ) +
					nBrix  ) /
	 		       ( regAcumDiviUm.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice ) );

			nPbu  :=
				(( Nvl(regAcumDiviUm.AC_POND_PBU,0)  * Nvl(regAcumDiviUm.AC_PROD_ANALI,0) ) +
					nPbu  ) /
				( regAcumDiviUm.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice ) );

			nLs   :=
			      (( Nvl(regAcumDiviUm.AC_POND_LS,0)   * Nvl(regAcumDiviUm.AC_PROD_ANALI,0) ) +
					nLs  ) /
			      ( regAcumDiviUm.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice )  );
			nAnali := regAcumDiviUm.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice );
		Else
			nBrix  := regAcumDiviUm.AC_POND_BRIX;
			nPbu   := regAcumDiviUm.AC_POND_PBU;
			nLS    := regAcumDiviUm.AC_POND_LS;
			nAnali := regAcumDiviUm.AC_PROD_ANALI;
		End If;


		if recContainer.FLAG = 0 then
			If nTempoQue > 0 Then
				nTempoQue := ( ( regAcumDiviUm.AC_POND_TEMP_QUEI  * regAcumDiviUm.AC_PROD ) +
						   ( nTempoQue * TblAcum( nIndice+11+100*nIndice ) ) ) /
						   ( Nvl(regAcumDiviUm.AC_PROD,0) + TblAcum( nIndice+11+100*nIndice ) );
				If nTempoQue > 999 Then
					nTempoQue := 999;
				End If;

                        Else
                           nTempoQue := regAcumDiviUm.AC_POND_TEMP_QUEI;
 			End If;

			If nTempoCor > 0 Then
				nTempoCor := ( ( regAcumDiviUm.AC_POND_TEMP_CORTE * regAcumDiviUm.AC_PROD ) +
						   ( nTempoCor * TblAcum( nIndice+11+100*nIndice ) ) ) /
						   ( regAcumDiviUm.AC_PROD + TblAcum( nIndice+11+100*nIndice ) );
				If nTempoCor > 999 Then
					nTempoCor := 999;
				End If;
			End If;
			nProd	    := regAcumDiviUm.AC_PROD + TblAcum( nIndice+11+100*nIndice );
		else
			nProd     := regAcumDiviUm.AC_PROD;
                        nTempoQue := regAcumDiviUm.AC_POND_TEMP_QUEI;
                        nTempoCor := regAcumDiviUm.AC_POND_TEMP_CORTE;
		end if;


        Update GA_ACUM_D1
			Set AC_PROD            = nProd,
			    AC_PROD_ANALI      = nAnali,
			    AC_POND_BRIX       = nBrix,
                            AC_POND_LS         = nLs,
			    AC_POND_PBU        = nPBU,
			    AC_POND_TEMP_QUEI  = nTempoQue,
			    AC_POND_AR	     = 0,
			    AC_POND_TEMP_CORTE = nTempoCor
			Where Current of curAcumDiviUm;
	Else
	        sProcesso := 'Insert Em curAcumDiviUm';
		Insert Into GA_ACUM_D1 ( COD_EMPR,
						 SAF_ANO_SAFRA,
						 COD_DIVI1,
						 ID_LIBER,
						 COD_TIP_CORTE,
						 AC_DT_ACUM,
						 AC_PROD,
						 AC_PROD_ANALI,
						 AC_POND_BRIX,
						 AC_POND_LS,
						 AC_POND_PBU,
                                                 AC_POND_TEMP_QUEI,
						 AC_POND_AR,
						 AC_POND_TEMP_CORTE )
				    Values ( TblAcum( nIndice+01+100*nIndice ),
						 TblAcum( nIndice+02+100*nIndice ),
						 TblAcum( nIndice+03+100*nIndice ),
						 TblAcum( nIndice+07+100*nIndice ),
						 TblAcum( nIndice+08+100*nIndice ),
						 dDiaCana,
						 TblAcum( nIndice+11+100*nIndice ),
						 TblAcum( nIndice+12+100*nIndice ),
						 TblAcum( nIndice+13+100*nIndice ),
						 TblAcum( nIndice+14+100*nIndice ),
						 TblAcum( nIndice+15+100*nIndice ),
						 TblAcum( nIndice+16+100*nIndice ),
						 TblAcum( nIndice+17+100*nIndice ),
						 TblAcum( nIndice+18+100*nIndice ) );

	End IF;

	Close curAcumDiviUm;

	Exception
		When Others Then
			nFalha := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
 	          	Insert Into Log_Erro Values ('Falha na Procedure Gap_AcumDivisaoUm' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;
   End;

Procedure Gap_AcumDivisaoDois( nIndice In Number ) Is
Cursor curAcumDiviDois Is
	Select *
	    From GA_ACUM_D2
		 Where COD_EMPR       = TblAcum( nIndice+01+100*nIndice )
		   And SAF_ANO_SAFRA  = TblAcum( nIndice+02+100*nIndice )
		   And COD_DIVI1	    = TblAcum( nIndice+03+100*nIndice )
		   And COD_DIVI2      = TblAcum( nIndice+04+100*nIndice )
		   And ID_LIBER	    = TblAcum( nIndice+07+100*nIndice )
		   And COD_TIP_CORTE  = TblAcum( nIndice+08+100*nIndice )
		   And AC_DT_ACUM     = dDiaCana
--		   And AC_DT_ACUM     = TblAcum( nIndice+09+100*nIndice )
  	  For Update;

regAcumDiviDois curAcumDiviDois%ROWTYPE;

   Begin

	sProcesso := 'Abrindo curAcumDiviDois';
	Open curAcumDiviDois;
	Fetch curAcumDiviDois Into regAcumDiviDois;

	Gap_AcumDadosTecnologicos( 'DIVI' , nIndice );

	If curAcumDiviDois%FOUND Then
		sProcesso := 'Update Em curAcumDiviDois';

		If recContainer.PSAN > 0 and recContainer.CANC = 0 then
			nBrix  :=
	  			 (( Nvl(regAcumDiviDois.AC_POND_BRIX,0) * Nvl(regAcumDiviDois.AC_PROD_ANALI,0) ) +
					nBrix  ) /
	 		       ( regAcumDiviDois.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice ) );

			nPbu   :=
				(( Nvl(regAcumDiviDois.AC_POND_PBU,0)  * Nvl(regAcumDiviDois.AC_PROD_ANALI,0) ) +
					nPbu  ) /
				( regAcumDiviDois.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice ) );

			nLs    :=
			      (( Nvl(regAcumDiviDois.AC_POND_LS,0)   * Nvl(regAcumDiviDois.AC_PROD_ANALI,0) ) +
					nLs  ) /
			      ( regAcumDiviDois.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice )  );
			nAnali := regAcumDiviDois.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice );
		Else
			nBrix  := regAcumDiviDois.AC_POND_BRIX;
			nPbu   := regAcumDiviDois.AC_POND_PBU;
			nLS    := regAcumDiviDois.AC_POND_LS;
			nAnali := regAcumDiviDois.AC_PROD_ANALI;
		End If;


		if recContainer.FLAG = 0 then
			If nTempoQue > 0 Then
				nTempoQue := ( ( regAcumDiviDois.AC_POND_TEMP_QUEI  * regAcumDiviDois.AC_PROD  ) +
						   ( nTempoQue * TblAcum( nIndice+11+100*nIndice ) ) ) /
						   ( Nvl(regAcumDiviDois.AC_PROD,0) + TblAcum( nIndice+11+100*nIndice ) );
				If nTempoQue > 999 Then
					nTempoQue := 999;
				End If;
                        else
                           nTempoQue := regAcumDiviDois.AC_POND_TEMP_QUEI;
			End If;


			If nTempoCor > 0 Then
				nTempoCor := ( ( regAcumDiviDois.AC_POND_TEMP_CORTE * regAcumDiviDois.AC_PROD ) +
						   ( nTempoCor * TblAcum( nIndice+11+100*nIndice ) ) ) /
						   ( regAcumDiviDois.AC_PROD + TblAcum( nIndice+11+100*nIndice ) );
				If nTempoCor > 999 Then
					nTempoCor := 999;
				End If;
			End If;
			nProd     := regAcumDiviDois.AC_PROD + TblAcum( nIndice+11+100*nIndice );
		else
			nProd     := regAcumDiviDois.AC_PROD;
			nTempoQue := regAcumDiviDois.AC_POND_TEMP_QUEI;
			nTempoCor := regAcumDiviDois.AC_POND_TEMP_CORTE;
		end if;

		Update GA_ACUM_D2
			Set AC_PROD            = nProd,
			    AC_PROD_ANALI      = nAnali,
			    AC_POND_BRIX       = nBrix,
			    AC_POND_LS	     = nLs,
			    AC_POND_PBU        = nPBU,
			    AC_POND_TEMP_QUEI  = nTempoQue,
			    AC_POND_AR	     = 0,
			    AC_POND_TEMP_CORTE = nTempoCor
			Where Current of curAcumDiviDois;
	Else
		sProcesso := 'Insert Em curAcumDiviDois';
		Insert Into GA_ACUM_D2 ( COD_EMPR,
						 SAF_ANO_SAFRA,
						 COD_DIVI1,
						 COD_DIVI2,
						 ID_LIBER,
						 COD_TIP_CORTE,
						 AC_DT_ACUM,
						 AC_PROD,
						 AC_PROD_ANALI,
						 AC_POND_BRIX,
						 AC_POND_LS,
						 AC_POND_PBU,
					       AC_POND_TEMP_QUEI,
						 AC_POND_AR,
						 AC_POND_TEMP_CORTE )
				    Values ( TblAcum( nIndice+01+100*nIndice ),
						 TblAcum( nIndice+02+100*nIndice ),
						 TblAcum( nIndice+03+100*nIndice ),
						 TblAcum( nIndice+04+100*nIndice ),
						 TblAcum( nIndice+07+100*nIndice ),
						 TblAcum( nIndice+08+100*nIndice ),
						 dDiaCana,
						 TblAcum( nIndice+11+100*nIndice ),
						 TblAcum( nIndice+12+100*nIndice ),
						 TblAcum( nIndice+13+100*nIndice ),
						 TblAcum( nIndice+14+100*nIndice ),
						 TblAcum( nIndice+15+100*nIndice ),
						 TblAcum( nIndice+16+100*nIndice ),
						 TblAcum( nIndice+17+100*nIndice ),
						 TblAcum( nIndice+18+100*nIndice ) );

	End If;

	Close curAcumDiviDois;

	Exception
		When Others Then
			nFalha := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
 	          	Insert Into Log_Erro Values ('Falha na Procedure Gap_AcumDivisaoDois' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;
   End;

Procedure Gap_AcumDivisaoTres( nIndice In Number ) Is
Cursor curAcumDiviTres Is
	Select *
	    From GA_ACUM_D3
		 Where COD_EMPR       = TblAcum( nIndice+01+100*nIndice )
		   And SAF_ANO_SAFRA  = TblAcum( nIndice+02+100*nIndice )
		   And COD_DIVI1	    = TblAcum( nIndice+03+100*nIndice )
		   And COD_DIVI2      = TblAcum( nIndice+04+100*nIndice )
		   And COD_DIVI3	    = TblAcum( nIndice+05+100*nIndice )
		   And ID_LIBER	    = TblAcum( nIndice+07+100*nIndice )
		   And COD_TIP_CORTE  = TblAcum( nIndice+08+100*nIndice )
		   And AC_DT_ACUM     = dDiaCana
  	  For Update;
regAcumDiviTres curAcumDiviTres%ROWTYPE;

   Begin

	sProcesso := 'Abrindo curAcumDiviTres';
	Open curAcumDiviTres;
	Fetch curAcumDiviTres Into regAcumDiviTres;


	Gap_AcumDadosTecnologicos( 'DIVI' , nIndice );

	If curAcumDiviTres%FOUND Then
		sProcesso := 'Update Em curAcumDiviTres';

		If recContainer.PSAN > 0 and recContainer.CANC = 0 then
			nBrix :=
	  			 (( Nvl(regAcumDiviTres.AC_POND_BRIX,0) * Nvl(regAcumDiviTres.AC_PROD_ANALI,0) ) +
					nBrix  ) /
	 		       ( regAcumDiviTres.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice ) );

			nPbu  :=
				(( Nvl(regAcumDiviTres.AC_POND_PBU,0)  * Nvl(regAcumDiviTres.AC_PROD_ANALI,0) ) +
					nPbu  ) /
				( regAcumDiviTres.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice ) );

			nLs   :=
			      (( Nvl(regAcumDiviTres.AC_POND_LS,0)   * Nvl(regAcumDiviTres.AC_PROD_ANALI,0) ) +
					nLs  ) /
			      ( regAcumDiviTres.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice )  );
			nAnali := regAcumDiviTres.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice );
		Else
			nAnali := regAcumDiviTres.AC_PROD_ANALI;
			nBrix  := regAcumDiviTres.AC_POND_BRIX;
			nPbu   := regAcumDiviTres.AC_POND_PBU;
			nLS    := regAcumDiviTres.AC_POND_LS;
		End If;


		if recContainer.FLAG = 0 then
			If nTempoQue > 0 Then
				nTempoQue := ( ( regAcumDiviTres.AC_POND_TEMP_QUEI  * regAcumDiviTres.AC_PROD  ) +
						   ( nTempoQue * TblAcum( nIndice+11+100*nIndice ) ) ) /
						   ( Nvl(regAcumDiviTres.AC_PROD,0) + TblAcum( nIndice+11+100*nIndice ) );
				If nTempoQue > 999 Then
					nTempoQue := 999;
				End If;
                        else
                           nTempoQue := regAcumDiviTres.AC_POND_TEMP_QUEI;
 			End If;

			If nTempoCor > 0 Then
				nTempoCor := ( ( regAcumDiviTres.AC_POND_TEMP_CORTE * regAcumDiviTres.AC_PROD ) +
						   ( nTempoCor * TblAcum( nIndice+11+100*nIndice ) ) ) /
						   ( regAcumDiviTres.AC_PROD + TblAcum( nIndice+11+100*nIndice ) );
				If nTempoCor > 999 Then
					nTempoCor := 999;
				End If;
			End If;
			nProd := regAcumDiviTres.AC_PROD + TblAcum( nIndice+11+100*nIndice );
		else
			nProd     := regAcumDiviTres.AC_PROD;
			nTempoQue := regAcumDiviTres.AC_POND_TEMP_QUEI;
			nTempoCor := regAcumDiviTres.AC_POND_TEMP_CORTE;
		end if;

		Update GA_ACUM_D3
			Set AC_PROD            = nProd,
			    AC_PROD_ANALI      = nAnali,
			    AC_POND_BRIX       = nBrix,
			    AC_POND_LS	     = nLs,
			    AC_POND_PBU        = nPBU,
			    AC_POND_TEMP_QUEI  = nTempoQue,
			    AC_POND_AR	     = 0,
			    AC_POND_TEMP_CORTE = nTempoCor
			Where Current of curAcumDiviTres;

	Else
		sProcesso := 'Insert Em curAcumDiviTres';
		Insert Into GA_ACUM_D3 ( COD_EMPR,
						 SAF_ANO_SAFRA,
						 COD_DIVI1,
						 COD_DIVI2,
						 COD_DIVI3,
						 ID_LIBER,
						 COD_TIP_CORTE,
						 AC_DT_ACUM,
						 AC_PROD,
						 AC_PROD_ANALI,
						 AC_POND_BRIX,
						 AC_POND_LS,
						 AC_POND_PBU,
					       AC_POND_TEMP_QUEI,
						 AC_POND_AR,
						 AC_POND_TEMP_CORTE )
				    Values ( TblAcum( nIndice+01+100*nIndice ),
						 TblAcum( nIndice+02+100*nIndice ),
						 TblAcum( nIndice+03+100*nIndice ),
						 TblAcum( nIndice+04+100*nIndice ),
 						 TblAcum( nIndice+05+100*nIndice ),
						 TblAcum( nIndice+07+100*nIndice ),
						 TblAcum( nIndice+08+100*nIndice ),
						 dDiaCana,
						 TblAcum( nIndice+11+100*nIndice ),
						 TblAcum( nIndice+12+100*nIndice ),
						 TblAcum( nIndice+13+100*nIndice ),
						 TblAcum( nIndice+14+100*nIndice ),
						 TblAcum( nIndice+15+100*nIndice ),
						 TblAcum( nIndice+16+100*nIndice ),
						 TblAcum( nIndice+17+100*nIndice ),
						 TblAcum( nIndice+18+100*nIndice ) );

	End If;

	Close curAcumDiviTres;

	Exception
		When Others Then
			nFalha := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
 	          	Insert Into Log_Erro Values ('Falha na Procedure Gap_AcumDivisaoTres' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;
   End;

Procedure Gap_AcumDivisaoQuatro( nIndice In Number ) Is
Cursor curAcumDiviQuatro Is
	Select *
	    From GA_ACUM_D4
		 Where COD_EMPR       = TblAcum( nIndice+01+100*nIndice )
		   And SAF_ANO_SAFRA  = TblAcum( nIndice+02+100*nIndice )
		   And COD_DIVI1	    = TblAcum( nIndice+03+100*nIndice )
		   And COD_DIVI2      = TblAcum( nIndice+04+100*nIndice )
		   And COD_DIVI3	    = TblAcum( nIndice+05+100*nIndice )
		   And COD_DIVI4      = TblAcum( nIndice+06+100*nIndice )
		   And ID_LIBER	    = TblAcum( nIndice+07+100*nIndice )
		   And COD_TIP_CORTE  = TblAcum( nIndice+08+100*nIndice )
		   And AC_DT_ACUM     = dDiaCana
--		   And AC_DT_ACUM     = TblAcum( nIndice+09+100*nIndice )
		   And ID_DIVI4	    = TblAcum( nIndice+10+100*nIndice )
  	  For Update;
regAcumDiviQuatro curAcumDiviQuatro%ROWTYPE;

   Begin

	sProcesso := 'Abrindo curAcumDiviQuatro';
	Open curAcumDiviQuatro;
	Fetch curAcumDiviQuatro Into regAcumDiviQuatro;


	Gap_AcumDadosTecnologicos( 'DIVI' , nIndice );

	If curAcumDiviQuatro%FOUND Then
		sProcesso := 'Update Em curAcumDiviQuatro';
		If recContainer.PSAN > 0 and recContainer.CANC = 0 Then
			nBrix :=
	  			 (( Nvl(regAcumDiviQuatro.AC_POND_BRIX,0) * Nvl(regAcumDiviQuatro.AC_PROD_ANALI,0) ) +
					nBrix  ) /
	 		       ( regAcumDiviQuatro.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice ) );

			nPbu  :=
				(( Nvl(regAcumDiviQuatro.AC_POND_PBU,0)  * Nvl(regAcumDiviQuatro.AC_PROD_ANALI,0) ) +
					nPbu  ) /
				( regAcumDiviQuatro.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice ) );

			nLs   :=
			      (( Nvl(regAcumDiviQuatro.AC_POND_LS,0)   * Nvl(regAcumDiviQuatro.AC_PROD_ANALI,0) ) +
					nLs  ) /
			      ( regAcumDiviQuatro.AC_PROD_ANALI + TblAcum( nIndice+12+100*nIndice )  );
			nAnali := regAcumDiviQuatro.AC_PROD_ANALI + TblAcum( nIndice+11+100*nIndice );
		Else
			nAnali := regAcumDiviQuatro.AC_PROD_ANALI;
			nBrix  := regAcumDiviQuatro.AC_POND_BRIX;
			nPbu   := regAcumDiviQuatro.AC_POND_PBU;
			nLS    := regAcumDiviQuatro.AC_POND_LS;
		End If;


		if recContainer.FLAG = 0 then
			If nTempoQue > 0 Then
				nTempoQue := ( ( regAcumDiviQuatro.AC_POND_TEMP_QUEI  * regAcumDiviQuatro.AC_PROD  ) +
	 					   ( nTempoQue * TblAcum( nIndice+11+100*nIndice ) ) ) /
						   ( Nvl(regAcumDiviQuatro.AC_PROD,0) + TblAcum( nIndice+11+100*nIndice ) );
				If nTempoQue > 999 Then
					nTempoQue := 999;
				End If;
                        else
                           nTempoQue := regAcumDiviQuatro.AC_POND_TEMP_QUEI;
			End If;

			If nTempoCor > 0 Then
				nTempoCor := ( ( regAcumDiviQuatro.AC_POND_TEMP_CORTE * regAcumDiviQuatro.AC_PROD ) +
						   ( nTempoCor * TblAcum( nIndice+11+100*nIndice ) ) ) /
						   ( regAcumDiviQuatro.AC_PROD + TblAcum( nIndice+11+100*nIndice ) );
				If nTempoCor > 999 Then
					nTempoCor := 999;
				End If;
			End If;
			nProd  := regAcumDiviQuatro.AC_PROD + TblAcum( nIndice+11+100*nIndice );
		else
			nProd     := regAcumDiviQuatro.AC_PROD;
			nTempoQue := regAcumDiviQuatro.AC_POND_TEMP_QUEI;
			nTempoCor := regAcumDiviQuatro.AC_POND_TEMP_CORTE;
		end if;

		Update GA_ACUM_D4
			Set AC_PROD            = nProd,
			    AC_PROD_ANALI      = nAnali,
			    AC_POND_BRIX       = nBrix,
			    AC_POND_LS	     = nLs,
			    AC_POND_PBU        = nPBU,
			    AC_POND_TEMP_QUEI  = nTempoQue,
			    AC_POND_AR	     = 0,
			    AC_POND_TEMP_CORTE = nTempoCor
			Where Current of curAcumDiviQuatro;
	Else
		sProcesso := 'Insert Em curAcumDiviQuatro';
		Insert Into GA_ACUM_D4 ( COD_EMPR,
						 SAF_ANO_SAFRA,
						 COD_DIVI1,
						 COD_DIVI2,
						 COD_DIVI3,
						 COD_DIVI4,
						 ID_LIBER,
						 COD_TIP_CORTE,
						 AC_DT_ACUM,
						 ID_DIVI4,
						 AC_PROD,
						 AC_PROD_ANALI,
						 AC_POND_BRIX,
						 AC_POND_LS,
						 AC_POND_PBU,
                                     AC_POND_TEMP_QUEI,
						 AC_POND_AR,
						 AC_POND_TEMP_CORTE )
				    Values ( TblAcum( nIndice+01+100*nIndice ),
						 TblAcum( nIndice+02+100*nIndice ),
						 TblAcum( nIndice+03+100*nIndice ),
						 TblAcum( nIndice+04+100*nIndice ),
 						 TblAcum( nIndice+05+100*nIndice ),
						 TblAcum( nIndice+06+100*nIndice ),
						 TblAcum( nIndice+07+100*nIndice ),
						 TblAcum( nIndice+08+100*nIndice ),
						 dDiaCana,
						 TblAcum( nIndice+10+100*nIndice ),
						 TblAcum( nIndice+11+100*nIndice ),
						 TblAcum( nIndice+12+100*nIndice ),
						 TblAcum( nIndice+13+100*nIndice ),
						 TblAcum( nIndice+14+100*nIndice ),
						 TblAcum( nIndice+15+100*nIndice ),
						 TblAcum( nIndice+16+100*nIndice ),
						 TblAcum( nIndice+17+100*nIndice ),
						 TblAcum( nIndice+18+100*nIndice ) );

	End If;

	Close curAcumDiviQuatro;

	Exception
		When Others Then
			nFalha := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
 	          	Insert Into Log_Erro Values ('Falha na Procedure Gap_AcumDivisaoQuatro' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;
   End;

Procedure Gap_AtualizaContainer Is

   Begin

	sProcesso := 'Atualizando Flag Container';
	update GA_VAR_CONTAINER
		set CONT_PROCE_PESAG = nStatusContainer,
		    CONT_TEMPO_QUEIM = nTempoQue ,
                CONT_TEMPO_CORTE = nTempoCor,
		    CONT_DIA_BALANCA = dDiaCana
			where ID_LANC_CONTA = recContainer.ID;

	if bInutiliza then
		sProcesso := 'Inutilizando a Analise';
		update GA_ANALI_SONDA
			set COD_MOT_CAN = regConfCpc.COD_MOT_CAN
				where ID_LANC_CONTA = recContainer.ID;
		bInutiliza := FALSE;
	end if;

	sProcesso := 'Atualizando Liberacao';
	--if regLiberacao.LIB_STATUS_CORTE = 2 then
		update GA_LIBERACAO
			set LIB_STATUS_CORTE = 3
			    where ID_LIBER = regLiberacao.ID_LIBER;
	--end if;

	exception
		when Others Then
			nFalha := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
 	          	Insert Into Log_Erro Values ('Falha na Procedure Gap_AtualizaContainer ' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			commit;


   End;

Procedure Gap_DeletaAcumulado( cTipoAcu In Char ) Is
Cursor curLiberId Is
	Select COD_EMPR, 		 SAF_ANO_SAFRA,
		 ID_LIBER
	    From GA_LIBERACAO
		 Where SAF_ANO_SAFRA = regEmprSafra.SAF_ANO_SAFRA
		   And ID_LIBER = nLibNume;
regLiberId curLiberId%ROWTYPE;


dDataInicial Date;
dDataFinal   Date;
dDataBalIni  Date;
dDataBalFim  Date;

   Begin

	dDataInicial := Gaf_DiaBalanca( dDataIni );
	dDataFinal   := Gaf_DiaBalanca( dDataFim );

	If cTipoAcu = 'GER' Then

		sProcesso := 'Deleta Acumulado - Geral';
		Update GA_VAR_CONTAINER
	   	    Set CONT_PROCE_PESAG = Null
			Where ENT_COD_EMPR  = nEmpr
			  And ENT_SAF_ANO_SAFRA = nSafra
	 	        And CONT_DATA_HORA_TARA between
				  dDataIni And dDataFim;

		Delete from GA_ACUM_D4
			Where COD_EMPR      = nEmpr
			  And SAF_ANO_SAFRA = nSafra
		        And AC_DT_ACUM between
				  dDataInicial  And
			        dDataFinal;

		Delete from GA_ACUM_D3
			Where COD_EMPR      = nEmpr
			  And SAF_ANO_SAFRA = nSafra
		        And AC_DT_ACUM between
				  dDataInicial  And
			        dDataFinal;

		Delete from GA_ACUM_D2
			Where COD_EMPR      = nEmpr
			  And SAF_ANO_SAFRA = nSafra
		        And AC_DT_ACUM between
				  dDataInicial  And
			        dDataFinal;

		Delete from GA_ACUM_D1
			Where COD_EMPR      = nEmpr
			  And SAF_ANO_SAFRA = nSafra
		        And AC_DT_ACUM between
				  dDataInicial  And
			        dDataFinal;

		Delete from GA_ACUM_LIBER
			Where COD_EMPR      = nEmpr
			  And SAF_ANO_SAFRA = nSafra
		        And AC_DT_ACUM between
				  dDataInicial  And
			        dDataFinal;


/*

			Update GA_ACUM_LIBER
			Set	AC_PROD = null,
				AC_PROD_ANALI = null,
				AC_POND_BRIX = null,
				AC_POND_LS = null,
				AC_POND_PBU = null,
				AC_POND_TEMP_QUEI = null,
				AC_POND_AR = null,
				AC_POND_TEMP_CORTE = null
		      Where COD_EMPR      = nEmpr
	      	  And SAF_ANO_SAFRA = nSafra
	              And AC_DT_ACUM between
				  dDataInicial  And
			        dDataFinal;
*/

	ElsIf cTipoAcu = 'UMA' Then

		sProcesso :='Abrindo curLiberId';
		open curLiberId;
		Fetch curLiberId Into regLiberId;
		Close curLiberId;
                dDataBalIni := Gaf_DiaHoraBal( dDataInicial,'I' );
                dDataBalFim := Gaf_DiaHoraBal( dDataFinal,'F' );


		delete from GA_ACUM_D4
			Where COD_EMPR      = regLiberID.COD_EMPR
			  And SAF_ANO_SAFRA = regLiberID.SAF_ANO_SAFRA
			  And ID_LIBER = regLiberId.ID_LIBER
		        And AC_DT_ACUM between
				  dDataInicial  And
			        dDataFinal;

		delete from GA_ACUM_D3
			Where COD_EMPR      = regLiberID.COD_EMPR
			  And SAF_ANO_SAFRA = regLiberID.SAF_ANO_SAFRA
			  And ID_LIBER = regLiberId.ID_LIBER
		        And AC_DT_ACUM between
				  dDataInicial  And
			        dDataFinal;

		delete from GA_ACUM_D2
			Where COD_EMPR      = regLiberID.COD_EMPR
			  And SAF_ANO_SAFRA = regLiberID.SAF_ANO_SAFRA
			  And ID_LIBER = regLiberId.ID_LIBER
		        And AC_DT_ACUM between
				  dDataInicial  And
			        dDataFinal;

		delete from GA_ACUM_D1
			where COD_EMPR      = regLiberID.COD_EMPR
			  and SAF_ANO_SAFRA = regLiberID.SAF_ANO_SAFRA
			  and ID_LIBER = regLiberId.ID_LIBER
		        and AC_DT_ACUM between
				  dDataInicial  And
			        dDataFinal;

		Delete from GA_ACUM_LIBER
			Where COD_EMPR      = regLiberID.COD_EMPR
			  And SAF_ANO_SAFRA = regLiberID.SAF_ANO_SAFRA
			  And ID_LIBER = regLiberId.ID_LIBER
		        And AC_DT_ACUM between
				  dDataInicial  And
			        dDataFinal;

		sProcesso := 'Deleta Acumulado - Uma';
		update GA_VAR_CONTAINER
	   	    Set CONT_PROCE_PESAG = Null
			Where CONT_DATA_HORA_TARA between
                                  dDataBalIni And dDataBalFim
			  And ID_LIBER = regLiberId.ID_LIBER;


/*
			Update GA_ACUM_LIBER
			Set	AC_PROD = null,
				AC_PROD_ANALI = null,
				AC_POND_BRIX = null,
				AC_POND_LS = null,
				AC_POND_PBU = null,
				AC_POND_TEMP_QUEI = null,
				AC_POND_AR = null,
				AC_POND_TEMP_CORTE = null
		      Where COD_EMPR      = regLiberID.COD_EMPR
	      	  And SAF_ANO_SAFRA = regLiberID.SAF_ANO_SAFRA
			  And ID_LIBER = regLiberId.ID_LIBER
	              And AC_DT_ACUM between
				  dDataInicial  And
			        dDataFinal;
*/

	end if;

--        Commit;

	Exception
		When Others Then
			nFalha := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
 	          	Insert Into Log_Erro Values ('Falha na Procedure Gap_DeletaAcumulado ' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;


   End;

Function Gaf_DiaBalanca( dData In Date ) Return Date Is

dRetData Date;

   Begin

	sProcesso	:= 'Calculando Dia Balanca';
        If to_number( to_char( dData                  , 'HH24MI' ) ) <
           to_number( to_char( regConfCpc.CPC_HR_INI  , 'HH24MI') ) Then
		dRetData  := dData - 1;
	Else
 		dRetData  := dData;
	End If;

	Return to_date( to_char( dRetData , 'DD-MM-YYYY' ) , 'DD-MM-YYYY' );

	Exception
		When Others Then
			nFalha := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			rollBack;
 	          	Insert Into Log_Erro Values ('Falha na Funcao Gaf_DiaBalanca ' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			commit;

   end;


Function Gaf_DiaHoraBal( dData In Date,cTip in char  ) Return Date Is

   Begin

        sProcesso       := 'Calculando Dia Balanca Hora';
        if cTip = 'I' then
           Return to_date( to_char(dData,'dd/mm/yyyy ') || to_char( regConfCpc.CPC_HR_INI , 'HH24:mi:ss' ), 'dd/mm/yyyy hh24:mi:ss' );
        else
           Return to_date( to_char(dData+1,'dd/mm/yyyy ') || to_char( regConfCpc.CPC_HR_FIM , 'HH24:mi:ss' ), 'dd/mm/yyyy hh24:mi:ss' );
        end if;

	Exception
		When Others Then
			nFalha := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			rollBack;
                        Insert Into Log_Erro Values ('Falha na Funcao Gaf_DiaHoraBal ' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YYYY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			commit;

   end;

End Gapk_Acumulados;
