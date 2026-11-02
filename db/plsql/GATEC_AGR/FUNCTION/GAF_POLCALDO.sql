CREATE OR REPLACE function gaf_PolCaldo( p_LS in number, p_Brix in number )
return number is

nLS        number(12,9);
nBrix      number(12,9);
nPolCaldo  number(12,9);

begin

   nLS := p_LS;
   nBrix := p_Brix;

   -- Calculo do POL%CALDO
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nLS is Not Null and nBrix is Not Null Then

      nPolCaldo := ( nLS * ( 0.2605 - (0.0009882 * nBrix) ) );

   end if;

   return ROUND(nPolCaldo,4);

end;

 