CREATE OR REPLACE function gaf_ARCana( p_Pureza in number, p_Fibra in number )
return number is

nPureza   number(12,9);
nFibra    number(12,9);
nARCana   number(12,9);

begin

   nPureza := p_Pureza;
   nFibra  := p_Fibra;

   -- Calculo do AR%CANA
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPureza is Not Null and nFibra is Not Null Then

      -- Alterado em 27/09/2001 (Divaldo)
      --nARCana := (9.9408-0.1049*nPureza)*(1-0.01*nFibra)*(1.0313-0.00575*nFibra);
   nARCana := (3.6410-0.0343*nPureza)*(1-0.01*nFibra)*(1.0313-(0.00575*nFibra));

   end if;

   return round(nARCana,8);

end;

 