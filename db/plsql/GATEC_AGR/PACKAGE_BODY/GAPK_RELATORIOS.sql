CREATE OR REPLACE Package Body Gapk_Relatorios As

Function Gaf_FuncTransporte( nCod_Func in Number, sDesc_Func In GA_FUNCIONARIO.DSC_FUNC%TYPE, nCod_Empr in Number, nSaf_Ano_Safra in Number,
		 dDataIni In Date, dDataFim In Date ) Return Varchar2 is

	Cursor c1 is
  		Select
			nvl(vd.cod_func_motor, 0) As Mot,
			nvl(vc.din_func_1, 0) As Func1,
			nvl(vc.din_func_2, 0) As Func2,
			nvl(vc.din_oper_trat_1, 0) As Trat1,
			nvl(vc.din_oper_trat_2, 0) As Trat2,
			vc.cont_peso_liqui As Peso,
			vc.cod_mis As Mis,
			vc.ent_id_viage As Viag,
			ms.cpl_peso_max As PesoMax,
			ms.cpl_peso_min As PesoMin,
			ms.id_clas_equip As Classe,
			decode(ms.id_clas_equip, 10, vc.cont_dist_media, 0) As DistMed
		From 	GA_VAR_DIGIT VD,
			GA_VAR_CONTAINER VC,
			GA_CPMIS_COMPL_MIS MS
  		Where vd.cod_empr=vc.ent_cod_empr And
			vd.saf_ano_safra=vc.ent_saf_ano_safra And
			vd.id_viage=vc.ent_id_viage And
			ms.cod_mis=vc.cod_mis And
			vd.cod_empr=nCod_Empr And
			vd.saf_ano_safra=nSaf_Ano_Safra And
			vc.cont_data_hora_tara >= dDataIni And
			vc.cont_data_hora_tara <= dDataFim;
	r1 c1%RowType;

	nFunc Number;
	sFunc VarChar2(40);
	nCountFunc Number(1);
	nViag Number;

	nAchou Number;
	nCont Number;
	sRet Varchar2(100);
Begin
	If nCod_Func = -1 Then
   		nInd := 1;
   		Return '';
	Else
   		If nInd = 1 then
			-- Abre o Cursor com todas as Viagems do Periodo.
      		Open C1 ;
	      	Fetch C1 into R1;
      		Loop
         			Exit When C1%NOTFOUND;

				nAchou := 0;
				nFunc := 0;

				nCountFunc := 1;

				Loop
					Exit When nCountFunc > 5;

					If nCountFunc = 1 Then
						nFunc := R1.Mot;
					End If;
					If nCountFunc = 2 Then
						nFunc := R1.Func1;
					End If;
					If nCountFunc = 3 Then
						nFunc := R1.Func2;
					ElsIf nCountFunc = 4 Then
						nFunc := R1.Trat1;
					ElsIf nCountFunc = 5 Then
						nFunc := R1.Trat2;
					End If;

					If nFunc > 0 Then
						-- Verifica se o Funcionario já esta no Vetor.
						nCont := 1;
						nAchou := 0;
      					Loop
      						Exit When nCont >= nInd;
		      	      		If aPeso(nCont*8+1) = nFunc Then
	            		    			nAchou := nCont;
	                 					nCont := nInd;
			            		End If ;
			                  	nCont := nCont + 1;
				            End Loop;

	   					-- Insere ou Altera (Soma) o Funcionario/Viagem no Vetor.
			  		      If nAchou > 0 then
							If R1.Peso <= R1.PesoMax Then
								aPeso( nAchou*8+3 ) := aPeso( nAchou*8+3 ) + r1.Peso;
								aPeso( nAchou*8+4 ) := aPeso( nAchou*8+4 ) + 1;
							Else
								aPeso( nAchou*8+5 ) := aPeso( nAchou*8+5 ) + r1.Peso;
								aPeso( nAchou*8+6 ) := aPeso( nAchou*8+6 ) + 1;
							End If;

							aPeso( nAchou*8+7 ) := aPeso( nAchou*8+7 ) + R1.DistMed;
      	      			Else
							aPeso( nInd*8+1 ) := nFunc;

							If R1.Peso <= R1.PesoMax Then
								aPeso( nInd*8+3 ) := R1.Peso;
								aPeso( nInd*8+4 ) := 1;
								aPeso( nInd*8+5 ) := 0;
								aPeso( nInd*8+6 ) := 0;
							Else
								aPeso( nInd*8+3 ) := 0;
								aPeso( nInd*8+4 ) := 0;

								aPeso( nInd*8+5 ) := R1.Peso;
								aPeso( nInd*8+6 ) := 1;
							End If;

							aPeso( nInd*8+7 ) := R1.DistMed;

      		     				nInd := nInd + 1;
           					End If;
					End If;

					nCountFunc := nCountFunc + 1;
				End Loop;

         			Fetch C1 into R1;
	      	End Loop;
   		End If;

		--Retorna a String com os Valores do Funcionário.
   		nCont := 1;
   		nAchou := 0 ;

	   	Loop
      		Exit When nCont >= nInd ;
		      If aPeso(nCont*8+1 ) = nCod_func Then
		      	nAchou := nCont;
         			nCont := nInd;
      		End if ;
      		nCont := nCont + 1;
   		End Loop;

   		If nAchou > 0 Then
			Return rPad(rTrim(lTrim(aPeso(nAchou*8+1))) || '-' || rTrim(lTrim(sDesc_Func)), 50) ||
					'  ' || lPad(aPeso(nAchou*8+3), 15, ' ') ||
				      '  ' || lPad(aPeso(nAchou*8+4), 10, ' ') ||
				      '  ' || lPad(aPeso(nAchou*8+5), 15, ' ') ||
				      '  ' || lPad(aPeso(nAchou*8+6), 10, ' ') ||
				      '  ' || lPad(aPeso(nAchou*8+3) + aPeso(nAchou*8+5), 18, ' ') ||
				      '  ' || lPad(aPeso(nAchou*8+4) + aPeso(nAchou*8+6), 12, ' ') ||
				      '  ' || lPad(aPeso(nAchou*8+7), 10, ' ');
		Else
			Return rPad(rTrim(lTrim(nCod_Func)) || '-' || rTrim(lTrim(sDesc_Func)), 50) ||
					'  ' || lPad(0, 15, ' ') ||
				      '  ' || lPad(0, 10, ' ') ||
				      '  ' || lPad(0, 15, ' ') ||
				      '  ' || lPad(0, 10, ' ') ||
				      '  ' || lPad(0, 18, ' ') ||
				      '  ' || lPad(0, 12, ' ') ||
				      '  ' || lPad(0, 10, ' ');
		End If ;
	End If;
End Gaf_FuncTransporte;

Function Gaf_DistViagem(nViag In Number, nCod_Empr In Number, nSaf_Ano_Safra In Number)
		Return Number Is

	Cursor c1 is
		Select
			Avg(nvl(rot_asfal, 0) + nvl(rot_terr1, 0) + nvl(rot_terr2, 0)) As Dist
		From	GA_DIVI4 D4,
			GA_ROTA RT,
			GA_ROTA_CANA RC,
			GA_AREA_LIBER AL,
			GA_VAR_CONTAINER VC
		Where d4.id_divi4=rc.id_divi4 And
			rt.cod_rota=rc.cod_rota And
			al.id_divi4=d4.id_divi4 And
			al.id_liber=vc.id_liber And
			rc.roc_principal=1 And
			d4.cod_empr=nCod_Empr And
			d4.saf_ano_safra=nSaf_Ano_Safra And
			vc.ent_id_viage=nViag
		Group By vc.ent_id_viage;
	r1 c1%RowType;

Begin
	Open C1;
	Fetch C1 Into R1;
	If C1%FOUND Then
		Return R1.Dist;
	Else
		Return 0;
	End If;
	Close C1;
End Gaf_DistViagem;


Procedure Imp is
	nCont number;
Begin
	nCont := 1;
	Loop
		Exit When nCont >= nInd ;
		dbms_output.put(aPeso( nCont*8+1 )) ;
		dbms_output.put( ' ' ) ;
		dbms_output.put_line(aPeso( nCont*8+2 )) ;
		dbms_output.put( ' ' ) ;
		dbms_output.put_line(aPeso( nCont*8+3 )) ;
		dbms_output.put( ' ' ) ;
		dbms_output.put_line(aPeso( nCont*8+4 )) ;
		dbms_output.put( ' ' ) ;
		dbms_output.put_line(aPeso( nCont*8+5 )) ;
		dbms_output.put( ' ' ) ;
		dbms_output.put_line(aPeso( nCont*8+6 )) ;
		dbms_output.put( ' ' ) ;
		dbms_output.put_line(aPeso( nCont*8+7 )) ;

		nCont:=nCont+1;
	End Loop;
	dbms_output.put_line(nInd-1) ;
End Imp;

End Gapk_Relatorios;
