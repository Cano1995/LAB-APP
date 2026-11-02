CREATE OR REPLACE function gafPureza( p_BRIX in number, p_PolCaldo in number )
return number is

nBrix      number(9,6);
nPolCaldo  number(9,6);
nPureza    number(9,6);

begin

   nBrix := p_Brix;
   nPolCaldo := p_PolCaldo;

   -- Calculo da PUREZA
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nBrix is Not Null and nPolCaldo is Not Null Then

      nPureza := ( nPolCaldo / nBrix ) * 100;

   end if;

   return nPureza;

end;

 