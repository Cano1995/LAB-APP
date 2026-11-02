CREATE OR REPLACE function gaf_VFUN( cFUN in NUMBER)
return number is

cursor curFun Is
	Select cod_func
          From GA_FUNCIONARIO
          Where COD_FUNc = cFun
	  and	FUN_DT_DESL IS NULL;
regFun curFun%ROWTYPE;

begin
	open curFun;
	fetch curFun into regFun;
	-- se data = null ativo, se não = inativo
	if curFun%NOTFOUND then
	   return 0;
	else
	   return 1;
	end if;

	close curFun;
end gaf_VFUN;

 