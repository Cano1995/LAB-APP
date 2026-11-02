CREATE OR REPLACE Function GAF_ROTAS( nIDD4 IN Number,
				      nEmpr IN Number,
				      cTipo IN Char )
Return Char
Is
Cursor C1 Is
Select ABV_ROTA,
       Nvl(ROT_ASFAL,0)+Nvl(ROT_TERR1,0)+Nvl(ROT_TERR2,0) Soma
    From GA_ROTA a,
         GA_ROTA_CANA b
     Where a.COD_EMPR_DEST = nEmpr
       And a.COD_ROTA = b.COD_ROTA
       And b.ID_DIVI4 = nIDD4
       And b.ROC_PRINCIPAL = 1;
R1 C1%RowType;
sRetorno Char(25);
Begin
      Open C1;
      Fetch C1 Into R1;
      If C1%FOUND Then
	If cTipo = 'DSC' Then
           sRetorno := R1.ABV_ROTA || ' ( ' || lpad(R1.Soma,5,' ') || ' )';
	Else
	   sRetorno := R1.Soma;
	End If;
      Else
	If cTipo = 'DSC' Then
           sRetorno := 'NENHUMA ROTA';
	Else
	   sRetorno := 0;
	End IF;
      End If;
      Return sRetorno;
      Close C1;
End GAF_ROTAS;

 