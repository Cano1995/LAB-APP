CREATE OR REPLACE Function GAF_VARIED( ID_DIV4 IN Number )
Return Char
Is
Cursor C1 Is
  Select  ABV_VARIE
      From GA_VARIE_DIVI4 DIV4,
           GA_VARIE_USINA USI
        Where DIV4.COD_VARIE_USINA = USI.COD_VARIE_USINA
          And ID_DIVI4 = ID_DIV4;
R1 C1%RowType;
sRetorno Char(15);
Begin
      Open C1;
      Loop
      Fetch C1 Into R1;
      If c1%ROWCOUNT = 0 Then
            sRetorno := 'NENHUMA';
      Elsif
         c1%ROWCOUNT > 1 Then
            sRetorno := 'VARIAS';
      Else
            sRetorno := R1.ABV_VARIE;
      End If;
      Exit When C1%NOTFOUND;
      End Loop;
      Return sRetorno;
      Close C1;
End GAF_VARIED;

 