CREATE OR REPLACE function gafPolCana( p_PolCaldo in number,
                                     p_Fibra in number,
                                     p_PBU in number )
return number is

nPolCaldo  number(9,6);
nFibra     number(9,6);
nPBU       number(9,6);
nPolCana   number(9,6);

begin

   nPolCaldo := p_PolCaldo;
   nFibra := p_Fibra;
   nPBU := p_PBU;

   -- Calculo do POL%CANA
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPolCaldo is Not Null and nFibra is Not Null and nPBU is Not Null Then

   	  -- Alterado em 27/09/2001 (Divaldo)
      --nPolCana := nPolCaldo * ( 1 - ( 0.01 * nFibra ) ) * ( 1.0794 - ( 0.000874 * nPBU ) );
	  nPolCana := nPolCaldo * ( 1 - ( 0.01 * nFibra ) ) * ( 1.02626 - ( 0.00046 * nPBU ) );

   end if;

   return nPolCana;

end;

 