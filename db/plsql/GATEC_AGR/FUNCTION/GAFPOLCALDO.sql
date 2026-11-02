CREATE OR REPLACE function gafPolCaldo( p_LS in number, p_Brix in number )
return number is

nLS        number(9,6);
nBrix      number(9,6);
nPolCaldo  number(9,6);

begin

   nLS := p_LS;
   nBrix := p_Brix;

   -- Calculo do POL%CALDO
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nLS is Not Null and nBrix is Not Null Then

      nPolCaldo := ( nLS * ( 0.2605 - ( 0.0009882 * nBrix ) ) );

   end if;

   return nPolCaldo;

end;

 