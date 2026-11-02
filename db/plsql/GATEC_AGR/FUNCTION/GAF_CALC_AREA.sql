CREATE OR REPLACE Function GAF_CALC_AREA(nId_Divi4 In Number, sTipo In VarChar, nFinalidade In Number,
			 sVariedade In VarChar, dDataInic In Date, dDataFim In Date)
					Return Number
 Is
	Cursor cColFinalid Is
		Select sum(arlib.tal_area_lib) As Area
		From  GA_AREA_LIBER ARLIB,
        		GA_LIBERACAO LIB,
        		GA_ACUM_D4 AC
		Where arlib.id_liber=lib.id_liber And
        		arlib.id_liber=ac.id_liber And
		      arlib.id_divi4=ac.id_divi4 And
        		ac.ac_dt_acum=(Select Max(ac2.ac_dt_acum)
                		From  GA_ACUM_D4 AC2
                		Where ac2.id_divi4=ac.id_divi4 And
                        	ac2.id_liber=ac.id_liber And
                        	ac2.ac_dt_acum >= dDataInic And
                        	ac2.ac_dt_acum <= dDataFim And
					ac2.cod_tip_corte=(Select Max(ac3.cod_tip_corte)
						From GA_ACUM_D4 AC3
						Where ac3.id_divi4=ac.id_divi4 And
		      			ac3.id_liber=ac.id_liber)) And
        		arlib.id_divi4=nId_Divi4 And
        		lib.cod_finalid=nFinalidade;
	  	rColFinalid cColFinalid%RowType;
	Cursor cCol is
		Select sum(arlib.tal_area_lib) As Area
		From  GA_AREA_LIBER ARLIB,
			GA_ACUM_D4 AC
		Where arlib.id_liber=ac.id_liber And
			arlib.id_divi4=ac.id_divi4 And
			ac.ac_dt_acum=(Select Max(ac2.ac_dt_acum)
        			From 	GA_ACUM_D4 AC2
        			Where ac2.id_divi4=ac.id_divi4 And
              			ac2.id_liber=ac.id_liber And
              			ac2.ac_dt_acum >= dDataInic And
              			ac2.ac_dt_acum <= dDataFim) And
			arlib.id_divi4=nId_Divi4;
   	rCol cCol%RowType;
  Cursor cColEstim Is
		Select lib.id_liber As Lib,
			decode(d4.di4_situa, 6, 1, 0) As Situacao,
      avg(arlib.tal_area_lib) As Area
		From  GA_AREA_LIBER ARLIB,
			GA_LIBERACAO LIB,
			GA_ACUM_D4 AC,
      GA_DIVI4 D4
		Where arlib.id_liber=lib.id_liber And
			arlib.id_liber=ac.id_liber And
			arlib.id_divi4=ac.id_divi4 And
      d4.id_divi4=arlib.id_divi4 And
			ac.ac_dt_acum=(Select Max(ac2.ac_dt_acum)
        			From 	GA_ACUM_D4 AC2
        			Where ac2.id_divi4=ac.id_divi4 And
              			ac2.id_liber=ac.id_liber And
              			ac2.ac_dt_acum >= dDataInic And
              			ac2.ac_dt_acum <= dDataFim And
					ac2.cod_tip_corte=(Select Max(ac3.cod_tip_corte)
        					From 	GA_ACUM_D4 AC3
        					Where ac3.id_divi4=ac.id_divi4 And
              					ac3.id_liber=ac.id_liber)) And
			arlib.id_divi4=nId_Divi4
    Group by lib.id_liber,
          decode(d4.di4_situa, 6, 1, 0);
   	rColEstim cColEstim%RowType;
	Cursor cColEstimFinalid Is
		Select lib.id_liber As Lib,
			decode(d4.di4_situa, 6, 1, 0) As Situacao,
      avg(arlib.tal_area_lib) As Area
		From  GA_AREA_LIBER ARLIB,
			GA_LIBERACAO LIB,
			GA_ACUM_D4 AC,
      GA_DIVI4 D4
		Where arlib.id_liber=lib.id_liber And
			arlib.id_liber=ac.id_liber And
			arlib.id_divi4=ac.id_divi4 And
      d4.id_divi4=arlib.id_divi4 And
			ac.ac_dt_acum=(Select Max(ac2.ac_dt_acum)
        			From 	GA_ACUM_D4 AC2
        			Where ac2.id_divi4=ac.id_divi4 And
              			ac2.id_liber=ac.id_liber And
              			ac2.ac_dt_acum >= dDataInic And
              			ac2.ac_dt_acum <= dDataFim And
					ac2.cod_tip_corte=(Select Max(ac3.cod_tip_corte)
        					From 	GA_ACUM_D4 AC3
		        			Where ac3.id_divi4=ac.id_divi4 And
            		  			ac3.id_liber=ac.id_liber)) And
			arlib.id_divi4=nId_Divi4 And
			lib.cod_finalid=nFinalidade
    Group by lib.id_liber,
          decode(d4.di4_situa, 6, 1, 0);
   	rColEstimFinalid cColEstimFinalid%RowType;
	Cursor cEstFinalid is
		Select (nvl(est.ed4_area_manual, 0) + nvl(est.ed4_area_mecanica, 0)) As Area
		From  GA_ESTIM_DIVI4_ATIVA EST
		Where est.id_divi4=nId_divi4 And
			est.cod_finalid=nFinalidade;
   	rEstFinalid cEstFinalid%RowType;
	Cursor cEstManFinalid is
		Select (nvl(est.ed4_area_manual, 0)) As Area
		From  GA_ESTIM_DIVI4_ATIVA EST
		Where est.id_divi4=nId_divi4 And
			est.cod_finalid=nFinalidade;
   	rEstManFinalid cEstManFinalid%RowType;
	Cursor cEstMecFinalid is
		Select (nvl(est.ed4_area_mecanica, 0)) As Area
		From  GA_ESTIM_DIVI4_ATIVA EST
		Where est.id_divi4=nId_divi4 And
			est.cod_finalid=nFinalidade;
   	rEstMecFinalid cEstMecFinalid%RowType;
	Cursor cEst is
		Select (nvl(est.ed4_area_manual, 0) + nvl(est.ed4_area_mecanica, 0)) As Area
		From  GA_ESTIM_DIVI4_ATIVA EST
		Where est.id_divi4=nId_divi4;
   	rEst cEst%RowType;
	Cursor cEstMan is
		Select (nvl(est.ed4_area_manual, 0)) As Area
		From  GA_ESTIM_DIVI4_ATIVA EST
		Where est.id_divi4=nId_divi4;
   	rEstMan cEstMan%RowType;
	Cursor cEstMec is
		Select (nvl(est.ed4_area_mecanica, 0)) As Area
		From  GA_ESTIM_DIVI4_ATIVA EST
		Where est.id_divi4=nId_divi4;
   	rEstMec cEstMec%RowType;
	Cursor cTCHEst Is
		Select Sum(ed4_tonel_estim) As TCHEst
		From  GA_ESTIM_DIVI4_ATIVA EST
		Where est.id_divi4=nId_divi4;
   	rTCHEst cTCHEst%RowType;
	Cursor cVarArea is
		Select vd4.var_area,
			vd4.cod_varie_usina
		From 	GA_VARIE_DIVI4 VD4,
			GA_VARIE_USINA VU
		Where vd4.cod_varie_usina=vu.cod_varie_usina And
			vd4.id_divi4=nId_Divi4 And
			vu.abv_varie=sVariedade;
	rVarArea cVarArea%RowType;
	nMaxVarieUsina Number(3);
	Cursor cVarAreaDif is
		Select vd4.var_area,
			vd4.cod_varie_usina
		From 	GA_VARIE_DIVI4 VD4,
			GA_VARIE_USINA VU
		Where vd4.cod_varie_usina=vu.cod_varie_usina And
			vd4.id_divi4=nId_Divi4 And
			vd4.cod_varie_usina <> nMaxVarieUsina;
	rVarAreaDif cVarAreaDif%RowType;
	Cursor cAreaLiber is
		Select sum(tal_area_lib) As AreaLiber
		From 	GA_AREA_LIBER AL, GA_LIBERACAO LIB
		Where	al.id_liber=lib.id_liber And
			al.id_divi4=nId_Divi4 And
			lib.lib_dt_abert >= dDataInic And
			lib.lib_dt_abert <= dDataFim;
	rAreaLiber cAreaLiber%RowType;
	Cursor cAreaLiberFinalid is
		Select sum(tal_area_lib) As AreaLiber
		From 	GA_AREA_LIBER AL,	GA_LIBERACAO LIB
		Where	al.id_liber=lib.id_liber And
			id_divi4=nId_Divi4 And
			lib.cod_finalid=nFinalidade; 
  -- Roberto/Anderson - 04/06/2003 
	--		lib.lib_dt_abert >= dDataInic And
	--		lib.lib_dt_abert <= dDataFim;
  -- fim - comentário
	rAreaLiberFinalid cAreaLiberFinalid%RowType;
	nArea Number;
	nAreaEstim Number;
	nAreaCalc Number;
	nAreaVarie Number;
	nAreaTotal Number;
  nAreaLiber Number;
	sType VarChar(30);
	nProd Number;
	nProdTotal Number;
	nTCHEst Number;
	nTCHReal Number;
	nTotalVarie Number(2);
	nCodVarieUsina Number(3);
	nAreaSubTotal Number;
	nAreaTotalOutras Number;
	nResto Number;
	sErroSql VarChar2(2000);
Begin
	nArea := 0;
	sType := LTrim(RTrim(Upper(sTipo)));
	If sType = 'LIBERADA' Then
		If nFinalidade = 0 Then
			Open cAreaLiber;
			Fetch cAreaLiber Into rAreaLiber;
			If cAreaLiber%FOUND Then
				nArea := rAreaLiber.AreaLiber;
			Else
				nArea := 0;
			End If;
			Close cAreaLiber;
		Else
			Open cAreaLiberFinalid;
			Fetch cAreaLiberFinalid Into rAreaLiberFinalid;
			If cAreaLiberFinalid%FOUND Then
				nArea := rAreaLiberFinalid.AreaLiber;
			Else
				nArea := 0;
			End If;
			Close cAreaLiberFinalid;
		End If;
	ElsIf sType = 'SALDO' Then -- Area Estimada menos Area Liberada
		If nFinalidade = 0 Then
			Open cEst;
			Fetch cEst Into rEst;
			If cEst%FOUND Then
				nAreaEstim := rEst.Area;
			Else
				nAreaEstim := 0;
			End If;
			Close cEst;
		Else
			Open cEstFinalid;
			Fetch cEstFinalid Into rEstFinalid;
			If cEstFinalid%FOUND Then
				nAreaEstim := rEstFinalid.Area;
			Else
				nAreaEstim := 0;
			End If;
			Close cEstFinalid;
		End If;
		nAreaCalc := 0;
		If nFinalidade = 0 Then
			Open cAreaLiber;
			Fetch cAreaLiber Into rAreaLiber;
			If cAreaLiber%FOUND Then
				nAreaCalc := nvl(rAreaLiber.AreaLiber, 0);
			End If;
			Close cAreaLiber;
		Else
			Open cAreaLiberFinalid;
			Fetch cAreaLiberFinalid Into rAreaLiberFinalid;
			If cAreaLiberFinalid%FOUND Then
				nAreaCalc := nvl(rAreaLiberFinalid.AreaLiber, 0);
			End If;
			Close cAreaLiberFinalid;
		End If;
		nArea := nAreaEstim - nAreaCalc;
	ElsIf sType = 'COLHIDA' Then
		If nFinalidade = 0 Then
			nAreaTotal :=0;
			-- Calcula Área Estimada
    	Open cEst;
			Fetch cEst Into rEst;
			If cEst%FOUND Then
				nAreaTotal := rEst.Area;
			End If;
			Close cEst;
    	-- Calcula Área Colhida
			Open cCol;
			Fetch cCol Into rCol;
			If cCol%FOUND Then
				nArea := rCol.Area;
			Else
				nArea := 0;
			End If;
    	-- Verifica Área do Talhão
			If nAreaTotal > 0 Then
				If nArea > nAreaTotal Then
					nArea := nAreaTotal;
				End If;
			End If;
			-- Calcula TCH Estimado
    	Open cTCHEst;
			Fetch cTCHEst Into rTCHEst;
			If cTCHEst%FOUND Then
				nTCHEst := rTCHEst.TCHEst;
			Else
				nTCHEst := 0;
			End If;
			nAreaEstim := 0;
    	Open cColEstim;
			Fetch cColEstim Into rColEstim;
			If cColEstim%NOTFOUND Then
				nArea := 0;
				Open cAreaLiber;
				Fetch cAreaLiber Into rAreaLiber;
				If cAreaLiber%FOUND Then
					nArea := rAreaLiber.AreaLiber;
				Else
					nArea := 0;
				End If;
			Else
				Loop
      		Exit When cColEstim%NOTFOUND;
					nProd := 0;
					nProdTotal := 0;
					-- Se a Liberação estiver encerrada.
					If rColEstim.Situacao = 1 Then
						If nvl(rColEstim.Area, 0) > 0 Then
							Select
								sum(ac.ac_prod)/1000
							Into
								nProdTotal
							From  GA_AREA_LIBER ARLIB,
								GA_ACUM_D4 AC
							Where arlib.id_liber=ac.id_liber And
								arlib.id_divi4=ac.id_divi4 And
								arlib.id_divi4=nId_Divi4 And
								arlib.id_liber=rColEstim.Lib;
          		-- Calcula o TCH Real
							nTchReal := nProdTotal / rColEstim.Area;
							Select
								sum(ac.ac_prod)/1000
							Into
								nProd
							From  GA_AREA_LIBER ARLIB,
								GA_ACUM_D4 AC
							Where arlib.id_liber=ac.id_liber And
								arlib.id_divi4=ac.id_divi4 And
								ac.ac_dt_acum >= dDataInic And
            	  ac.ac_dt_acum <= dDataFim And
								arlib.id_divi4=nId_Divi4 And
								arlib.id_liber=rColEstim.Lib;
          		--  Calcula a Area Total da Liberada.
							nAreaCalc := (nProd / nTCHReal);
          		-- Area Calculada não pode ser maior que Area liberada
          		--If nAreaCalc > rColEstim.Area Then
							--	nAreaCalc := rColEstim.Area;
							--End If;
							nAreaEstim := nAreaEstim + nAreaCalc;
						End If;
					Else  -- Se a Liberação estiver Aberta
						Select
							sum(ac.ac_prod)/1000
						Into
							nProd
						From  GA_AREA_LIBER ARLIB,
							GA_ACUM_D4 AC
						Where arlib.id_liber=ac.id_liber And
							arlib.id_divi4=ac.id_divi4 And
							arlib.id_divi4=nId_Divi4 And
							arlib.id_liber=rColEstim.Lib;
            -- Calcula a Área Estimada da Liberação
						If nTCHEst > 0 Then
							nAreaCalc := (nProd / nTCHEst);
						Else
							nAreaCalc := 0;
						End If;
            -- Area Calculada não pode ser maior que Area liberada
						If nAreaCalc > rColEstim.Area Then
							nAreaCalc := rColEstim.Area;
						End If;
            nAreaEstim := nAreaEstim + nAreaCalc;
					End If;
          Fetch cColEstim Into rColEstim;
				End Loop;
			End If;
		Else
			nAreaTotal :=0;
			Open cEstFinalid;
			Fetch cEstFinalid Into rEstFinalid;
			If cEstFinalid%FOUND Then
				nAreaTotal := rEstFinalid.Area;
			End If;
			Close cEstFinalid;
			Open cColFinalid;
			Fetch cColFinalid Into rColFinalid;
			If cColFinalid%FOUND Then
				nArea := rColFinalid.Area;
			Else
				nArea := 0;
			End If;
			If nAreaTotal > 0 Then
				If nArea > nAreaTotal Then
					nArea := nAreaTotal;
				End If;
			End If;
      Open cTCHEst;
			Fetch cTCHEst Into rTCHEst;
			If cTCHEst%FOUND Then
				nTCHEst := rTCHEst.TCHEst;
			Else
				nTCHEst := 0;
			End If;
      nAreaEstim := 0;
			Open cColEstimFinalid;
			Fetch cColEstimFinalid Into rColEstimFinalid;
			If cColEstimFinalid%FOUND Then
				Open cAreaLiberFinalid;
				Fetch cAreaLiberFinalid Into rAreaLiberFinalid;
				If cAreaLiberFinalid%FOUND Then
					nArea := rAreaLiberFinalid.AreaLiber;
				Else
					nArea := 0;
				End If;
				Return nArea;
			Else
				Loop
      		Exit When cColEstimFinalid%NOTFOUND;
					nProd := 0;
					nProdTotal := 0;
					If rColEstimFinalid.Situacao = 1 Then
						If nvl(rColEstimFinalid.Area, 0) > 0 Then
							Select
								sum(ac.ac_prod)/1000
							Into
								nProdTotal
							From  GA_AREA_LIBER ARLIB,
                    GA_LIBERACAO LIB,
								    GA_ACUM_D4 AC
							Where arlib.id_liber=ac.id_liber And
								arlib.id_divi4=ac.id_divi4 And
                lib.id_liber=arlib.id_liber And
                lib.cod_finalid=nFinalidade And
								arlib.id_divi4=nId_Divi4;
              Select
								sum(arlib.tal_area_lib)
							Into
								nAreaLiber
							From  GA_AREA_LIBER ARLIB,
                    GA_LIBERACAO LIB
							Where lib.id_liber=arlib.id_liber And
                lib.cod_finalid=nFinalidade And
								arlib.id_divi4=nId_Divi4;
							nTchReal := nProdTotal / nAreaLiber;
              Select
								sum(ac.ac_prod)/1000
							Into
								nProd
							From  GA_AREA_LIBER ARLIB,
								GA_ACUM_D4 AC
							Where arlib.id_liber=ac.id_liber And
								arlib.id_divi4=ac.id_divi4 And
								ac.ac_dt_acum >= dDataInic And
              	ac.ac_dt_acum <= dDataFim And
								arlib.id_divi4=nId_Divi4 And
								arlib.id_liber=rColEstimFinalid.Lib;
              nAreaCalc := (nProd / nTCHReal);
							nAreaEstim := nAreaEstim + nAreaCalc;
						End If;
					Else
						Select
							sum(ac.ac_prod)/1000
						Into
							nProd
						From  GA_AREA_LIBER ARLIB,
							GA_ACUM_D4 AC
						Where arlib.id_liber=ac.id_liber And
							arlib.id_divi4=ac.id_divi4 And
							arlib.id_divi4=nId_Divi4 And
							arlib.id_liber=rColEstimFinalid.Lib;
						If nTCHEst > 0 Then
							nAreaCalc := (nProd / nTCHEst);
						Else
							nAreaCalc := 0;
						End If;
						If nAreaCalc > rColEstimFinalid.Area Then
							nAreaCalc := rColEstimFinalid.Area;
						End If;
						nAreaEstim := nAreaEstim + nAreaCalc;
					End If;
					Fetch cColEstimFinalid Into rColEstimFinalid;
				End Loop;
        nArea := nAreaEstim;
			End If;
		End If;
	ElsIf sType = 'ESTIMADA' Then
		If nFinalidade = 0 Then
			Open cEst;
			Fetch cEst Into rEst;
			If cEst%FOUND Then
				nArea := rEst.Area;
			Else
				nArea := 0;
			End If;
		Else
			Open cEstFinalid;
			Fetch cEstFinalid Into rEstFinalid;
			If cEstFinalid%FOUND Then
				nArea := rEstFinalid.Area;
			Else
				nArea := 0;
			End If;
		End If;
	ElsIf sType = 'ESTIMADAMANUAL' Then
		If nFinalidade = 0 Then
			Open cEstMan;
			Fetch cEstMan Into rEstMan;
			If cEstMan%FOUND Then
				nArea := rEstMan.Area;
			Else
				nArea := 0;
			End If;
		Else
			Open cEstManFinalid;
			Fetch cEstManFinalid Into rEstManFinalid;
			If cEstManFinalid%FOUND Then
				nArea := rEstManFinalid.Area;
			Else
				nArea := 0;
			End If;
		End If;
	ElsIf sType = 'ESTIMADAMECANICA' Then
		If nFinalidade = 0 Then
			Open cEstMec;
			Fetch cEstMec Into rEstMec;
			If cEstMec%FOUND Then
				nArea := rEstMec.Area;
			Else
				nArea := 0;
			End If;
		Else
			Open cEstMecFinalid;
			Fetch cEstMecFinalid Into rEstMecFinalid;
			If cEstMecFinalid%FOUND Then
				nArea := rEstMecFinalid.Area;
			Else
				nArea := 0;
			End If;
		End If;
	End If;
	If lTrim(rTrim(sVariedade)) <> ' ' Then
		nAreaTotal := 0;
		nAreaVarie := 0;
		nTotalVarie := 0;
		-- -------------------------------
		-- Alteração Solicitada por Marcelo Barata (CTC - 21/02/01).
		-- Usar Soma Total das Áreas da Variedade do Talhão.
		-- -------------------------------
		-- -------------------------------
		-- Alteração Solicitada por Claudio (CTC - 04/04/01).
		-- Usar Diferança para Calcular a Área da variedade com maior codigo.
		-- -------------------------------
		nTotalVarie := 2;
		If nTotalVarie > 1 Then
			Select Max(cod_varie_usina)
			Into 	nMaxVarieUsina
			From	GA_VARIE_DIVI4 VD4
			Where vd4.id_divi4=nId_Divi4;
			Select sum(vd4.var_area)
			Into   nAreaTotal
			From 	GA_VARIE_DIVI4 VD4
			Where vd4.id_divi4=nId_Divi4;
			Open cVarArea;
			Fetch cVarArea Into rVarArea;
			If cVarArea%FOUND Then
				nAreaVarie := rVarArea.var_area;
				nCodVarieUsina := rVarArea.cod_varie_usina;
			End If;
			Select Count(*)
			Into   nTotalVarie
			From 	GA_VARIE_DIVI4 VD4,
				GA_VARIE_USINA VU
			Where vd4.cod_varie_usina=vu.cod_varie_usina And
				vd4.id_divi4=nId_Divi4;
			If nCodVarieUsina = nMaxVarieUsina And nTotalVarie > 1 Then
				nAreaSubTotal := 0;
				Open cVarAreaDif;
				Fetch cVarAreaDif Into rVarAreaDif;
				Loop
      				Exit When cVarAreaDif%NOTFOUND;
					nAreaSubTotal := nAreaSubTotal + Round((rVarAreaDif.var_area * nArea) / nAreaTotal, 2);
					Fetch cVarAreaDif Into rVarAreaDif;
				End Loop;
				nArea := nArea - nAreaSubTotal;
			Else
				If nArea > 0 And nAreaTotal > 0 Then
					nArea := (nAreaVarie * nArea) / nAreaTotal;
				End If;
			End If;
		End If;
	End If;
	Return Round(nvl(nArea, 0), 12);
End GAF_CALC_AREA;

 