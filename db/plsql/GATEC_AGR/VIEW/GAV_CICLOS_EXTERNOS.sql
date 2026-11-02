CREATE OR REPLACE VIEW GATEC_AGR.GAV_CICLOS_EXTERNOS AS
select 	ex.id_ciclo_externo ID,
--	Tempo de ciclo e Peso utilizado para o agrupamento
	ex.cie_tempo_ciclo TEMPO_DE_CICLO ,
	ex.cie_peso_liquido PESO_CARGA ,
--
--	Conjunto Chegada ( BRUTO )
	ex.id_conju_cheg CODIGO_CONJUNTO_CHEG ,
	conj_cheg.dsc_conju DESC_CONJUNTO_CHEG ,
--
--   	Agrupamento Chegada ( BRUTO )
	ex.cod_agrup_cheg COD_AGRUPAMENTO_CHEG ,
	agr_cheg.abv_agrup DSC_AGRUPAMENTO_CHEG ,
--
--	Data e Hora real de Chegada (BRUTO )
	to_date( to_char(ex.cie_data_cheg,'DD/MM/YYYY') ||' '|| to_char(ex.cie_hora_cheg,'HH24:MI'),'DD/MM/YYYY HH24:MI') DATA_HORA_CHEG ,
--
--	Caminhão e Julieta que chegaram ( BRUTO )
	ex.cod_mis_motriz_cheg CODIGO_MOTRIZ_CHEG ,
	frota_cheg.abv_mis DSC_MOTRIZ_CHEG,
	ex.cod_mis_conta_cheg CODIGO_CONTA_CHEG ,
	conta_cheg.abv_mis DSC_CONTA_CHEG,
--
--	Frente de chegada ( Frente efetiva )
	ex.cod_frente_cheg CODIGO_FRENTE_CHEG,
	ex.cod_divi1_cheg CODIGO_DIVI1_CHEG ,
	ex.cod_divi2_cheg CODIGO_DIVI2_CHEG ,
	fr_cheg.fdc_nome_guerra NOME_FRENTE_CHEG ,
--
--	Data e Hora prevista de retorno
	to_char(ex.data_prev_ret_saida,'DD/MM/YYYY HH24:MI') PREVISAO_RETORNO ,
--
--	Conjunto de Saida ( TARA )
	ex.id_conju_saida CONJUNTO_SAIDA,
	conj_sai.dsc_conju DESC_CONJUNTO_SAIDA,
--
--   	Agrupamento saida ( TARA )
	ex.cod_agrup_saida CODIGO_AGRUPAMENTO_SAIDA ,
	agr_sai.abv_agrup DSC_AGRUPAMENTO_SAIDA ,
--
--	Data e Hora real de Saida ( TARA )
	ex.data_saida DATA_HORA_SAIDA ,
--
--	Caminhão e Julieta na saida (TARA)
	ex.cod_mis_motriz_saida CODIGO_MOTRIZ_SAIDA ,
	frota_sai.abv_mis DSC_MOTRIZ_SAIDA,
	ex.cod_mis_conta_saida CODIGO_CONTA_SAIDA ,
	conta_sai.abv_mis DSC_CONTA_SAIDA ,
--
--	Frente planejada ( TARA )
	ex.cod_frente_saida CODIGO_FRENTE_SAIDA,
	ex.cod_divi1_saida CODIGO_DIVI1_SAIDA ,
	ex.cod_divi2_saida CODIGO_DIVI2_SAIDA ,
	fr_sai.fdc_nome_guerra NOME_FRENTE_SAIDA ,
--
--	Atraso
	TRUNC( ( to_date( to_char(ex.cie_data_cheg,'DD/MM/YYYY') ||' '|| to_char(ex.cie_hora_cheg,'HH24:MI'),'DD/MM/YYYY HH24:MI') -
	  ex.data_prev_ret_saida ) * 1440  ) Atraso
--
From 	ga_ciclos_externos ex ,
	ga_var_conjunto conj_cheg ,
	ga_var_conjunto conj_sai ,
	ga_agrup_mis agr_cheg ,
	ga_agrup_mis agr_sai ,
	gi_meq_mis frota_cheg ,
	gi_meq_mis conta_cheg ,
	gi_meq_mis frota_sai ,
	gi_meq_mis conta_sai ,
	ga_frente_d2 fr_cheg ,
	ga_frente_d2 fr_sai
Where
--	Carregando Conjuntos
	ex.id_conju_cheg = conj_cheg.id_conju(+)
and	ex.id_conju_saida = conj_sai.id_conju(+)
--
--	Carregando Agrupamentos
and	ex.cod_agrup_cheg = agr_cheg.cod_agrup(+)
and	ex.cod_agrup_saida = agr_sai.cod_agrup(+)
--
--	Carregando Caminhao/Julietas de Chegada no Bruto
and	ex.cod_mis_motriz_cheg = frota_cheg.cod_mis(+)
and	ex.cod_mis_conta_cheg = conta_cheg.cod_mis(+)
--
--	Carregando Caminhao/Julietas de Saida na Taragem
and	ex.cod_mis_motriz_saida = frota_sai.cod_mis(+)
and	ex.cod_mis_conta_saida = conta_sai.cod_mis(+)
--
--	Carregando Frente Realizada
and	ex.cod_frente_cheg = fr_cheg.cod_frente(+)
and	ex.saf_ano_safra_cheg = fr_cheg.saf_ano_safra(+)
and	ex.cod_divi1_cheg = fr_cheg.cod_divi1(+)
and	ex.cod_divi2_cheg = fr_cheg.cod_divi2(+)
--
--	Carregando Frente Planejada
and	ex.cod_frente_saida = fr_sai.cod_frente(+)
and	ex.saf_ano_safra_saida = fr_sai.saf_ano_safra(+)
and	ex.cod_divi1_saida = fr_sai.cod_divi1(+)
and	ex.cod_divi2_saida = fr_sai.cod_divi2(+)
--

 
/
