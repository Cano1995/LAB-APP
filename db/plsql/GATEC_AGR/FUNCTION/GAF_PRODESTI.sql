CREATE OR REPLACE Function Gaf_ProdEsti( nIDD4           In Number ,
	  				           nFinalid        In Number ,
						     nID_ESTIM_AGRUP In Number )
Return Number
Is
nProdEsti Number    := 0;
nAreaEsti Number    := 0;
Cursor curEstim Is
  Select ed4_tonel_Estim,
         max(A.ed4_dt_estim)
     From ga_estim_divi4 A
       where a.ED4_DT_ESTIM = ( select max(ED4_DT_ESTIM)
						from GA_ESTIM_DIVI4
							where ID_DIVI4 = a.ID_DIVI4
							  and COD_FINALID = a.COD_FINALID )
	   and a.cod_finalid = nFinalid
	   and a.ID_ESTIM_AGRUP = nID_ESTIM_AGRUP
         and a.id_divi4 = nIDD4
    group by a.ed4_tonel_estim;
regEstim curEstim%ROWTYPE;
Cursor curEstMed Is
  Select a.cod_finalid,
         max(A.ed4_dt_estim) ed4_dt_estim
    From ga_estim_divi4 A
      where A.cod_finalid    in ( 1,2,3,4,5 )
	  and A.id_estim_agrup = nID_ESTIM_AGRUP
        and a.id_divi4       = nIDD4
   group by a.cod_finalid;
regEstMed curEstMed%ROWTYPE;
Cursor curEsTotal Is
  Select Nvl(a.ed4_tonel_estim,0) ProdEsti,
	 (nvl(A.ed4_area_manual,0)+nvl(A.ed4_area_mecanica,0)) Area
     From ga_estim_divi4 a
       Where a.cod_finalid    = regEstMed.cod_finalid
         And a.ed4_dt_estim   = regEstMed.ed4_dt_estim
	   And a.ID_ESTIM_AGRUP = nID_ESTIM_AGRUP
	   And a.id_divi4       = nIDD4;
regEsTotal curEsTotal%ROWTYPE;
Cursor curDivi4 Is
   Select nvl(di4_situa,0) di4_situa
      From ga_divi4
        Where id_divi4 = nIDD4;
regDivi4 curDivi4%ROWTYPE;
Begin
 Open curDivi4;
 Fetch curDivi4 Into regDivi4;
 Close curDivi4;
 If regDivi4.di4_situa <> 0 Then
   If nFinalid <> 0 Then
     Open curEstim;
     Fetch curEstim Into regEstim;
     If curEstim%FOUND Then
	nProdEsti := regEstim.ed4_tonel_estim;
     Else
	nProdEsti := 0;
     End If;
     Close curEstim;
   Else
     Open curEstMed;
     Loop
	Fetch curEstMed Into regEstMed;
	Exit When curEstMed%NOTFOUND;
	Open curEsTotal;
	Fetch curEsTotal Into regEsTotal;
	If curEsTotal%FOUND Then
		nProdEsti := nProdEsti + ( regEsTotal.ProdEsti * regEsTotal.Area );
		nAreaEsti := nAreaEsti + regEsTotal.Area;
	End If;
	Close curEsTotal;
     End Loop;
     nProdEsti := round( nProdEsti / nAreaEsti );
     Close curEstMed;
   End If;
  Else
   nProdEsti := 0;
  End If;
  Return nProdEsti;
    Exception
        When Others Then
	       nProdEsti := 999999.99;
	       Return nProdEsti;
End gaf_ProdEsti;

 