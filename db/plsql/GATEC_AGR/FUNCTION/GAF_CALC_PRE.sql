CREATE OR REPLACE Function GAF_CALC_PRE(nIDD4     In Number,
                                        cTipo     In Char,
                                        dDataInic In Date,
                                        dDataFim  In Date) Return Number Is
  nRetorno  Varchar2(20);
  nFibra    Number;
  nAgio     Number;
  nPureza   Number;
  nPolCana  Number;
  nFator    Number;
  nVolume   Number;
  nPbu      Number;
  nBrix     Number;
  nLs       Number;
  nA        Number := 1;
  nB        Number := 0;
  nLScor    Number := 0;
  nClarif   Number;
  nPolCaldo Number(6, 2) := 0;
  nAtr      Number(6, 2) := 0;
  nAr       Number(6, 2) := 0;
  nArCana   Number;
  nArCaldo  Number;
  nPanNumer Number(12) := null;
  ErroSql   Varchar2(240);
  sUsina    Varchar2(50);

  Cursor curSafras Is
    Select COD_EMPR, SAF_ANO_SAFRA From GA_DIVI4 Where id_divi4 = nIDD4;
  regSafras curSafras%ROWTYPE;

  Cursor curDataPre Is
    Select --TO_DATE(Max(A.PAN_DT), 'DD/MM/YYYY') PAN_DT
           Max(TRUNC(A.PAN_DT)) PAN_DT
    --Select Max(A.PAN_DT) PAN_DT
      From GA_PRE_ANALI A, GA_MOV_PRE_ANALI B
     Where nvl(A.PAN_BRIX, 0) <> 0
       And A.ID_PRE_ANALI = B.ID_PRE_ANALI
       And
          -- B.MPA_FLAG_ORIGEM = 1 And
           B.ID_DIVI4 = nIDD4
       And a.pan_dt >= dDataInic
       And a.pan_dt <= dDataFim;
  regDataPre curDataPre%ROWTYPE;

  Cursor C1 Is
    Select --A.PAN_NUMER PAN_NUMER,
     AVG(A.PAN_BRIX) PAN_BRIX,
     AVG(A.PAN_LS) PAN_LS,
     AVG(A.PAN_PBU) PAN_PBU,
     AVG(A.PAN_AR) PAN_AR,
     AVG(A.PAN_POL_CALDO) PAN_POL_CALDO,
     --A.PAN_CLARIF,
     AVG(A.PAN_VOLUM_DILUI) PAN_VOLUM_DILUI,
     AVG(A.PAN_TITUL_FATOR) PAN_TITUL_FATOR --,
    --A.PAN_DT
      From GA_PRE_ANALI A, GA_MOV_PRE_ANALI B
     Where nvl(A.PAN_BRIX, 0) <> 0
       And A.ID_PRE_ANALI = B.ID_PRE_ANALI
       And
          -- B.MPA_FLAG_ORIGEM = 1 And
           B.ID_DIVI4 = nIDD4
       And
          --A.PAN_DT=regDataPre.PAN_DT;
          --TO_DATE(A.PAN_DT,'DD/MM/YYYY')=regDataPre.PAN_DT;
          --TO_DATE(TO_CHAR(A.PAN_DT,'DD/MM/YYYY'), 'DD/MM/YYYY')=regDataPre.PAN_DT;
          TRUNC(A.PAN_DT) = regDataPre.PAN_DT;
  R1 C1%ROWTYPE;

  Cursor antDataPre Is
    Select TO_DATE(Max(A.PAN_DT), 'DD/MM/YYYY') PAN_DT
    --Select Max(A.PAN_DT) PAN_DT
      From GA_PRE_ANALI A, GA_MOV_PRE_ANALI B
     Where nvl(A.PAN_BRIX, 0) <> 0
       And A.ID_PRE_ANALI = B.ID_PRE_ANALI
       And
          -- B.MPA_FLAG_ORIGEM = 1 And
          --A.PAN_DT < regDataPre.PAN_DT And
           TO_DATE(A.PAN_DT, 'DD/MM/YYYY') < regDataPre.PAN_DT
       And B.ID_DIVI4 = nIDD4;
  regantDataPre antDataPre%ROWTYPE;

  Cursor C1_ant Is
    Select --A.PAN_NUMER PAN_NUMER,
     AVG(A.PAN_BRIX) PAN_BRIX,
     AVG(A.PAN_LS) PAN_LS,
     AVG(A.PAN_PBU) PAN_PBU,
     AVG(A.PAN_AR) PAN_AR,
     AVG(A.PAN_POL_CALDO) PAN_POL_CALDO,
     AVG(A.PAN_VOLUM_DILUI) PAN_VOLUM_DILUI,
     AVG(A.PAN_TITUL_FATOR) PAN_TITUL_FATOR --,
    --A.PAN_DT,
    --A.PAN_CLARIF
      From GA_PRE_ANALI A, GA_MOV_PRE_ANALI B
     Where nvl(A.PAN_BRIX, 0) <> 0
       And A.ID_PRE_ANALI = B.ID_PRE_ANALI
       And
          -- B.MPA_FLAG_ORIGEM = 1 And
           B.ID_DIVI4 = nIDD4
       And
          --A.PAN_DT = regantDataPre.PAN_DT;
           TO_DATE(A.PAN_DT, 'DD/MM/YYYY') = regantDataPre.PAN_DT;
  R1_ant C1_ant%ROWTYPE;

  -- Clarificante será gravado na tabela de Pre Analise
  -- mas quando for calculo por media usar CES_CLARIF da GA_CONFI_EMPR_SAFRA
  Cursor C5 Is
    Select CES_CLARIF
      From GA_CONFI_EMPR_SAFRA
     Where COD_EMPR = regSafras.COD_EMPR
       And SAF_ANO_SAFRA = regSafras.SAF_ANO_SAFRA;
  R5 C5%ROWTYPE;

  Cursor C6 Is
    Select sum(arlib.tal_estim_pos_queim * arlib.tal_area_lib) /
           sum(arlib.tal_area_lib) As ProdEstim
      From GA_AREA_LIBER ARLIB, GA_LIBERACAO LIB
     Where arlib.id_liber = lib.id_liber
       And lib.cod_finalid = 1
       And arlib.id_divi4 = nIdD4;
  R6 C6%ROWTYPE;
BEGIN
  Open curSafras;
  Fetch curSafras
    Into regSafras;
  Close curSafras;
  Open C5;
  Fetch C5
    Into R5;
  Close C5;
  If cTipo = 'PRODESTIM' Then
    Open c6;
    Fetch c6
      Into r6;
    If C6%FOUND Then
      nRetorno := r6.ProdEstim;
    End If;
    Close C6;
  Else
    Open curDataPre;
    Fetch curDataPre
      Into regDataPre;
    Close curDataPre;
    If cTipo = 'AGI_ANT' then
      Open antDataPre;
      Fetch antDataPre
        Into regantDataPre;
      Close antDataPre;
      Open C1_ant;
      Fetch C1_ant
        into R1_ant;
      If C1_ant%FOUND Then
        -- Atribuic?o de Valores repetitiva para poder utilizar a view de Calculo PreAnali
        --nClarif     := R1_ant.PAN_CLARIF;
        nPbu  := R1_ant.PAN_PBU;
        nBrix := R1_ant.PAN_BRIX;
        If R5.CES_CLARIF = 0 then
          nLs := (R1_ant.PAN_LS * 1.00621) + 0.05117;
        else
          nLs := R1_ant.PAN_LS;
        end if;
        nPolCaldo := R1_ant.PAN_POL_CALDO;
        nAtr      := R1_ant.PAN_AR;
        nAr       := R1_ant.PAN_AR;
        nFibra    := R1_ant.PAN_PBU;
        nAgio     := R1_ant.PAN_BRIX;
        nPureza   := R1_ant.PAN_LS;
        nPolCana  := R1_ant.PAN_POL_CALDO;
        --nClarif     := R1_ant.PAN_CLARIF;
        --nPanNumer   := R1_ant.PAN_NUMER;
      End if;
      Close c1_ant;
    Else
      Open C1;
      Fetch C1
        Into R1;
      If C1%FOUND Then
        -- Atribuic?o de Valores repetitiva para poder utilizar a view de Calculo PreAnali
        --nClarif     := R1.PAN_CLARIF;
        nPbu  := R1.PAN_PBU;
        nBrix := R1.PAN_BRIX;
        If R5.CES_CLARIF = 0 then
          nLs := (R1.PAN_LS * 1.00621) + 0.05117;
        else
          nLs := R1.PAN_LS;
        end if;
        nPolCaldo := R1.PAN_POL_CALDO;
        nAtr      := R1.PAN_AR;
        nAr       := R1.PAN_AR;
        nVolume   := R1.PAN_VOLUM_DILUI;
        nFator    := R1.PAN_TITUL_FATOR;
        nFibra    := R1.PAN_PBU;
        nAgio     := R1.PAN_BRIX;
        nPureza   := R1.PAN_LS;
        nPolCana  := R1.PAN_POL_CALDO;
        --nClarif     := R1.PAN_CLARIF;
        --nPanNumer   := R1.PAN_NUMER;
      Else
        -- Calculo da Media
        -- Para as Demais Usinas (Excluindo Zillo)
        -- N?o fazer blocagem. Retornar Zero.
        Return 0;
      End If;
      Close C1;
    End if;
    If cTipo = 'BRI' Then
      Return nvl(nBrix, 0);
    ElsIf cTipo = 'LS ' Then
      Return nvl(nLs, 0);
    ElsIf cTipo = 'PBU' Then
      Return nvl(nPbu, 0);
    ElsIf cTipo = 'FIB' Then
      If nPbu > 0 Then
        -- esta formula foi alterada em 29/06/2004
        -- nFibra := ((nPBU * 0.152)-8.367);
        nFibra := ((0.08 * nPBU) + 0.8760);
      
      End If;
      Return nvl(nFibra, 0);
    ElsIf cTipo = 'POC' Then
      If nLs > 0 And nBrix > 0 Then
        nPolCaldo := (nLS * (0.2605 - (0.0009882 * nBrix)));
      End If;
      Return nvl(nPolCaldo, 0);
    ElsIf cTipo = 'POL' Then
      If nBrix > 0 And nLs > 0 And nPbu > 0 Then
        -- esta formula foi alterada em 29/06/2004
        -- nFibra := ((nPBU * 0.152)-8.367);
        nFibra := ((0.08 * nPBU) + 0.8760);
      
        nPolCaldo := (nLS * (0.2605 - (0.0009882 * nBrix)));
        --nPolCana := (nPolCaldo * (1-(0.01 * nFibra)) *
        --  (1.0794-(0.000874 * nPbu)));
        nPolCana := (nPolCaldo * (1 - (0.01 * nFibra)) *
                    (1.0313 - (0.00575 * nFibra)));
      End If;
      Return nvl(nPolCana, 0);
    ElsIf cTipo = 'PUR' Then
      If nBrix > 0 And nLs > 0 And nPbu > 0 Then
        -- esta formula foi alterada em 29/06/2004
        -- nFibra := ((nPBU * 0.152)-8.367);
        nFibra := ((0.08 * nPBU) + 0.8760);
      
        nPolCaldo := (nLS * (0.2605 - (0.0009882 * nBrix)));
        nPureza   := ((nPolCaldo / nBrix) * 100);
      End If;
      Return nvl(nPureza, 0);
    ElsIf cTipo = 'AGI' or cTipo = 'AGI_ANT' Then
      If nBrix > 0 And nLs > 0 And nPbu > 0 Then
        -- esta formula foi alterada em 29/06/2004
        -- nFibra := ((nPBU * 0.152)-8.367);
        nFibra    := ((0.08 * nPBU) + 0.8760);
        nPolCaldo := (nLS * (0.2605 - (0.0009882 * nBrix)));
        -- nPolCana := (nPolCaldo * (1-(0.01 * nFibra)) *
        --   (1.0794-(0.000874 * nPbu)));
        nPolCana := (nPolCaldo * (1 - (0.01 * nFibra)) *
                    (1.0313 - (0.00575 * nFibra)));
        nPureza  := ((nPolCaldo / nBrix) * 100);
        nAgio    := (((((nPolCana / 12.257) * 1.9330) *
                    (1 - (40 / (nPureza - 1)))) - 1) * 100);
      End If;
      Return nvl(nAgio, 0);
    ElsIf cTipo = 'AR ' Then
      If nBrix > 0 And nLs > 0 And nPbu > 0 Then
        -- esta formula foi alterada em 29/06/2004
        -- nFibra := ((nPBU * 0.152)-8.367);
        nFibra    := ((0.08 * nPBU) + 0.8760);
        nPolCaldo := (nLS * (0.2605 - (0.0009882 * nBrix)));
        nPureza   := ((nPolCaldo / nBrix) * 100);
        --nArCaldo := (9.9408-0.1049 * nPureza);
        nArCaldo := (3.6410 - 0.0343 * nPureza);
      End If;
      Return nvl(nArCaldo, 0);
    ElsIf cTipo = 'ARC' Then
      If nBrix > 0 And nLs > 0 And nPbu > 0 Then
        -- esta formula foi alterada em 29/06/2004
        -- nFibra := ((nPBU * 0.152)-8.367);
        nFibra    := ((0.08 * nPBU) + 0.8760);
        nPolCaldo := (nLS * (0.2605 - (0.0009882 * nBrix)));
        nPureza   := ((nPolCaldo / nBrix) * 100);
        --nArCaldo := (9.9408-0.1049 * nPureza);
        nArCaldo := (3.6410 - 0.0343 * nPureza);
        nArCana  := (nArCaldo * (1 - 0.01 * nFibra) *
                    (1.0313 - 0.00575 * nFibra));
      End If;
      Return nvl(nArCana, 0);
    ElsIf cTipo = 'ATR' Then
      If nBrix > 0 And nLs > 0 And nPbu > 0 Then
        -- esta formula foi alterada em 29/06/2004
        -- nFibra := ((nPBU * 0.152)-8.367);
        nFibra    := ((0.08 * nPBU) + 0.8760);
        nPolCaldo := (nLS * (0.2605 - (0.0009882 * nBrix)));
        --nPolCana := (nPolCaldo * (1-(0.01 * nFibra)) *
        --  (1.0794-(0.000874 * nPbu)));
        nPolCana := (nPolCaldo * (1 - (0.01 * nFibra)) *
                    (1.0313 - (0.00575 * nFibra)));
      
        nPureza := ((nPolCaldo / nBrix) * 100);
        -- esta formula foi alterada em 29/06/2004
        -- nArCaldo := (9.9408-0.1049 * nPureza);
        nArCaldo := (3.6410 - 0.0343 * nPureza);
        nArCana  := (nArCaldo * (1 - 0.01 * nFibra) *
                    (1.0313 - 0.00575 * nFibra));
        nAtr     := (9.5263 * nPolCana + 9.05 * nArCana);
      
      End If;
      Return nvl(nATR, 0);
    ElsIf cTipo = 'FAT' Then
      Return nvl(nFator, 0);
    ElsIf cTipo = 'NUM' Then
      Return nvl(nPanNumer, 0);
    Else
      Return - 1;
    End If;
  End If;
End GAF_CALC_PRE;

 