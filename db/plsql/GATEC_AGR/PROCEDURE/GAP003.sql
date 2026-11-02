CREATE OR REPLACE Procedure GAP003( nIDD4      In Number,
				    nMoagem    In Out ga_divi4.di4_area_total%TYPE,    -- Area de Moagem
				    nMuda      In Out ga_divi4.di4_area_total%TYPE,    -- Area de Muda
				    nVenda     In Out ga_divi4.di4_area_total%TYPE,    -- Area de Venda
				    nPecuaria  In Out ga_divi4.di4_area_total%TYPE,    -- Area de Pecuaria
				    nCrescer   In Out ga_divi4.di4_area_total%TYPE,    -- Crescimento
				    nProdEsti  In Out ga_divi4.di4_area_total%TYPE,    -- Producao Estimada
	                 	    nRetorno   Out Number ) Is
nSomaAreas Number := 0;
nTotal     Number := 0;

ErroSql    VarChar2(240);

Cursor curFinal Is
   Select   a.cod_finalid,
           max(A.ed4_dt_estim) ed4_dt_estim
      From ga_estim_divi4 A,
           ga_estim_agrup B
        Where   B.id_estim_agrup = A.id_estim_agrup
          And   B.eag_ativa  = 1
          And   A.cod_finalid in ( 1,2,3,4,5 )
          And   A.id_divi4 = nIDD4
     group by   A.cod_finalid;

regFinal curFinal%ROWTYPE;

Cursor curAreaTotal Is
    Select (nvl(A.ed4_area_manual,0)+nvl(A.ed4_area_mecanica,0)) Soma,
           nvl(a.ed4_tonel_estim,0) ed4_tonel_estim
       From ga_estim_divi4 a
         Where a.cod_finalid = regFinal.cod_finalid
	   and a.ed4_dt_estim = regFinal.ed4_dt_estim
           and a.id_divi4 = nIDD4;

regAreaTotal curAreaTotal%ROWTYPE;

Begin
      nMoagem   := 0;
	nRetorno  := 0;
      nMuda     := 0;
      nVenda    := 0;
      nProdEsti := 0;
      nPecuaria := 0;
	nCrescer  := 0;
	Open curFinal;

	Loop
		Fetch curFinal Into regFinal;
		Exit When curFinal%NOTFOUND;

		Open curAreaTotal;
		Fetch curAreaTotal Into regAreaTotal;
		if curAreaTotal%FOUND Then

      			If regFinal.COD_FINALID = 1 Then
				nMoagem   := nMoagem + regAreaTotal.Soma;
			ElsIf regFinal.COD_FINALID = 2 Then
				nMuda     := nMuda + regAreaTotal.Soma;
			ElsIf regFinal.COD_FINALID = 3 Then
				nVenda    := nVenda + regAreaTotal.Soma;
			ElsIf regFinal.COD_FINALID = 4 Then
				nPecuaria := nPecuaria + regAreaTotal.Soma;
			-- Outras --
			-- Obs: Acresenta-se o valor de pecuaria para Outras
			Else
				nPecuaria := nPecuaria + regAreaTotal.Soma;
			End If;
		End If;

		Close curAreaTotal;

		-- Acumular o Total de Areas Total e Mecanica
		nSomaAreas := nSomaAreas + regAreaTotal.Soma;
		-- Acumular o ( Total de Areas * Tonelada Estimada )
		nTotal     := nTotal + (regAreaTotal.Soma * regAreaTotal.ED4_TONEL_ESTIM );

	End Loop;

	If nSomaAreas > 0 Then
		nProdEsti := nTotal / nSomaAreas;
	Else
		nProdEsti := 0;
	End If;

	nCrescer := nSomaAreas - nCrescer;

	Close curFinal;

	Exception
		When Others Then

			nRetorno := 1;
			ErroSql := substr( SQLERRM , 1, 240 );
			Insert Into Log_erro Values
			( 'Falha na Procedure GAP003 ' || USER || ' ' ||
		 	  TO_CHAR( SYSDATE , 'DD-MM-YY-HH24:MI:SS' ) ||
			  ErroSql  );
			Commit;

End GAP003;

 