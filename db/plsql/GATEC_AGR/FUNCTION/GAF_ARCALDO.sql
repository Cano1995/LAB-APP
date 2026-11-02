CREATE OR REPLACE function gaf_ARCaldo( p_Pureza in number )
return number is

nPureza   number(12,9);
nARCaldo  number(12,9);

begin

   nPureza := round( p_Pureza, 4 );

   -- Calculo do AR%CALDO
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPureza is Not Null Then

   	  -- Altrado em 27/09/2001 (Divaldo)
      --nARCaldo := ( 9.9408 - 0.1049 * nPureza );
	  nARCaldo := ( 3.6410 - 0.0343 * nPureza );

   end if;

   return nARCaldo;

end;

 