CREATE OR REPLACE Function Gaf_TrazCampo( nCOD_EMPR  	In GA_EMPR.COD_EMPR%TYPE,
			nSAF_ANO_SAFRA 	In GA_SAFRAS.SAF_ANO_SAFRA%TYPE,
			nCOD_FRENTE 	In GA_EQUIP_TRANSITO.COD_FRENTE%TYPE,
                        nCOD_DIVI1 	In GA_DIVI1.COD_DIVI1%TYPE,
                        nCOD_DIVI2 	In GA_DIVI2.COD_DIVI2%TYPE )
Return NUMBER Is
cursor curTrazCampo Is
 SELECT sum(fdc_tempo) CAMPO
 FROM 	ga_frente_d2_calc
 WHERE 	cod_frente 	= nCOD_FRENTE
 AND	cod_divi1  	= nCOD_DIVI1
 AND	cod_divi2  	= nCOD_DIVI2
 AND	saf_ano_safra 	= nSAF_ANO_SAFRA
 AND	cod_empr      	= nCOD_EMPR
 AND	(id_clas_equip 	= 1
 OR     id_clas_equip 	= 14
 OR	id_clas_equip 	= 3) ;
regTrazCampo curTrazCampo%ROWTYPE;
   Begin
        open curTrazCampo ;
        fetch curTrazCampo into regTrazCampo;
	return regTrazCampo.CAMPO;
        close curTrazCampo;
   End;

 