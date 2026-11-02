CREATE OR REPLACE Function Gaf_Distancia( nID_LIBER In Number ,
							nCOD_EMPR In Number )
			Return Number Is
Cursor curDistancia Is
	Select al.ID_LIBER,
		 nvl(ro.ROT_ASFAL,0)+nvl(ro.ROT_TERR1,0)+nvl(ro.ROT_TERR2,0) DISTANCIA
	    From GA_ROTA        ro,
		   GA_ROTA_CANA   rc,
		   GA_FUNDO_AGRIC fu,
		   GA_LIBERACAO   li,
		   GA_AREA_LIBER  al
	       Where ro.COD_EMPR_DEST  = nCOD_EMPR
		   And rc.COD_ROTA       = ro.COD_ROTA
	         And rc.COD_EMPR_DEST  = rc.COD_EMPR_DEST
		   And rc.ROC_PRINCIPAL  = 1
		   And rc.ID_DIVI4       = al.ID_DIVI4
--		   And fu.ID_CARAC       = 1
		   And fu.ID_FUNDO_AGRIC = li.ID_FUNDO_AGRIC
		   And li.ID_LIBER       = al.ID_LIBER
		   And al.ID_LIBER       = nID_LIBER;
regDistancia curDistancia%ROWTYPE;
Cursor curFornecedor Is
Select rot.ROT_ASFAL+rot.ROT_TERR1+rot.ROT_TERR2 DISTANCIA
    From GA_ROTA       rot,
	   GA_ROTA_FORNE rof,
	   GA_LIBERACAO  lib
       Where rot.COD_EMPR_DEST  = nCOD_EMPR
	   And rot.COD_EMPR_DEST  = rof.COD_EMPR_DEST
	   And rot.COD_ROTA       = rof.COD_ROTA
         And rof.ID_FUNDO_AGRIC = lib.ID_FUNDO_AGRIC
	   And lib.ID_LIBER       = nID_LIBER;
regFornecedor curFornecedor%ROWTYPE;
sProcesso  varchar2(240);
ErroSql    varchar2(240);
nDistancia number;
Begin
	sProcesso := 'Abrindo curDistancia';
	Open curDistancia;
	Fetch curDistancia Into regDistancia;
	If curDistancia%FOUND Then
		nDistancia := regDistancia.DISTANCIA;
	Else
		Open curFornecedor;
		Fetch curFornecedor Into regFornecedor;
		nDistancia := regFornecedor.DISTANCIA;
		Close curFornecedor;
	End If;
	Close curDistancia;
	Return Nvl( nDistancia , 0 );
      Exception
		When Others Then
			nDistancia := 999.999;
			Return nDistancia;
End;

 