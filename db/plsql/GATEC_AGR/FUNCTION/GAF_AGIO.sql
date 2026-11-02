CREATE OR REPLACE function gaf_Agio( p_PolCana in number, p_Pureza in number )
return number is

nPolCana   number(9,6);
nPureza    number(9,6);
nAgio      number(9,6);

begin

   nPolCana := p_PolCana;
   nPureza := p_Pureza;

   -- Calculo do AGIO
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If NVL(nPolCana,0) > 0 and NVL(nPureza,0) > 0 Then
      nAgio := 100 *((1.933 * nPolCana / 12.257) * (1 - 40 / (nPureza - 1)) - 1);
   end if;

   return nAgio;

end;



 