CREATE OR REPLACE TRIGGER GATEC_AGR.GAT_BA_MOVIMIENTO_BASCULA
  before insert or update of
      cod_empresa, 
      cod_sucursal, 
      cod_bascula, 
      nro_comprobante, 
      cod_porteria, 
      nro_comprobante_port, 
      fec_entrada, 
      fec_salida, 
      movimiento, 
      cod_usuario_entrada, 
      cod_usuario_salida, 
      nro_comprobante_lab, 
      nro_remision_origen, 
      remision_bruto, 
      remision_tara, 
      cod_contrato, 
      hora_entrada, 
      hora_salida, 
      peso_entrada, 
      peso_salida, 
      peso_bruto, 
      peso_tara, 
      cod_articulo, 
      cod_cliente, 
      cod_tip_movimiento, 
      cod_contrato_exp, 
      cod_bascula_salida, 
      cod_destino, 
      cod_productor, 
      cod_chofer, 
      nombre_chofer, 
      nro_chapa, 
      cantidad_bolsa, 
      nro_planilla_acopio, 
      cod_analista, 
      anulado, 
      cod_contratista_1, 
      cod_contratista_2, 
      cod_fletero, 
      prec_cosecha, 
      prec_carga, 
      prec_flete, 
      cod_caja, 
      tip_mov, 
      cod_origen, 
      aplicado, 
      ind_peso, 
      cod_persona, 
      porc_desc_varios, 
      cod_caja_porteria, 
      cantidad_porteria, 
      cod_per_fletero, 
      nro_finca, 
      zafra, 
      fec_hor_salida, 
      tipo_entrada, 
      peso_bruto_bck, 
      peso_cadena, 
      trazabilidad, 
      cod_tipo_corte, 
      cod_tipo_caña, 
      parcela, 
      cod_variedad, 
      porc_desc_trash, 
      kilos_descuento, 
      numero, 
      cod_tipo_liq, 
      zafra_bascula, 
      transferencias, 
      cod_acumulado, 
      kilos_descuento_trash, 
      tiempo_corte, 
      tip_remision_origen, 
      ser_remision_origen, 
      porc_desc_impureza, 
      kilos_desc_impureza, 
      porc_desc_cogollo, 
      kilos_desc_cogollo, 
      tip_remision_destino, 
      ser_remision_destino, 
      nro_remision_destino, 
      fec_sal_chacra, 
      nro_orden_cosecha, 
      autorizado_mod, 
      usr_autorizo_mod, 
      nro_upd
  
   or delete on "INV"."BA_MOVIMIENTOS_BASCULA"
  for each row
declare
  -- local variables here
  nPesoLiqNew number;
  nPesoLiqOld number;

  szafra varchar(5);
  ncomp  varchar(20);

  nmaxaco       number;
  ntotpesoaco   number;
  npesoaco      number;
  nultpeso      number;
  nCont         number;
  nC            number;
  nCodAcumulado number;
  nPesoCadena   number;
  sDesc         varchar2(50);
  sError        varchar2(100);
  sCana         varchar2(1);
  sEmpresa      varchar2(10);
  sArticulo     varchar2(10);

  cursor cAco is
    select aco.nro_comprobante,
           aco.nro_acoplado,
           aco.zafra,
           nvl(pan_brix, 0) pan_brix,
           nvl(pan_ls, 0) pan_ls,
           nvl(pan_pbu, 0) pan_pbu,
           nvl(cod_mot_can, 0) cod_mot_can,
           lab.cod_acumulado,
           peso_acoplado
      from ba_acoplados_sorteados aco, ga_anali_sonda lab
     where zafra = sZafra
       and aco.nro_comprobante = nComp
       and aco.nro_comprobante = lab.nro_comprobante(+)
       and aco.nro_acoplado = lab.nro_acoplado(+)
       and aco.zafra = lab.saf_ano_safra(+);

  rAco cAco%ROWTYPE;

begin
  --if user <> 'INV' then
  sCana := 'N';

  if deleting then
    szafra    := :old.zafra;
    nComp     := :old.NRO_COMPROBANTE_PORT;
    sempresa  := :old.cod_empresa;
    sArticulo := :old.cod_articulo;
  
  else
    szafra    := :new.zafra;
    nComp     := :new.NRO_COMPROBANTE_PORT;
    sempresa  := :new.cod_empresa;
    sArticulo := :new.cod_articulo;
  end if;

  begin
    select 'S'
      into sCana
      from st_articulos
     where cod_empresa = sEmpresa
       and cod_articulo = sArticulo
       and cod_tipo_liq in (1, 2);
  exception
    when others then
      sCana := 'N';
  end;

  if sCana = 'S' then
    -- caso contrário és otro produto 
  /* 
    if :new.Cantidad_bolsa > 0 then
      nPesoCadena := nvl(:new.peso_cadena, 0);
    else
      nPesoCadena := 0;
    end if;
  
    nPesoLiqNew := nvl(:new.peso_entrada, 0) - nPesoCadena -
                   nvl(:new.peso_salida, 0);
  */
  
    nPesoLiqNew := nvl(:new.peso_bruto,0) - nvl(:new.peso_tara,0);
    
/*
  
    if :old.Cantidad_bolsa > 0 then
      nPesoCadena := nvl(:old.peso_cadena, 0);
    else
      nPesoCadena := 0;
    end if;
    nPesoLiqOld := nvl(:old.peso_entrada, 0) - nPesoCadena -
                   nvl(:old.peso_salida, 0);

*/
    nPesoLiqOld := nvl(:old.peso_bruto,0) - nvl(:old.peso_tara,0);

    

    
    nCodAcumulado := 0;
  
    GAP_ATUALIZA_ACUM('BA1',
                      szafra,
                      nComp,
                      0,
                      0,
                      0,
                      0,
                      0,
                      0,
                      0,
                      0,
                      0,
                      nPesoLiqNew,
                      nPesoLiqOld,
                      :new.cod_empresa,
                      :new.cod_persona,
                      :new.nro_finca,
                      :new.parcela,
                      :new.cod_tipo_corte,
                      to_date(trim(to_char(:new.fec_salida, 'ddmmyyyy') || ' ' ||
                                   to_char(:new.fec_hor_salida,
                                           'hh24:mi:ss')),
                              'ddmmyyyy hh24:mi:ss'),
                      :new.cod_tipo_liq,
                      :old.cod_empresa,
                      :old.cod_persona,
                      :old.nro_finca,
                      :old.parcela,
                      :old.cod_tipo_corte,
                      to_date(trim(to_char(:old.fec_salida, 'ddmmyyyy') || ' ' ||
                                   to_char(:old.fec_hor_salida,
                                           'hh24:mi:ss')),
                              'ddmmyyyy hh24:mi:ss'),
                      :old.cod_tipo_liq,
                      :new.cod_acumulado,
                      :old.cod_acumulado,
                      nCodAcumulado);
  
    if not deleting then
      :new.cod_acumulado := nCodAcumulado;
    end if;
  
    select max(nro_acoplado), count(*), sum(peso_acoplado)
      into nMaxAco, nCont, nTotPesoAco
      from ba_acoplados_sorteados
     where zafra = sZafra
       and nro_comprobante = nComp;
  
    nPesoAco := round(nPesoLiqNew / nCont, -1);
  
    if nCont > 1 then
      nUltPeso := nPesoLiqNew - ((nCont - 1) * nPesoAco);
    else
      nUltPeso := nPesoAco;
    end if;
  
    nc := 0;
    open cAco;
    loop
      fetch cAco
        into rAco;
      exit when cAco%NOTFOUND;
      nc          := nc + 1;
      nPesoLiqOld := raco.peso_acoplado;
      if nc = nCont then
        nPesoLiqNew := nUltPeso;
      else
        nPesoLiqNew := nPesoAco;
      end if;
    
      if npesoliqold <> npesoliqnew then
        update ba_acoplados_sorteados
           set peso_acoplado = npesoliqnew
         where zafra = sZafra
           and nro_comprobante = nComp
           and nro_acoplado = raco.nro_acoplado;
      end if;
    
      -- chamar a procedure
      GAP_ATUALIZA_ACUM('BA2',
                        szafra,
                        nComp,
                        raco.nro_acoplado,
                        raco.pan_brix,
                        raco.pan_ls,
                        raco.pan_pbu,
                        raco.cod_mot_can,
                        raco.pan_brix,
                        raco.pan_ls,
                        raco.pan_pbu,
                        raco.cod_mot_can,
                        nPesoLiqNew,
                        nPesoLiqOld,
                        :new.cod_empresa,
                        :new.cod_persona,
                        :new.nro_finca,
                        :new.parcela,
                        :new.cod_tipo_corte,
                        to_date(trim(to_char(:new.fec_salida, 'ddmmyyyy') || ' ' ||
                                     to_char(:new.fec_hor_salida,
                                             'hh24:mi:ss')),
                                'ddmmyyyy hh24:mi:ss'),
                        :new.cod_tipo_liq,
                        :old.cod_empresa,
                        :old.cod_persona,
                        :old.nro_finca,
                        :old.parcela,
                        :old.cod_tipo_corte,
                        to_date(trim(to_char(:old.fec_salida, 'ddmmyyyy') || ' ' ||
                                     to_char(:old.fec_hor_salida,
                                             'hh24:mi:ss')),
                                'ddmmyyyy hh24:mi:ss'),
                        :old.cod_tipo_liq,
                        raco.cod_acumulado,
                        raco.cod_acumulado,
                        nCodAcumulado);
    
      update ga_anali_sonda
         set cod_acumulado = nCodAcumulado
       where saf_ano_safra = raco.zafra
         and nro_comprobante = raco.nro_comprobante
         and nro_acoplado = raco.nro_acoplado;
    
    end loop;
    close cAco;
  end if;
 -- end if;
exception
  when others then
    sError := left(sqlerrm, 100);
    if inserting then
      sDesc := 'Inserting';
      nComp := :new.nro_comprobante_port;
    elsif updating then
      sDesc := 'Updating';
      nComp := :new.nro_comprobante_port;
    else
      sDesc := 'Deleting';
      nComp := :old.nro_comprobante_port;
    end if;
    insert into ga_error_procedures
      (fecha, procedure_name, nro_comprobante, descripcion)
    values
      (sysdate, 'GAT_BA_MOVIMIENTO_BASCULA', nComp, sError);
  
end GAT_BA_MOVIMIENTO_BASCULA;



