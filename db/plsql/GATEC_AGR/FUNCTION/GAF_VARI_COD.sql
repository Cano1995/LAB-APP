CREATE OR REPLACE Function GAF_VARI_COD( ID_DIV4 IN Number )
Return Number
Is
Cursor C1 Is
  Select   USI.COD_VARIE_USINA VARIE
      From GA_VARIE_DIVI4 DIV4,
           GA_VARIE_USINA USI
        Where DIV4.COD_VARIE_USINA = USI.COD_VARIE_USINA
          And ID_DIVI4 = ID_DIV4;
R1 C1%RowType;
Cursor C2 Is
  Select   COD_VARIE_USINA  AGRUPADOS
  From     GA_VARIE_USINA
  Where
           COD_VARIE_COPER = 8887;
R2 C2%RowType;
nRetorno Number(4);
Begin
      Open C1;
      Loop
      Fetch C1 Into R1;
      If c1%ROWCOUNT = 0 Then
         nRetorno := NULL;
      Elsif c1%ROWCOUNT > 1 Then
         Open C2;
         Fetch C2 Into R2;
         nRetorno := R2.AGRUPADOS ;
         Close C2;
      Else
         nRetorno := R1.VARIE;
      End If;
      Exit When C1%NOTFOUND;
      End Loop;
      Close C1;
      return nRetorno;
End;

 