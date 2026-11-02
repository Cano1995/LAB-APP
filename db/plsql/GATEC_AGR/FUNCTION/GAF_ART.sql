CREATE OR REPLACE function gaf_ART( p_PolCana in number, p_ARCana in number )
return number is  
nPolCana   number(9,6);  
nARCana    number(9,6);  
nART       number(9,6);  
begin  
 nPolCana := round( p_PolCana, 4 );  
   nARCana  := p_ARCana;  
   -- Calculo do ART  
   -- Somente existir  c lculo se os par¿metros de entrada estiverem  
   -- diferentes de nulo  
   If nPolCana Is Not Null And nARCana Is Not Null Then  
      nART := nPolCana / 0.95 + nARCana;  
   end if;  
   return round( nART, 2 );  
end;
 