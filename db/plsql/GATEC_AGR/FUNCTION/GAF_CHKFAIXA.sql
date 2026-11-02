CREATE OR REPLACE function gaf_ChkFaixa( nCriterio in number,
						     nTipo     in number,
						     nValor    in number )
			return varchar2 is
sProcesso  varchar2(240);
sFaixa     GA_CHK_FAIXA.DSC_CHK_FAIXA%TYPE;
cursor curGA_CHK_FAIXA is
	select
		 COD_CHK_FAIXA,
		 DSC_CHK_FAIXA,
		 CHK_INICIO,
		 CHK_FINAL
	    from GA_CHK_FAIXA
		 where COD_CRITERIO = nCriterio
  	    order by COD_CHK_FAIXA;
regGA_CHK_FAIXA curGA_CHK_FAIXA%ROWTYPE;
begin
	sProcesso := 'Abrindo cursor';
	open curGA_CHK_FAIXA;
	loop
		fetch curGA_CHK_FAIXA into regGA_CHK_FAIXA;
		exit when curGA_CHK_FAIXA%NOTFOUND;
		if nValor > regGA_CHK_FAIXA.CHK_INICIO and nValor <= regGA_CHK_FAIXA.CHK_FINAL then
			if nTipo = 0 then
				sFaixa := regGA_CHK_FAIXA.COD_CHK_FAIXA;
				exit;
			elsif nTipo = 1 then
				sFaixa := regGA_CHK_FAIXA.DSC_CHK_FAIXA;
				exit;
			elsif nTipo = 2 then
				sFaixa := lpad( regGA_CHK_FAIXA.CHK_INICIO,3, '0' ) || ' - ' || lpad( regGA_CHK_FAIXA.CHK_FINAL,3, '0' );
				exit;
			end if;
		end if;
	end loop;
	close curGA_CHK_FAIXA;
	return sFaixa;
      exception
		when others then
			sFaixa := 'ERRO !';
			return sFaixa;
end;

 