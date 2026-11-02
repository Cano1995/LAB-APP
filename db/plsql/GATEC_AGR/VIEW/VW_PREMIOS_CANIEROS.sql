CREATE OR REPLACE VIEW GATEC_AGR.VW_PREMIOS_CANIEROS AS
select c.cod_empresa,
           c.cod_per_cañero,
           c.mes_anio,
					 c.quincena,
           100*(c.POL-g.POL)/g.POL porc_pol,
           100*(c.Pureza-g.Pureza)/g.Pureza porc_pureza,
           c.fibra
from gatec_agr.vw_prom_lab_canieros c,
         gatec_agr.vw_prom_lab_general g
where c.cod_empresa = '01'
    and c.cod_empresa = g.cod_empresa
    and c.mes_anio       = g.mes_anio
    and c.quincena        = g.quincena

 
/
