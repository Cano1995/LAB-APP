CREATE OR REPLACE function gafLS( p_PEX in number,  p_Brix in number  )
return number is

nPEX       number(9,6);
nBrix      number(9,6);
nLS        number(9,6);

begin

   nPEX := p_PEX;

   -- Calculo do LS
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPEX is Not Null and nBrix is Not Null Then

      nLS := ( nPEX / ( 0.2605 - ( 0.0009882 * nBrix ) ) );

   end if;

   return nLS;

end;

 