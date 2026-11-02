CREATE OR REPLACE Function           GAF_FUNC_TRANSPORT(nCod_Func In Number, nCod_Empr In Number, nSaf_Ano_Safra In Number,
							    dDataInic In Date, dDataFim In Date)
			Return VarChar2
 Is
	Cursor C1 Is
		Select
			vc.cont_peso_liqui As Peso,
			vc.cod_mis As Mis,
			vc.ent_id_viage As Viag,
			cpl_peso_max As PesoMax,
			cpl_peso_min As PesoMin,
			id_clas_equip As Classe
		From 	GA_VAR_DIGIT VD,
			GA_VAR_CONTAINER VC,
			GA_CPMIS_COMPL_MIS MS
		Where vd.cod_empr=vc.ent_cod_empr And
			vd.saf_ano_safra=vc.ent_saf_ano_safra And
			vd.id_viage=vc.ent_id_viage And
			ms.cod_mis=vc.cod_mis And
			vd.cod_empr=nCod_Empr And
			vd.saf_ano_safra=nSaf_Ano_Safra And
			vc.cont_data_hora_tara >= dDataInic And
			vc.cont_data_hora_tara <= dDataFim And
			(vd.cod_func_motor=nCod_Func Or
			vc.din_func_1=nCod_Func Or
	 		vc.din_func_2=nCod_Func Or
	 		vc.din_oper_trat_1=nCod_Func Or
	 		vc.din_oper_trat_2=nCod_Func);
		-- Order By vc.cod_mis;

   	R1 C1%RowType;

	sReturn VarChar2(1000);
	sFunc VarChar2(51);
	sMis VarChar2(15);

	nPesoDentro Number(11);
	nPesoFora Number(11);
	nPesoTotal Number(15);

	nViagDentro Number(6);
	nViagFora Number(6);
	nViagTotal Number(7);

	nPeso Number(11);
	nPesoMin Number(11);
	nPesoMax Number(11);

	nDist Number(6,1);
	nDistViag Number;
Begin
	sReturn := '';
	sMis := '';

	nPesoDentro :=0;
	nPesoFora :=0;
	nPesoTotal :=0;

	nViagDentro :=0;
	nViagFora :=0;
	nViagTotal :=0;

	nPesoMin :=0;
	nPesoMax :=0;

	nDist := 0;

	Select  cod_func || '-' || dsc_func
	Into	sFunc
	From 	GA_FUNCIONARIO
	Where   cod_func=nCod_Func;

	Open C1;

	Loop
      	Fetch C1 Into R1;
		Exit When C1%NOTFOUND;

		nPeso := R1.Peso;
		nPesoMax := R1.PesoMax;
		nPesoMin := R1.PesoMin;

		If nPeso > nPesoMax Then
			nPesoFora := nPesoFora + R1.Peso;
			nViagFora := nViagFora + 1;
		Else
			nPesoDentro := nPesoDentro + R1.Peso;
			nViagDentro := nViagDentro + 1;
		End If;

		If R1.Classe = 10 Then
			Select
				Avg(nvl(rot_asfal, 0) + nvl(rot_terr1, 0) + nvl(rot_terr2, 0))
			Into
				nDistViag
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
				vc.ent_id_viage=R1.Viag
			Group By vc.ent_id_viage;

			nDist := nDist + nDistViag;
		End If;

	End Loop;
	Close C1;

	nPesoTotal := nPesoDentro + nPesoFora;
	nViagTotal := nViagDentro + nViagFora;

	sReturn := rPad(sFunc, 51) || '  ' || lPad(nPesoDentro, 15, ' ') ||
				      '  ' || lPad(nViagDentro, 10, ' ') ||
				      '  ' || lPad(nPesoFora, 15, ' ') ||
				      '  ' || lPad(nViagFora, 10, ' ') ||
				      '  ' || lPad(nPesoTotal, 18, ' ') ||
				      '  ' || lPad(nViagTotal, 12, ' ') ||
				      '  ' || lPad(nDist, 10, ' ');

	Return sReturn;

	Exception
      	When Others Then
                 Return 'Erro - ' || sFunc;

End GAF_FUNC_TRANSPORT;




 
