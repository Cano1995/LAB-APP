CREATE OR REPLACE Function Gaf_AreLibFin( nCOD_FINALID In Number, nID_DIVI4 In Number )
			Return Number
			Is
nRetorno Number;
nRet Number;
Cursor curLiberacao Is
        Select Sum( are.TAL_AREA_LIB )
        From GA_AREA_LIBER are,
             GA_LIBERACAO  lib
        Where lib.ID_LIBER    = are.ID_LIBER and
              lib.COD_FINALID = nCod_FINALID and
              are.ID_DIVI4    =  nID_DIVI4 ;
Begin
        nRetorno := 0;
	Open curLiberacao;
        Fetch curLiberacao Into nRet;
        if nRet IS NOT NULL then
           nRetorno := nRet;
        end if;
	Close curLiberacao;
        Return nRetorno;
	Exception
		When Others Then
			nRetorno := 999.99;
			Return nRetorno;
End;

 