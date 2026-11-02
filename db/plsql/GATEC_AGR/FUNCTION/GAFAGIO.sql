CREATE OR REPLACE function gafAgio( p_PolCana in number, p_FR in number )
return number is

nPolCana   number(9,6);
nFR        number(9,6);
nAgio      number(9,6);

begin

   nPolCana := p_PolCana;
   nFR := p_FR;

   -- Calculo do AGIO
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPolCana is Not Null and nFR is Not Null Then

      nAgio := ( nPolCana / 12.257 * nFR - 1 ) * 100;

   end if;

   return nAgio;

end;

 