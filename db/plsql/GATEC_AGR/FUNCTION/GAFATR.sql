CREATE OR REPLACE function gafATR( p_PolCana in number,
                                 p_ARCana in number,
                                 p_FatorK in number )
return number is

nPolCana   number(9,6);
nARCana    number(9,6);
nFatorK    number(9,6);
nATR       number(9,6);

begin

   nPolCana := p_PolCana;
   nARCana  := p_ARCana;
   nFatorK  := nvl( p_FatorK, 1 ) ;


   -- Calculo do ATR
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPolCana is Not Null Then

      nATR := ( 9.26288 * nPolCana + 8.8 * nARCana ) * nFatorK;

   end if;

   return nATR;

end;

 