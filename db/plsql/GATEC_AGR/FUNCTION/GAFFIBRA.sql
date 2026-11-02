CREATE OR REPLACE function gafFibra( p_PBU in number )
return number is

nPBU      number(9,6);
nFibra    number(9,6);

begin

   nPBU := p_PBU;

   -- Calculo da FIBRA
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPBU is Not Null Then

   	  -- Alterado em 27/09/2001 (Divaldo)
      --nFibra := ( ( nPBU * 0.152 ) - 8.367 );
	  nFibra := ( ( nPBU * 0.08 ) + 0.8760 );

   end if;

   return nFibra;

end;

 