CREATE OR REPLACE Function Gaf_Planejada ( pId_Oper           In Number ,
					pCod_OS  In Number,
 					pEmpresa  In Number,
					pSafra   In Number )
Return Number
Is

nExistePlan  Number(3) := 0;


Begin

  SELECT count(*)  into
	nExistePlan
  from GA_RECUR_UTIL_ATIV_OS
  where   cod_empr = pEmpresa  and
  saf_ano_safra = pSafra  and
  cod_os = pCod_OS and
  id_oper = pId_Oper	;


  Return nExistePlan;

  Exception
     When Others Then
	    nExistePlan := 0;
	    Return nExistePlan;

End Gaf_Planejada;



 