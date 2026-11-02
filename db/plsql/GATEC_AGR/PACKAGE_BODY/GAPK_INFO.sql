CREATE OR REPLACE Package Body gapk_info AS


function gaf_round( sTipo in varchar2 ) return number is

nArred number;
cursor cArred is
   select
      LS,
      PBU,
      BRIX,
      POLCANA,
      ARCANA,
      ARCALDO,
      POLCALDO,
      ATR,
      FIBRA,
      PUREZA
   from ga_pcts_arredonda;
regArred cArred%ROWTYPE;

begin
   if nvl(nArr_ls,0) = 0 then
      open cArred;
      fetch cArred into regArred           ;
      nArr_LS       := regArred.LS         ;
      nArr_PBU 	    := regArred.PBU 	   ;
      nArr_BRIX     := regArred.BRIX       ;
      nArr_POLCANA  := regArred.POLCANA    ;
      nArr_ARCANA   := regArred.ARCANA     ;
      nArr_ARCALDO  := regArred.ARCALDO    ;
      nArr_POLCALDO := regArred.POLCALDO   ;
      nArr_ATR      := regArred.ATR        ;
      nArr_FIBRA    := regArred.FIBRA      ;
      nArr_PUREZA   := regArred.PUREZA     ;
      close cArred ;
   end if;
   if sTipo = 'LS' then
      nArred := nArr_Ls;
   elsif sTipo = 'PBU' then
      nArred := nArr_pbu;
   elsif sTipo = 'BRIX' then
      nArred := nArr_brix;
   elsif sTipo = 'POLCANA' then
      nArred := nArr_polcana;
   elsif sTipo = 'ARCANA' then
      nArred := nArr_arcana;
   elsif sTipo = 'ARCALDO' then
      nArred := nArr_arcaldo;
   elsif sTipo = 'POLCALDO' then
      nArred := nArr_polcaldo;
   elsif sTipo = 'ATR' then
      nArred := nArr_atr;
   elsif sTipo = 'FIBRA' then
      nArred := nArr_fibra;
   elsif sTipo = 'PUREZA' then
      nArred := nArr_pureza;
   else
      nArred := 8;
   end if;
   return nArred;
end ;


end;


