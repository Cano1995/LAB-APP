CREATE OR REPLACE procedure GAP_ATUALIZA_ACUM(sOrigem           in varchar2,
                                              sZafra            in varchar2,
                                              nCompr            in number,
                                              nNroAco           in number,
                                              nNewBrix          in number,
                                              nNewLs            in number,
                                              nNewPbu           in number,
                                              nNewCodMotCan     in number,
                                              nOldBrix          in number,
                                              nOldLs            in number,
                                              nOldPbu           in number,
                                              nOldCodMotCan     in number,
                                              nNewPeso          in number,
                                              nOldPeso          in number,
                                              pCod_Empresa_new  in varchar2,
                                              pCod_Persona_new  in varchar2,
                                              pNro_Finca_new    in varchar2,
                                              pParcela_new      in varchar2,
                                              pTipo_Corte_new   in varchar2,
                                              pFecha_Bas_new    in date,
                                              pCod_Tip_Liq_new  in varchar2,
                                              pCod_Empresa_old  in varchar2,
                                              pCod_Persona_old  in varchar2,
                                              pNro_Finca_old    in varchar2,
                                              pParcela_old      in varchar2,
                                              pTipo_Corte_old   in varchar2,
                                              pFecha_Bas_old    in date,
                                              pCod_Tip_Liq_old  in varchar2,
                                              nCodAcumulado_new in number,
                                              nCodAcumulado_old in number,
                                              nCodAcumulado     in out number) is

  sCod_Persona   VarChar2(15);
  sNro_Finca     VarChar2(15);
  sParcela       VarChar2(15);
  sTipo_Corte    VarChar2(5);
  sCod_Empresa   VarChar2(5);
  sCod_Tip_Liq   VarChar2(5);
  dFecha         Date;
  dFecha_Bas     Date;
  nBrix_Acum     Number;
  nLs_Acum       Number;
  nPbu_Acum      Number;
  nPesoTot_Acum  Number;
  nPesoAna_Acum  Number;
  nPesoTot_New   Number;
  nPesoTot_Old   Number;
  nPesoAna_New   Number;
  nPesoAna_Old   Number;
  nBrix_New      Number;
  nBrix_Old      Number;
  nLs_New        Number;
  nLs_Old        Number;
  nPbu_New       Number;
  nPbu_Old       Number;
  nCodMotCan_New Number;
  nCodMotCan_Old Number;
  nRet           Number;
  nBrixNew_Peso  Number;
  nBrixOld_Peso  Number;
  nBrixAcum_Peso Number;
  nLsNew_Peso    Number;
  nLsOld_Peso    Number;
  nLsAcum_Peso   Number;
  nPbuNew_Peso   Number;
  nPbuOld_Peso   Number;
  nPbuAcum_Peso  Number;
  ncont          number;
  nMaxAco        number;
  nTotPesoAco    number;
  nPesoAco       number;
  nUltPeso       number;
  ncodNew        number;

begin

  -- setar as variaveis iniciais com os valores retornados dos parametros
  nPesoTot_New := nvl(nNewPeso, 0);
  nPesoTot_Old := nvl(nOldPeso, 0);
  if sorigem <> 'BA1' then
    nPesoAna_New := nvl(nNewPeso, 0);
    nPesoAna_Old := nvl(nOldPeso, 0);
  end if;
  nBrix_New      := nvl(nNewBrix, 0);
  nBrix_Old      := nvl(nOldBrix, 0);
  nLs_New        := nvl(nNewLs, 0);
  nLs_Old        := nvl(nOldLs, 0);
  nPbu_New       := nvl(nNewPbu, 0);
  nPbu_Old       := nvl(nOldPbu, 0);
  nCodMotCan_New := nvl(nNewCodMotCan, 0);
  nCodMotCan_Old := nvl(nOldCodMotCan, 0);
  nPesoTot_Acum  := 0;
  nPesoAna_Acum  := 0;
  ncodNew        := 0;

  begin
  
    dFecha := trunc(pFecha_Bas_old);
    if to_number(to_char(pFecha_Bas_old, 'hh24')) < 4 then
      dFecha := trunc(pFecha_Bas_old - 1);
    end if;
  
    if nvl(nBrix_New, 0) = 0 or nvl(nLs_New, 0) = 0 or nvl(nPbu_New, 0) = 0 or
       nvl(nCodMotCan_New, 0) <> 0 then
      nBrix_New    := 0;
      nLs_New      := 0;
      nPbu_New     := 0;
      nPesoAna_New := 0;
    end if;
  
    if nvl(nBrix_Old, 0) = 0 or nvl(nLs_Old, 0) = 0 or nvl(nPbu_Old, 0) = 0 or
       nvl(nCodMotCan_Old, 0) <> 0 then
      nBrix_Old    := 0;
      nLs_Old      := 0;
      nPbu_Old     := 0;
      nPesoAna_Old := 0;
    end if;
    select ba.brix, ba.ls, ba.pbu, ba.peso_acumulado, ba.peso_analizado
      into nBrix_Acum, nLs_Acum, nPbu_Acum, nPesoTot_Acum, nPesoAna_Acum
      from ba_bascula_analisis ba
     where cod_acumulado = nCodAcumulado_old;

    --Cuando el origen del dato es laboratorio pondera los analisis por Peso Analizado
    --O sea peso acoplado
    --MUS 30-05-2012!!!
    
    
    if sOrigem = 'LA' then
      -- so trabalha com o analisado    
      -- Calculando as multiplicações da ponderação
    
      nBrixAcum_Peso := nBrix_Acum * nPesoAna_Acum;
      nBrixNew_Peso  := nBrix_New * nPesoAna_New;
      nBrixOld_Peso  := nBrix_Old * nPesoAna_Old;
    
      nLsAcum_Peso := nLs_Acum * nPesoAna_Acum;
      nLsNew_Peso  := nLs_New * nPesoAna_New;
      nLsOld_Peso  := nLs_Old * nPesoAna_Old;
    
      nPbuAcum_Peso := nPbu_Acum * nPesoAna_Acum;
      nPbuNew_Peso  := nPbu_New * nPesoAna_New;
      nPbuOld_Peso  := nPbu_Old * nPesoAna_Old;
    
      nBrixAcum_Peso := nBrixAcum_Peso - nBrixOld_Peso + nBrixNew_Peso;
      nLsAcum_Peso   := nLsAcum_Peso - nLsOld_Peso + nLsNew_Peso;
      nPbuAcum_Peso  := nPbuAcum_Peso - nPbuOld_Peso + nPbuNew_Peso;
    
      nPesoAna_Acum := nPesoAna_Acum - nPesoAna_Old + nPesoAna_New;
    
      if nPesoAna_Acum = 0 then
        nBrix_acum := 0;
        nLs_acum   := 0;
        nPbu_acum  := 0;
      else
        nBrix_Acum := nBrixAcum_Peso / nPesoAna_Acum;
        nLs_Acum   := nLsAcum_Peso / nPesoAna_Acum;
        nPbu_Acum  := nPbuAcum_Peso / nPesoAna_Acum;
      end if;
    elsif sOrigem = 'BA1' then
      --  'BA'  s'o trabalha com o peso acumulado 
      -- Fazer o calculo usando o old
      nPesoTot_Acum := nPesoTot_Acum - nPesoTot_Old;
    
    else
      -- so trabalha com o analisado    
      -- Calculando as multiplicações da ponderação
      nBrixAcum_Peso := nBrix_Acum * nPesoAna_Acum;
      nBrixOld_Peso  := nBrix_Old * nPesoAna_Old;
    
      nLsAcum_Peso := nLs_Acum * nPesoAna_Acum;
      nLsOld_Peso  := nLs_Old * nPesoAna_Old;
    
      nPbuAcum_Peso := nPbu_Acum * nPesoAna_Acum;
      nPbuOld_Peso  := nPbu_Old * nPesoAna_Old;
    
      nPesoAna_Acum := nPesoAna_Acum - nPesoAna_Old;
    
      nBrixAcum_Peso := nBrixAcum_Peso - nBrixOld_Peso;
      nLsAcum_Peso   := nLsAcum_Peso - nLsOld_Peso;
      nPbuAcum_Peso  := nPbuAcum_Peso - nPbuOld_Peso;
    
      if nPesoAna_Acum = 0 then
        nBrix_acum := 0;
        nLs_acum   := 0;
        nPbu_acum  := 0;
      else
        nBrix_Acum := nBrixAcum_Peso / nPesoAna_Acum;
        nLs_Acum   := nLsAcum_Peso / nPesoAna_Acum;
        nPbu_Acum  := nPbuAcum_Peso / nPesoAna_Acum;
      end if;
    
    end if;
  
    -- Colocar no acumulado
    -- no caso do laboratorio faz a troca (pq o registro com certeza vai existir)
    -- no caso da balanca fará o update do old agora
  
    if nPesoTot_Acum = 0 then
      nCodAcumulado := 0;
      delete ba_bascula_analisis ba
       where cod_acumulado = ncodacumulado_old;
    
    else
      if sorigem = 'LA' then
        update ba_bascula_analisis ba
           set peso_analizado = nPesoAna_Acum,
               brix           = round(nBrix_Acum, 7),
               ls             = round(nLs_Acum, 7),
               pbu            = round(nPbu_Acum, 7)
         where cod_acumulado = ncodacumulado_old;
      elsif sorigem = 'BA1' then
        update ba_bascula_analisis ba
           set ba.peso_acumulado = nPesoTot_Acum
         where cod_acumulado = ncodacumulado_old;
      else
        update ba_bascula_analisis ba
           set peso_analizado = nPesoAna_Acum,
               brix           = round(nBrix_Acum, 7),
               ls             = round(nLs_Acum, 7),
               pbu            = round(nPbu_Acum, 7)
         where cod_acumulado = ncodacumulado_old;
      end if;
    end if;
  exception
    when others then
      -- nao tem o OLD (se for pela balanca -  BA )
      -- se for no caso de LA (nao tem o acumulado )
      nRet := 0; -- só para nao dar o erro
  end;
    --Cuando el origen del dato no es laboratorio pondera los analisis por Peso Acumumulado (Bruto - Tara)
    --MUS 30-05-2012!!!
    
  begin
    if sorigem <> 'LA' then
    
      if sorigem = 'BA1' then
        if pFecha_Bas_new is null then
          select ba.brix,
                 ba.ls,
                 ba.pbu,
                 ba.peso_acumulado,
                 ba.peso_analizado,
                 cod_acumulado
            into nBrix_Acum,
                 nLs_Acum,
                 nPbu_Acum,
                 nPesoTot_Acum,
                 nPesoAna_Acum,
                 nCodAcumulado  
            from ba_bascula_analisis ba
           where ba.cod_empresa = pCod_Empresa_new
             and ba.cod_per_cañero = pCod_Persona_new
             and ba.nro_finca = pNro_Finca_new
             and ba.parcela = pParcela_new 
             and ba.cod_tipo_corte = pTipo_Corte_new
             and zafra = szafra
             and ba.fecha is null
             and cod_tipo_liq = pCod_Tip_Liq_new;
        else
          dFecha := trunc(pFecha_Bas_new);       
          if to_number(to_char(pFecha_Bas_new, 'hh24')) < 4 then
            dFecha := trunc(pFecha_Bas_new - 1);
          end if;
          select ba.brix,
                 ba.ls,
                 ba.pbu,
                 ba.peso_acumulado,
                 ba.peso_analizado,
                 cod_acumulado
            into nBrix_Acum,
                 nLs_Acum,
                 nPbu_Acum,
                 nPesoTot_Acum,
                 nPesoAna_Acum,
                 nCodAcumulado
            from ba_bascula_analisis ba
           where ba.cod_empresa = pCod_Empresa_new
             and ba.cod_per_cañero = pCod_Persona_new
             and ba.nro_finca = pNro_Finca_new
             and ba.parcela = pParcela_new
             and ba.cod_tipo_corte = pTipo_Corte_new
             and zafra = szafra
             and ba.fecha = dFecha
             and cod_tipo_liq = pCod_Tip_Liq_new;
        end if;
        nCodnew := nCodAcumulado;
      else
        -- 
        -- verifica se já tem o código de acumulado
        -- se nao tem vai receber o que já foi gerado  
        --
        if nvl(nCodAcumulado_new, 0) = 0 or
           nCodAcumulado <> nvl(nCodAcumulado_new, 0) then
          nCodNew := nCodAcumulado;
        else
          nCodNew := nCodAcumulado_new;
        end if;
        select ba.brix, ba.ls, ba.pbu, ba.peso_acumulado, ba.peso_analizado
          into nBrix_Acum,
               nLs_Acum,
               nPbu_Acum,
               nPesoTot_Acum,
               nPesoAna_Acum
          from ba_bascula_analisis ba
         where cod_acumulado = nCodNew;
      end if;
    
      if sOrigem = 'BA1' then
        nPesoTot_Acum := nPesoTot_Acum + nPesoTot_new;
      else
      
        -- Calculando as multiplicações da ponderação
        nBrixAcum_Peso := nBrix_Acum * nPesoAna_Acum;
        nBrixNew_Peso  := nBrix_New * nPesoAna_New;
      
        nLsAcum_Peso := nLs_Acum * nPesoAna_Acum;
        nLsNew_Peso  := nLs_New * nPesoAna_New;
      
        nPbuAcum_Peso := nPbu_Acum * nPesoAna_Acum;
        nPbuNew_Peso  := nPbu_New * nPesoAna_New;
      
        -- Fazer o calculo usando o old
        nPesoAna_Acum := nPesoAna_Acum + nPesoAna_New;
      
        nBrixAcum_Peso := nBrixAcum_Peso + nBrixNew_Peso;
        nLsAcum_Peso   := nLsAcum_Peso + nLsNew_Peso;
        nPbuAcum_Peso  := nPbuAcum_Peso + nPbuNew_Peso;
      
        if nPesoAna_Acum = 0 then
          nBrix_acum := 0;
          nLs_acum   := 0;
          nPbu_acum  := 0;
        else
          nBrix_Acum := nBrixAcum_Peso / nPesoAna_Acum;
          nLs_Acum   := nLsAcum_Peso / nPesoAna_Acum;
          nPbu_Acum  := nPbuAcum_Peso / nPesoAna_Acum;
        end if;
      
      end if;
      -- Colocar no acumulado
      -- no caso do laboratorio faz a troca (pq o registro com certeza vai existir)
      -- no caso da balanca fará o update do old agora
      if sorigem = 'BA1' then
        update ba_bascula_analisis ba
           set peso_acumulado = nPesoTot_Acum
         where cod_acumulado = nCodNew;
      else
        update ba_bascula_analisis ba
           set peso_analizado = nPesoAna_Acum,
               brix           = round(nBrix_Acum, 7),
               ls             = round(nLs_Acum, 7),
               pbu            = round(nPbu_Acum, 7)
         where cod_acumulado = nCodNew;
      end if;
    end if;
  
  exception
    when others then
      begin
        if nvl(nPesoTot_New, 0) > 0 and nvl(pCod_Persona_new, ' ') <> ' ' then
          select gasq_acumulado.nextval into nCodAcumulado from dual;
        
          insert into ba_bascula_analisis
            (id_divi4,
             cod_acumulado,
             cod_empresa,
             zafra,
             cod_per_cañero,
             nro_finca,
             parcela,
             cod_tipo_corte,
             fecha,
             cod_tipo_liq,
             peso_acumulado,
             peso_analizado,
             brix,
             ls,
             pbu)
          values
            (TRIM(szafra) || TRIM(pCod_Persona_new) || TRIM(pNro_Finca_new) || TRIM(pParcela_new),
             ncodAcumulado,
             pCod_Empresa_new,
             szafra,
             pCod_Persona_new,
             pNro_Finca_new,
             pParcela_new,
             pTipo_Corte_new,
             dFecha,
             pCod_Tip_Liq_new,
             nPesoTot_New,
             nvl(nPesoAna_New, 0),
             nvl(nBrix_New, 0),
             nvl(nLs_New, 0),
             nvl(nPbu_New, 0));
        end if;
      exception
        when others then
          nRet := 0;
      end;
  end;  

end GAP_ATUALIZA_ACUM;

 