CREATE OR REPLACE Function GAF_CALC_BROCA(nId_Divi4 In Number,
	sTipo In VarChar, sVariedade In VarChar) Return Number

 Is
	Cursor cBroca Is
		Select  sum(cant.can_tot_can_exa) As CanaExaminada,
			sum(cant.can_tot_can_bro) As CanaBrocada,
			((sum(cant.can_tot_can_bro) / sum(cant.can_tot_can_exa)) * 100) As PorcBrocada,
			sum(cant.can_tot_ent_exa) As EntNoExaminado,
			sum(cant.can_tot_ent_bro) As EntNoBrocado,
			((sum(cant.can_tot_ent_bro) / sum(cant.can_tot_ent_exa)) * 100) As II
		From 	GA_DIVI4 D4,
			GA_LANC_BROCA LANBR,
			GA_CANA_TOT CANT
		Where 	d4.id_divi4=lanbr.id_divi4 And
			lanbr.id_lanc_broca=cant.id_lanc_broca And
			d4.id_divi4=nId_Divi4;
   	rBroca cBroca%RowType;

	Cursor cVarArea is
		Select 	var_area
		From 	GA_VARIE_DIVI4 VD4,
			GA_VARIE_USINA VU
		Where 	vd4.cod_varie_usina=vu.cod_varie_usina And
			vd4.id_divi4=nId_Divi4 And
			vu.abv_varie=sVariedade;
	rVarArea cVarArea%RowType;

	nReturn Number;
	sType VarChar(30);

	nAreaTotal Number;
	nAreaVarie Number;
	nTotalVarie Number;
Begin
	nReturn := 0;
	sType := LTrim(RTrim(Upper(sTipo)));

	Open cBroca;
	Fetch cBroca Into rBroca;
	If cBroca%Found Then

		If sType = 'CANAEXAMINADA' Then
			nReturn := rBroca.CanaExaminada;
		ElsIf sType = 'CANABROCADA' Then
			nReturn := rBroca.CanaBrocada;
		ElsIf sType = 'PORCBROCADA' Then
			nReturn := rBroca.PorcBrocada;
		ElsIf sType = 'ENTNOEXAMINADO' Then
			nReturn := rBroca.EntNoExaminado;
		ElsIf sType = 'ENTNOBROCADO' Then
			nReturn := rBroca.EntNoBrocado;
		ElsIf sType = 'II' Then
			nReturn := rBroca.II;
		End If;

		If lTrim(rTrim(sVariedade)) <> ' ' Then
			nAreaTotal := 0;
			nAreaVarie := 0;
			nTotalVarie := 0;

			Select	Count(*)
			Into   	nTotalVarie
			From 	GA_VARIE_DIVI4 VD4,
				GA_VARIE_USINA VU
			Where 	vd4.cod_varie_usina=vu.cod_varie_usina And
				vd4.id_divi4=nId_Divi4;

			If nTotalVarie > 1 Then
				Select 	di4_area_total
				Into   	nAreaTotal
				From 	GA_DIVI4 D4
				Where 	d4.id_divi4=nId_Divi4;

				Open cVarArea;
				Fetch cVarArea Into rVarArea;
				If cVarArea%FOUND Then
					nAreaVarie := rVarArea.var_area;
				End If;

				If nReturn > 0 And nAreaTotal > 0 Then
					nReturn := (nAreaVarie * nReturn) / nAreaTotal;
				End If;
			End If;
		End If;
	End If;

	Return Round(nvl(nReturn, 0), 2);

End GAF_CALC_BROCA;


 