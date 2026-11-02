CREATE OR REPLACE TRIGGER "GATEC_AGR".GAT_ANALI_SONDA
  before update or delete on ga_anali_sonda
  for each row
declare
  -- local variables here

  nSafra       number;
  ncomp        number;
  nPesoLiqNew  number;
  nPesoLiqoLD  number;
  sCod_Persona VarChar2(15);
  sNro_Finca   VarChar2(15);
  sParcela     VarChar2(15);
  sTipo_Corte  VarChar2(5);
  sCod_Empresa VarChar2(5);
  sCod_Tip_Liq VarChar2(5);
  dFecha_Bas   Date;
  nCodAcum     number;
  sError       varchar2(100);
  sDesc        varchar2(50);

begin

  if deleting then
    nsafra      := :old.saf_ano_safra;
    nComp       := :old.NRO_COMPROBANTE;
    nPesoLiqNew := 0;  
    select peso_acoplado
      into nPesoLiqOld
      from ba_acoplados_sorteados
     where zafra = nsafra
       and nro_comprobante = nComp
       and nro_acoplado = :old.nro_acoplado;
  else
    nSafra := :new.saf_ano_safra;
    nComp  := :new.NRO_COMPROBANTE;
    select peso_acoplado
      into nPesoLiqNew
      from ba_acoplados_sorteados
     where zafra = :new.saf_ano_safra
       and nro_comprobante = nComp
       and nro_acoplado = :new.nro_acoplado;
    nPesoLiqoLD := nPesoLiqNew;
  end if;

  GAP_ATUALIZA_ACUM('LA',
                    nSafra,
                    nComp,
                    :new.NRO_ACOPLADO,
                    :new.PAN_BRIX,
                    :new.PAN_LS,
                    :new.PAN_PBU,
                    :new.COD_MOT_CAN,
                    :old.PAN_BRIX,
                    :old.PAN_LS,
                    :old.PAN_PBU,
                    :old.COD_MOT_CAN,
                    nPesoLiqNew,
                    nPesoLiqoLD,
                    sCod_empresa,
                    scod_persona,
                    snro_finca,
                    sparcela,
                    stipo_corte,
                    dfecha_bas,
                    scod_tip_liq,
                    sCod_empresa,
                    scod_persona,
                    snro_finca,
                    sparcela,
                    stipo_corte,
                    dfecha_bas,
                    scod_tip_liq,
                    :new.cod_acumulado,
                    :old.cod_acumulado,
                    nCodAcum);

exception
  when others then
    sError := left(sqlerrm, 100);
    if inserting then
      sDesc := 'Inserting';
      nComp := :new.nro_comprobante;
    elsif updating then
      sDesc := 'Updating';
      nComp := :new.nro_comprobante;
    else
      sDesc := 'Deleting';
      nComp := :old.nro_comprobante;
    end if;
    insert into ga_error_procedures
      (fecha, procedure_name, nro_comprobante, descripcion)
    values
      (sysdate, 'GAT_ANALI_SONDA', nComp, sError);
  
end GAT_ANALI_SONDA;



