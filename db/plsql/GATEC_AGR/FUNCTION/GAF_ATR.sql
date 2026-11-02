CREATE OR REPLACE function gaf_ATR( p_cod_empr in number,
                                    p_saf_ano_safra in number,
                                    p_PolCana in number,
                                    p_ARCana in number,
                                    p_FatorK in number )
return number is

nPolCana   number(9,6);
nARCana    number(9,6);
nFatorK    number(9,6);
nATR       number(9,6);
nCodEmprGatec number(4);

begin

   nPolCana := p_PolCana;
   nARCana  := p_ARCana;
   nFatorK  := nvl( p_FatorK, 1 ) ;

   --busca o código do cliente na Gatec
   select cod_empr_gatec into nCodEmprGatec from ga_empr
   where cod_empr = p_cod_empr;

   -- Calculo do ATR
   -- Somente existir  c lculo se os par¿metros de entrada estiverem
   -- diferentes de nulo
   If nPolCana is Not Null Then
      if p_saf_ano_safra < 2005 then
         nATR := ((9.26288 * nPolCana) + 8.8 * nARCana ) * nFatorK;
      else
         if nCodEmprGatec = 18 or -- Ipiranga - Mococa
            nCodEmprGatec = 19 or -- Pau d'Alho
            nCodEmprGatec = 47 or -- Zanin
            nCodEmprGatec = 61 or -- Ipiranga - Descalvado
            nCodEmprGatec = 110 or -- Ipiranga - Iacanga
            nCodEmprGatec = 67 then -- Vista Alegre
             --novo cálculo
             nATR := ((9.5263 * nPolCana) + 9.05 * nARCana ) * nFatorK;
         else
             nATR := ((9.26288 * nPolCana) + 8.8 * nARCana ) * nFatorK;
         end if;
      end if;
   end if;

   return round( nATR, 4 );

end;

 