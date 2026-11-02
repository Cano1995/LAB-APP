CREATE OR REPLACE Function GAF_SOLOS( ID_DIV4 IN Number )
Return Char
Is
Cursor C1 Is
  Select  ABV_SOLO
      From GA_SOLOS_DIVI4 SOLO,
           GA_SOLOS_USINA USI
        Where SOLO.COD_SOLO_USINA = USI.COD_SOLO_USINA
          And ID_DIVI4 = ID_DIV4;
R1 C1%RowType;
sRetorno Char(15);
Begin
      Open C1;
      Loop
      Fetch C1 Into R1;
      If C1%ROWCOUNT = 0 Then
            sRetorno := 'NENHUMA';
      Elsif
         C1%ROWCOUNT > 1 Then
            sRetorno := 'VARIOS';
      Else
            sRetorno := R1.ABV_SOLO;
      End If;
      Exit When C1%NOTFOUND;
      End Loop;
      Return sRetorno;
      Close C1;
End GAF_SOLOS;

 