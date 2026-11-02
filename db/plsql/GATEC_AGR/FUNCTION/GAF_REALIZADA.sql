CREATE OR REPLACE Function Gaf_Realizada ( pId_Oper           In Number ,
					pCod_OS  In Number,
 					pEmpresa  In Number,
					pSafra   In Number )
Return Number
Is

nExisteReal  Number(3) := 0;


Begin

  SELECT count(*)  into
	nExisteReal
  from GA_RECUR_UTIL_ATIV  a,
	GA_RECUR_UTIL_LANC  b
  where a.id_recur_lanc = b.id_recur_lanc  and
	 b.cod_empr = pEmpresa  and
   b.saf_ano_safra = pSafra  and
  b.cod_os = pCod_OS and
  a.id_oper = pId_Oper	;


  Return nExisteReal;

  Exception
     When Others Then
	    nExisteReal := 0;
	    Return nExisteReal;

End Gaf_Realizada;

 