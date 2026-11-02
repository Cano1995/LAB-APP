CREATE OR REPLACE VIEW GATEC_AGR.GAV_VIAGEM_BRUTO AS
select
	frota.id_conju,
	conj.dsc_conju,
	conj.conj_num_carga,
	conj.tipo_peso,
	frota.cod_mis			FROTA_MOTRIZ,
	conta.cod_mis			COD_EQUIP,
	mis_conta.cod_agrup,
	conta.id_liber,
	lib.cod_frente			FRENTE_REAL,
	conta.ent_id_viage,
	conta.cont_data_peso		DATA_BRUTO,
	conta.cont_data_hora		HORA_BRUTO
from
	ga_var_container 	conta,
	ga_var_digit 		frota,
	ga_var_conjunto		conj,
	ga_liberacao 		lib,
	ga_cpmis_compl_mis	mis_frota,
	ga_cpmis_compl_mis	mis_conta
where
		conta.ent_id_viage = frota.id_viage
	and	conta.ent_cod_empr = frota.cod_empr
	and	conta.ent_saf_ano_safra = frota.saf_ano_safra
--      frota=conju
	and 	frota.id_conju = conj.id_conju
--      conta=lib
	and	conta.id_liber = lib.id_liber
--	conta=mis
	and	conta.cod_mis = mis_conta.cod_mis
--      frota=mis
	and	frota.cod_mis = mis_frota.cod_mis
--	and 	conta.cont_data_peso_tara is null
--	and 	conta.cont_data_hora_tara is null

 
 
/
