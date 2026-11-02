CREATE OR REPLACE VIEW GATEC_AGR.GAV_VIAGEM_TARA AS
select
	frota.id_conju,
	conj.dsc_conju,
	conj.conj_num_carga,
	frota.cod_mis			FROTA_MOTRIZ,
	conta.cod_mis			COD_EQUIP,
	conta.ent_id_viage,
	conta.sai_id_viage,
	conta.cont_peso_liqui
from
	ga_var_container 	conta,
	ga_var_digit 		frota,
	ga_var_conjunto		conj
where
		conta.sai_id_viage = frota.id_viage
	and	conta.sai_cod_empr = frota.cod_empr
	and	conta.sai_saf_ano_safra = frota.saf_ano_safra
--      frota=conju
	and 	frota.id_conju = conj.id_conju

 
 
/
