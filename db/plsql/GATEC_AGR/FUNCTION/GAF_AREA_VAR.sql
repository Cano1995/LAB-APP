CREATE OR REPLACE Function GAF_AREA_VAR( nID_DIVI4 IN Number )
Return Number
Is
Cursor C1 Is
  Select   sum(USI.VAR_AREA) AREA_VAR
  From     GA_VARIE_DIVI4 USI
  Where    nID_DIVI4 = USI.ID_DIVI4 ;
R1 C1%RowType;
Begin
      Open C1;
      Fetch C1 Into R1;
      Close C1;
      return R1.AREA_VAR;
End GAF_AREA_VAR;

 