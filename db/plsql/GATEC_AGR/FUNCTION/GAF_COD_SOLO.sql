CREATE OR REPLACE Function GAF_COD_SOLO( ID_DIV4 IN Number )
Return Number
Is
Cursor C1 Is
  Select   USI.COD_SOLO_USINA
      From GA_SOLOS_DIVI4 SOLO,
           GA_SOLOS_USINA USI
        Where SOLO.COD_SOLO_USINA = USI.COD_SOLO_USINA
          And ID_DIVI4 = ID_DIV4;
R1 C1%RowType;
Cursor C2 Is
  Select    COD_SOLO_USINA
  From      GA_SOLOS_USINA
  Where     COD_SOLO_COPER = 998 ;
R2 C2%RowType;
nRetorno Number(3);
Begin
      Open C1;
      Loop
      Fetch C1 Into R1;
      If C1%ROWCOUNT = 0 Then
            nRetorno := NULL;
      Elsif C1%ROWCOUNT > 1 Then
            Open C2;
            Fetch C2 Into R2;
            nRetorno := R2.COD_SOLO_USINA;
            Close C2;
      Else
            nRetorno := R1.COD_SOLO_USINA;
      End If;
      Exit When C1%NOTFOUND;
      End Loop;
      Close C1;
      Return nRetorno;
End GAF_COD_SOLO;

 