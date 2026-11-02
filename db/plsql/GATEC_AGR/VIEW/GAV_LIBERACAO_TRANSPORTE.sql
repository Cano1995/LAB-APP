CREATE OR REPLACE VIEW GATEC_AGR.GAV_LIBERACAO_TRANSPORTE AS
select
	lib.COD_EMPR,
	lib.SAF_ANO_SAFRA,
	lib.ID_LIBER,
	lib.LIB_NUMERO,
	fdo.ID_FUNDO_AGRIC,
	fdo.ID_CARAC,
	lpad( fdo.COD_FUNDO_AGRIC, 6,'0') COD_FUNDO_AGRIC,
	fdo.FAG_NOME,
	lib.LIB_FOR_TONEL_PREVI,
	gaf_Distancia( lib.ID_LIBER, lib.COD_EMPR ) LIB_DISTANCIA,
	lib.COD_TIP_CORTE,
	lib.COD_FINALID,
	sum( acu.AC_PROD / 1000 ) LIB_PRODUCAO,
	lib.LIB_FOR_TONEL_PREVI - nvl(sum( acu.AC_PROD / 1000 ),0) LIB_SALDO,
	decode( cfg.CPC_ORIG_TIPO_CORTE,
				0, can.CAR_TEMPO_QUEIM,
				1, car.CAR_TEMPO_QUEIM ) CAR_TEMPO_QUEIM,
	decode( cfg.CPC_ORIG_TIPO_CORTE,
				0, can.CAR_TEMPO_PERCU,
				1, car.CAR_TEMPO_PERCU ) CAR_TEMPO_PERCU,
	decode( decode( cfg.CPC_ORIG_TIPO_CORTE,
				0, can.CAR_TEMPO_QUEIM,
				1, car.CAR_TEMPO_QUEIM ),
			'S',
			to_date( to_char( lib.LIB_DT_ABERT, 'DD-MM-YYYY' ) || ' ' ||
			to_char( lib.LIB_HR_ABERT, 'HH24:MI:SS'), 'DD-MM-YYYY HH24:MI:SS' ),
			null )  LIB_TEMPOQUEIMA,
	decode( decode( cfg.CPC_ORIG_TIPO_CORTE,
				0, can.CAR_TEMPO_PERCU,
				1, car.CAR_TEMPO_PERCU ),
				'S',
			to_date( to_char( lib.LIB_DT_ABERT, 'DD-MM-YYYY' ) || ' ' ||
			to_char( lib.LIB_HR_ABERT, 'HH24:MI:SS'), 'DD-MM-YYYY HH24:MI:SS' ),
			null )  LIB_TEMPOCORTE,
	to_date( to_char( lib.LIB_DT_ABERT, 'DD-MM-YYYY' ) || ' ' ||
	to_char( lib.LIB_HR_ABERT, 'HH24:MI:SS'), 'DD-MM-YYYY HH24:MI:SS' ) LIB_ABERTURA,
	lib.LIB_DT_ABERT,
	lib.LIB_HR_ABERT,
	lib.LIB_DT_ENCER,
	lib.LIB_STATUS_CORTE
    from
-- Liberacao
	   GA_CARAC_CANA  can,
-- Real
	   GA_CARAC_CANA  car,
	   GA_CONF_CPC	cfg,
	   GA_TIPO_CORTE  cor,
	   GA_FUNDO_AGRIC	fdo,
	   GA_LIBERACAO   lib,
	   GA_ACUM_LIBER  acu
	where can.ID_CARAC	 = lib.ID_CARAC
	  and car.ID_CARAC(+)    = cor.ID_CARAC
	  and cor.COD_TIP_CORTE  = lib.COD_TIP_CORTE
	  and cfg.SAF_ANO_SAFRA  = lib.SAF_ANO_SAFRA
	  and cfg.COD_EMPR	 = lib.COD_EMPR
	  and fdo.ID_FUNDO_AGRIC = lib.ID_FUNDO_AGRIC
	  and lib.ID_LIBER       = acu.ID_LIBER(+)
	  and lib.LIB_DT_ENCER is null
	  and lib.LIB_STATUS_CORTE in ( 1,2,3 )
   group by
		lib.COD_EMPR,
		lib.SAF_ANO_SAFRA,
		lib.ID_LIBER,
		lib.LIB_NUMERO,
		fdo.ID_FUNDO_AGRIC,
		fdo.ID_CARAC,
		fdo.COD_FUNDO_AGRIC,
		fdo.FAG_NOME,
		lib.COD_TIP_CORTE,
		lib.COD_FINALID,
		lib.LIB_FOR_TONEL_PREVI,
		can.CAR_TEMPO_QUEIM,
		can.CAR_TEMPO_PERCU,
		car.CAR_TEMPO_QUEIM,
		car.CAR_TEMPO_PERCU,
		cfg.CPC_ORIG_TIPO_CORTE,
		lib.LIB_DT_ABERT,
		lib.LIB_HR_ABERT,
		lib.LIB_DT_ENCER,
		lib.LIB_STATUS_CORTE

 
 
/
