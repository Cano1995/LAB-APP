CREATE OR REPLACE TRIGGER GATEC_AZPA.INT_PORT_LABOR
  before insert or update or delete  on int_port_labor  
  for each row
declare
  -- local variables here
  nRec number;
begin
  if inserting then
    if :new.ind_sorteo = 'S' then
      select count(*)
        into nRec
        from gatec_agr.ga_anali_sonda
       where nro_comprobante =:new.nro_comprobante  and nro_acoplado = :new.nro_acoplado;
      if nRec = 0 then
        insert into gatec_agr.ga_anali_sonda
          (id_lanc_conta, pan_numer, saf_ano_safra, cod_empr, nro_comprobante,nro_acoplado, pan_dt )
        values
          ( trim(to_char(:new.nro_comprobante)) || trim(to_char(:new.nro_acoplado)) ,
          trim(to_char(:new.nro_comprobante)) || trim(to_char(:new.nro_acoplado)),
           to_number(:new.zafra),
           1, :new.nro_comprobante,:new.nro_acoplado, sysdate  );
      end if;
    end if;
  end if;
end INT_PORT_LABOR;



