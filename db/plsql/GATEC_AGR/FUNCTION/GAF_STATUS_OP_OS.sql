CREATE OR REPLACE Function Gaf_Status_Op_OS ( pId_Oper           In Number ,
					pCod_OS  In Number,
 					pEmpresa  In Number,
					pSafra   In Number )
Return VarChar
Is

nExiste  Number(3) := 0;
sStatus Char(1) ;

Begin

  SELECT count(*)  into
	nExiste
  from ga_encerramento_op
  where   cod_empr = pEmpresa  and
  saf_ano_safra = pSafra  and
  cod_os = pCod_OS and
  id_oper = pId_Oper	;


If nExiste = 0 then
	sStatus := 'A'	;
Else
	sStatus := 'E';
End If;

  Return sStatus;

  Exception
     When Others Then
	    sStatus:= '';
	    Return sStatus;

End Gaf_Status_Op_OS;



 