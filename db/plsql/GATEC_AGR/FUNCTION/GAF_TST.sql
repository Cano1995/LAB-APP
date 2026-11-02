CREATE OR REPLACE Function Gaf_Tst( nIDLiber In Number )
Return Number
Is

Cursor curEstCorte Is
SELECT 	LIB.id_divi4
FROM 	GA_AREA_LIBER LIB,
	GA_DIVI4 DI4
WHERE 	TAL_AREA_LIB =
		(SELECT 	MAX(LIB_AUX.TAL_AREA_LIB)
		 FROM   	GA_AREA_LIBER LIB_AUX
		 WHERE 		LIB.ID_LIBER = LIB_AUX.ID_LIBER)
and	LIB.ID_LIBER = nIDLiber
AND	DI4.ID_DIVI4 = LIB.ID_DIVI4;

regEstCorte curEstCorte%ROWTYPE;

Begin

  Open curEstCorte;
  Fetch curEstCorte Into regEstCorte;
  Close curEstCorte;

  Return regEstCorte.id_divi4;

  Exception
     When Others Then
	    Return '';

End Gaf_Tst;

 