CREATE OR REPLACE Function GAF_RATEIO_EMPREITEIRO(nId_Divi4 In Number, nLiberacao In Number,
						    nEmpreiteiro In Number, dDataTaraInic In Date,
						    dDataTaraFim In Date, sEstagio In Varchar) Return Number
Is
	Cursor C1 is
           	SELECT al.tal_area_lib As Area,
			 sum(vc.cont_peso_liqui) As SomaPeso
		FROM   GA_VAR_CONTAINER VC,
        		 GA_AREA_LIBER AL
		WHERE  vc.id_liber=al.id_liber AND
		       vc.din_turmeiro_1 > 0 AND
			 al.id_divi4=nId_Divi4 AND
			 vc.id_liber=nLiberacao AND
			 vc.din_turmeiro_1=nEmpreiteiro AND
			 (vc.cont_data_hora_tara >= dDataTaraInic AND
                   vc.cont_data_hora_tara <= dDataTaraFim)
		GROUP BY al.tal_area_lib;

   	R1 C1%RowType;

	Cursor C5 is
           	SELECT Max(al.Id_divi4) As MxID
		FROM   GA_VAR_CONTAINER VC,
        		 GA_AREA_LIBER AL
		WHERE  vc.id_liber=al.id_liber AND
		       vc.din_turmeiro_1 > 0 AND
			 vc.id_liber=nLiberacao AND
			 vc.din_turmeiro_1=nEmpreiteiro AND
			 (vc.cont_data_hora_tara >= dDataTaraInic AND
      		 vc.cont_data_hora_tara <= dDataTaraFim);

   	R5 C5%RowType;

	Cursor C6 is
           	SELECT al.id_divi4 As Talhao,
			 al.tal_area_lib As Area
		FROM   GA_AREA_LIBER AL

		WHERE  al.id_liber=nLiberacao
		ORDER BY al.id_divi4;

   	R6 C6%RowType;

	Cursor C2 is
            SELECT sum(al.tal_area_lib) AS SomaArea
		FROM   GA_AREA_LIBER AL
		WHERE  al.id_liber=nLiberacao;

   	R2 C2%RowType;

	Cursor C3 is
            SELECT al.tal_area_lib As Area,
			 sum(vc.cont_peso_liqui) As SomaPeso
		FROM   GA_VAR_CONTAINER VC,
        		 GA_AREA_LIBER AL,
			 GA_DIVI4 D4,
			 GA_ESTAG_USINA EST,
			 GA_ESTAG_COPER ESC
		WHERE  vc.id_liber=al.id_liber AND
		       al.id_divi4=d4.id_divi4 AND
			 d4.cod_estag_usina=est.cod_estag_usina AND
			 est.cod_estag_coper=esc.cod_estag_coper AND
		       vc.din_turmeiro_1 > 0 AND
			 al.id_divi4=nId_Divi4 AND
			 vc.id_liber=nLiberacao AND
   			 esc.eco_ciclo in (1, 5) AND
			 vc.din_turmeiro_1=nEmpreiteiro AND
			 (vc.cont_data_hora_tara >= dDataTaraInic AND
			  vc.cont_data_hora_tara <= dDataTaraFim)
		GROUP BY al.tal_area_lib;

   	R3 C3%RowType;

	Cursor C4 is
            SELECT al.tal_area_lib As Area,
			 sum(vc.cont_peso_liqui) As SomaPeso
		FROM   GA_VAR_CONTAINER VC,
        		 GA_AREA_LIBER AL,
			 GA_DIVI4 D4,
			 GA_ESTAG_USINA EST,
			 GA_ESTAG_COPER ESC
		WHERE  vc.id_liber=al.id_liber AND
		       al.id_divi4=d4.id_divi4 AND
			 d4.cod_estag_usina=est.cod_estag_usina AND
			 est.cod_estag_coper=esc.cod_estag_coper AND
		       vc.din_turmeiro_1 > 0 AND
			 al.id_divi4=nId_Divi4 AND
			 vc.id_liber=nLiberacao AND
   			 esc.eco_ciclo in (2, 3, 4, 6) AND
			 vc.din_turmeiro_1=nEmpreiteiro AND
			 (vc.cont_data_hora_tara >= dDataTaraInic AND
			 vc.cont_data_hora_tara <= dDataTaraFim)
		GROUP BY al.tal_area_lib;

   	R4 C4%RowType;

	Cursor C7 is
            SELECT al.tal_area_lib As Area,
			 sum(vc.cont_peso_liqui) As SomaPeso
		FROM   GA_VAR_CONTAINER VC,
        		 GA_AREA_LIBER AL
		      --GA_DIVI4 D4,
			--GA_ESTAG_USINA EST,
			--GA_ESTAG_COPER ESC
		WHERE  vc.id_liber=al.id_liber AND
		      --al.id_divi4=d4.id_divi4 AND
		      --d4.cod_estag_usina=est.cod_estag_usina AND
			--est.cod_estag_coper=esc.cod_estag_coper AND
		       vc.din_turmeiro_1 > 0 AND
			-- al.id_divi4=nId_Divi4 AND
			 vc.id_liber=nLiberacao AND
   			--esc.eco_ciclo in (2, 3, 4, 6) AND
			 vc.din_turmeiro_1=nEmpreiteiro AND
			 (vc.cont_data_hora_tara >= dDataTaraInic AND
			 vc.cont_data_hora_tara <= dDataTaraFim)
		GROUP BY al.tal_area_lib;

   	R7 C7%RowType;


	nValor Number;
	nValorAcum Number;
Begin
	If LTrim(RTrim(Upper(sEstagio))) = 'TODOS' Then
		If nId_Divi4 = 0 Then
			Open C2;
	      	Fetch C2 Into R2;
			If C2%FOUND Then
				Open C7;
		      	Fetch C7 Into R7;
				If C7%FOUND Then
					nValor := r7.SomaPeso / r2.SomaArea;
					nValor := nValor * r7.Area;
					nValor := nValor / 1000;
					nValor := Trunc(nValor, 2);

					Return nValor;
				Else
					Return -1;
				End If;
			Else
				Return -1;
			End If;
		Else
		Open C1;
      	Fetch C1 Into R1;
		If C1%FOUND Then
			Open C2;
     			Fetch C2 Into R2;
			If C2%FOUND Then
				Open C5;
      			Fetch C5 Into R5;
				If C5%FOUND Then
					If r5.MxId = nId_divi4 Then
						nValor := 0;
						nValorAcum := 0;
						Open C6;
						Loop
			      			Fetch C6 Into R6;
							Exit When r6.Talhao=r5.MxId;

							nValor := r1.SomaPeso / r2.SomaArea;
							nValor := nValor * r6.Area;
							nValor := nValor / 1000;
							nValor := Trunc(nValor, 2);

							nValorAcum := nValorAcum + nValor;
						End Loop;

						nValor := r1.SomaPeso / 1000;
						nValor := nValor - nValorAcum;
						nValor := Trunc(nValor, 2);

						Return nValor;
					Else
						nValor := r1.SomaPeso / r2.SomaArea;
						nValor := nValor * r1.Area;
						nValor := nValor / 1000;
						nValor := Trunc(nValor, 2);

						Return nValor;
					End If;
				Else
					Return -1;
				End If;
			Else
				Return -1;
			End If;
		Else
			Return -1;
		End If;
		End If;
	Else
		If Upper(sEstagio) = '18M' Then
			Open C3;
	      	Fetch C3 Into R3;
			If C3%FOUND Then
				Open C2;
     				Fetch C2 Into R2;
				If C2%FOUND Then
					Open C5;
      				Fetch C5 Into R5;
					If C5%FOUND Then
						If r5.MxId = nId_divi4 Then
							nValor := 0;
							nValorAcum := 0;
							Open C6;
							Loop
				      			Fetch C6 Into R6;
								Exit When R6.Talhao=R5.MxId;

								nValor := R3.SomaPeso / R2.SomaArea;
								nValor := nValor * R6.Area;
								nValor := nValor / 1000;
								nValor := Trunc(nValor, 2);

								nValorAcum := nValorAcum + nValor;
							End Loop;

							nValor := R3.SomaPeso / 1000;
							nValor := nValor - nValorAcum;
							nValor := Trunc(nValor, 2);

							Return nValor;
						Else
							nValor := R3.SomaPeso / R2.SomaArea;
							nValor := nValor * R3.Area;
							nValor := nValor / 1000;
							nValor := Trunc(nValor, 2);

							Return nValor;
						End If;
					Else
						Return 0;
					End If;
				Else
					Return 0;
				End If;
			Else
				Return 0;
			End If;
		ElsIf Upper(sEstagio) = 'SOCA' Then
			Open C4;
	      	Fetch C4 Into R4;
			If C4%FOUND Then
				Open C2;
     				Fetch C2 Into R2;
				If C2%FOUND Then
					Open C5;
      				Fetch C5 Into R5;
					If C5%FOUND Then
						If r5.MxId = nId_divi4 Then
							nValor := 0;
							nValorAcum := 0;
							Open C6;
							Loop
				      			Fetch C6 Into R6;
								Exit When R6.Talhao=R5.MxId;

								nValor := R4.SomaPeso / R2.SomaArea;
								nValor := nValor * R6.Area;
								nValor := nValor / 1000;
								nValor := Trunc(nValor, 2);

								nValorAcum := nValorAcum + nValor;
							End Loop;

							nValor := R4.SomaPeso / 1000;
							nValor := nValor - nValorAcum;
							nValor := Trunc(nValor, 2);

							Return nValor;
						Else
							nValor := R4.SomaPeso / R2.SomaArea;
							nValor := nValor * R4.Area;
							nValor := nValor / 1000;
							nValor := Trunc(nValor, 2);

							Return nValor;
						End If;
					Else
						Return 0;
					End If;
				Else
					Return 0;
				End If;
			Else
				Return 0;
			End If;
		Else
			Return -1;
		End If;
	End If;

End GAF_RATEIO_EMPREITEIRO;

 