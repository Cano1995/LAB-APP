CREATE OR REPLACE Function GAF_FAIXA(nId_Divi4 In Number, nCriterio In Number,
					dDataInic In Date, dDataFim In Date)
					Return VarChar2
 Is
	Cursor cFaixa Is
		Select *
		From 	 GA_CHK_FAIXA
		Where  cod_criterio=nCriterio;

   	rFaixa cFaixa%RowType;

	Cursor cDist Is
		Select (rot_asf_ida + rot_t1_ida + rot_t2_ida +
			rot_asf_vol + rot_t1_vol + rot_t2_vol)/2  As Dist
		From	GA_DIVI4 D4,
			GA_ROTA_CANA RC,
			GA_ROTA RT
		Where d4.id_divi4=rc.id_divi4 And
			d4.cod_empr=rc.cod_empr_dest And
			rc.cod_rota=rt.cod_rota And
			rc.roc_principal=1 And
			d4.id_divi4=nId_Divi4 And
      rt.rot_tipo is null;

   	rDist cDist%RowType;


	Cursor cTQ Is
		Select (gaf_calc_sonda(nId_divi4, 'TQ', 'Produção Real', 1, '', dDataInic, dDataFim)) As TQ
		From 	Dual;

   	rTQ cTQ%RowType;

	Cursor cTC Is
		Select (gaf_calc_sonda(nId_divi4, 'TC', 'Produção Real', 1, '', dDataInic, dDataFim)) As TC
		From 	Dual;

   	rTC cTC%RowType;

	Cursor cDeclividade Is
		Select d4.di4_decli As Declividade
		From 	 GA_DIVI4 D4
		Where  d4.id_divi4=nId_Divi4;

   	rDeclividade cDeclividade%RowType;

	Cursor cProdutividade Is
		Select ((gaf_calc_sonda(nId_Divi4, 'PRODREAL', '', 1, '', dDataInic, dDataFim)/1000)/
			gaf_calc_area(nId_Divi4, 'COLHIDA', 1, '', dDataInic, dDataFim)) As Produtividade
		From Dual;

   	rProdutividade cProdutividade%RowType;

	Cursor cIdade Is
		Select (decode(d4.di4_dt_corte_anter, null,(decode(d4.di4_dt_plant, null, 0,
			(nvl(d4.di4_dt_corte_atual,sysdate)-d4.di4_dt_plant)/30.51)),
			((nvl(d4.di4_dt_corte_atual,sysdate)-d4.di4_dt_corte_anter)/30.51))) As Idade
		From 	GA_DIVI4 D4
		Where d4.Id_Divi4=nId_Divi4;

   	rIdade cIdade%RowType;

	Cursor cBroca Is
		Select ((sum(ct.can_tot_ent_bro) * 100) / sum(ct.can_tot_ent_exa)) As IndInfest
		From 	GA_DIVI4 D4,
			GA_CANA_TOT CT,
   			GA_LANC_BROCA LB
		Where d4.id_divi4=lb.id_divi4 And
		   	lb.id_lanc_broca=ct.id_lanc_broca And
			d4.Id_Divi4=nId_Divi4;

   	rBroca cBroca%RowType;

	sRetorno VarChar2(30);

	nFaixaI Number;
	nFaixaF Number;
	nValor Number;

	nExecuta Number;

Begin
	nExecuta := 0;

	Open cFaixa;
	Fetch cFaixa Into rFaixa;
	If cFaixa%FOUND Then
		If nCriterio = 1 Then				-- Faixa de Distância
			Open cDist;
			Fetch cDist Into rDist;
			If cDist%FOUND Then
				nValor := rDist.Dist;
				nExecuta := 1;
			Else
				nValor := 0;
				nExecuta := 1;
			End If;
		ElsIf nCriterio = 2 Then			-- Faixa de Tempo de Queima
			Open cTQ;
			Fetch cTQ Into rTQ;
			If cTQ%FOUND Then
				nValor := rTQ.TQ;
				nExecuta := 1;
			Else
				nValor := 0;
				nExecuta := 1;
			End If;
		ElsIf nCriterio = 3 Then			-- Faixa de Tempo de Corte
			Open cTC;
			Fetch cTC Into rTC;
			If cTC%FOUND Then
				nValor := rTC.TC;
				nExecuta := 1;
			Else
				nValor := 0;
				nExecuta := 1;
			End If;
		ElsIf nCriterio = 4 Then			-- Faixa de Declividade
			Open cDeclividade;
			Fetch cDeclividade Into rDeclividade;
			If cDeclividade%FOUND Then
				nValor := rDeclividade.Declividade;
				nExecuta := 1;
			Else
				nValor := 0;
				nExecuta := 1;
			End If;
		ElsIf nCriterio = 5 Then			-- Faixa de Broca (Indice de Infestação)
			Open cBroca;
			Fetch cBroca Into rBroca;
			If cBroca%FOUND Then
				nValor := rBroca.IndInfest;
				nExecuta := 1;
			Else
				nValor := 0;
				nExecuta := 1;
			End If;
		ElsIf nCriterio = 7 Then			-- Faixa de Produtividade
			Open cProdutividade;
			Fetch cProdutividade Into rProdutividade;
			If cProdutividade%FOUND Then
				nValor := rProdutividade.Produtividade;
				nExecuta := 1;
			Else
				nValor := 0;
				nExecuta := 0;
			End If;
		ElsIf nCriterio = 8 Then			-- Faixa de Estimativa
		--	Open cEstima;
		--	Fetch cEstima Into rEstima;
		--	If cEstima%FOUND Then
		--		nValor := rEstima.Estima;
		--		nExecuta := 1;
		--	Else
		--		nValor := 0;
				nExecuta := 0;
		--	End If;
		ElsIf nCriterio = 9 Then			-- Faixa de Idade
			Open cIdade;
			Fetch cIdade Into rIdade;
			If cIdade%FOUND Then
				nValor := rIdade.Idade;
				nExecuta := 1;
			Else
				nValor := 0;
				nExecuta := 0;
			End If;
		Else
			sRetorno := 'Outro';
		End If;

		If nExecuta = 1 Then
			Close cFaixa;
			Open cFaixa;
			Loop
		        	Fetch cFaixa Into rFaixa;
		        	Exit When cFaixa%NOTFOUND;

				nFaixaI := rFaixa.chk_inicio;
				nFaixaF := rFaixa.chk_final;

		        	If nFaixaI <= nValor Then
					If nValor <= nFaixaF Then
		      	     		sRetorno := rFaixa.dsc_chk_faixa;
						Exit;
					End If;
				End If;
		      End Loop;
		End If;

	Else
		sRetorno := 'Nenhuma Faixa';
	End If;

	If ' ' || rTrim(lTrim(sRetorno)) = ' ' Then
		sRetorno := 'Nenhuma Faixa';
	End If;

	Return sRetorno;
End GAF_FAIXA;

 