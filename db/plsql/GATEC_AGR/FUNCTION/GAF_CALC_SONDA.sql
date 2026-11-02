CREATE OR REPLACE Function           GAF_CALC_SONDA(nId_Divi4 In Number,
                                          sTipo In VarChar,
						                              sPondera In VarChar, 
                                          nFinalidade In Number,
						                              sVariedade In VarChar,
						                              dDataAcumInic In Date, 
                                          dDataAcumFim In Date)
Return Number
 Is
	sVar VarChar(30);
	sType VarChar(30);
	sPond VarChar(255);
	nReturn Number;
	nProdReal Number;
	nProdAnali Number;
	nBrix Number;
	nLs Number;
	nPbu Number;
	nTQ Number;
	nTC Number;
	nFibra Number;
	nPolCaldo Number;
	nPolCana Number;
	nPureza Number;
	nAgio	Number;
	nAtr Number;
	nArCaldo Number;
	nArCana Number;
	nAreaTotal Number;
	nAreaParc Number;
	nIdLiber Number;
  nCodEmprGatec number(4);
  p_saf_ano_safra number(4);
  p_cod_empr number;

Begin
	sType := LTrim(RTrim(Upper(sTipo)));
	sPond := LTrim(RTrim(Upper(sPondera)));
	nProdReal := 0;
	nProdAnali := 0;
	nBrix := 0;
	nLs := 0;
	nPbu := 0;
	nTQ := 0;
	nTC := 0;
	nFibra := 0;
	nPolCaldo := 0;
	nPolCana := 0;
	nPureza := 0;
	nAgio	:= 0;
	nAtr := 0;
	nArCaldo := 0;
	nArCana := 0;
	nReturn := 0.5;
	If nFinalidade = 0 Then
		nReturn := 1;
	 	If sPond <> ' ' Then
			nReturn := 2;
			If sPond = '1' Then
				nReturn := 3;
				Select sum(ac_prod) As ProdReal,
					sum(ac_prod_anali) As ProdAnali,
 					sum(ac_pond_brix) As Brix,
					sum(ac_pond_ls) As Ls,
					sum(ac_pond_pbu) As Pbu
				Into
					nProdReal,
					nProdAnali,
					nBrix,
					nLs,
					nPbu
				From GA_ACUM_D4 acum
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei) As TQ
				Into	nTQ
				From GA_ACUM_D4 acum
				Where acum.ac_pond_temp_quei > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte) As TQ
				Into	nTC
				From GA_ACUM_D4 acum
				Where acum.ac_pond_temp_corte > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'PRODUÇÃO REAL', 1) > 0 Then
				nReturn := 4;
				Select sum(ac_pond_brix*ac_prod)/sum(ac_prod) As Brix,
					sum(ac_pond_ls*ac_prod)/sum(ac_prod) As Ls,
					sum(ac_pond_pbu*ac_prod)/sum(ac_prod) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From GA_ACUM_D4 acum
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*ac_prod)/sum(ac_prod) As TQ
				Into  nTQ
				From GA_ACUM_D4 acum
				Where acum.ac_pond_temp_quei > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*ac_prod)/sum(ac_prod) As TQ
				Into  nTC
				From GA_ACUM_D4 acum
				Where acum.ac_pond_temp_corte > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'PRODUÇÃO ANALISADA', 1) > 0  Then
				nReturn := 5;
				Select sum(ac_pond_brix*ac_prod_anali)/sum(ac_prod_anali) As Brix,
					sum(ac_pond_ls*ac_prod_anali)/sum(ac_prod_anali) As Ls,
					sum(ac_pond_pbu*ac_prod_anali)/sum(ac_prod_anali) As Pbu,
					sum(ac_pond_temp_quei*ac_prod_anali)/sum(ac_prod_anali) As TQ,
					sum(ac_pond_temp_corte*ac_prod_anali)/sum(ac_prod_anali) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
				From GA_ACUM_D4 acum
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*ac_prod)/sum(ac_prod) As TQ
				Into  nTQ
				From GA_ACUM_D4 acum
				Where acum.ac_pond_temp_quei > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*ac_prod)/sum(ac_prod) As TQ
				Into  nTC
				From GA_ACUM_D4 acum
				Where acum.ac_pond_temp_corte > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'PRODUTIVIDADE ESTIMADA', 1) > 0 Then
				nReturn := 6;
				Select sum(ac_pond_brix*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As Brix,
					sum(ac_pond_ls*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As Ls,
					sum(ac_pond_pbu*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_ACUM_D4 acum,
					GA_ESTIM_DIVI4_ATIVA est
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					acum.id_divi4=est.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As TQ
				Into	nTQ
				From 	GA_ACUM_D4 acum,
					GA_ESTIM_DIVI4_ATIVA est
				Where acum.ac_pond_temp_quei > 0 And
					acum.id_divi4=est.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As TQ
				Into	nTC
				From 	GA_ACUM_D4 acum,
					GA_ESTIM_DIVI4_ATIVA est
				Where acum.ac_pond_temp_corte > 0 And
					acum.id_divi4=est.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'IDADE', 1) > 0  Then
				nReturn := 7;
				Select sum(ac_pond_brix*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As Brix,
					sum(ac_pond_ls*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As Ls,
					sum(ac_pond_pbu*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As TQ
				Into	nTQ
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum
				Where acum.ac_pond_temp_quei > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As TC
				Into	nTC
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum
				Where acum.ac_pond_temp_corte > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'ÁREA LIQUIDA', 1) > 0  Then
				nReturn := 8;
				Select sum(ac_pond_brix*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As Brix,
					sum(ac_pond_ls*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As Ls,
					sum(ac_pond_pbu*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei* (d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As TQ
				Into  nTQ
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum
				Where acum.ac_pond_temp_quei > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'DISTÂNCIA ASFALTO', 1) > 0  Then
				nReturn := 9;
				Select sum(ac_pond_brix*rota.rot_asfal)/sum(rota.rot_asfal) As Brix,
					sum(ac_pond_ls*rota.rot_asfal)/sum(rota.rot_asfal) As Ls,
					sum(ac_pond_pbu*rota.rot_asfal)/sum(rota.rot_asfal) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*rota.rot_asfal)/sum(rota.rot_asfal) As TQ
				Into	nTQ
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana
				Where acum.ac_pond_temp_quei > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*rota.rot_asfal)/sum(rota.rot_asfal) As TC
				Into	nTC
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana
				Where acum.ac_pond_temp_corte > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'DISTÂNCIA TERRA 1', 1) > 0  Then
				nReturn := 10;
				Select sum(ac_pond_brix*rota.rot_terr1)/sum(rota.rot_terr1) As Brix,
					sum(ac_pond_ls*rota.rot_terr1)/sum(rota.rot_terr1) As Ls,
					sum(ac_pond_pbu*rota.rot_terr1)/sum(rota.rot_terr1) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select
					sum(ac_pond_temp_quei*rota.rot_terr1)/sum(rota.rot_terr1) As TQ
				Into  nTQ
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana
				Where acum.ac_pond_temp_quei > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select
					sum(ac_pond_temp_corte*rota.rot_terr1)/sum(rota.rot_terr1) As TC
				Into  nTC
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana
				Where acum.ac_pond_temp_corte > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'DISTÂNCIA TERRA 2', 1) > 0  Then
				nReturn := 11;
				Select sum(ac_pond_brix*rota.rot_terr2)/sum(rota.rot_terr2) As Brix,
					sum(ac_pond_ls*rota.rot_terr2)/sum(rota.rot_terr2) As Ls,
					sum(ac_pond_pbu*rota.rot_terr2)/sum(rota.rot_terr2) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*rota.rot_terr2)/sum(rota.rot_terr2) As TQ
				Into	nTQ
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana
				Where acum.ac_pond_temp_quei > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*rota.rot_terr2)/sum(rota.rot_terr2) As TC
				Into	nTC
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana
				Where acum.ac_pond_temp_corte > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
			End If;
   		Else
			nReturn := 12;
			If sType = 'PRODREALD' Or sType = 'TQD' Then
				Select sum(cont_peso_liqui) As ProdReal,
				 	sum(cont_tempo_queim * cont_peso_liqui) / sum(cont_peso_liqui) As TQ,
					sum(distinct tal_area_lib) As Area
				Into  nProdReal,
					nTQ,
					nAreaParc
				From 	GA_VAR_CONTAINER VARCO,
					GA_LIBERACAO LIB,
					GA_AREA_LIBER ARLIB
				Where varco.id_liber=lib.id_liber And
					lib.id_liber=arlib.id_liber And
				   	(to_char(varco.cont_data_hora_tara, 'HH24:MI:SS') >= '06:00:00' And
				   	to_char(varco.cont_data_hora_tara, 'HH24:MI:SS') <= '18:59:59') And
					varco.cont_proce_pesag is not null And
					arlib.id_divi4=nId_Divi4 And
					varco.cont_dia_balanca >= dDataAcumInic And
					varco.cont_dia_balanca <= dDataAcumFim;
				Select  sum(a1.tal_area_lib)
				Into 	  nAreaTotal
				From    GA_AREA_LIBER A1
				Where   a1.id_liber in (Select a2.id_liber
			           		From GA_AREA_LIBER A2, GA_VAR_CONTAINER VARCO
				           	Where a2.id_liber=varco.id_liber and
							a2.id_divi4=nId_divi4 and
							varco.cont_dia_balanca >= dDataAcumInic And
							varco.cont_dia_balanca <= dDataAcumFim);
				nProdReal := (nProdReal * nAreaParc) / nAreaTotal;
				nTQ := (nTQ * nAreaParc) / nAreaTotal;
			ElsIf sType = 'PRODREALN' Or sType = 'TQN' Then
				nReturn := 898;
				Select sum(cont_peso_liqui) As ProdReal,
					 sum(cont_tempo_queim * cont_peso_liqui) / sum(cont_peso_liqui) As TQ,
					 sum( distinct tal_area_lib) As Area
				Into  nProdReal,
					nTQ,
					nAreaParc
				From 	GA_VAR_CONTAINER VARCO,
					GA_LIBERACAO LIB,
					GA_AREA_LIBER ARLIB
				Where varco.id_liber=lib.id_liber And
					lib.id_liber=arlib.id_liber And
				   	(to_char(varco.cont_data_hora_tara, 'HH24:MI:SS') <= '05:59:59' Or
			   		to_char(varco.cont_data_hora_tara, 'HH24:MI:SS') >= '19:00:00') And
					varco.cont_proce_pesag is not null And
					arlib.id_divi4=nId_Divi4 And
					varco.cont_dia_balanca >= dDataAcumInic And
					varco.cont_dia_balanca <= dDataAcumFim;
				Select  sum(a1.tal_area_lib)
				Into 	  nAreaTotal
				From    GA_AREA_LIBER A1
				Where   a1.id_liber in (Select a2.id_liber
			           		From GA_AREA_LIBER A2, GA_VAR_CONTAINER VARCO
				           	Where a2.id_liber=varco.id_liber and
							a2.id_divi4=nId_divi4 and
							varco.cont_dia_balanca >= dDataAcumInic And
							varco.cont_dia_balanca <= dDataAcumFim);
				nProdReal := (nProdReal * nAreaParc) / nAreaTotal;
				nTQ := (nTQ * nAreaParc) / nAreaTotal;
			ElsIf sType = 'PRODREALBIT' Or sType = 'TQBIT' Then
				Select sum(cont_peso_liqui) As ProdReal,
				 	sum(cont_tempo_queim * cont_peso_liqui) / sum(cont_peso_liqui) As TQ,
					sum(distinct tal_area_lib) As Area
				Into  nProdReal,
					nTQ,
					nAreaParc
				From 	GA_VAR_CONTAINER VARCO,
					GA_LIBERACAO LIB,
					GA_AREA_LIBER ARLIB
				Where varco.id_liber=lib.id_liber And
					lib.id_liber=arlib.id_liber And
					varco.cont_proce_pesag is not null And
					varco.din_bituca_1 is not null And
					arlib.id_divi4=nId_Divi4 And
					varco.cont_dia_balanca >= dDataAcumInic And
					varco.cont_dia_balanca <= dDataAcumFim;
				Select  sum(a1.tal_area_lib)
				Into 	  nAreaTotal
				From    GA_AREA_LIBER A1
				Where   a1.id_liber in (Select a2.id_liber
			           		From GA_AREA_LIBER A2, GA_VAR_CONTAINER VARCO
				           	Where a2.id_liber=varco.id_liber and
							varco.din_bituca_1 is not null And
							varco.cont_proce_pesag is not null And
							a2.id_divi4=nId_divi4 and
							varco.cont_dia_balanca >= dDataAcumInic And
							varco.cont_dia_balanca <= dDataAcumFim);
				nProdReal := (nProdReal * nAreaParc) / nAreaTotal;
				nTQ := (nTQ * nAreaParc) / nAreaTotal;
			ElsIf sType = 'PRODREALDB' Or sType = 'TQDB' Then
				Select sum(cont_peso_liqui) As ProdReal,
				 	sum(cont_tempo_queim * cont_peso_liqui) / sum(cont_peso_liqui) As TQ,
					sum(distinct tal_area_lib) As Area
				Into  nProdReal,
					nTQ,
					nAreaParc
				From 	GA_VAR_CONTAINER VARCO,
					GA_LIBERACAO LIB,
					GA_AREA_LIBER ARLIB
				Where varco.id_liber=lib.id_liber And
					lib.id_liber=arlib.id_liber And
				   	(to_char(varco.cont_data_hora_tara, 'HH24:MI:SS') >= '06:00:00' And
				   	to_char(varco.cont_data_hora_tara, 'HH24:MI:SS') <= '18:59:59') And
					varco.cont_proce_pesag is not null And
					varco.din_bituca_1 is not null And
					arlib.id_divi4=nId_Divi4 And
					varco.cont_dia_balanca >= dDataAcumInic And
					varco.cont_dia_balanca <= dDataAcumFim;
				Select  sum(a1.tal_area_lib)
				Into 	  nAreaTotal
				From    GA_AREA_LIBER A1
				Where   a1.id_liber in (Select a2.id_liber
			           		From GA_AREA_LIBER A2, GA_VAR_CONTAINER VARCO
				           	Where a2.id_liber=varco.id_liber and
							varco.din_bituca_1 is not null And
							varco.cont_proce_pesag is not null And
							a2.id_divi4=nId_divi4 and
							varco.cont_dia_balanca >= dDataAcumInic And
							varco.cont_dia_balanca <= dDataAcumFim);
				nProdReal := (nProdReal * nAreaParc) / nAreaTotal;
				nTQ := (nTQ * nAreaParc) / nAreaTotal;
			ElsIf sType = 'PRODREALNB' Or sType = 'TQNB' Then
				nReturn := 898;
				Select sum(cont_peso_liqui) As ProdReal,
					 sum(cont_tempo_queim * cont_peso_liqui) / sum(cont_peso_liqui) As TQ,
					 sum( distinct tal_area_lib) As Area
				Into  nProdReal,
					nTQ,
					nAreaParc
				From 	GA_VAR_CONTAINER VARCO,
					GA_LIBERACAO LIB,
					GA_AREA_LIBER ARLIB
				Where varco.id_liber=lib.id_liber And
					lib.id_liber=arlib.id_liber And
				   	(to_char(varco.cont_data_hora_tara, 'HH24:MI:SS') <= '05:59:59' Or
			   		to_char(varco.cont_data_hora_tara, 'HH24:MI:SS') >= '19:00:00') And
					varco.din_bituca_1 is not null And
					varco.cont_proce_pesag is not null And
					arlib.id_divi4=nId_Divi4 And
					varco.cont_dia_balanca >= dDataAcumInic And
					varco.cont_dia_balanca <= dDataAcumFim;
				Select  sum(a1.tal_area_lib)
				Into 	  nAreaTotal
				From    GA_AREA_LIBER A1
				Where   a1.id_liber in (Select a2.id_liber
			           		From GA_AREA_LIBER A2, GA_VAR_CONTAINER VARCO
				           	Where a2.id_liber=varco.id_liber and
							varco.din_bituca_1 is not null And
							varco.cont_proce_pesag is not null And
							a2.id_divi4=nId_divi4 and
							varco.cont_dia_balanca >= dDataAcumInic And
							varco.cont_dia_balanca <= dDataAcumFim);
				nProdReal := (nProdReal * nAreaParc) / nAreaTotal;
				nTQ := (nTQ * nAreaParc) / nAreaTotal;
			ElsIf Upper(Substr(sType, 1, 4)) = 'PROD' Then
      	     		Select sum(ac_prod) As ProdReal,
					sum(ac_prod_anali) AS ProdAnali
				Into
					nProdReal,
					nProdAnali
           			From GA_ACUM_D4 acum
	           		Where (acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
			Else
				Select sum(ac_pond_brix) As Brix,
					sum(ac_pond_ls) As Ls,
					sum(ac_pond_pbu) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From GA_ACUM_D4 acum
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei) As TQ
				Into	nTQ
				From GA_ACUM_D4 acum
				Where acum.ac_pond_temp_quei > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte) As TC
				Into	nTC
				From GA_ACUM_D4 acum
				Where acum.ac_pond_temp_corte > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
			End If;
 		End If;
	Else
	nReturn := 14;
	-- Tem Filtro de Finalidade
		If sPond <> ' ' Then
			nReturn := 15;
			If sPond = '1' Then
				nReturn := 16;
				Select sum(ac_prod) As ProdReal,
					sum(ac_prod_anali) As ProdAnali,
					sum(ac_pond_brix) As Brix,
					sum(ac_pond_ls) As Ls,
					sum(ac_pond_pbu) As Pbu
				Into
					nProdReal,
					nProdAnali,
					nBrix,
					nLs,
					nPbu
				From  GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei) As TQ
				Into	nTQ
				From  GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_quei > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte) As TC
				Into	nTC
				From  GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_corte > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'PRODUÇÃO REAL', 1) > 0 Then
				nReturn := 17;
				Select sum(ac_pond_brix*ac_prod)/sum(ac_prod) As Brix,
					sum(ac_pond_ls*ac_prod)/sum(ac_prod) As Ls,
					sum(ac_pond_pbu*ac_prod)/sum(ac_prod) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*ac_prod)/sum(ac_prod) As TQ
				Into	nTQ
				From 	GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_quei > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*ac_prod)/sum(ac_prod) As TC
				Into	nTC
				From 	GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_corte > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'PRODUÇÃO ANALISADA', 1) > 0  Then
				nReturn := 18;
				Select sum(ac_pond_brix*ac_prod_anali)/sum(ac_prod_anali) As Brix,
					sum(ac_pond_ls*ac_prod_anali)/sum(ac_prod_anali) As Ls,
					sum(ac_pond_pbu*ac_prod_anali)/sum(ac_prod_anali) As Pbu
				Into	nBrix,
					nLs,
					nPbu
				From	GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*ac_prod)/sum(ac_prod_anali) As TQ
				Into	nTQ
				From 	GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_quei > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*ac_prod)/sum(ac_prod_anali) As TC
				Into	nTC
				From 	GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_corte > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'PRODUTIVIDADE ESTIMADA', 1) > 0 Then
				nReturn := 19;
				Select sum(ac_pond_brix*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As Brix,
					sum(ac_pond_ls*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As Ls,
					sum(ac_pond_pbu*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_ACUM_D4 acum,
					GA_ESTIM_DIVI4_ATIVA est,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					acum.id_divi4=est.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As TQ
				Into	nTQ
				From 	GA_ACUM_D4 acum,
					GA_ESTIM_DIVI4_ATIVA est,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_quei > 0 And
					acum.id_divi4=est.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As TC
				Into	nTC
				From 	GA_ACUM_D4 acum,
					GA_ESTIM_DIVI4_ATIVA est,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_corte > 0 And
					acum.id_divi4=est.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'IDADE', 1) > 0  Then
				nReturn := 20;
				Select sum(ac_pond_brix*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As Brix,
					sum(ac_pond_ls*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As Ls,
					sum(ac_pond_pbu*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As TQ
				Into	nTQ
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_quei > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As TC
				Into	nTC
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_corte > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'ÁREA LIQUIDA', 1) > 0  Then
				nReturn := 21;
				Select sum(ac_pond_brix*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As Brix,
					sum(ac_pond_ls*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As Ls,
					sum(ac_pond_pbu*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As TQ
				Into	nTQ
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_quei > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As TC
				Into	nTC
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_corte > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'DISTÂNCIA ASFALTO', 1) > 0  Then
				nReturn := 22;
				Select sum(ac_pond_brix*rota.rot_asfal)/sum(rota.rot_asfal) As Brix,
					sum(ac_pond_ls*rota.rot_asfal)/sum(rota.rot_asfal) As Ls,
					sum(ac_pond_pbu*rota.rot_asfal)/sum(rota.rot_asfal) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*rota.rot_asfal)/sum(rota.rot_asfal) As TQ
				Into	nTQ
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_quei > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*rota.rot_asfal)/sum(rota.rot_asfal) As TC
				Into	nTC
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_corte > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'DISTÂNCIA TERRA 1', 1) > 0  Then
				nReturn := 23;
				Select sum(ac_pond_brix*rota.rot_terr1)/sum(rota.rot_terr1) As Brix,
					sum(ac_pond_ls*rota.rot_terr1)/sum(rota.rot_terr1) As Ls,
					sum(ac_pond_pbu*rota.rot_terr1)/sum(rota.rot_terr1) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*rota.rot_terr1)/sum(rota.rot_terr1) As TQ
				Into  nTQ
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_quei > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*rota.rot_terr1)/sum(rota.rot_terr1) As TC
				Into  nTC
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_corte > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
			ElsIf Instr(sPond, 'DISTÂNCIA TERRA 2', 1) > 0  Then
				nReturn := 24;
				Select sum(ac_pond_brix*rota.rot_terr2)/sum(rota.rot_terr2) As Brix,
					sum(ac_pond_ls*rota.rot_terr2)/sum(rota.rot_terr2) As Ls,
					sum(ac_pond_pbu*rota.rot_terr2)/sum(rota.rot_terr2) As Pbu
				Into
					nBrix,
					nLs,
					nPbu
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				If sType = 'TQ' Then
				Select sum(ac_pond_temp_quei*rota.rot_terr2)/sum(rota.rot_terr2) As TQ
				Into  nTQ
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_quei > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
				If sType = 'TC' Then
				Select sum(ac_pond_temp_corte*rota.rot_terr2)/sum(rota.rot_terr2) As TC
				Into  nTC
				From 	GA_ACUM_D4 acum,
					GA_ROTA rota,
					GA_ROTA_CANA rtcana,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_temp_corte > 0 And
					rtcana.id_divi4=acum.id_divi4 And
					rota.cod_rota=rtcana.cod_rota And
					rtcana.roc_principal=1 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;
				End If;
			End If;
		Else
			nReturn := 25;
			If sType = 'PRODREALBIT' Then
				Select sum(cont_peso_liqui) As ProdReal,
				 	sum(cont_tempo_queim * cont_peso_liqui) / sum(cont_peso_liqui) As TQ,
					sum(distinct tal_area_lib) As Area
				Into  nProdReal,
					nTQ,
					nAreaParc
				From 	GA_VAR_CONTAINER VARCO,
					GA_LIBERACAO LIB,
					GA_AREA_LIBER ARLIB
				Where varco.id_liber=lib.id_liber And
					lib.id_liber=arlib.id_liber And
					varco.cont_proce_pesag is not null And
					lib.cod_finalid=nFinalidade And
					varco.din_bituca_1 is not null And
					arlib.id_divi4=nId_Divi4 And
					varco.cont_dia_balanca >= dDataAcumInic And
					varco.cont_dia_balanca <= dDataAcumFim;
				Select  sum(a1.tal_area_lib)
				Into 	  nAreaTotal
				From    GA_AREA_LIBER A1
				Where   a1.id_liber in (Select a2.id_liber
			           		From GA_AREA_LIBER A2, GA_LIBERACAO LIB, GA_VAR_CONTAINER VARCO
				           	Where a2.id_liber=varco.id_liber and
							a2.id_liber=lib.id_liber And
							lib.cod_finalid=nFinalidade And
							a2.id_divi4=nId_divi4 and
							varco.cont_dia_balanca >= dDataAcumInic And
							varco.cont_dia_balanca <= dDataAcumFim);
				nProdReal := (nProdReal * nAreaParc) / nAreaTotal;
				nTQ := (nTQ * nAreaParc) / nAreaTotal;
			ElsIf sType = 'PRODREALD' Or sType = 'TQD' Then
				Select sum(cont_peso_liqui) As ProdReal,
				 	sum(cont_tempo_queim * cont_peso_liqui) / sum(cont_peso_liqui) As TQ,
					sum(distinct tal_area_lib) As Area
				Into  nProdReal,
					nTQ,
					nAreaParc
				From 	GA_VAR_CONTAINER VARCO,
					GA_LIBERACAO LIB,
					GA_AREA_LIBER ARLIB
				Where varco.id_liber=lib.id_liber And
					lib.id_liber=arlib.id_liber And
				   	(to_char(varco.cont_data_hora_tara, 'HH24:MI:SS') >= '06:00:00' And
				   	to_char(varco.cont_data_hora_tara, 'HH24:MI:SS') <= '18:59:59') And
					varco.cont_proce_pesag is not null And
					lib.cod_finalid=nFinalidade And
					arlib.id_divi4=nId_Divi4 And
					varco.cont_dia_balanca >= dDataAcumInic And
					varco.cont_dia_balanca <= dDataAcumFim;
				Select  sum(a1.tal_area_lib)
				Into 	  nAreaTotal
				From    GA_AREA_LIBER A1
				Where   a1.id_liber in (Select a2.id_liber
			           		From GA_AREA_LIBER A2, GA_LIBERACAO LIB, GA_VAR_CONTAINER VARCO
				           	Where a2.id_liber=varco.id_liber and
							a2.id_liber=lib.id_liber And
							lib.cod_finalid=nFinalidade And
							a2.id_divi4=nId_divi4 and
							varco.cont_dia_balanca >= dDataAcumInic And
							varco.cont_dia_balanca <= dDataAcumFim);
				nProdReal := (nProdReal * nAreaParc) / nAreaTotal;
				nTQ := (nTQ * nAreaParc) / nAreaTotal;
			ElsIf sType = 'PRODREALN' Or sType = 'TQN' Then
				nReturn := 898;
				Select sum(cont_peso_liqui) As ProdReal,
					 sum(cont_tempo_queim * cont_peso_liqui) / sum(cont_peso_liqui) As TQ,
					 sum( distinct tal_area_lib) As Area
				Into  nProdReal,
					nTQ,
					nAreaParc
				From 	GA_VAR_CONTAINER VARCO,
					GA_LIBERACAO LIB,
					GA_AREA_LIBER ARLIB
				Where varco.id_liber=lib.id_liber And
					lib.id_liber=arlib.id_liber And
				   	(to_char(varco.cont_data_hora_tara, 'HH24:MI:SS') <= '05:59:59' Or
			   		to_char(varco.cont_data_hora_tara, 'HH24:MI:SS') >= '19:00:00') And
					varco.cont_proce_pesag is not null And
					lib.cod_finalid=nFinalidade And
					arlib.id_divi4=nId_Divi4 And
					varco.cont_dia_balanca >= dDataAcumInic And
					varco.cont_dia_balanca <= dDataAcumFim;
				Select  sum(a1.tal_area_lib)
				Into 	  nAreaTotal
				From    GA_AREA_LIBER A1
				Where   a1.id_liber in (Select a2.id_liber
			           		From GA_AREA_LIBER A2, GA_LIBERACAO LIB, GA_VAR_CONTAINER VARCO
				           	Where a2.id_liber=varco.id_liber and
							a2.id_liber=lib.id_liber And
							lib.cod_finalid=nFinalidade And
							a2.id_divi4=nId_divi4 and
							varco.cont_dia_balanca >= dDataAcumInic And
							varco.cont_dia_balanca <= dDataAcumFim);
				nProdReal := (nProdReal * nAreaParc) / nAreaTotal;
				nTQ := (nTQ * nAreaParc) / nAreaTotal;
			ElsIf Upper(Substr(sType, 1, 4)) = 'PROD' Then
				Select sum(ac_prod) As ProdReal,
					sum(ac_prod_anali) As ProdAnali
				Into
					nProdReal,
					nProdAnali
				From  GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					(acum.ac_dt_acum >= dDataAcumInic And
		 			acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
			Else
				Select sum(ac_pond_brix) As Brix,
					sum(ac_pond_ls) As Ls,
					sum(ac_pond_pbu) As Pbu,
					sum(AC_POND_TEMP_QUEI) As TQ,
					sum(ac_pond_temp_corte) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
				From  GA_ACUM_D4 acum,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					(acum.ac_dt_acum >= dDataAcumInic And
		 			acum.ac_dt_acum <= dDataAcumFim) And
					id_divi4=nId_Divi4;
			End If;
		End If;
	End If;
	If sType = 'PRODREAL' Or sType = 'PRODREALD' Or sType = 'PRODREALN' Or sType = 'PRODREALDB' Or sType = 'PRODREALN' Then
		If sVariedade <> ' ' Then

			Select sum(vd4.var_area)
			Into nAreaTotal
			From GA_VARIE_DIVI4 VD4
			Where vd4.id_divi4=nId_Divi4;

			Select var_area
			Into nAreaParc
			From GA_VARIE_DIVI4 VD4, GA_VARIE_USINA VU
			Where vd4.cod_varie_usina=vu.cod_varie_usina AND
				vd4.id_divi4=nId_divi4 And
				vu.abv_varie=sVariedade;

			If nAreaTotal > 0 Then
				nProdReal := ((nAreaParc * nProdReal) / nAreaTotal);
			Else
				nProdReal := 0;
			End If;
		End If;
		Return nvl(nProdReal, 0);
	ElsIf sType = 'PRODANALI' Then
		If sVariedade <> ' ' Then
			Select sum(vd4.var_area)
			Into   nAreaTotal
			From 	GA_VARIE_DIVI4 VD4
			Where vd4.id_divi4=nId_Divi4;
			Select var_area
			Into nAreaParc
			From GA_VARIE_DIVI4 VD4, GA_VARIE_USINA VU
			Where vd4.cod_varie_usina=vu.cod_varie_usina AND
				vd4.id_divi4=nId_divi4 And
				vu.abv_varie=sVariedade;
			If nAreaTotal > 0 Then
				nProdAnali := ((nAreaParc * nProdAnali) / nAreaTotal);
			Else
				nProdAnali := 0;
			End If;
		End If;
		Return nvl(nProdAnali, 0);
	ElsIf sType = 'BRIX' Then
		Return nvl(nBrix, 0);
	ElsIf sType = 'LS' Then
		Return nvl(nLs, 0);
	ElsIf sType = 'PBU' Then
		Return nvl(nPbu, 0);
	ElsIf sType = 'FIBRA' Then
		If nPbu > 0 Then
			nFibra := GAF_FIBRA(nPBU);
		End If;
		Return nvl(nFibra, 0);
	ElsIf sType = 'POLCALDO' Then
		If nLs > 0 And nBrix > 0 Then
			nPolCaldo := GAF_POLCALDO(nLS,nBrix);
		End If;
		Return nvl(nPolCaldo, 0);
	ElsIf sType = 'POLCANA' Then
		If nBrix > 0 And nLs > 0 And nPbu > 0 Then
			nPolCana := GAF_POLCANA(GAF_POLCALDO(nLS,nBrix),GAF_FIBRA(nPBU),nPBU);
		End If;
		Return nvl(nPolCana, 0);
	ElsIf sType = 'PUREZA' Then
		If nBrix > 0 And nLs > 0 And nPbu > 0 Then
			nPureza := GAF_PUREZA(nBrix, GAF_POLCALDO(nLs,nBrix));
		End If;
		Return nvl(nPureza, 0);
	ElsIf sType = 'AGIO' Then
		If nBrix > 0 And nLs > 0 And nPbu > 0 Then
			nAgio := GAF_AGIO(GAF_POLCANA(GAF_POLCALDO(nLS,nBrix),GAF_FIBRA(nPbu),nPbu),GAF_PUREZA(nBrix,GAF_POLCALDO(nLS,nBrix)));
		End If;
		Return nvl(nAgio, 0);
	ElsIf sType = 'ARCALDO' Then
		If nBrix > 0 And nLs > 0 And nPbu > 0 Then
			nArCaldo := GAF_ARCALDO(GAF_PUREZA(nBrix, GAF_POLCALDO(nLs, nBrix)));
		End If;
		Return nvl(nArCaldo, 0);
	ElsIf sType = 'ARCANA' Then
		If nBrix > 0 And nLs > 0 And nPbu > 0 Then
			nArCana := GAF_ARCANA(GAF_PUREZA(nBrix, GAF_POLCALDO(nLs, nBrix)), GAF_FIBRA(nPbu));
		End If;
		Return nvl(nArCana, 0);
	ElsIf sType = 'ATR' Then
		If nBrix > 0 And nLs > 0 And nPbu > 0 Then
       --busca empresa e safra do id_divi4
       select cod_empr, saf_ano_safra 
       into p_cod_empr, p_saf_ano_safra 
       from ga_divi4
       where id_divi4 = nId_Divi4;
       
       nAtr := GAF_ATR(p_cod_empr, p_saf_ano_safra,
                       GAF_POLCANA(GAF_POLCALDO(nLS,nBrix),GAF_FIBRA(nPBU),nPBU),
                       GAF_ARCANA(GAF_PUREZA(nBrix, GAF_POLCALDO(nLs, nBrix)), GAF_FIBRA(nPbu)),
                       1);
		End If;
		Return nvl(nATR, 0);
	ElsIf sType = 'TQ' Or sType = 'TQD' Or sType = 'TQN' Or sType = 'TQDB' Or sType = 'TQNB' Or sType = 'TQBIT' Then
		Return nvl(nTQ, 0);
	ElsIf sType = 'TC' Then
		Return nvl(nTC, 0);
	Else
		Return -1;
	End If;

End GAF_CALC_SONDA;

 
