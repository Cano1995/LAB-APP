CREATE OR REPLACE VIEW GATEC_AGR.GA_DIVI1_MUS AS
select '01' cod_empr,
       '2007' SAF_ANO_SAFRA,
       cod_persona COD_DIVI1,
       nombre DSC_DIVI1,
       nombre ABV_DIVI1,
       nvl(ind_empresa,'N') TIPO_PERSONA
  from personas
 where cod_sector = 'CAÑ'

 
/
