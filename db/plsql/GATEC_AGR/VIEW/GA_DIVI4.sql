CREATE OR REPLACE VIEW GATEC_AGR.GA_DIVI4 AS
select trim(zafra) || trim(cod_per_cañero) || trim(nro_finca) ||
       trim(parcela) ID_DIVI4,
       1 COD_EMPR,
       zafra saf_ano_safra,
       cod_per_cañero cod_divi1,
       nro_finca cod_divi2,
       1 cod_divi3,
       parcela cod_divi4,
       nvl(cantidad_cortes, 1) cod_estag_usina,
       hectareas di4_area_total,
       0 di4_area_inuti,
       0 di4_area_carre,
       0 di4_espac,
       0 di4_Decli,
       null  di4_situa,
       cod_tipo_liq
  from lc_censos_parcelas_det lcdet

 
/
