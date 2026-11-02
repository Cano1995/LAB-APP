CREATE OR REPLACE Function Gaf_Idade( nIDD4     In Number  ,
  				      dDataBase In Date )
Return Number
Is
Cursor curDataCalc Is
   Select Nvl( DI4_DT_CORTE_ANTER , DI4_DT_PLANT ) DATA
      From GA_DIVI4
	  Where ID_DIVI4 = nIDD4;
regDataCalc curDataCalc%ROWTYPE;
nIdade Number := 0;
Begin
   Open curDataCalc;
   Fetch curDataCalc Into regDataCalc;
   nIdade := round( ( ( dDataBase - regDataCalc.DATA ) / 30.5 ), 2 );
   Return nIdade;
   Close curDataCalc;
   Exception
   	When Others Then
	   nIdade := 999.99;
	   Return nIdade;
End;

 