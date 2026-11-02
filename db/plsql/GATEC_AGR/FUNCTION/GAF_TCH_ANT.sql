CREATE OR REPLACE function gaf_tch_ant(nid_divi4   in number,
																			 nfinalidade in number,
																			 svariedade  in varchar,
																			 ddatainic   in date,
																			 ddatafinal  in date) return number is
	nretorno number;
	nid number;
	nd1 number;
	nd2 number;
	nd3 number;
	nd4 number;
	stype varchar(20);
	nsafra number(4);
	sdata varchar(10);
	nano number(4);
	ddtinic date;
	ddtfim date;
	cursor ctchreal is
		select ((gaf_calc_sonda(d4.id_divi4, 'ProdReal', '', 1, svariedade, ddtinic, ddtfim) / 1000) /
					 decode(gaf_calc_area(d4.id_divi4, 'COLHIDA', 1, svariedade, ddtinic, ddtfim), 0, 1, gaf_calc_area(d4.id_divi4, 'COLHIDA', 1, svariedade, ddtinic, ddtfim))) as tchreal
		from ga_divi4 d4
		where d4.id_divi4 = nid and d4.saf_ano_safra = nsafra;
	rtchreal ctchreal%rowtype;
begin
	select saf_ano_safra
	into nsafra
	from ga_divi4 d4
	where d4.id_divi4 = nid_divi4;
	nsafra := nsafra - 1;
	select d4.cod_divi1,
				 d4.cod_divi2,
				 d4.cod_divi3,
				 d4.cod_divi4
	into nd1,
			 nd2,
			 nd3,
			 nd4
	from ga_divi4 d4
	where d4.id_divi4 = nid_divi4;
	select d4.id_divi4
	into nid
	from ga_divi4 d4
	where d4.cod_divi1 = nd1 and d4.cod_divi2 = nd2 and d4.cod_divi3 = nd3 and
				d4.cod_divi4 = nd4 and d4.saf_ano_safra = nsafra;
	sdata := to_char(ddatainic, 'dd/mm/yyyy');
	nano := to_number(substr(sdata, 7, 4));
	nano := nano - 1;
	sdata := substr(sdata, 1, 6) || to_char(nano);
	ddtinic := to_date(sdata, 'dd/mm/yyyy');
	sdata := to_char(ddatafinal, 'dd/mm/yyyy');
	nano := to_number(substr(sdata, 7, 4));
	nano := nano - 1;
	sdata := substr(sdata, 1, 6) || to_char(nano);
	ddtfim := to_date(sdata, 'dd/mm/yyyy');
	open ctchreal;
	fetch ctchreal
		into rtchreal;
	if ctchreal%found then
		nretorno := rtchreal.tchreal;
	else
		nretorno := 0;
	end if;
	close ctchreal;
	return nretorno;
end gaf_tch_ant;

 