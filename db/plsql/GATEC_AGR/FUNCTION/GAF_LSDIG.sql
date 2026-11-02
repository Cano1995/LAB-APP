CREATE OR REPLACE function gaf_LSDig( nLS in number )
return number is

nLsDig  number;
begin

   If nLs is Not Null Then

      nLSDig := round( (nLs - 0.05117)/1.00621,gapk_info.gaf_round('LS') );

   end if;

   return nLSDig;

end;



 