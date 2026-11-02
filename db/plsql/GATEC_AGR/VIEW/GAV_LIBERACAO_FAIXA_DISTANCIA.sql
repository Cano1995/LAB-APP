CREATE OR REPLACE VIEW GATEC_AGR.GAV_LIBERACAO_FAIXA_DISTANCIA AS
select
	lib.ID_LIBER,
	lib.COD_EMPR,
	lib.SAF_ANO_SAFRA,
	lib.LIB_NUMERO,
	lib.COD_TIP_CORTE,
	lib.COD_FINALID,
	fdo.ID_CARAC,
	can.CAR_TEMPO_QUEIM,
	can.CAR_TEMPO_PERCU,
	decode( can.CAR_TEMPO_QUEIM,
			'S',
			to_date( to_char( lib.LIB_DT_ABERT, 'DD-MM-YYYY' ) || ' ' ||
			to_char( lib.LIB_HR_ABERT, 'HH24:MI:SS'), 'DD-MM-YYYY HH24:MI:SS' ),
			null )  LIB_TEMPOQUEIMA,
	decode( can.CAR_TEMPO_PERCU,
			'S',
			to_date( to_char( lib.LIB_DT_ABERT, 'DD-MM-YYYY' ) || ' ' ||
			to_char( lib.LIB_HR_ABERT, 'HH24:MI:SS'), 'DD-MM-YYYY HH24:MI:SS' ),
			null )  LIB_TEMPOCORTE,
	to_date( to_char( lib.LIB_DT_ABERT, 'DD-MM-YYYY' ) || ' ' ||
		to_char( lib.LIB_HR_ABERT, 'HH24:MI:SS'), 'DD-MM-YYYY HH24:MI:SS' ) LIB_ABERTURA,
	lib.LIB_FOR_TONEL_PREVI,
	sum( nvl(acu.AC_PROD,0) / 1000 ) LIB_PRODUCAO,
	gaf_chkfaixa( 1, 0, gaf_distancia( lib.ID_LIBER, lib.COD_EMPR ) ) COD_CHK_FAIXA,
	gaf_distancia( lib.ID_LIBER, lib.COD_EMPR ) LIB_DISTANCIA_MEDIA,
	lib.LIB_STATUS_CORTE
    from
	   GA_CARAC_CANA  can,
	   GA_FUNDO_AGRIC fdo,
	   GA_LIBERACAO   lib,
	   GA_ACUM_LIBER  acu
       where can.ID_CARAC = lib.ID_CARAC
	   and fdo.ID_FUNDO_AGRIC = lib.ID_FUNDO_AGRIC
	   and lib.LIB_DT_ENCER is null
	   and lib.ID_LIBER = acu.ID_LIBER(+)
    group by
		lib.ID_LIBER,
		lib.COD_EMPR,
		lib.SAF_ANO_SAFRA,
		lib.LIB_NUMERO,
		lib.COD_TIP_CORTE,
		lib.COD_FINALID,
		fdo.ID_CARAC,
		can.CAR_TEMPO_QUEIM,
		can.CAR_TEMPO_PERCU,
		lib.LIB_DT_ABERT,
		lib.LIB_HR_ABERT,
		lib.LIB_FOR_TONEL_PREVI,
		lib.LIB_STATUS_CORTE

 
 
/
