CREATE OR REPLACE VIEW GATEC_AGR.GA_TIPO_CORTE AS
select cod_tipo_corte cod_tip_corte,
1 cod_agreg,
descripcion||'('||cod_tipo_corte||')' dsc_tip_corte,
descripcion||'('||cod_tipo_corte||')' abv_tip_corte,
cod_clasificacion id_carac,
1 cod_tip_calc_tc,
0 id_s4 from lc_tipos_cortes

 
/
