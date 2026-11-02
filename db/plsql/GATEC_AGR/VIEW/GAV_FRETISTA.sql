CREATE OR REPLACE VIEW GATEC_AGR.GAV_FRETISTA AS
select fc.id_viage,
       fc.cod_empr,
       fc.saf_ano_safra,

       fc.fec_dt_hora,
       fps_codigo,
       fps_nome,

       fps_tp_ps,
       fc.id_fre_ps,
       fa.cod_prop,

       pro_nome,
       fa.cod_fundo_agric,
       fag_nome,

       cod_divi2_ori,
       d2ori.dsc_divi2 dsc_divi2_ori,
       cod_divi3_ori,

       d3ori.dsc_divi3 dsc_divi3_ori,
       cod_divi2_des,
       d2des.dsc_divi2 dsc_divi2_des,

       cod_divi3_des,
       d3des.dsc_divi3 dsc_divi3_des,

       case
         when fc.id_class_equip in (10, 16) then
          fc.cod_mis_trac
         else
          fc.cod_mis
       end cod_mis,

       case
         when fc.id_class_equip = 10 then
          1
         else
          0
       end viagem,

       id_class_equip,
       cleqp.dsc_clas_equip,
       fc.fec_vl_uni frp_valor,

       fec_qtde ton,
       fec_vlr_total total,
       distancia,

       fra_codigo,
       fec_docto,
       fc.cod_divi1_ccpag,

       fc.cod_divi2_ccpag,
       fc.cod_divi3_ccpag,
       fc.cod_etap,

       fc.cod_prop_ccpag,
       fc.FRC_VFIXO,
       fc.loc_codigo_ori,

       fc.loc_codigo_des,
       fc.fec_vlr_desc_comb,
       fc.id_fundo_ccpag,
       fc.id_fundo_ccpag_dest,
       fc.fec_vlr_total_desc

  from (((((((((((ga_fre_prest_servico ps inner join ga_fre_fechamento fc on

        ps.id_fre_ps = fc.id_fre_ps)

        left outer  join ga_cpmis_compl_mis cpmis on
        case
          when fc.id_class_equip in (10, 16) then
           fc.cod_mis_trac
          else
           fc.cod_mis
        end = cpmis.cod_mis)

        left outer  join ga_cpmis_clas_equip cleqp on
        case fc.id_class_equip
          when 16 then
           10
          else
           fc.id_class_equip
        end = cleqp.id_clas_equip)

        left outer join
        (select max(saf_ano_safra) saf_ano_safra, cod_empr

                  from ga_divi4

                 group by cod_empr) defsafra

        on defsafra.saf_ano_safra <= fc.saf_ano_safra and
        defsafra.cod_empr = fc.cod_empr)

        left outer join ga_divi2 d2ori on
        d2ori.cod_divi1 = fc.cod_divi1_ori and
        d2ori.cod_divi2 = fc.cod_divi2_ori and

        d2ori.cod_empr = fc.cod_empr and
        d2ori.saf_ano_safra =
        coalesce(defsafra.saf_ano_safra, fc.saf_ano_safra))

        left outer join ga_divi3 d3ori on
        d3ori.cod_divi1 = fc.cod_divi1_ori and
        d3ori.cod_divi2 = fc.cod_divi2_ori and

        d3ori.cod_divi3 = fc.cod_divi3_ori and
        d3ori.cod_empr = fc.cod_empr and

        d3ori.saf_ano_safra =
        coalesce(defsafra.saf_ano_safra, fc.saf_ano_safra))

        left outer join (select min(id_fundo_agric) id_fundo_agric,
                                    cod_divi1,
                                    cod_divi2,
                                    cod_divi3,
                                    cod_empr,
                                    saf_ano_safra

                               from ga_divi4
                              group by cod_divi1,
                                       cod_divi2,
                                       cod_divi3,
                                       cod_empr,
                                       saf_ano_safra) d4

        on d4.cod_divi1 = fc.cod_divi1_ori and
        d4.cod_divi2 = fc.cod_divi2_ori and

        d4.cod_divi3 = fc.cod_divi3_ori and d4.cod_empr = fc.cod_empr and
        d4.saf_ano_safra =
        coalesce(defsafra.saf_ano_safra, fc.saf_ano_safra))

        left outer join ga_fundo_agric fa on
        d4.id_fundo_agric = fa.id_fundo_agric)

        left outer join ga_proprietario pp on fa.cod_prop = pp.cod_prop)

        left outer join ga_divi2 d2des on
        d2des.cod_divi1 = fc.cod_divi1_des and
        d2des.cod_divi2 = fc.cod_divi2_des and

        d2des.cod_empr = fc.cod_empr and
        d2des.saf_ano_safra =
        coalesce(defsafra.saf_ano_safra, fc.saf_ano_safra))

        left outer join ga_divi3 d3des on
        d3des.cod_divi1 = fc.cod_divi1_des and
        d3des.cod_divi2 = fc.cod_divi2_des and

        d3des.cod_divi3 = fc.cod_divi3_des and d3des.cod_empr = fc.cod_empr and

        d3des.saf_ano_safra =
        coalesce(defsafra.saf_ano_safra, fc.saf_ano_safra))

 
 
/
