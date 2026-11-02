CREATE OR REPLACE Function Gaf_Dt_Enc_Op_OS ( pId_Oper           In Number ,
                                        pCod_OS  In Number,
                                        pEmpresa  In Number,
                                        pSafra   In Number )
Return DATE
Is
nExiste  Number(3) := 0;
sStatus Char(1) ;
dDT_ENCERRAMENTO Date;
Begin
  SELECT DT_ENCERRAMENTO  into
        dDT_ENCERRAMENTO
  from ga_encerramento_op
  where   cod_empr = pEmpresa  and
  saf_ano_safra = pSafra  and
  cod_os = pCod_OS and
  id_oper = pId_Oper    ;
  Return dDT_ENCERRAMENTO;
  Exception
     When Others Then
            dDT_ENCERRAMENTO:= NULL;
            Return dDT_ENCERRAMENTO;
End Gaf_Dt_Enc_Op_OS;



 