CREATE OR REPLACE function gafARCaldo( p_Pureza in number )
return number is

nPureza   number(9,6);
nARCaldo  number(9,6);

begin

   nPureza := p_Pureza;

   -- Calculo do AR%CALDO
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPureza is Not Null Then

   	  -- Alterado em 27/09/2001 (Divaldo)
      --nARCaldo := ( 9.9408 - 0.1049 * nPureza );
	  nARCaldo := ( 3.6410 - 0.0343 * nPureza );

   end if;

   return nARCaldo;

end;

 