CREATE OR REPLACE function gaf_FatorK( p_TQ in number )
return number is

nTQ      number(9,6);
nFatorK  number(9,6);

begin

   nTQ := round( p_TQ, 0 );

   -- Calculo do FATOR K
   -- Somente existirá  cálculo se os parâmetros de entrada estiverem
   -- diferentes de nulo
   If nTQ is Not Null Then

      If nTQ > 72 Then
         nFatorK := 1 - ( nTQ - 72 ) * 0.002;
      Else
         nFatorK := 1;
      End If;

   end if;

   return nFatorK;

end;

 