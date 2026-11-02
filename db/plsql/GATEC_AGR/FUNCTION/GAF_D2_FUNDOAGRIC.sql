CREATE OR REPLACE Function GAF_D2_FUNDOAGRIC(nFundoAgric In Number, sRetorno In VarChar)
					Return VarChar

 Is
	Cursor C1 is
		Select d2.cod_divi2 As CodD2,
			 d2.abv_divi2 As AbvD2
		From 	 GA_DIVI4 D4,
			 GA_DIVI2 D2
		Where  d4.cod_empr=d2.cod_empr And
			 d4.saf_ano_safra=d2.saf_ano_safra And
			 d4.cod_divi1=d2.cod_divi1 And
			 d4.cod_divi2=d2.cod_divi2 And
			 d4.id_fundo_agric=nFundoAgric;
   	R1 C1%RowType;

Begin
	Open C1;
	Fetch C1 Into R1;
	If C1%FOUND Then
		If Upper(sRetorno) = 'COD' Then
			Return r1.CodD2;
		ElsIf Upper(sRetorno) = 'ABV' Then
			Return r1.AbvD2;
		Else
			Return r1.CodD2 || ' - ' || r1.AbvD2;
		End If;
	Else
		Return '';
	End If;

End GAF_D2_FUNDOAGRIC;

 