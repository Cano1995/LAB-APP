CREATE OR REPLACE Function Gaf_DiaBalanca( dData In Date ) Return Date Is
cursor curConfCpc Is
 Select CPC_HR_INI,
        CPC_HR_FIM,
        nvl(CPC_TEMPO_ACUM,4) TEMPOACUM
        From   GA_CONF_CPC
 Where  COD_EMPR        = 1
        And SAF_ANO_SAFRA   = 2005;
regConfCpc curConfCpc%ROWTYPE;
dRetData Date;
   Begin
 open curConfCPc;
 fetch curConfCpc into regConfCpc;
 close curConfCpc;
 If to_number( to_char( trunc( dData                 , 'HH24' ) , 'HH24' ) ) <
    to_number( to_char( trunc( regConfCpc.CPC_HR_INI , 'HH24' ) , 'HH24') ) Then
  dRetData  := dData - 1;
 Else
   dRetData  := dData;
 End If;
 Return to_date( to_char( dRetData , 'DD-MM-YY' ) , 'DD-MM-YY' );
   End;

 