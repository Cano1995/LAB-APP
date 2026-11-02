CREATE OR REPLACE Function Gaf_AreCorFinMan( nIDD4           In Number ,
                                             nFinalid        In Number ,
                                             nID_ESTIM_AGRUP In Number)
Return Number
Is
nAreaCorte Number(9,5) := 0;
Cursor curEstim Is
  Select nvl(A.ed4_area_manual,0) Soma,
         max(A.ed4_dt_estim)
     From ga_estim_divi4 A
       where a.ED4_DT_ESTIM = ( select max(ED4_DT_ESTIM)
						from GA_ESTIM_DIVI4
							where ID_DIVI4 = a.ID_DIVI4
							  and COD_FINALID = a.COD_FINALID )
	   and a.cod_finalid    = nFinalid
	   and a.ID_ESTIM_AGRUP = nID_ESTIM_AGRUP
         and a.id_divi4       = nIDD4
    group by a.ed4_area_manual,
  	       a.ed4_area_mecanica;
regEstim curEstim%ROWTYPE;
Cursor curDivi4 Is
   Select nvl(di4_situa,0) di4_situa,
 	  nvl(di4_area_total,0) di4_area_total,
	  nvl(di4_area_inuti,0) di4_area_inuti,
	  nvl(di4_area_carre,0) di4_area_carre
      From ga_divi4
        Where id_divi4 = nIDD4;
regDivi4 curDivi4%ROWTYPE;
Begin
  Open curDivi4;
  Fetch curDivi4 Into regDivi4;
  Close curDivi4;
  If regDivi4.di4_Situa <> 0 Then
     If nFinalid <> 0 Then
       Open curEstim;
       Fetch curEstim Into regEstim;
       If curEstim%FOUND Then
	  nAreaCorte := regEstim.Soma;
       Else
	  nAreaCorte := 0;
       End If;
       Close curEstim;
     else
       nAreaCorte := 0;
     end if;
  Else
     nAreaCorte := 0 ;
  End If;
  Return nAreaCorte;
  Exception
     When Others Then
	    nAreaCorte := 9999.99999;
	    Return nAreaCorte;
End gaf_AreCorFinMan;

 