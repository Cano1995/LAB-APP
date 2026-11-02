CREATE OR REPLACE VIEW GATEC_AGR.GA_DIVI2 AS
select '01' cod_empr, zafra saf_ano_safra ,cod_per_cañero COD_DIVI1, nro_finca COD_DIVI2,
decode(' ' || trim(descripcion), ' ','TERCEIRO',descripcion)  DSC_DIVI2,
decode(' ' || trim(descripcion), ' ','TERCEIRO',descripcion)  ABV_DIVI2
from lc_censos_fincas_det

 
/
