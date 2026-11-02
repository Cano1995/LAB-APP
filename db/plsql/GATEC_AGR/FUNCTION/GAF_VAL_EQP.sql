CREATE OR REPLACE function gaf_val_eqp( cMis in char)
return number is

cursor curEqp Is
	Select cod_mis
          From GI_MEQ_MIS
          Where COD_MIS = cMis
	  and	MIS_STATU = 1;
regEqp curEqp%ROWTYPE;

begin
	open curEqp;
	fetch curEqp into regEqp;
	-- se status for 1, equipamento ativo, se 0 = inativo
	if curEqp%NOTFOUND then
	   return 0;
	else
	   return 1;
	end if;

	close curEqp;
end gaf_val_eqp;

 