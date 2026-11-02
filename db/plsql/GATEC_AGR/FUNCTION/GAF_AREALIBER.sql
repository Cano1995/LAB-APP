CREATE OR REPLACE Function Gaf_AreaLiber( nID_LIBER In Number )
			Return Number
			Is
nRetorno Number;
Cursor curLiberacao Is
	Select Sum( TAL_AREA_LIB )
	    From GA_AREA_LIBER
		 Where ID_LIBER = nID_LIBER;
Begin
	Open curLiberacao;
	Fetch curLiberacao Into nRetorno;
	Close curLiberacao;
	Return nRetorno;
	Exception
		When Others Then
			nRetorno := 999.99;
			Return nRetorno;
End;

 