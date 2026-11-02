CREATE OR REPLACE function gaf_FatorK_T( p_TQ in number, p_Dia in date )
return number is

nTQ      number(9,6);
nFatorK  number(9,6);
nT  		 number(9,6);
begin

   nTQ := round( p_TQ, 0 );
   if to_char(p_Dia,'MM-DD') <= '08-31' then
       nT := 72;
   else
   	   nT := 60;
   end if;

   -- Calculo do FATOR K
   -- Somente existirá  cálculo se os parâmetros de entrada estiverem
   -- diferentes de nulo
   If nTQ is Not Null Then

      If nTQ > nT Then
         nFatorK := 1 - ( nTQ - nT ) * 0.002;
      Else
         nFatorK := 1;
      End If;

   end if;

   return round( nFatorK , 4 );

end;

 