CREATE OR REPLACE Procedure Gap_DeletaEtiqueta( nCOD_EMPR      In     Number,
						nSAF_ANO_SAFRA In     Number,
						nETQ_NUMER     In     Number,
						nPreAnali      In     Number,
					        nRetorno       In Out Number )
Is
Cursor curEtiqueta Is
   Select COD_EMPR,
	  SAF_ANO_SAFRA,
	  PAN_NUMER
       From GA_ETQ_PREANA
	  Where COD_EMPR      = nCOD_EMPR
	    And SAF_ANO_SAFRA = nSAF_ANO_SAFRA
	    And ETQ_EMISSAO   = 1;
regEtiqueta curEtiqueta%ROWTYPE;
ErroSql Varchar2(2000);
Begin
  nRetorno := 0;
  -- Delecao Geral
  If nETQ_NUMER = 0 Then
     If nPreAnali = 0 Then
       Delete from GA_ETQ_PREANA
        Where COD_EMPR = nCOD_EMPR
	  And SAF_ANO_SAFRA = nSAF_ANO_SAFRA
	  And ETQ_EMISSAO = 1;
     Else
       Open curEtiqueta;
       Loop
       Fetch curEtiqueta Into regEtiqueta;
       Exit When curEtiqueta%NOTFOUND;
	  Delete From GA_PRE_ANALI
	   Where COD_EMPR = regEtiqueta.COD_EMPR
	     And SAF_ANO_SAFRA = regEtiqueta.SAF_ANO_SAFRA
 	     And PAN_NUMER = regEtiqueta.PAN_NUMER;
	  Delete From GA_ETQ_PREANA
           Where COD_EMPR = regEtiqueta.COD_EMPR
	     And SAF_ANO_SAFRA = regEtiqueta.SAF_ANO_SAFRA
 	     And PAN_NUMER = regEtiqueta.PAN_NUMER;
       End Loop;
     End If;
  Else
    If nPreAnali = 0 Then
       Delete from GA_ETQ_PREANA
        Where COD_EMPR = nCOD_EMPR
          And SAF_ANO_SAFRA = nSAF_ANO_SAFRA
          And PAN_NUMER = nETQ_NUMER;
    Else
       Delete From GA_PRE_ANALI
	Where COD_EMPR = nCOD_EMPR
	  And SAF_ANO_SAFRA = nSAF_ANO_SAFRA
 	  And PAN_NUMER = nETQ_NUMER;
       Delete From GA_ETQ_PREANA
        Where COD_EMPR = nCOD_EMPR
	  And SAF_ANO_SAFRA = nSAF_ANO_SAFRA
 	  And PAN_NUMER = nETQ_NUMER;
    End If;
  End If;
  Commit;
  Exception
	When Others Then
		nRetorno := 1;
		RollBack;
		ErroSql := substr( SQLERRM , 1, 240 );
		Insert Into Log_erro Values
		( 'Falha na Procedure Gap_DeletaEtiqueta ' || USER || ' ' ||
	 	  TO_CHAR( SYSDATE , 'DD-MM-YY-HH24:MI:SS' ) ||
		  ErroSql  );
		Commit;
End;

 