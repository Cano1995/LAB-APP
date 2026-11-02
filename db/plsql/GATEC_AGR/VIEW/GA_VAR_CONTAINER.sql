CREATE OR REPLACE VIEW GATEC_AGR.GA_VAR_CONTAINER AS
select nro_comprobante_port id_lanc_conta,
       zafra                ent_saf_ano_safra,
       1                    din_frente_1,
       cod_tipo_corte       din_tipo_corte_1,
       cod_empresa          ent_cod_empr,
       peso_bruto CONT_PESO_LIQUI,
       null CONT_TEMPO_QUEIM,
       null CONT_TEMPO_CORTE,
       null CONT_PROCE_PESAG,
       fec_hor_salida CONT_DATA_HORA_TARA
  from ba_movimientos_bascula
 where zafra = busca_parametro('BS', 'ZAFRA_ACTUAL')
   and cod_articulo in ('01', '60')

/
