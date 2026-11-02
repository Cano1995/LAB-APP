CREATE OR REPLACE function gaf_Fibra( p_PBU in number )
return number is

nPBU      number(12,9);
nFibra    number(12,9);

begin

   nPBU := p_PBU;

   -- Calculo da FIBRA
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPBU is Not Null Then

   	  -- Altrado em 27/09/2001 (Divaldo)
	  --nFibra := ( ( nPBU * 0.152 ) - 8.367 );
      nFibra := ( ( nPBU * 0.08 ) + 0.8760 );

   end if;

   return round( nFibra, 4 );

end;

 