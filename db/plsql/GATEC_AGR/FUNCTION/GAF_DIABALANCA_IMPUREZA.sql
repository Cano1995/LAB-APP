CREATE OR REPLACE Function Gaf_DiaBalanca_Impureza(dData In Date, pSafra In Number, pEmpresa In Number) Return Date Is
  cursor curConfCpc Is
    Select CPC_HR_INI, CPC_HR_FIM, nvl(CPC_TEMPO_ACUM, 4) TEMPOACUM
      From GA_CONF_CPC
     Where SAF_ANO_SAFRA = pSafra And
           COD_EMPR = pEmpresa;
  regConfCpc curConfCpc%ROWTYPE;
  dRetData   Date;
Begin
  open curConfCPc;
  fetch curConfCpc
    into regConfCpc;
  close curConfCpc;
  If to_number(to_char(trunc(dData, 'HH24'), 'HH24')) <
     to_number(to_char(trunc(regConfCpc.CPC_HR_INI, 'HH24'), 'HH24')) Then
    dRetData := dData - 1;
  Else
    dRetData := dData;
  End If;
  Return to_date(to_char(dRetData, 'DD-MM-YY'), 'DD-MM-YY');
End;

 