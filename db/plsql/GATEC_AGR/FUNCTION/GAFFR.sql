CREATE OR REPLACE function gafFR( p_Pureza in number )
return number is

nPureza    number(9,6);
nFR        number(9,6);

begin

   nPureza  := p_Pureza;

   -- Calculo do FR
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPureza is Not Null Then

      nFR := 1.9330 * ( 1 - ( 40 / ( nPureza - 1 ) ) );

   end if;

   return nFR;

end;

 