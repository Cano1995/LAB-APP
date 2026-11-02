CREATE OR REPLACE function gafFatorK( p_TQ in number )
return number is

nTQ      number(9,6);
nFatorK  number(9,6);

begin

   nTQ := p_TQ;

   -- Calculo do FATOR K
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nTQ is Not Null Then

      nFatorK := 0.99 - ( nTQ - 72 ) * 0.002;

   end if;

   return nFatorK;

end;

 