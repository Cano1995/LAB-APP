CREATE OR REPLACE VIEW GATEC_AGR.GAVUZ_PRE_MATURADOR_OLD AS
select prt.saf_ano_safra, prt.id_divi4, prt.cod_divi1, prt.cod_divi2, prt.abv_divi2, prt.cod_divi3, prt.cod_divi4, 
       prt.cod_estag_usina, prt.abv_varie,
       prt.area_estimada_moagem, prt.tch_estimado,
 
       prt.abv_tipo_pre as tipo_pre_tra, 
       prt.pan_dt as data_tra,
       round(avg(prt.pan_brix), 2) as brix_tra, 
       round(avg(prt.pan_ls), 2) as ls_tra, 
       round(avg(prt.pan_pbu), 2) as pbu_tra, 
       round(avg(prt.pan_ar), 2) as ar_tra, 
       round(avg(prt.pan_fibra), 2) as fibra_tra, 
       round(avg(prt.pan_pureza), 2) as pureza_tra, 
       round(avg(prt.pan_pcc), 2) as pcc_tra,
       round(avg(prt.pan_atr), 2)  as atr_tra,
       
       pre.abv_tipo_pre as tipo_pre_tes, 
       (pre.pan_dt) as data_tes,
       round(avg(pre.pan_brix), 2) as brix_tes, 
       round(avg(pre.pan_ls), 2) as ls_tes, 
       round(avg(pre.pan_pbu), 2) as pbu_tes, 
       round(avg(pre.pan_ar), 2) as ar_tes, 
       round(avg(pre.pan_fibra), 2) as fibra_tes, 
       round(avg(pre.pan_pureza), 2) as pureza_tes, 
       round(avg(pre.pan_pcc), 2) as pcc_tes,
       round(avg(pre.pan_atr), 2)  as atr_tes
       
from 
(select 1 as pre_tratamento,
       d4.id_divi4, d4.saf_ano_safra, d4.cod_divi1, d4.cod_divi2, d2.abv_divi2, d4.cod_divi3, d4.cod_divi4, d4.cod_estag_usina, vu.abv_varie,
       nvl(ea.ed4_area_manual, 0) + nvl(ea.ed4_area_mecanica, 0) as area_estimada_moagem,
       nvl(ea.ed4_tonel_estim, 0) as tch_estimado,
       tp.cod_tipo_pre, tp.abv_tipo_pre,
       pa.pan_dt, 
       round(avg(pa.pan_brix), 2) as pan_brix, 
       round(avg(pa.pan_ls), 2) as pan_ls, 
       round(avg(pa.pan_pbu), 2) as pan_pbu, 
       round(avg(pa.pan_ar), 2) as pan_ar, 
       round(avg(pa.pan_fibra_cana), 2) as pan_fibra, 
       round(avg(pa.pan_pureza), 2) as pan_pureza, 
       round(avg(pa.pan_pol_cana), 2)  as pan_pcc,
       round(avg(pa.pan_atr), 2)  as pan_atr
from ga_divi4 d4,
     ga_divi2 d2,
     ga_varie_divi4 vd4,
     ga_varie_usina vu,
     ga_estim_divi4_ativa ea,
     ga_pre_anali pa,
     ga_mov_pre_anali mp,
     ga_tipo_pre_anali tp
where d4.saf_ano_safra=2006 and
      d4.cod_empr=1 and
      --d4.cod_divi1=3 and
      --d4.cod_divi2=875 and
      --d4.cod_divi3=1 and
      --d4.cod_divi4=1 and
      d2.saf_ano_safra=d4.saf_ano_safra and
      d2.cod_empr=d4.cod_empr and
      d2.cod_divi1=d4.cod_divi1 and
      d2.cod_divi2=d4.cod_divi2 and
      vd4.id_divi4=d4.id_divi4 and
      vu.cod_varie_usina=vd4.cod_varie_usina and
      ea.id_divi4(+)=d4.id_divi4 and
      ea.cod_finalid=1 and
      mp.id_pre_anali=pa.id_pre_anali and
      d4.id_divi4=mp.id_divi4 and
      tp.cod_tipo_pre=pa.cod_tipo_pre and
      tp.cod_tipo_pre in (3, 5, 6, 7, 8)
group by d4.id_divi4, d4.saf_ano_safra, d4.cod_divi1, d4.cod_divi2, d2.abv_divi2, d4.cod_divi3, d4.cod_divi4, d4.cod_estag_usina, vu.abv_varie,
       nvl(ea.ed4_area_manual, 0) + nvl(ea.ed4_area_mecanica, 0),
       nvl(ea.ed4_tonel_estim, 0),
       tp.cod_tipo_pre, tp.abv_tipo_pre,
       pa.pan_dt) prt,
       
(select 2 as pre_testemunha,
       d4.id_divi4, d4.saf_ano_safra, d4.cod_divi1, d4.cod_divi2, d2.abv_divi2, d4.cod_divi3, d4.cod_divi4, d4.cod_estag_usina, vu.abv_varie,
       nvl(ea.ed4_area_manual, 0) + nvl(ea.ed4_area_mecanica, 0) as area_estimada_moagem,
       nvl(ea.ed4_tonel_estim, 0) as tch_estimado,
       tp.cod_tipo_pre, tp.abv_tipo_pre,
       pa.pan_dt, 
       round(avg(pa.pan_brix), 2) as pan_brix, 
       round(avg(pa.pan_ls), 2) as pan_ls, 
       round(avg(pa.pan_pbu), 2) as pan_pbu, 
       round(avg(pa.pan_ar), 2) as pan_ar, 
       round(avg(pa.pan_fibra_cana), 2) as pan_fibra, 
       round(avg(pa.pan_pureza), 2) as pan_pureza, 
       round(avg(pa.pan_pol_cana), 2)  as pan_pcc,
       round(avg(pa.pan_atr), 2)  as pan_atr    
from ga_divi4 d4,
     ga_divi2 d2,
     ga_varie_divi4 vd4,
     ga_varie_usina vu,
     ga_estim_divi4_ativa ea,
     ga_pre_anali pa,
     ga_mov_pre_anali mp,
     ga_tipo_pre_anali tp
where d4.saf_ano_safra=2006 and
      d4.cod_empr=1 and
      --d4.cod_divi1=3 and
      --d4.cod_divi2=875 and
      --d4.cod_divi3=1 and
      --d4.cod_divi4=1 and
      d2.saf_ano_safra=d4.saf_ano_safra and
      d2.cod_empr=d4.cod_empr and
      d2.cod_divi1=d4.cod_divi1 and
      d2.cod_divi2=d4.cod_divi2 and
      vd4.id_divi4=d4.id_divi4 and
      vu.cod_varie_usina=vd4.cod_varie_usina and
      ea.id_divi4(+)=d4.id_divi4 and
      ea.cod_finalid=1 and
      mp.id_pre_anali=pa.id_pre_anali and
      d4.id_divi4=mp.id_divi4 and
      tp.cod_tipo_pre=pa.cod_tipo_pre and
      tp.cod_tipo_pre in (2)
group by d4.id_divi4, d4.saf_ano_safra, d4.cod_divi1, d4.cod_divi2, d2.abv_divi2, d4.cod_divi3, d4.cod_divi4, d4.cod_estag_usina, vu.abv_varie,
       nvl(ea.ed4_area_manual, 0) + nvl(ea.ed4_area_mecanica, 0),
       nvl(ea.ed4_tonel_estim, 0),
       tp.cod_tipo_pre, tp.abv_tipo_pre,
       pa.pan_dt) pre

where pre.id_divi4(+)=prt.id_divi4       

group by prt.saf_ano_safra, prt.id_divi4, prt.cod_divi1, prt.cod_divi2, prt.abv_divi2, prt.cod_divi3, prt.cod_divi4, 
       prt.cod_estag_usina, prt.abv_varie,
       prt.area_estimada_moagem, prt.tch_estimado,
       prt.abv_tipo_pre,
       pre.abv_tipo_pre,
       prt.pan_dt, pre.pan_dt
                 
order by prt.saf_ano_safra, prt.cod_divi1, prt.cod_divi2, prt.abv_divi2, prt.cod_divi3, prt.cod_divi4, prt.pan_dt, pre.pan_dt

 
 
/
