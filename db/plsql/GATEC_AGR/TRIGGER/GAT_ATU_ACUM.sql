CREATE OR REPLACE TRIGGER "GATEC_AGR".gat_atu_acum
before insert or Update of ac_pond_brix,ac_pond_ls, ac_pond_pbu on ga_acum_liber
For Each Row












DECLARE
nPolCaldo    Number;
nFibra       Number;
nPolCana     Number;
nPureza      Number;
nAr          number;
nAgio        Number;
nAtr         Number;
nLsCorrigido Number;
BEGIN
      if nvl(:new.ac_pond_pbu,0) != 0 and nvl(:new.ac_pond_ls,0) != 0 and nvl(:new.ac_pond_brix,0) != 0 then
         nLsCorrigido := :new.ac_pond_ls;
         nPolCaldo := gaf_PolCaldo( nLsCorrigido, :new.ac_pond_brix );
         nFibra    := gaf_Fibra( :new.ac_pond_pbu );
         nPolCana  := gaf_PolCana( nPolCaldo, nFibra, :new.ac_pond_pbu );
         nPureza   := gaf_Pureza( :new.ac_pond_brix, nPolCaldo );
         nAr       := gaf_ARCana( nPureza, nFibra );
         nAgio     := gaf_Agio( nPolCana, gaf_FR( nPureza ) );
         nAtr      := gaf_ATR(:new.cod_empr, :new.saf_ano_safra, nPolCana,nAr, 1 );
         :new.ac_pond_pol_caldo := nPolCaldo;
         :new.ac_pond_pol_cana  := nPolCana;
         :new.AC_POND_PUREZA    := nPureza;
         :new.AC_POND_FIBRA     := nFibra;
         :new.AC_POND_ATR       := nAtr;
      end if;
END;





