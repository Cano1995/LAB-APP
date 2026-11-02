CREATE OR REPLACE Function Gaf_Sequencia( sTabela  in varchar2,
				sColuna  in varchar2,
				nTipoCol in number )
Return Number Is
nLinhas      Number;
nRetorno     Number;
curSequencia Number;
sSelect      varchar2(100);
Begin
	sSelect := 'Select Max(' || sColuna || ') From sTabela ';
	curSequencia := DBMS_SQL.OPEN_CURSOR;
	DBMS_SQL.PARSE( curSequencia, sSelect, DBMS_SQL.V7 );
	DBMS_SQL.DEFINE_COLUMN( 1 , 1, nTipoCol );
	nLinhas := DBMS_SQL.EXECUTE( curSequencia );
	DBMS_SQL.COLUMN_VALUE( curSequencia, 1, nRetorno );
	DBMS_SQL.CLOSE_CURSOR( curSequencia );
	Return nRetorno;
End;

 