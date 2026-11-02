CREATE OR REPLACE VIEW GATEC_AGR.GAV_PCTS_CERTIF AS
select 	id_certif,
	cer_numer,
	ent_saf_ano_safra,
	ent_cod_empr,
	cer_bruto,
	ltrim(rtrim(to_char(cont_data_peso, 'DD/MM/YYYY' ))) bruto_data,
	ltrim(rtrim(to_char( cont_data_hora, 'HH24:MI' ))) bruto_hora,
	cer_tara,
	ltrim(rtrim(to_char( cont_data_peso_tara, 'DD/MM/YYYY' ))) tara_data,
	ltrim(rtrim(to_char( cont_data_hora_tara, 'HH24:MI' ))) tara_hora,
	m.dsc_empreit empreiteiro,
	a.id_lanc_conta romaneio,
	pro_nome,
	c.cod_fundo_agric,
	fag_abrev,
	mun_munic municipio,
	fag_insc_iaa,
	fag_insc_estad,
	NVL( cont_placa, a.cod_mis ) placa,
	abv_func motorista,
        cont_data_hora_tara,
	cer_status,
	l.lib_numero liberacao,
	t.abv_tip_corte corte,
	a.din_carreg_1 carreg
from 	ga_var_container a,
	ga_certi_peso b,
	ga_fundo_agric c,
	ga_proprietario d,
	ga_var_digit e,
	ga_funcionario f,
	ga_cep_munic g,
	ga_liberacao l,
	ga_tipo_corte t,
	ga_empreit m
where 	a.id_lanc_conta = b.id_lanc_conta and
	b.id_fundo_agric = c.id_fundo_agric and
	c.cod_prop = d.cod_prop and
	a.ent_id_viage = e.id_viage and
	e.cod_func_motor = f.cod_func and
	c.mun_cep = g.mun_cep and
	a.id_liber = l.id_liber and
	a.din_tipo_corte_1 = t.cod_tip_corte and
	a.din_turmeiro_1 = m.cod_empreit

 
 
/
