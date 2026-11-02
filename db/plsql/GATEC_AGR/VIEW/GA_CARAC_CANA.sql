CREATE OR REPLACE VIEW GATEC_AGR.GA_CARAC_CANA AS
select  cod_clasificacion id_carac,
case when instr(upper(descripcion), 'QUE') > 0 then 'QUEMADA'
else 'CRUDA'
end DSC_CARAC,
case when instr(upper(descripcion), 'QUE') > 0 then 'QUEMADA'
else 'CRUDA'
end ABV_CARAC,
case when instr(upper(descripcion), 'QUE') > 0 then  'S'
else 'N'
end CAR_TEMPO_QUEIM,
case when instr(upper(descripcion), 'QUE') > 0 then 'N'
else 'S'
end CAR_TEMPO_PERCU from
lc_clasificacion_cortes

 
/
