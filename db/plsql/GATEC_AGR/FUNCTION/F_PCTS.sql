CREATE OR REPLACE function f_Pcts( p_LS in number, p_Brix in number, p_Pbu in number, sRet in char )
return number is
nPBU      number(9,6);
nFibra    number(9,6);
nLS        number(9,6);
nBrix      number(9,6);
nPolCaldo  number(9,6);
nPolCana   number(9,6);
nPureza    number(9,6);
begin
   nFibra   := 0;
   nPureza  := 0;
   nPolCana := 0;
   nPBU     := p_PBU;
   nLS      := p_LS;
   nBrix    := p_Brix;
   If nPBU != 0 then
   	  -- Alterado em 27/09/2001 (Divaldo)
      --nFibra := ( ( nPBU * 0.152 ) - 8.367 );
	  nFibra := ( ( nPBU * 0.08 ) + 0.8760 );
   end if;
   if sRet = 'FIB' then
      return nFibra;
   end if;
   if nLS != 0 and nBrix != 0 then
      nPolCaldo := ( nLS * ( 0.2605 - ( 0.0009882 * nBrix ) ) );
      nPureza := ( nPolCaldo / nBrix ) * 100;
      If nFibra != 0 and nPBU != 0 Then
	  	 -- Alterado em 27/09/2001 (Divaldo)
         --nPolCana := nPolCaldo * ( 1 - ( 0.01 * nFibra ) ) * ( 1.0794 - ( 0.000874 * nPBU ) );
		 nPolCana := nPolCaldo * ( 1 - ( 0.01 * nFibra ) ) * ( 1.02626 - ( 0.00046 * nPBU ) );
      end if;
   end if;
   if sRet = 'POL' then
      return nPolCana;
   elsif sRet = 'PUR' then
      return nPureza;
   end if;
end;

 