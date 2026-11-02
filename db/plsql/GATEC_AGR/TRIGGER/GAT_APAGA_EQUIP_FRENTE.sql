CREATE OR REPLACE TRIGGER "GATEC_AGR".gat_apaga_equip_frente
  before delete on ga_frente_d2
  for each row






declare
  -- local variables here
begin
     delete ga_frente_d2_caminh
            where  cod_empr = :old.cod_empr
            and    saf_ano_safra = :old.saf_ano_safra
            and    cod_divi1 = :old.cod_divi1
            and    cod_divi2 = :old.cod_divi2
            and    cod_frente = :old.cod_frente;
     delete ga_frente_d2_equip
            where  cod_empr = :old.cod_empr
             and    saf_ano_safra = :old.saf_ano_safra
             and    cod_divi1 = :old.cod_divi1
             and    cod_divi2 = :old.cod_divi2
             and    cod_frente = :old.cod_frente;
  delete ga_frente_d2_calc
     where  cod_empr = :old.cod_empr
     and    saf_ano_safra = :old.saf_ano_safra
     and    cod_divi1 = :old.cod_divi1
     and    cod_divi2 = :old.cod_divi2
     and    cod_frente = :old.cod_frente;
end gat_apaga_equip_frente;



