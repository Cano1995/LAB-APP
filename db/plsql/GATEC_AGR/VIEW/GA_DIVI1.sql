CREATE OR REPLACE VIEW GATEC_AGR.GA_DIVI1 AS
select '01' cod_empr,
       busca_parametro('BS', 'ZAFRA_ACTUAL') SAF_ANO_SAFRA,
       --'2013' SAF_ANO_SAFRA,
       p.cod_persona COD_DIVI1,
       p.nombre DSC_DIVI1,
       p.nombre ABV_DIVI1,
       nvl(tc.ind_empresa,'N') TIPO_PERSONA
  from personas p, lc_tipos_cañeros tc
 where p.cod_sector = 'CAÑ'
 and p.cod_tipo = tc.cod_tipo(+)

 
/
