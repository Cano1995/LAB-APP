CREATE OR REPLACE VIEW GATEC_AGR.GA_ACUM_D4 AS
select
id_divi4,
cod_empresa  cod_empr,
cod_empresa  cod_empr_receptora,
zafra saf_ano_safra,
p.cod_per_cañero cod_divi1,
p.nro_finca cod_divi2,
1 cod_divi3,
p.parcela cod_divi4,
1 id_liber,
p.cod_tipo_liq cod_tip_liq,
p.cod_tipo_corte cod_tip_corte,
p.fecha ac_dt_acum,
p.peso_acumulado ac_prod,
p.peso_analizado ac_prod_anali,
p.brix ac_pond_brix,
p.ls ac_pond_ls,
p.pbu ac_pond_pbu,
p.tiempo_quema ac_pond_temp_quei,
p.tiempo_corte ac_pond_temp_corte,
p.cod_acumulado,
case when peso_analizado=0 then 0 else gaf_fibra(pbu) end  ac_pond_fibra,
case when peso_analizado=0 then 0 else gaf_polcaldo(p.ls,p.brix) end   ac_pond_pol_caldo,
case when peso_analizado=0 then 0 else gaf_pureza(brix,gaf_polcaldo(p.ls,p.brix) ) end   ac_pond_pureza,
case when peso_analizado=0 then 0 else gaf_arcaldo(gaf_pureza(brix,gaf_polcaldo(p.ls,p.brix) ) ) end    ac_pond_ar,
case when peso_analizado=0 then 0 else gaf_arcana(gaf_pureza(brix,gaf_polcaldo(p.ls,p.brix) ) ,gaf_fibra(pbu))  end  ac_pond_ar_cana,
case when peso_analizado=0 then 0 else gaf_polcana( gaf_polcaldo(p.ls,p.brix),gaf_fibra(pbu),p.pbu) end   ac_pond_pol_cana,
case when peso_analizado=0 then 0 else gaf_atr(1,to_number(zafra),
gaf_polcana( gaf_polcaldo(p.ls,p.brix),gaf_fibra(pbu),p.pbu),
gaf_arcana(gaf_pureza(brix,gaf_polcaldo(p.ls,p.brix) ) ,gaf_fibra(pbu)),1 ) end ac_pond_atr
from ba_bascula_analisis p

/
