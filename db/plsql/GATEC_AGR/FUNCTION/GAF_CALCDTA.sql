CREATE OR REPLACE Function Gaf_CalcDta(
					nIDD4 In Number
				      )
Return Date
Is
dRetorno  Date;
nA        Number := 1;
nB        Number := 0;
nLScor    Number := 0;
ErroSql   Varchar2(240);
Cursor curSafras Is
 Select COD_EMPR,
	SAF_ANO_SAFRA
     From GA_DIVI4
	Where id_divi4 = nIDD4;
regSafras curSafras%ROWTYPE;
Cursor curDataPre Is
  Select Max(A.PAN_DT) PAN_DT
    From  GA_PRE_ANALI A,
	  GA_MOV_PRE_ANALI B
      Where A.PAN_BRIX Is Not Null
	And A.ID_PRE_ANALI    = B.ID_PRE_ANALI
	And B.ID_DIVI4        = nIDD4
	And B.MPA_FLAG_ORIGEM = 1;
regDataPre curDataPre%ROWTYPE;
Cursor C1 Is
  Select A.PAN_NUMER PAN_NUMER,
	 A.PAN_BRIX PAN_BRIX,
	 A.PAN_LS PAN_LS,
	 A.PAN_PBU PAN_PBU,
	 A.PAN_AR PAN_AR,
	 PAN_POL_CALDO PAN_POL_CALDO,
	 A.PAN_CLARIF
    From  GA_PRE_ANALI A,
	  GA_MOV_PRE_ANALI B
      Where A.PAN_BRIX Is Not Null
	And A.ID_PRE_ANALI    = B.ID_PRE_ANALI
	And B.ID_DIVI4        = nIDD4
	And A.PAN_DT 	      = regDataPre.PAN_DT
	And B.MPA_FLAG_ORIGEM = 1;
R1 C1%ROWTYPE;
-- Especialidade do Talh?o Corrente e Periodo de ponderac?o
Cursor C2 Is
 Select COD_ESPEC,
        CES_PER_PONDE
    From GA_ESPEC,
         GA_AGRUP,
	 GA_CONFI_EMPR_SAFRA
       Where GA_ESPEC.ID_ESPEC   	      = GA_AGRUP.ID_ESPEC
        And GA_AGRUP.ID_DIVI4    	      = nIDD4
        And GA_ESPEC.COD_GRUPO                = GA_CONFI_EMPR_SAFRA.COD_GRUPO
        And GA_ESPEC.COD_SUBGR   	      = GA_CONFI_EMPR_SAFRA.COD_SUBGR
	And GA_CONFI_EMPR_SAFRA.COD_EMPR      = regSafras.COD_EMPR
	And GA_CONFI_EMPR_SAFRA.SAF_ANO_SAFRA = regSafras.SAF_ANO_SAFRA;
R2 C2%ROWTYPE;
-- Intervalo de Datas para media
Cursor C3 Is
 Select MAX(PAN_DT) MAIOR,
	(MAX(PAN_DT) - R2.CES_PER_PONDE) MENOR
     from VIEW_BLOCO_PRE_ANALI
  	Where COD_ESPEC     = R2.COD_ESPEC
          And COD_EMPR      = regSafras.COD_EMPR
	  And SAF_ANO_SAFRA = regSafras.SAF_ANO_SAFRA;
R3 C3%ROWTYPE;
BEGIN
   Open curSafras;
   Fetch curSafras Into regSafras;
   Close curSafras;
   Open curDataPre;
   Fetch curDataPre Into regDataPre;
   Close curDataPre;
   Open C1;
   Fetch C1 Into R1;
   If C1%FOUND Then
	-- Atribuic?o de Valores repetitiva para poder utilizar a view de Calculo PreAnali
	dRetorno  := regDataPre.PAN_DT;
-- Calculo da Media
   Else
     Open C2;
     Fetch C2 Into R2;
     If C2%FOUND Then
	Open C3;
	Fetch C3 Into R3;
	Close C3;
 	  dRetorno  := R3.MAIOR;
        Close C2;
     End If;
   End If;
  Close C1;
  Return dRetorno;
  Exception
	When Others Then
		dRetorno := SYSDATE;
		Return dRetorno;
End Gaf_CalcDta;

 