CREATE OR REPLACE PACKAGE BODY GAPK_AGRUPDINAMICO IS
procedure gap_Main( nCOD_EMPR      in number,
			  nSAF_ANO_SAFRA in number,
			  sSelecao       in varchar2,
		  	  pCOD_GRUPO     in number,
			  pCOD_SUBGR     in number,
 			  nRetorno       in out number,
			  sErro          in out varchar2  ) is
begin
	nErro := 0;
	nCOD_GRUPO := pCOD_GRUPO;
	nCOD_SUBGR := pCOD_SUBGR;
	sProcesso := 'Deletando tabela do assistente';
	delete from SEQUENCIA where OBJETO = 'GA_ESPEC';
	commit;
	sProcesso := 'Analisando criterios de selecao';
	gap_Criterio( sSelecao );
	sProcesso := 'Montando Order by';
	gap_OrderBy;
	sProcesso := 'Montando Comando SQL';
	sSelect := 'select di4.ID_DIVI4,
				 di4.COD_DIVI1,
				 di4.COD_DIVI2,
				 di4.COD_DIVI3,
				 var.COD_VARIE_USINA,
				 sol.COD_SOLO_USINA,
				 di4.COD_ESTAG_USINA,
				 di4.MUN_CEP,
				 nvl( to_char( di4.DI4_DT_CORTE_ANTER, ''MM-YYYY'' ),
				      to_char( di4.DI4_DT_PLANT      , ''MM-YYYY'' ) ) PLANTIOCORTE,
				 DI4_ESPAC,
				 DI4_DECLI
			    from GA_VARIE_DIVI4 var,
				   GA_SOLOS_DIVI4 sol,
				   GA_DIVI4 di4
				 where var.ID_DIVI4(+) = di4.ID_DIVI4
				   and sol.ID_DIVI4(+) = di4.ID_DIVI4
				   and SAF_ANO_SAFRA   = :nSAF_ANO_SAFRA
				   and COD_EMPR        = :nCOD_EMPR';
	sSelect := sSelect || ' order by ' || sOrderBy;
	-- Pegando um Handle para o cursor
	curAGRUP := DBMS_SQL.OPEN_CURSOR;
	sProcesso := 'Executado DBMS_SQL.PARSE';
	-- Executando a comando select contido em sSelect e habilitando curAGRUP
	DBMS_SQL.PARSE( curAGRUP, sSelect, DBMS_SQL.V7 );
	sProcesso := 'Alterando os valores de bind variables';
	DBMS_SQL.BIND_VARIABLE( curAGRUP, ':nSAF_ANO_SAFRA', nSAF_ANO_SAFRA, 4 );
	DBMS_SQL.BIND_VARIABLE( curAGRUP, ':nCOD_EMPR'     , nCOD_EMPR     , 2 );
	sProcesso := 'Definindo as colunas into';
	-- Definindo a Colunas/Intos do cursor
	DBMS_SQL.DEFINE_COLUMN( curAGRUP, 1, nID_DIVI4			        );
	DBMS_SQL.DEFINE_COLUMN( curAGRUP, 2, recAgrAtual.COD_DIVI1          );
	DBMS_SQL.DEFINE_COLUMN( curAGRUP, 3, recAgrAtual.COD_DIVI2          );
	DBMS_SQL.DEFINE_COLUMN( curAGRUP, 4, recAgrAtual.COD_DIVI3          );
	DBMS_SQL.DEFINE_COLUMN( curAGRUP, 5, recAgrAtual.COD_VARIE_USINA    );
	DBMS_SQL.DEFINE_COLUMN( curAGRUP, 6, recAgrAtual.COD_SOLO_USINA     );
	DBMS_SQL.DEFINE_COLUMN( curAGRUP, 7, recAgrAtual.COD_ESTAG_USINA, 3 );
	DBMS_SQL.DEFINE_COLUMN( curAGRUP, 8, recAgrAtual.MUN_CEP	        );
	DBMS_SQL.DEFINE_COLUMN( curAGRUP, 9, recAgrAtual.PLANTIOCORTE   , 7 );
	DBMS_SQL.DEFINE_COLUMN( curAGRUP,10, recAgrAtual.DI4_ESPAC          );
	DBMS_SQL.DEFINE_COLUMN( curAGRUP,11, recAgrAtual.DI4_DECLI          );
	sProcesso := 'Executando DBMS_SQL.EXECUTE';
	nLinhas := DBMS_SQL.EXECUTE( curAGRUP );
	sProcesso := 'Abrindo cursor curGA_ESPEC';
	Open curGA_ESPEC;
	sProcesso := 'Inicio do Loop em curAGRUP';
	loop
		sProcesso := 'Executando DBMS_SQL.FETCH_ROWS';
		exit when DBMS_SQL.FETCH_ROWS( curAGRUP )= 0;
		sProcesso := 'Executando DBMS_SQL.COLUMN_VALUE';
		DBMS_SQL.COLUMN_VALUE( curAGRUP, 1, nID_DIVI4 );
		DBMS_SQL.COLUMN_VALUE( curAGRUP, 2, recAgrAtual.COD_DIVI1       );
		DBMS_SQL.COLUMN_VALUE( curAGRUP, 3, recAgrAtual.COD_DIVI2       );
		DBMS_SQL.COLUMN_VALUE( curAGRUP, 4, recAgrAtual.COD_DIVI3       );
		DBMS_SQL.COLUMN_VALUE( curAGRUP, 5, recAgrAtual.COD_VARIE_USINA );
		DBMS_SQL.COLUMN_VALUE( curAGRUP, 6, recAgrAtual.COD_SOLO_USINA  );
		DBMS_SQL.COLUMN_VALUE( curAGRUP, 7, recAgrAtual.COD_ESTAG_USINA );
		DBMS_SQL.COLUMN_VALUE( curAGRUP, 8, recAgrAtual.MUN_CEP	    );
		DBMS_SQL.COLUMN_VALUE( curAGRUP, 9, recAgrAtual.PLANTIOCORTE    );
		DBMS_SQL.COLUMN_VALUE( curAGRUP,10, recAgrAtual.DI4_ESPAC       );
		DBMS_SQL.COLUMN_VALUE( curAGRUP,11, recAgrAtual.DI4_DECLI       );
		sProcesso := 'Testando os vetores';
		-- gaf_Compara retorna TRUE quando os vetores estao diferentes
		if gaf_Compara then
			sProcesso := 'Pegando um novo numero para ID_ESPEC';
			gap_ProcEspec( 'NOVO' );
		else
			sProcesso := 'Pegando o atual numero para ID_ESPEC';
			gap_ProcEspec( 'ATUAL' );
		end if;
		sProcesso := 'Inserindo em GA_AGRUP, depois de ' || sProcesso;
		insert into GA_AGRUP
			values ( recGA_AGRUP.ID_ESPEC ,
				   recGA_AGRUP.ID_DIVI4 ,
				   nCOD_EMPR,
				   nSAF_ANO_SAFRA,
           null );
	end loop;
	sProcesso := 'Executando DBMS_SQL.CLOSE_CURSOR';
	DBMS_SQL.CLOSE_CURSOR( curAGRUP );
	sProcesso := 'Fechando cruGA_ESPEC';
	close curGA_ESPEC;
	nRetorno := nErro;
	sErro    := sErroSql;
	sProcesso := 'Executando commit';
	commit;
	exception
		When Others Then
			nRetorno  := 1;
			sErro     := substr(sqlerrm,1,240);
			RollBack;
 	          	insert into log_erro values ('Falha na Procedure Gap_Main ' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErro );
			Commit;
			-- Retornando values externos
			nRetorno := nErro;
			sErro    := sErroSql;
end gap_Main;
procedure gap_Criterio( sSelecao in varchar2 ) is
begin
	-- sSelecao sera '0,0,0,0,0,0,0,0,0,0'
	-- COD_DIVI1
	if substr( sSelecao, 01, 1) = '1' then
		recCondAgr.COD_DIVI1 := 1;
	else
		recCondAgr.COD_DIVI1 := 0;
	end if;
	-- COD_DIVI2
	if substr( sSelecao, 03, 1) = '1' then
		recCondAgr.COD_DIVI2 := 1;
	else
		recCondAgr.COD_DIVI2 := 0;
	end if;
	-- COD_DIVI3
	if substr( sSelecao, 05, 1) = '1' then
		recCondAgr.COD_DIVI3 := 1;
	else
		recCondAgr.COD_DIVI3 := 0;
	end if;
	-- COD_VARIE_USINA
	if substr( sSelecao, 07, 1) = '1' then
		recCondAgr.COD_VARIE_USINA := 1;
	else
		recCondAgr.COD_VARIE_USINA := 0;
	end if;
	-- COD_SOLO_USINA
	if substr( sSelecao, 09, 1) = '1' then
		recCondAgr.COD_SOLO_USINA := 1;
	else
		recCondAgr.COD_SOLO_USINA := 0;
	end if;
	-- COD_ESTAG_USINA
	if substr( sSelecao, 11, 1) = '1' then
		recCondAgr.COD_ESTAG_USINA := 1;
	else
		recCondAgr.COD_ESTAG_USINA := 0;
	end if;
	-- MUN_CEP
	if substr( sSelecao, 13, 1) = '1' then
		recCondAgr.MUN_CEP := 1;
	else
		recCondAgr.MUN_CEP := 0;
	end if;
	-- PLANTIOCORTE
	if substr( sSelecao, 15, 1) = '1' then
		recCondAgr.PLANTIOCORTE := 1;
	else
		recCondAgr.PLANTIOCORTE := 0;
	end if;
	-- DI4_ESPAC
	if substr( sSelecao, 17, 1) = '1' then
		recCondAgr.DI4_ESPAC := 1;
	else
		recCondAgr.DI4_ESPAC := 0;
	end if;
	-- DI4_DECLI
	if substr( sSelecao, 19, 1) = '1' then
		recCondAgr.DI4_DECLI := 1;
	else
		recCondAgr.DI4_DECLI := 0;
	end if;
end gap_Criterio;
procedure gap_Orderby Is
begin
	sOrderBy := '';
	if recCondAgr.COD_DIVI1 = 1 then
		sOrderBy := ' COD_DIVI1 ';
	end if;
	if recCondAgr.COD_DIVI2 = 1 then
		if sOrderBy = '' then
			sOrderBy := ' COD_DIVI2 ';
		else
			sOrderBy := sOrderBy || ',COD_DIVI2 ';
		end if;
	end if;
	if recCondAgr.COD_DIVI3 = 1 then
		if sOrderBy = '' then
			sOrderBy := ' COD_DIVI3 ';
		else
			sOrderBy := sOrderBy || ',COD_DIVI3 ';
		end if;
	end if;
	if recCondAgr.COD_VARIE_USINA = 1 then
		if sOrderBy = '' then
			sOrderBy := ' COD_VARIE_USINA ';
		else
			sOrderBy := sOrderBy || ',COD_VARIE_USINA ';
		end if;
	end if;
	if recCondAgr.COD_SOLO_USINA = 1 then
		if sOrderBy = '' then
			sOrderBy := ' COD_SOLO_USINA ';
		else
			sOrderBy := sOrderBy || ',COD_SOLO_USINA ';
		end if;
	end if;
	if recCondAgr.COD_ESTAG_USINA = 1 then
		if sOrderBy = '' then
			sOrderBy := ' COD_ESTAG_USINA ';
		else
			sOrderBy := sOrderBy || ',COD_ESTAG_USINA ';
		end if;
	end if;
	if recCondAgr.MUN_CEP = 1 then
		if sOrderBy = '' then
			sOrderBy := ' MUN_CEP ';
		else
			sOrderBy := sOrderBy || ',MUN_CEP ';
		end if;
	end if;
	if recCondAgr.PLANTIOCORTE = 1 then
		if sOrderBy = '' then
			sOrderBy := ' PLANTIOCORTE ';
		else
			sOrderBy := sOrderBy || ',PLANTIOCORTE ';
		end if;
	end if;
	if recCondAgr.DI4_ESPAC = 1 then
		if sOrderBy = '' then
			sOrderBy := ' DI4_ESPAC ';
		else
			sOrderBy := sOrderBy || ',DI4_ESPAC ';
		end if;
	end if;
	if recCondAgr.DI4_DECLI = 1 then
		if sOrderBy = '' then
			sOrderBy := ' DI4_DECLI ';
		else
			sOrderBy := sOrderBy || ',DI4_DECLI ';
		end if;
	end if;
end gap_OrderBy;
function gaf_Compara return boolean is
bRet boolean;
begin
	bRet := FALSE;
	sProcesso := 'Testando nvl(recAgrAtual.COD_DIVI1,0) != nvl(recAgrAnter.COD_DIVI1,0)';
	if nvl(recAgrAtual.COD_DIVI1,0)    	  != nvl(recAgrAnter.COD_DIVI1,0) and
	   recCondAgr.COD_DIVI1 = 1 then
		bRet := TRUE;
	end if;
	sProcesso := 'Testando nvl(recAgrAtual.COD_DIVI2,0) != nvl(recAgrAnter.COD_DIVI2,0)';
	if nvl(recAgrAtual.COD_DIVI2,0)       != nvl(recAgrAnter.COD_DIVI2,0) and
	   recCondAgr.COD_DIVI2 = 1 then
		bRet := TRUE;
	end if;
	sProcesso := 'Testando nvl(recAgrAtual.COD_DIVI3,0) != nvl(recAgrAnter.COD_DIVI3,0)';
	if nvl(recAgrAtual.COD_DIVI3,0)       != nvl(recAgrAnter.COD_DIVI3,0) and
	   recCondAgr.COD_DIVI3 = 1 then
		bRet := TRUE;
	end if;
	sProcesso := 'Testando nvl(recAgrAtual.COD_VARIE_USINA,0) != nvl(recAgrAnter.COD_VARIE_USINA,0)';
	if nvl(recAgrAtual.COD_VARIE_USINA,0) != nvl(recAgrAnter.COD_VARIE_USINA,0) and
	   recCondAgr.COD_VARIE_USINA = 1 then
		bRet := TRUE;
	end if;
	sProcesso := 'Testando nvl(recAgrAtual.COD_SOLO_USINA,0) != nvl(recAgrAnter.COD_SOLO_USINA,0)';
	if nvl(recAgrAtual.COD_SOLO_USINA,0)  != nvl(recAgrAnter.COD_SOLO_USINA,0)  and
	   recCondAgr.COD_SOLO_USINA = 1 then
		bRet := TRUE;
	end if;
		sProcesso := 'Testando nvl(recAgrAtual.COD_ESTAG_USINA,'' '')  != nvl(recAgrAnter.COD_ESTAG_USINA,'' '')';
	if nvl(recAgrAtual.COD_ESTAG_USINA,' ')  != nvl(recAgrAnter.COD_ESTAG_USINA,' ')  and
	   recCondAgr.COD_ESTAG_USINA = 1 then
		bRet := TRUE;
	end if;
	sProcesso := 'Testando nvl(recAgrAtual.MUN_CEP,0) != nvl(recAgrAnter.MUN_CEP,0)';
	if nvl(recAgrAtual.MUN_CEP,0)         != nvl(recAgrAnter.MUN_CEP,0) and
	   recCondAgr.MUN_CEP = 1 then
		bRet := TRUE;
	end if;
	sProcesso := 'Testando nvl(recAgrAtual.PLANTIOCORTE,'' '') != nvl(recAgrAnter.PLANTIOCORTE,'' '')';
	if nvl(recAgrAtual.PLANTIOCORTE,' ')    != nvl(recAgrAnter.PLANTIOCORTE,' ') and
	   recCondAgr.PLANTIOCORTE = 1 then
		bRet := TRUE;
	end if;
	sProcesso := 'Testando nvl(recAgrAtual.DI4_ESPAC,0)!= nvl(recAgrAnter.DI4_ESPAC,0)';
	if nvl(recAgrAtual.DI4_ESPAC,0)       != nvl(recAgrAnter.DI4_ESPAC,0) and
	   recCondAgr.DI4_ESPAC = 1 then
		bRet := TRUE;
	end if;
	sProcesso := 'Testando nvl(recAgrAtual.DI4_DECLI,0) != nvl(recAgrAnter.DI4_DECLI,0)';
	if nvl(recAgrAtual.DI4_DECLI,0)       != nvl(recAgrAnter.DI4_DECLI,0) and
	   recCondAgr.DI4_DECLI = 1 then
		bRet := TRUE;
	end if;
	if bRet then
		-- Linha Atual e diferente da linha anterior
		sProcesso := 'Atribuindo valores atuais em recAgrAnter';
		recAgrAnter.COD_DIVI1        := recAgrAtual.COD_DIVI1;
		recAgrAnter.COD_DIVI2        := recAgrAtual.COD_DIVI2;
		recAgrAnter.COD_DIVI3        := recAgrAtual.COD_DIVI3;
		recAgrAnter.COD_VARIE_USINA  := recAgrAtual.COD_VARIE_USINA;
		recAgrAnter.COD_SOLO_USINA   := recAgrAtual.COD_SOLO_USINA;
		recAgrAnter.COD_ESTAG_USINA  := recAgrAtual.COD_ESTAG_USINA;
		recAgrAnter.MUN_CEP          := recAgrAtual.MUN_CEP;
		recAgrAnter.PLANTIOCORTE     := recAgrAtual.PLANTIOCORTE;
		recAgrAnter.DI4_ESPAC        := recAgrAtual.DI4_ESPAC;
		recAgrAnter.DI4_DECLI        := recAgrAtual.DI4_DECLI;
	else
		sProcesso := 'Mantendo valores atuais em recAgrAnter';
	end if;
	sProcesso := 'Retornado valor para funcao';
	return bRet;
end gaf_compara;
procedure gap_ProcEspec( cTipo in varchar2 ) is
cursor curMAXID is
	select nvl( max ( ID_ESPEC ),0 ) + 1
		from GA_ESPEC;
cursor curMAXCOD is
	select nvl( max ( COD_ESPEC ),0 ) + 1
		from GA_ESPEC
		    where COD_GRUPO = nCOD_GRUPO
			and COD_SUBGR = nCOD_SUBGR;
nMaxID  GA_ESPEC.ID_ESPEC%TYPE;
nMaxCOD GA_ESPEC.COD_ESPEC%TYPE;
begin
	if cTipo = 'NOVO' then
		sProcesso := 'Executando fetch em curGA_ESPEC';
		fetch curGA_ESPEC into recGA_ESPEC;
		if curGA_ESPEC%NOTFOUND then
			sProcesso := 'Nao foi encontrado mais linhas em curGA_AGRUP';
			Open curMAXID;
			fetch curMAXID into nMAXID;
			Open curMAXCOD;
			fetch curMAXCOD into nMAXCOD;
			sProcesso := 'Inserindo em GA_ESPEC';
			insert into GA_ESPEC
				values ( nMAXID,
					   nCOD_GRUPO,
					   nCOD_SUBGR,
					   nMAXCOD,
					   'BLOCO - ' || lpad( nMAXCOD, 5,'0' ),
					   'BL- ' || lpad( nMAXCOD, 5, '0' ),
					   null,
             null );
			recGA_AGRUP.ID_ESPEC := nMAXID;
			nID_ESPEC := nMAXID;
			close curMAXID;
			close curMAXCOD;
		else
			sProcesso := 'Encontrado proxima linhas em curGA_AGRUP';
			recGA_AGRUP.ID_ESPEC := recGA_ESPEC.ID_ESPEC;
			nID_ESPEC := recGA_ESPEC.ID_ESPEC;
		end if;
	elsif cTipo = 'ATUAL' then
		sProcesso := 'Retornando o ID_ESPEC atual';
		recGA_AGRUP.ID_ESPEC := nID_ESPEC;
	end if;
	recGA_AGRUP.ID_DIVI4 := nID_DIVI4;
	exception
		When Others Then
			nErro    := 1;
                  sErroSql := Substr(SqlErrm,1,240);
			RollBack;
 	          	Insert Into Log_Erro Values ('Falha na Procedure Gap_ProcEspec ' || ' ' ||
	                                          USER || ' ' || to_char( SYSDATE , 'DD-MM-YY HH24:MI:SS ' ) || ' ' ||
								sProcesso || ' ' || sErroSql );
			Commit;
end gap_ProcEspec;
END GAPK_AGRUPDINAMICO;
