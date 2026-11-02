CREATE OR REPLACE Function Gaf_Status_OS (
                   pCod_OS In Number,
                   pEmpresa In Number,
                   pSafra In Number ) Return VarChar Is

nExiste           Number(3) := 0;
nOperacoes        Number(3) := 0;
nAbertas          Number(3) := 0;
nLocais           Number(3) := 0;
dLanc_Dt_Encerr   Date;
sStatus    Char(1) ;
Begin

----Verifica se existe local para esta OS
  Select Count(*)
  Into nLocais
  From GA_RECUR_UTIL_LOC_OS
  Where cod_empr = pEmpresa
    and saf_ano_safra = pSafra
    and cod_os = pCod_OS ;

  Select LANC_DT_ENCERR
  Into dLanc_Dt_Encerr
  From GA_RECUR_UTIL_OS
  Where cod_empr = pEmpresa
    and saf_ano_safra = pSafra
    and cod_os = pCod_OS ;


  Select Count(*)
  Into  nOperacoes
  From  GA_RECUR_UTIL_ATIV_OS A
  Where a.cod_empr = pEmpresa
    and a.saf_ano_safra = pSafra
    and a.cod_os = pCod_OS ;

  SELECT Count(*)
  Into  nAbertas
  From  GA_RECUR_UTIL_ATIV_OS A
  Where a.cod_empr = pEmpresa
    and a.saf_ano_safra = pSafra
    and a.cod_os = pCod_OS
    and not exists (Select b.id_oper
            From GA_ENCERRAMENTO_OP B
            Where a.id_oper = b.id_oper And
                  a.cod_empr = b.cod_empr And
                  a.saf_ano_safra = b.saf_ano_safra And
                  a.cod_os= b.cod_os);
  If nOperacoes = 0 then
      sStatus := 'N';
  ElsIf nAbertas = 0  And nOperacoes > 0 then
      sStatus := 'E';
  Else
      If nAbertas = nOperacoes  then
         sStatus := 'A';
      Else
         sStatus := 'P';
      End If;
  End If;

----Se nao existir local para OS, verifica a data de encerramento
----para retornar se a OS esta aberta ou encerrada
  If nLocais = 0 then
     If dLanc_Dt_Encerr is null then
        sStatus := 'A';
     Else
        sStatus := 'E';
     End If;
  End If;

  Return sStatus;

Exception
     When Others Then
     sStatus:= '';
     Return sStatus;

End Gaf_Status_OS;





 