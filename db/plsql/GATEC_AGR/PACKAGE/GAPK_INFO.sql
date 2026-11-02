CREATE OR REPLACE PACKAGE            "GAPK_INFO"  as

   function gaf_round( sTipo in varchar2 ) return number;
        PRAGMA RESTRICT_REFERENCES( gaf_round, 'WNDS' );
        
      nArr_LS       NUMBER;
      nArr_PBU 	    NUMBER;
      nArr_BRIX     NUMBER;
      nArr_POLCANA  NUMBER;
      nArr_ARCANA  NUMBER;
      nArr_ARCALDO  NUMBER;
      nArr_POLCALDO NUMBER;
      nArr_ATR      NUMBER;
      nArr_FIBRA    NUMBER;
      nArr_PUREZA   NUMBER;
        
end;



 