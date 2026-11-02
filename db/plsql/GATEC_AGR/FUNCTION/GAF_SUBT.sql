CREATE OR REPLACE Function Gaf_SubT( 	nIDD4 In Number,
			          nCodFinalid In Number,
				  nRetTipArea In Number,
				  dDataEstim In date )
Return Number
Is
bRetZero boolean;
nRetValor number;

Cursor curEstim Is
  Select	ED4_AREA_MANUAL,
		ED4_AREA_MECANICA,
		ED4_DT_ESTIM
  from 		GA_ESTIM_DIVI4
  where 	id_divi4 = nIDD4
  and		cod_finalid = nCodFinalid
  order by      ed4_dt_estim desc;
regEstim curEstim%ROWTYPE;

Begin

Open curEstim;
   bRetZero := true;
   Loop
      Fetch curEstim
      Into regEstim;

      If  regEstim.ED4_DT_ESTIM = dDataEstim then
	  if bRetZero then
	     Close curEstim;
  	     return 0;
          else
	     if nRetTipArea = 1 then
  	        nRetValor := regEstim.ED4_AREA_MANUAL;
             else
	        nRetValor := regEstim.ED4_AREA_MECANICA;
             end if;
             close curEstim;
  	     return nRetValor;
	  end if;
      else
         bRetZero := false;
      end if;

   End Loop;


   Close curEstim;

   Exception
     When Others Then
	    Return '';

End Gaf_Subt;

 