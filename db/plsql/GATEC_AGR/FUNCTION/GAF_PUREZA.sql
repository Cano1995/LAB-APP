CREATE OR REPLACE function gaf_Pureza( p_BRIX in number, p_PolCaldo in number )
return number is

nBrix      number(12,9);
nPolCaldo  number(12,9);
nPureza    number(12,9);

begin

   nBrix := p_Brix;
   nPolCaldo := p_PolCaldo;

   -- Calculo da PUREZA
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nBrix is Not Null and nPolCaldo is Not Null Then

      nPureza := ( nPolCaldo / nBrix ) * 100;

   end if;

   return round(nPureza,4);

end;

 