CREATE OR REPLACE Function GAF_CALC_DATA(nId_Divi4 In Number, sTipo In VarChar)
				Return Date

 Is
	Cursor curDataPre Is
	  	Select Max(PRE.PAN_DT) As pan_dt
	   	From   GA_PRE_ANALI PRE,
         		GA_MOV_PRE_ANALI MOV
   		Where nvl(pre.pan_brix, 0) <> 0 And
			pre.id_pre_anali=mov.id_pre_anali And
			mov.mpa_flag_origem = 1 And
			mov.id_divi4=nId_Divi4 ;

	rDataPre curDataPre%ROWTYPE;

	dRetorno Date;
	sType VarChar(20);

Begin
	sType := LTrim(RTrim(Upper(sTipo)));

	If sType = 'PRE' Then
		Open curDataPre;
		Fetch curDataPre Into rDataPre;
		If curDataPre%FOUND Then
			dRetorno := rDataPre.Pan_dt;
		Else
			dRetorno := Null;
		End If;
	End If;

	Return dRetorno;
End GAF_CALC_DATA;

 