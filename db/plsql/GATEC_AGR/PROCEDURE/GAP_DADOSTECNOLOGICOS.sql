CREATE OR REPLACE Procedure GAP_DADOSTECNOLOGICOS( p_cod_empr in number,
                                                   p_saf_ano_safra in number,
                                                   nPbuFibra  In Out number,
                                                   nBrixAgio  In Out number,
                                                   nLsPureza  In Out number,
                                                   nCaldoCana In Out number,
                                                   nClariAtr  In Out number,
                                                   nRetorno   In Out number)
IS

	-- Valores default quando nClariAtr = 1
	nA        Number := 1;
	nB        Number := 0;
	nLScor    Number := 0;

	nPbu      Number;
	nPolCaldo Number;

Begin
     	nRetorno := 0;
     	nPbu     := nPbuFibra;

     	-- Dados Tecnologicos


     	If nClariAtr = 0  Then   -- Cloreto de Aluminio
        		nA := 1.00621;
           	nB := 0.05117;
	   	      nLScor := nA * ( nLsPureza + nB );
     	Elsif nClariAtr = 1 then -- Subacetato de Chumbo
	   	      nLScor := nA * ( nLsPureza + nB );
      else                     -- Octapol
      	    nA := 0.99879;
           	nB := 0.47374;
            nLScor := nA * ( nLsPureza + nB );
     	End If;

     	-- Calculando a Fibra
		  nPbuFibra := GAF_FIBRA(nPbu);

     	-- Calculando o pol caldo
      nPolCaldo := GAF_POLCALDO(nLScor, nBrixAgio);

     	-- Calculando o Valor do Pol Cana
		  nCaldoCana := GAF_POLCANA(nPolCaldo, nPbuFibra, nPbu);

     	-- Calculando a Pureza
     	nLsPureza := GAF_PUREZA(nBrixAgio, nPolCaldo);

     	--Calculando o Valor do Agio
     	nBrixAgio := GAF_AGIO(nCaldoCana, nLsPureza);

     	--Calculando o Valor da Atr
		  nClariAtr := GAF_ATR(p_cod_empr, p_saf_ano_safra,
                           nCaldoCana,
                           GAF_ARCANA(nLsPureza, nPbuFibra),
                           1);

  	Exception
		When Others Then
			nRetorno := 1;

End GAP_DADOSTECNOLOGICOS;



 