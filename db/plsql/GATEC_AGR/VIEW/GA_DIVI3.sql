CREATE OR REPLACE VIEW GATEC_AGR.GA_DIVI3 AS
select '01' cod_empr, zafra saf_ano_safra ,cod_per_cañero COD_DIVI1, nro_finca COD_DIVI2, 1 COD_DIVI3,
'UNICO'  DSC_DIVI3,
'UNICO'  ABV_DIVI3
from lc_censos_fincas_det

 
/
