CREATE OR REPLACE Procedure GAPUZ_PRE_ANALISE_MATURADOR( NSAFRA in NUMBER) Is
begin
  
  --EXCLUI TODAS AS ANALISES
  DELETE FROM GAUZ_PRE_ANALISE_MATURADOR 
  WHERE SAF_ANO_SAFRA = NSAFRA;
  
  INSERT INTO GAUZ_PRE_ANALISE_MATURADOR
         (SAF_ANO_SAFRA, ID_DIVI4, COD_DIVI1, COD_DIVI2, ABV_DIVI2, COD_DIVI3, COD_DIVI4, COD_ESTAG_USINA, ABV_VARIE,
          AREA_ESTIMADA_MOAGEM, TCH_ESTIMADO,
          TIPO_PRE_TRA,
          DATA_TRA,
          BRIX_TRA,
          LS_TRA,
          PBU_TRA,
          AR_TRA,
          FIBRA_TRA,
          PUREZA_TRA,
          PCC_TRA,
          ATR_TRA)
  select d4.saf_ano_safra, d4.id_divi4, d4.cod_divi1, d4.cod_divi2, d2.abv_divi2, d4.cod_divi3, d4.cod_divi4, d4.cod_estag_usina, vu.abv_varie,
       nvl(ea.ed4_area_manual, 0) + nvl(ea.ed4_area_mecanica, 0) as area_estimada_moagem,
       nvl(ea.ed4_tonel_estim, 0) as tch_estimado,
       tp.abv_tipo_pre,
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
    where d4.saf_ano_safra=nsafra and
          d4.cod_empr=1 and
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
           pa.pan_dt;
  
  update GAUZ_PRE_ANALISE_MATURADOR PM
  set (
      TIPO_PRE_TES,
      DATA_TES,
      BRIX_TES,
      LS_TES,
      PBU_TES,
      AR_TES,
      FIBRA_TES,
      PUREZA_TES,
      PCC_TES,
      ATR_TES
      ) =
      (
  select tp.abv_tipo_pre,
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
  where d4.saf_ano_safra=pm.saf_ano_safra and
        d4.cod_empr=1 and
        d4.id_divi4=pm.id_divi4 and
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
        tp.cod_tipo_pre in (2) and
        pa.pan_dt = (select max(pa2.pan_dt) from ga_pre_anali pa2, ga_mov_pre_anali mp2
                     where mp2.id_divi4=mp.id_divi4 and
                           pa2.pan_dt <= pm.data_tra)
  group by tp.abv_tipo_pre, pa.pan_dt);
  
  commit;
  
end GAPUZ_PRE_ANALISE_MATURADOR;

 