CREATE OR REPLACE function gaf_PolCana( p_PolCaldo in number,
                                        p_Fibra in number,
                                        p_PBU in number )
return number is

nPolCaldo  number(12,9);
nFibra     number(12,9);
nPBU       number(12,9);
nPolCana   number(12,9);

begin

   nPolCaldo := p_PolCaldo;
   nFibra := p_Fibra;
   nPBU := p_PBU;

   -- Calculo do POL%CANA
   -- Somente existirá cálculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPolCaldo is Not Null and nFibra is Not Null and nPBU is Not Null Then

      --nPolCana := nPolCaldo * ( 1 - ( 0.01 * nFibra ) ) * ( 1.0794 - ( 0.000874 * nPBU ) );
      nPolCana := round(nPolCaldo * ( 1 - ( 0.01 * nFibra ) ),6) * ( 1.0313 - round(( 0.00575 * nFibra ),6) );

   end if;

   return round(nPolCana,4) ;

end;

 