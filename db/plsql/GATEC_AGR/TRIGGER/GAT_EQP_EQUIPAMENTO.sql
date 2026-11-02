CREATE OR REPLACE TRIGGER "GATEC_AGR".GAT_EQP_EQUIPAMENTO
  After Insert or Delete or Update on ga_cpmis_compl_mis
  For Each Row



Declare

  nCodEmpr Number(2);
  sErroSql varchar2(240);
  nId      number(6);
  nSeq     number(6);
  sDesc    varchar2(40);
  sCGC     varchar2(18);
  sCPF     varchar2(11);
  sTipo    char(1);

Begin

  -- Esta Trigger está no agr p/ os casos de usinas não possuem
  -- nenhum módulo de mecanização
  -- Atualiza o cadastro de prestadores de serviço a partir de cadastros básicos

  if Updating or Inserting then
    
    begin  
     
      select cod_empr
        into nCodEmpr
        from gi_meq_mis
       where cod_mis = :new.cod_mis;
   
      select id_fre_ps
        into nId
        from ga_fre_prest_servico
       where fps_codigo = to_char(:NEW.COD_PROP_EQUIP) and
             cod_empr = nCodEmpr;
    exception
 
      when NO_DATA_FOUND then
        nId := 0;
          
    end;
  
    -- Incluir o proprietário no fretista
    -- buscar o código do id na sequência
    if nID = 0 then
    
      select GA_SEQ_ID_PS.nextval into nSeq from dual;
      nId := nSeq;
    
      -- buscar o nome / cpf / cgc no cadastro do prestador 
      select dsc_prop_equip,
             prop_equip_tipo,
             prop_equip_cgc,
             prop_equip_cpf
        into sDesc, sTipo, sCGC, sCPF
        from ga_tabgr_prop_equip
       where cod_prop_equip = :NEW.COD_PROP_EQUIP;
    
      insert into ga_fre_prest_servico
        (cod_empr,
         saf_ano_safra,
         id_fre_ps,
         fps_codigo,
         fps_nome,
         fps_abv)
      values
        (nCodEmpr,
         to_number(to_char(sysdate, 'yyyy')),
         nSeq,
         trim(to_char(:NEW.COD_PROP_EQUIP)),
         sDesc,
         substr(sDesc, 1, 20)
         );
    end if;
  
    update ga_fre_ps_eqp
       set id_fre_ps = nId
     where trim(cod_mis) = trim(:NEW.cod_mis);
  
    -- não encontrou o codmis para este prestador então cadastra 
    if SQL%NOTFOUND then
      insert into ga_fre_ps_eqp
        (cod_mis, id_fre_ps, fre_data_inicial, fre_data_final)
      values
        (:NEW.cod_mis,
         nId,
         to_date('01/01/' || to_number(to_char(sysdate, 'yyyy')),
                 'dd/mm/yyyy'),
         to_date('31/12' ||
                 to_char(to_number(to_char(sysdate, 'yyyy'))),
                 'dd/mm/yyyy'));
    end if;
  end if;
  -- Fim de Alteração

exception
  when Others Then
    sErroSql := Substr(SqlErrm, 1, 240);
    Insert Into Log_Erro
    Values
      (:NEW.cod_mis || to_char(SYSDATE, 'DD-MM-YYYY HH24:MI:SS ') ||
      ' Erro Trigger GAT_EQP_EQUIPAMENTO ' ||
       sErroSql);
  
End;



