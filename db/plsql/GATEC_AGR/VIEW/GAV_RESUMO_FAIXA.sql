CREATE OR REPLACE VIEW GATEC_AGR.GAV_RESUMO_FAIXA AS
select
	dis.COD_EMPR,
	dis.SAF_ANO_SAFRA,
	fai.COD_CHK_FAIXA,
	fai.DSC_CHK_FAIXA,
	lpad( fai.CHK_INICIO, 3, '0' ) CHK_INICIO,
	lpad( fai.CHK_FINAL , 3, '0' ) CHK_FINAL,
	sum( dis.LIB_FOR_TONEL_PREVI ) LIB_PROD_TOTAL,
	sum( dis.LIB_PRODUCAO )		 LIB_PRODUCAO,
	sum( decode( dis.LIB_STATUS_CORTE,
				0, dis.LIB_FOR_TONEL_PREVI,
				null ) ) LIB_PROD_CORTE,
	sum( decode( dis.LIB_STATUS_CORTE,
				1, dis.LIB_FOR_TONEL_PREVI,
				2, dis.LIB_FOR_TONEL_PREVI,
				3, dis.LIB_FOR_TONEL_PREVI,
				null ) ) LIB_PROD_TRANSPORTE,
	sum( decode( dis.LIB_STATUS_CORTE,
				1, greatest( dis.LIB_FOR_TONEL_PREVI - dis.LIB_PRODUCAO, 0 ),
				2, greatest( dis.LIB_FOR_TONEL_PREVI - dis.LIB_PRODUCAO, 0 ),
				3, greatest( dis.LIB_FOR_TONEL_PREVI - dis.LIB_PRODUCAO, 0 ),
				null ) ) LIB_SALDO_TRANSPORTE,
	sum( LIB_DISTANCIA_MEDIA *
		decode( dis.LIB_STATUS_CORTE,
				0, dis.LIB_FOR_TONEL_PREVI,
				greatest( dis.LIB_FOR_TONEL_PREVI - dis.LIB_PRODUCAO, 0 ) ) ) /
		sum( decode( dis.LIB_STATUS_CORTE,
				0, dis.LIB_FOR_TONEL_PREVI,
				greatest( dis.LIB_FOR_TONEL_PREVI - dis.LIB_PRODUCAO, 0 ) ) ) LIB_DISTANCIA_MEDIA
     from
	GA_CHK_FAIXA fai,
	GAV_LIBERACAO_FAIXA_DISTANCIA dis
       where fai.COD_CRITERIO = 1
	   and fai.COD_CHK_FAIXA = dis.COD_CHK_FAIXA
    group by
		dis.COD_EMPR,
		dis.SAF_ANO_SAFRA,
		fai.COD_CHK_FAIXA,
		fai.DSC_CHK_FAIXA,
		fai.CHK_INICIO,
		fai.CHK_FINAL

 
 
/
