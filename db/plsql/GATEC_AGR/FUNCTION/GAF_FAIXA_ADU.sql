CREATE OR REPLACE Function GAF_FAIXA_ADU(nId_Divi4     In Number,
                                         sCodNutriente In VarChar,
                                         sIndiceValor  In VarChar)
  Return VarChar2 Is
  Cursor cFaixa Is
    Select si.abv_indice, sn.ind_cor, sn.ind_inic, sn.ind_fim
      From GA_SOL_NUTRI_INDIC SN, GA_SOL_INDICES SI
     Where sn.id_solos_indice = si.ind_codigo
       And sn.cod_nutriente = sCodNutriente;

  rFaixa cFaixa%RowType;

  Cursor cValor Is
    Select Avg(sn.sol_valor) As Media
      From GA_SOL_LANCA SL, ga_sol_lanca_divi4 d4, GA_SOL_LANCA_NUTRI SN
     Where sl.cod_amostra = sn.cod_amostra
       And sl.id_confi_telas = sn.id_confi_telas
       And sl.cod_amostra = d4.cod_amostra
       and sn.cod_nutriente = sCodNutriente
       And d4.id_divi4 = nId_Divi4;

  rValor cValor%RowType;

  sRetorno VarChar2(30);

  nFaixaI Number;
  nFaixaF Number;
  nValor  Number;

Begin
  sRetorno := '';

  If sCodNutriente <> ' ' Then
    Open cValor;
    Fetch cValor
      Into rValor;
    If cValor%FOUND Then
      nValor := rValor.Media;
    
      If Upper(LTrim(RTrim(sIndiceValor))) = 'VALOR' Then
        sRetorno := to_char(nValor, '999,999,990.00');
      ElsIf Upper(LTrim(RTrim(sIndiceValor))) = 'INDICE' Then
        Open cFaixa;
        Loop
          Fetch cFaixa
            Into rFaixa;
          Exit When cFaixa%NOTFOUND;
        
          nFaixaI := rFaixa.ind_inic;
          nFaixaF := rFaixa.ind_fim;
        
          If nFaixaI <= nValor Then
            If nValor <= nFaixaF Then
              sRetorno := rFaixa.abv_indice;
              Exit;
            End If;
          End If;
        End Loop;
      Else
        sRetorno := '';
      End If;
    End If;
  End If;

  If ' ' || rTrim(lTrim(sRetorno)) = ' ' Then
    If Upper(LTrim(RTrim(sIndiceValor))) = 'VALOR' Then
      sRetorno := '';
    ElsIf Upper(LTrim(RTrim(sIndiceValor))) = 'INDICE' Then
      sRetorno := 'Nenhuma Faixa';
    Else
      sRetorno := '';
    End If;
  End If;

  Return sRetorno;
End GAF_FAIXA_ADU;

 