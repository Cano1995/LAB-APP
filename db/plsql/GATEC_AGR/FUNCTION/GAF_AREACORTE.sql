CREATE OR REPLACE Function Gaf_AreaCorte ( nIDD4           In Number ,
		          			       nFinalid        In Number ,
							 nID_ESTIM_AGRUP In Number)
Return Number
Is
nAreaCorte Number(9,5) := 0;
Cursor curEstim Is
  Select (nvl(A.ed4_area_manual,0)+nvl(A.ed4_area_mecanica,0)) Soma,
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
Cursor curEstMed Is
  Select a.cod_finalid,
         max(A.ed4_dt_estim) ed4_dt_estim
    From ga_estim_divi4 A
      where A.cod_finalid    in ( 1,2,3,4,5 )
	  and a.ID_ESTIM_AGRUP = nID_ESTIM_AGRUP
        and a.id_divi4       = nIDD4
   group by a.cod_finalid;
regEstMed curEstMed%ROWTYPE;
Cursor curEsTotal Is
  Select (nvl(a.ed4_area_manual,0)+nvl(a.ed4_area_mecanica,0)) Soma
     From ga_estim_divi4 a
       Where a.cod_finalid  = regEstMed.cod_finalid
	 And a.ed4_dt_estim   = regEstMed.ed4_dt_estim
       and a.ID_ESTIM_AGRUP = nID_ESTIM_AGRUP
	 And a.id_divi4       = nIDD4;
regEsTotal curEsTotal%ROWTYPE;
Cursor curDivi4 Is
   Select nvl(di4_situa,0) di4_situa,
 	  nvl(di4_area_total,0) di4_area_total,
	  nvl(di4_area_inuti,0) di4_area_inuti,
	  nvl(di4_area_carre,0) di4_area_carre
      From ga_divi4
        Where id_divi4 = nIDD4;
regDivi4 curDivi4%ROWTYPE;
Cursor curAreaLiber Is
   Select nvl(sum(are.TAL_AREA_LIB),0) AREA
       From GA_AREA_LIBER are,
		GA_LIBERACAO  lib
          Where lib.COD_FINALID = nFinalid
	      And lib.ID_LIBER    = are.ID_LIBER
		And are.ID_DIVI4    = nIDD4;
regAreaLiber curAreaLiber%ROWTYPE;
Cursor curAreaTodas Is
   Select nvl(sum(are.TAL_AREA_LIB),0) AREA
       From GA_AREA_LIBER are,
		GA_LIBERACAO  lib
          Where lib.COD_FINALID = regEstMed.COD_FINALID
	      And lib.ID_LIBER    = are.ID_LIBER
		And are.ID_DIVI4    = nIDD4;
regAreaTodas curAreaTodas%ROWTYPE;
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
	 Open curAreaLiber;
	 Fetch curAreaLiber Into regAreaLiber;
	 If curAreaLiber%FOUND Then
	     nAreaCorte := nAreaCorte - regAreaLiber.AREA;
	 End If;
	 Close curAreaLiber;
       Close curEstim;
     Else
       Open curEstMed;
       Loop
         Fetch curEstMed Into regEstMed;
         Exit When curEstMed%NOTFOUND;
 	   Open curEsTotal;
	   Fetch curEsTotal Into regEsTotal;
	   If curEsTotal%FOUND Then
	 	nAreaCorte := nAreaCorte + regEsTotal.Soma;
         End If;
	   Open curAreaTodas;
	   Fetch curAreaTodas Into regAreaTodas;
	   If curAreaTodas%FOUND Then
	      nAreaCorte := nAreaCorte - regAreaTodas.AREA;
         End If;
	   Close curEsTotal;
	   Close curAreaTodas;
       End Loop;
       Close curEstMed;
     End If;
  Else
     nAreaCorte := regDivi4.di4_area_total - ( regDivi4.di4_area_inuti + regDivi4.di4_area_carre );
  End If;
  Return nAreaCorte;
  Exception
     When Others Then
	    nAreaCorte := 9999.99999;
	    Return nAreaCorte;
End gaf_AreaCorte;

 