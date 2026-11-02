CREATE OR REPLACE Function GAF_SUM_ACUM(nId_Divi4 In Number, sTipo In VarChar,
						sPondera In VarChar, nFinalidade In Number,
						dDataAcumInic In Date, dDataAcumFim In Date)
											Return Number
 Is
	Cursor C1 is
           		Select sum(ac_prod) As ProdReal,
				sum(ac_prod_anali) AS ProdAnali,
				sum(ac_pond_brix) As Brix,
				sum(ac_pond_ls) As Ls,
				sum(ac_pond_pbu) As Pbu,
				sum(ac_pond_temp_quei) As TQ,
				sum(ac_pond_temp_corte) As TC
           		From GA_ACUM_D4 acum
           		Where acum.ac_pond_brix > 0 And
				acum.ac_pond_ls > 0 And
				acum.ac_pond_pbu > 0 And
				(acum.ac_dt_acum >= dDataAcumInic And
				acum.ac_dt_acum <= dDataAcumFim) And
				id_divi4=nId_Divi4;
   	R1 C1%RowType;

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

Begin
	-- DBMS_OUTPUT.PUT_LINE ( 'Mensagem: Inicio GAF_SUM_ACUM ' );
	-- DBMS_OUTPUT.NEW_LINE ;

	sType := LTrim(RTrim(Upper(sTipo)));
	sPond := LTrim(RTrim(Upper(sPondera)));

	If nFinalidade = 0 Then
	 	If sPond <> ' ' Then
			If sPond = '1' Then
				Select sum(ac_prod) As ProdReal,
					sum(ac_prod_anali) As ProdAnali,
 					sum(ac_pond_brix) As Brix,
					sum(ac_pond_ls) As Ls,
					sum(ac_pond_pbu) As Pbu,
					sum(ac_pond_temp_quei) As TQ,
					sum(ac_pond_temp_corte) As TC
				Into
					nProdReal,
					nProdAnali,
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

				If sType = 'PRODREAL' Then
					Return nProdReal;
				ElsIf sType = 'PRODANALI' Then
					Return nProdAnali;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'PRODUÇÃO REAL', 1) > 0 Then
				Select sum(ac_pond_brix*ac_prod)/sum(ac_prod) As Brix,
					sum(ac_pond_ls*ac_prod)/sum(ac_prod) As Ls,
					sum(ac_pond_pbu*ac_prod)/sum(ac_prod) As Pbu,
					sum(ac_pond_temp_quei*ac_prod)/sum(ac_prod) As TQ,
					sum(ac_pond_temp_corte*ac_prod)/sum(ac_prod) As TC
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
				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'PRODUÇÃO ANALISADA', 1) > 0  Then
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
				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'PRODUTIVIDADE ESTIMADA', 1) > 0 Then
				Select sum(ac_pond_brix*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As Brix,
					sum(ac_pond_ls*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As Ls,
					sum(ac_pond_pbu*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As Pbu,
					sum(ac_pond_temp_quei*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As TQ,
					sum(ac_pond_temp_corte*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
				From 	GA_ACUM_D4 acum,
					GA_ESTIM_DIVI4 est,
					GA_ESTIM_AGRUP agp
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					est.id_estim_agrup=agp.id_estim_agrup And
					acum.id_divi4=est.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;

				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'IDADE', 1) > 0  Then
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
						d4.di4_dt_corte_anter)/30.51)))) As Pbu,
					sum(ac_pond_temp_quei*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As TQ,
					sum(ac_pond_temp_corte*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;

				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'ÁREA LIQUIDA', 1) > 0  Then
				Select sum(ac_pond_brix*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As Brix,
					sum(ac_pond_ls*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As Ls,
					sum(ac_pond_pbu*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As Pbu,
					sum(ac_pond_temp_quei* (d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As TQ,
					sum(ac_pond_temp_corte*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As TC

				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
				From 	GA_DIVI4 d4,
					GA_ACUM_D4 acum
				Where acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					d4.id_divi4=acum.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					d4.id_divi4=nId_Divi4;

				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'DISTÂNCIA ASFALTO', 1) > 0  Then
				Select sum(ac_pond_brix*rota.rot_asfal)/sum(rota.rot_asfal) As Brix,
					sum(ac_pond_ls*rota.rot_asfal)/sum(rota.rot_asfal) As Ls,
					sum(ac_pond_pbu*rota.rot_asfal)/sum(rota.rot_asfal) As Pbu,
					sum(AC_POND_TEMP_QUEI*rota.rot_asfal)/sum(rota.rot_asfal) As TQ,
					sum(ac_pond_temp_corte*rota.rot_asfal)/sum(rota.rot_asfal) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
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

				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'DISTÂNCIA TERRA 1', 1) > 0  Then
				Select sum(ac_pond_brix*rota.rot_terr1)/sum(rota.rot_terr1) As Brix,
					sum(ac_pond_ls*rota.rot_terr1)/sum(rota.rot_terr1) As Ls,
					sum(ac_pond_pbu*rota.rot_terr1)/sum(rota.rot_terr1) As Pbu,
					sum(AC_POND_TEMP_QUEI*rota.rot_terr1)/sum(rota.rot_terr1) As TQ,
					sum(ac_pond_temp_corte*rota.rot_terr1)/sum(rota.rot_terr1) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
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

				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'DISTÂNCIA TERRA 2', 1) > 0  Then
				Select sum(ac_pond_brix*rota.rot_terr2)/sum(rota.rot_terr2) As Brix,
					sum(ac_pond_ls*rota.rot_terr2)/sum(rota.rot_terr2) As Ls,
					sum(ac_pond_pbu*rota.rot_terr2)/sum(rota.rot_terr2) As Pbu,
					sum(AC_POND_TEMP_QUEI*rota.rot_terr2)/sum(rota.rot_terr2) As TQ,
					sum(ac_pond_temp_corte*rota.rot_terr2)/sum(rota.rot_terr2) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
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

				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
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
      			If sType = 'PRODREAL' Then
         				Return ( r1.ProdReal ) /1000 ;
      			ElsIf sType = 'PRODANALI' Then
	         			Return ( r1.ProdAnali ) / 1000;
      			ElsIf sType = 'BRIX' Then
         				Return ( r1.Brix );
	      		ElsIf sType = 'LS' Then
        				Return ( r1.Ls );
				ElsIf sType = 'PBU' Then
      	   			Return ( r1.Pbu );
				ElsIf sType = 'TQ' Then
					Return ( r1.TQ );
				ElsIf sType = 'TC' Then
					Return ( r1.TC );
      			Else
         				Return -1;
     	 			End If;
			Else
				Return 0;
			End If;
 		End If;
	Else
	-- Tem Filtro de Finalidade
		If sPond <> ' ' Then
			If sPond = '1' Then
				Select  sum(ac_prod) As ProdReal,
					sum(ac_prod_anali) As ProdAnali,
					sum(ac_pond_brix) As Brix,
					sum(ac_pond_ls) As Ls,
					sum(ac_pond_pbu) As Pbu,
					sum(AC_POND_TEMP_QUEI) As TQ,
					sum(ac_pond_temp_corte) As TC
				Into
					nProdReal,
					nProdAnali,
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

				If sType = 'PRODREAL' Then
					Return nProdReal;
				ElsIf sType = 'PRODANALI' Then
					Return nProdAnali;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'PRODUÇÃO REAL', 1) > 0 Then
				Select sum(ac_pond_brix*ac_prod)/sum(ac_prod) As Brix,
					sum(ac_pond_ls*ac_prod)/sum(ac_prod) As Ls,
					sum(ac_pond_pbu*ac_prod)/sum(ac_prod) As Pbu,
					sum(AC_POND_TEMP_QUEI*ac_prod)/sum(ac_prod) As TQ,
					sum(ac_pond_temp_corte*ac_prod)/sum(ac_prod) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
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
				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'PRODUÇÃO ANALISADA', 1) > 0  Then
				Select sum(ac_pond_brix*ac_prod_anali)/sum(ac_prod_anali) As Brix,
					sum(ac_pond_ls*ac_prod_anali)/sum(ac_prod_anali) As Ls,
					sum(ac_pond_pbu*ac_prod_anali)/sum(ac_prod_anali) As Pbu,
					sum(AC_POND_TEMP_QUEI*ac_prod_anali)/sum(ac_prod_anali) As TQ,
					sum(ac_pond_temp_corte*ac_prod_anali)/sum(ac_prod_anali) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
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
				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'PRODUTIVIDADE ESTIMADA', 1) > 0 Then
				Select sum(ac_pond_brix*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As Brix,
					sum(ac_pond_ls*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As Ls,
					sum(ac_pond_pbu*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As Pbu,
					sum(AC_POND_TEMP_QUEI*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As TQ,
					sum(ac_pond_temp_corte*est.ed4_tonel_estim)/sum(est.ed4_tonel_estim) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
				From 	GA_ACUM_D4 acum,
					GA_ESTIM_DIVI4 est,
					GA_ESTIM_AGRUP agp,
					GA_LIBERACAO libe
				Where libe.id_liber=acum.id_liber And
					libe.cod_finalid=nFinalidade And
					acum.ac_pond_brix > 0 And
					acum.ac_pond_ls > 0 And
					acum.ac_pond_pbu > 0 And
					est.id_estim_agrup=agp.id_estim_agrup And
					acum.id_divi4=est.id_divi4 And
					(acum.ac_dt_acum >= dDataAcumInic And
					acum.ac_dt_acum <= dDataAcumFim) And
					acum.id_divi4=nId_Divi4;

				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'IDADE', 1) > 0  Then
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
						d4.di4_dt_corte_anter)/30.51)))) As Pbu,
					sum(ac_pond_temp_quei*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As TQ,
					sum(ac_pond_temp_corte*(decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51))))/sum((decode(d4.di4_dt_corte_anter, null,
						(decode(d4.di4_dt_plant, null, 0, (nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_plant)/30.51)),((nvl(d4.di4_dt_corte_atual,sysdate)-
						d4.di4_dt_corte_anter)/30.51)))) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
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

				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'ÁREA LIQUIDA', 1) > 0  Then
				Select sum(ac_pond_brix*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As Brix,
					sum(ac_pond_ls*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As Ls,
					sum(ac_pond_pbu*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As Pbu,
					sum(AC_POND_TEMP_QUEI*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As TQ,
					sum(ac_pond_temp_corte*(d4.di4_area_total-d4.di4_area_inuti-
						d4.di4_area_carre))/sum((d4.di4_area_total-
						d4.di4_area_inuti-d4.di4_area_carre)) As TC				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
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

				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'DISTÂNCIA ASFALTO', 1) > 0  Then
				Select sum(ac_pond_brix*rota.rot_asfal)/sum(rota.rot_asfal) As Brix,
					sum(ac_pond_ls*rota.rot_asfal)/sum(rota.rot_asfal) As Ls,
					sum(ac_pond_pbu*rota.rot_asfal)/sum(rota.rot_asfal) As Pbu,
					sum(AC_POND_TEMP_QUEI*rota.rot_asfal)/sum(rota.rot_asfal) As TQ,
					sum(ac_pond_temp_corte*rota.rot_asfal)/sum(rota.rot_asfal) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
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

				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'DISTÂNCIA TERRA 1', 1) > 0  Then
				Select sum(ac_pond_brix*rota.rot_terr1)/sum(rota.rot_terr1) As Brix,
					sum(ac_pond_ls*rota.rot_terr1)/sum(rota.rot_terr1) As Ls,
					sum(ac_pond_pbu*rota.rot_terr1)/sum(rota.rot_terr1) As Pbu,
					sum(AC_POND_TEMP_QUEI*rota.rot_terr1)/sum(rota.rot_terr1) As TQ,
					sum(ac_pond_temp_corte*rota.rot_terr1)/sum(rota.rot_terr1) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
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

				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			ElsIf Instr(sPond, 'DISTÂNCIA TERRA 2', 1) > 0  Then
				Select sum(ac_pond_brix*rota.rot_terr2)/sum(rota.rot_terr2) As Brix,
					sum(ac_pond_ls*rota.rot_terr2)/sum(rota.rot_terr2) As Ls,
					sum(ac_pond_pbu*rota.rot_terr2)/sum(rota.rot_terr2) As Pbu,
					sum(AC_POND_TEMP_QUEI*rota.rot_terr2)/sum(rota.rot_terr2) As TQ,
					sum(ac_pond_temp_corte*rota.rot_terr2)/sum(rota.rot_terr2) As TC
				Into
					nBrix,
					nLs,
					nPbu,
					nTQ,
					nTC
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

				If sType = 'PRODREAL' Then
					Return -1;
				ElsIf sType = 'PRODANALI' Then
					Return -1;
				ElsIf sType = 'BRIX' Then
					Return nBrix;
				ElsIf sType = 'LS' Then
					Return nLs;
				ElsIf sType = 'PBU' Then
					Return nPbu;
				ElsIf sType = 'TQ' Then
					Return nTQ;
				ElsIf sType = 'TC' Then
					Return nTC;
				Else
					Return -1;
				End If;
			Else
				Return -1;
			End If;
		Else
			Select sum(ac_prod) As ProdReal,
				sum(ac_prod_anali) As ProdAnali,
				sum(ac_pond_brix) As Brix,
				sum(ac_pond_ls) As Ls,
				sum(ac_pond_pbu) As Pbu,
				sum(AC_POND_TEMP_QUEI) As TQ,
				sum(ac_pond_temp_corte) As TC
			Into
				nProdReal,
				nProdAnali,
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

			If sType = 'PRODREAL' Then
				Return nProdReal;
			ElsIf sType = 'PRODANALI' Then
				Return nProdAnali;
			ElsIf sType = 'BRIX' Then
				Return nBrix;
			ElsIf sType = 'LS' Then
				Return nLs;
			ElsIf sType = 'PBU' Then
				Return nPbu;
			ElsIf sType = 'TQ' Then
				Return nTQ;
			ElsIf sType = 'TC' Then
				Return nTC;
			Else
				Return -1;
			End If;
		End If;
	End If;
End GAF_SUM_ACUM;

 