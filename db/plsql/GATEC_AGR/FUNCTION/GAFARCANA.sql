CREATE OR REPLACE function gafARCana( p_Pureza in number, p_Fibra in number )
return number is

nPureza   number(9,6);
nFibra    number(9,6);
nARCana   number(9,6);

begin

   nPureza := p_Pureza;
   nFibra  := p_Fibra;

   -- Calculo do AR%CANA
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPureza is Not Null and nFibra is Not Null Then

   	  -- Alterado em 27/09/2001 (Divaldo)
      --nARCana := (9.9408-0.1049*nPureza)*(1-0.01*nFibra)*(1.0313-0.00575*nFibra);
	  nARCana := (3.6410-0.0343*nPureza)*(1-0.01*nFibra)*(1.0313-0.00575*nFibra);

   end if;

   return nARCana;

end;

 