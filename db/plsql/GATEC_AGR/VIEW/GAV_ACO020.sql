CREATE OR REPLACE VIEW GATEC_AGR.GAV_ACO020 AS
select
   di4.ID_DIVI4,
   lib.LIB_NUMERO,
   lib.ID_MOTIVO,
   di4.COD_EMPR,
   di4.SAF_ANO_SAFRA,
   di4.COD_DIVI1,
   di4.COD_DIVI2,
   di4.COD_DIVI3,
   di4.COD_DIVI4,
   di4.di4_dt_plant,
   di4.di4_dt_corte_anter,
   di4.di4_dt_corte_atual,
   di4.di4_situa,
   esu.COD_ESTAG_USINA,
   esu.ABV_ESTAG_USINA,
   saf.SAF_UNID_MEDID,
   saf.SAF_DIVI1_SING,
   saf.SAF_DIVI2_SING,
   saf.SAF_DIVI3_SING,
   saf.SAF_DIVI4_SING,
   esc.ECO_NRO_CORTE,
   fin.COD_FINALID ,
   fin.DSC_FINALID,
   liba.TAL_AREA_LIB,
   gaf_arecorfin( di4.ID_DIVI4,fin.COD_FINALID,est_g.ID_ESTIM_AGRUP) tot_area_corte,
   gaf_arelibfin( fin.COD_FINALID, di4.ID_DIVI4 )                    tot_area_lib,
   (liba.TAL_AREA_LIB*liba.TAL_ESTIM_POS_QUEIM)     prod_estimada,
   sum( acum_d4.AC_PROD/1000 )                      prod_recebida,
   sum(acum_d4.AC_PROD_ANALI/1000)                  prod_anali,
   decode(gaf_arelibfin( fin.COD_FINALID, di4.ID_DIVI4 ),0,0,
           sum(acum_d4.AC_PROD/1000)/gaf_arelibfin( fin.COD_FINALID, di4.ID_DIVI4 ) ) prod_tch,
   sum(acum_d4.AC_POND_TEMP_QUEI*acum_d4.AC_PROD/1000)   TQ_X_Prod,
   sum(acum_d4.AC_POND_TEMP_CORTE*acum_d4.AC_PROD/1000)  TC_X_Prod,
   sum(acum_d4.AC_POND_BRIX*acum_d4.AC_PROD/1000)        Brix_x_Prod,
   sum(acum_d4.AC_POND_LS*acum_d4.AC_PROD/1000)          Ls_x_Prod,
   sum(acum_d4.AC_POND_PBU*acum_d4.AC_PROD/1000)         Pbu_x_Prod,
   sum(acum_d4.AC_POND_BRIX*acum_d4.AC_PROD_ANALI/1000)  Brix_x_Anali,
   sum(acum_d4.AC_POND_LS*acum_d4.AC_PROD_ANALI/1000)    Ls_x_Anali,
   sum(acum_d4.AC_POND_PBU*acum_d4.AC_PROD_ANALI/1000)   Pbu_x_Anali,
   to_date( to_char( lib.LIB_DT_ABERT, 'dd/mm/yyyy' ) || ' ' || to_char( lib.LIB_HR_ABERT, 'hh24:mi:ss' ), 'dd/mm/yyyy hh24:mi:ss' ) LIB_DT_HR_ABERT,
   lib.LIB_DT_ABERT,
   to_char( lib.LIB_HR_ABERT, 'hh24:mi:ss' )   LIB_HR_ABERT,
   lib.LIB_DT_ENCER,
   lib.COD_EMPREIT,
   lib.COD_FRENTE,
   lib.LIB_STATUS_CORTE,
   di1.ABV_DIVI1,
   di2.ABV_DIVI2,
   di3.ABV_DIVI3,
   fun.COD_FUNDO_AGRIC,
   tipc.COD_TIP_CORTE,
   carc.CAR_TEMPO_QUEIM,
   car_fun.ID_CARAC,
   sol.cod_solo_usina,
   rot.rot_asfal+rot.rot_terr1+rot.rot_terr2  distanc,
   var.cod_varie_usina,
   var.abv_varie                  variedade
from
   GA_DIVI4               di4,
   GA_AREA_LIBER          liba,
   GA_SAFRAS              saf,
   GA_ESTAG_COPER         esc,
   GA_ESTAG_USINA         esu,
   GA_LIBERACAO           lib,
   GA_FINALID_COPER       fin,
   GA_DIVI1               di1,
   GA_DIVI2               di2,
   GA_DIVI3               di3,
   GA_TIPO_CORTE          tipc,
   GA_CARAC_CANA          carc,
   GA_EMPREIT             emp,
   GA_FUNDO_AGRIC         fun,
   GA_CARAC_FUNDO         car_fun,
   GA_FRENT_TRABA         fre,
   GA_ESTIM_AGRUP         est_g,
   GA_VARIE_USINA         var,
   GA_SOLOS_USINA         sol,
   GA_ACUM_D4             acum_d4,
   GA_ROTA	              rot,
   GA_ROTA_CANA           rot_cana
where
   di4.COD_EMPR           =     saf.COD_EMPR          and
   di4.SAF_ANO_SAFRA      =     saf.SAF_ANO_SAFRA     and
   di4.COD_ESTAG_USINA    =     esu.COD_ESTAG_USINA   and
   esu.COD_ESTAG_COPER    =     esc.COD_ESTAG_COPER	  and
   liba.id_divi4          =     di4.ID_DIVI4         and
   lib.ID_LIBER           =     liba.ID_LIBER        and
   lib.COD_TIP_CORTE      =     tipc.COD_TIP_CORTE   and
   lib.ID_CARAC           =     carc.ID_CARAC        and
   lib.ID_FUNDO_AGRIC     =     fun.ID_FUNDO_AGRIC   and
   lib.COD_FRENTE         =     fre.COD_FRENTE       and
   lib.COD_EMPREIT        =     emp.COD_EMPREIT (+)  and
   liba.ID_LIBER           =    acum_d4.ID_LIBER(+)  and
   fun.ID_CARAC           =     car_fun.ID_CARAC     and
   lib.COD_FINALID        =     fin.COD_FINALID      and
   liba.ID_DIVI4           =    acum_d4.ID_DIVI4(+)  and
   di3.COD_EMPR           =     di4.COD_EMPR         and
   di3.SAF_ANO_SAFRA      =     di4.SAF_ANO_SAFRA    and
   di3.COD_DIVI3          =     di4.COD_DIVI3        and
   di3.COD_DIVI2          =     di4.COD_DIVI2        and
   di3.COD_DIVI1          =     di4.COD_DIVI1        and
   di2.COD_EMPR           =     di4.COD_EMPR         and
   di2.SAF_ANO_SAFRA      =     di4.SAF_ANO_SAFRA    and
   di2.COD_DIVI2          =     di4.COD_DIVI2        and
   di2.COD_DIVI1          =     di4.COD_DIVI1        and
   di1.COD_EMPR           =     di4.COD_EMPR         and
   di1.SAF_ANO_SAFRA      =     di4.SAF_ANO_SAFRA    and
   di1.COD_DIVI1          =     di4.COD_DIVI1        and
   var.COD_VARIE_USINA    =     gaf_vari_cod( di4.ID_DIVI4 ) and
   sol.COD_SOLO_USINA     =     gaf_cod_solo( di4.ID_DIVI4 ) and
   rot_cana.roc_principal =     1                    and
   rot_cana.cod_empr_dest =     di4.COD_EMPR         and
   rot_cana.id_divi4      =     di4.id_divi4         and
   rot.cod_empr_dest      =     rot_cana.cod_empr_dest and
   rot.cod_rota           =     rot_cana.cod_rota      and
   est_g.eag_tipo         = 1                          and
   est_g.eag_ativa        = 1
   --and di4.cod_empr =2 and di4.saf_ano_safra = 1997 and di4.cod_divi1 = 5 and di4.cod_divi2 = 51
group by
   di4.COD_EMPR,
   di4.SAF_ANO_SAFRA,
   di4.COD_DIVI1,
   di4.COD_DIVI2,
   di4.COD_DIVI3,
   di4.COD_DIVI4,
   di4.ID_DIVI4,
   lib.LIB_NUMERO,
   lib.ID_MOTIVO,
   di4.di4_dt_plant,
   di4.di4_dt_corte_anter,
   di4.di4_dt_corte_atual,
   di4.di4_situa,
   car_fun.ID_CARAC,
   sol.cod_solo_usina,
   var.cod_varie_usina,
   var.abv_varie,
   est_g.ID_ESTIM_AGRUP,
   esu.ABV_ESTAG_USINA,
   esu.COD_ESTAG_USINA,
   saf.SAF_UNID_MEDID,
   saf.SAF_DIVI1_SING,
   saf.SAF_DIVI2_SING,
   saf.SAF_DIVI3_SING,
   saf.SAF_DIVI4_SING,
   esc.ECO_NRO_CORTE,
   fin.COD_FINALID ,
   fin.DSC_FINALID,
   liba.TAL_AREA_LIB,
   (liba.TAL_AREA_LIB*liba.TAL_ESTIM_POS_QUEIM),
   tipc.COD_TIP_CORTE,
   carc.CAR_TEMPO_QUEIM,
   fun.COD_FUNDO_AGRIC,
   di1.ABV_DIVI1,
   di2.ABV_DIVI2,
   di3.ABV_DIVI3,
   lib.LIB_STATUS_CORTE,
   rot.rot_asfal,
   rot.rot_terr1,
   rot.rot_terr2,
   lib.COD_FRENTE,
   lib.COD_EMPREIT,
   lib.LIB_DT_ENCER,
   lib.LIB_DT_ABERT,
   lib.LIB_HR_ABERT

 
 
/
