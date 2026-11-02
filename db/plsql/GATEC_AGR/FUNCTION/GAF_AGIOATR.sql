CREATE OR REPLACE function gaf_AgioATR( p_Safra in number,p_Atr in number )
return number is

nCpa_atr   number;
nAgioAtr   number;
nSafra     number;
nAtr       number;

begin

   nSafra := p_Safra ;
   nAtr   := p_Atr;

   select CPA_ATR into nCpa_atr from GA_CANA_PADRAO where saf_ano_safra = nSafra;

   nCpa_Atr := round( nCpa_atr, 2 );

   -- Calculo do AgioATR

   nAgioATR := ((nAtr / nCpa_atr) -1) * 100;

   return round( nAgioATR, 2 );

end;

 