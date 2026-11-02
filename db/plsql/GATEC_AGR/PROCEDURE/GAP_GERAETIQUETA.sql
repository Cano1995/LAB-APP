CREATE OR REPLACE procedure Gap_GeraEtiqueta( nIDD4    In     Number,
					      nVAR     in     number,
                                              cEtq     In Out varchar2,
                                              nRetorno In Out Number )
Is

nNextSeq Number := 0;

nCOD_DIVI1 number(1) := 2;
nCOD_DIVI2 number(1) := 3;
nCOD_DIVI3 number(1) := 2;
nCOD_DIVI4 number(1) := 2;
nVARIE	   number(1) := 4;

Cursor curDivi4 Is
   Select COD_DIVI1,
          COD_DIVI2,
          COD_DIVI3,
          COD_DIVI4
       From GA_DIVI4
	 where ID_DIVI4 = nIDD4;
regDivi4 curDivi4%ROWTYPE;

/*
cursor curNextSeq Is
   Select Nvl(Max(PAN_NUMER),0)
      From GA_PRE_ANALI,
           GA_MOV_PRE_ANALI
         Where PAN_NUMER Like '20%'
           And Substr(lpad(PAN_NUMER,12,'0'),1,3) = '020'
           And GA_PRE_ANALI.ID_PRE_ANALI = GA_MOV_PRE_ANALI.ID_PRE_ANALI
           And GA_MOV_PRE_ANALI.ID_DIVI4 = nIDD4
           And GA_MOV_PRE_ANALI.MPA_FLAG_ORIGEM = 1;
*/

cursor curGA_ETQ_MONTA is
	select *
		from GA_ETQ_MONTA
			where MON_TIPO = 'PREANALI';
regGA_ETQ_MONTA curGA_ETQ_MONTA%ROWTYPE;

-- Cursor para quando usar PREFIXO+COD_DIVI4+VARIEDADE+SEQUENCIA

Cursor curNextSeq Is
   Select Nvl(Max(PAN_NUMER),0)
   From   GA_PRE_ANALI,
          GA_MOV_PRE_ANALI
   Where  GA_PRE_ANALI.ID_PRE_ANALI = GA_MOV_PRE_ANALI.ID_PRE_ANALI
   And    Lpad(SUBSTR(GA_PRE_ANALI.PAN_NUMER,6,4),4,'0') = Lpad(nVAR,nVARIE,'0')
   And    GA_MOV_PRE_ANALI.ID_DIVI4 = nIDD4
   And    GA_MOV_PRE_ANALI.MPA_FLAG_ORIGEM = 1;

-- Cursor para quando usar PREFIXO+COD_DIVI4+SEQUENCIA

Cursor curNextSeq2 Is
   Select TO_CHAR(Nvl(Max(PAN_NUMER),0))
   From   GA_PRE_ANALI,
          GA_MOV_PRE_ANALI
   Where  GA_PRE_ANALI.ID_PRE_ANALI = GA_MOV_PRE_ANALI.ID_PRE_ANALI
   And    GA_MOV_PRE_ANALI.ID_DIVI4 = nIDD4
   And    GA_MOV_PRE_ANALI.MPA_FLAG_ORIGEM = 1
   And    Lpad(SUBSTR(GA_PRE_ANALI.PAN_NUMER,6,3),3,'0') in
  (Select max(Lpad(SUBSTR(GA_PRE_ANALI.PAN_NUMER,6,3),3,'0'))
   From   GA_PRE_ANALI,
          GA_MOV_PRE_ANALI
   Where  GA_PRE_ANALI.ID_PRE_ANALI = GA_MOV_PRE_ANALI.ID_PRE_ANALI
   And    length(GA_PRE_ANALI.PAN_NUMER)  = 8
   And    GA_MOV_PRE_ANALI.ID_DIVI4 = nIDD4
   And    GA_MOV_PRE_ANALI.MPA_FLAG_ORIGEM = 1);


-- Cursor para quando usar PREFIXO+SEQUENCIA

Cursor curNextSeq3 Is
   Select TO_CHAR(Nvl(Max(PAN_NUMER),0))
   From   GA_PRE_ANALI,
          GA_MOV_PRE_ANALI
   Where  GA_PRE_ANALI.ID_PRE_ANALI = GA_MOV_PRE_ANALI.ID_PRE_ANALI
   And    GA_MOV_PRE_ANALI.MPA_FLAG_ORIGEM = 1
   And    Lpad(SUBSTR(GA_PRE_ANALI.PAN_NUMER,2,4),4,'0') in
  (Select max(Lpad(SUBSTR(GA_PRE_ANALI.PAN_NUMER,2,4),4,'0'))
   From   GA_PRE_ANALI,
          GA_MOV_PRE_ANALI
   Where  GA_PRE_ANALI.ID_PRE_ANALI = GA_MOV_PRE_ANALI.ID_PRE_ANALI
   And    length(GA_PRE_ANALI.PAN_NUMER)  = 5
   And    GA_MOV_PRE_ANALI.MPA_FLAG_ORIGEM = 1);

-- Cursor para quando usar PREFIXO+COD_DIVI2+COD_DIVI3+COD_DIVI4+SEQUENCIA

Cursor curNextSeq4 Is
   Select TO_CHAR(Nvl(Max(PAN_NUMER),0))
   From   GA_PRE_ANALI,
          GA_MOV_PRE_ANALI
   Where  GA_PRE_ANALI.ID_PRE_ANALI = GA_MOV_PRE_ANALI.ID_PRE_ANALI
   And    GA_MOV_PRE_ANALI.ID_DIVI4 = nIDD4
   And    GA_MOV_PRE_ANALI.MPA_FLAG_ORIGEM = 1
   And    Lpad(SUBSTR(GA_PRE_ANALI.PAN_NUMER,9,3),3,'0') in
  (Select max(Lpad(SUBSTR(GA_PRE_ANALI.PAN_NUMER,9,3),3,'0'))
   From   GA_PRE_ANALI,
          GA_MOV_PRE_ANALI
   Where  GA_PRE_ANALI.ID_PRE_ANALI = GA_MOV_PRE_ANALI.ID_PRE_ANALI
   And    length(GA_PRE_ANALI.PAN_NUMER) >=  10
   And    GA_MOV_PRE_ANALI.ID_DIVI4 = nIDD4
   And    GA_MOV_PRE_ANALI.MPA_FLAG_ORIGEM = 1);

ErroSql Varchar2(2000);

sColunas varchar2(100);
sProcesso varchar2(2000);
sEtqAux varchar2(20);

Begin

	cEtq := null;

	sProcesso := 'Executando open curDivi4';
	open curDivi4;
	fetch curDivi4 into regDivi4;
	close curDivi4;

	sProcesso := 'Executando open curGA_ETQ_MONTA';
	open curGA_ETQ_MONTA;
	fetch curGA_ETQ_MONTA into regGA_ETQ_MONTA;

	If curGA_ETQ_MONTA%FOUND then

		sProcesso := 'Montando colunas';
		-- Alterar o tamanho do LPAD conforme a utilização da usina
		if instr( regGA_ETQ_MONTA.MON_CAMPO , 'COD_DIVI1') != 0 then
			sColunas := lpad( regDivi4.COD_DIVI1, nCOD_DIVI1, '0' );
		end if;

		if instr( regGA_ETQ_MONTA.MON_CAMPO , 'COD_DIVI2' ) != 0 then
			sColunas := nvl(sColunas,'') || lpad( regDivi4.COD_DIVI2, nCOD_DIVI2, '0' );
		end if;

		if instr( regGA_ETQ_MONTA.MON_CAMPO , 'COD_DIVI3' ) != 0 then
			sColunas := nvl(sColunas,'') || lpad( regDivi4.COD_DIVI3, nCOD_DIVI3, '0' );
		end if;

		if instr( regGA_ETQ_MONTA.MON_CAMPO , 'COD_DIVI4' ) != 0 then
			sColunas := nvl(sColunas,'') || lpad( regDivi4.COD_DIVI4, nCOD_DIVI4, '0' );
		end if;

		if instr( regGA_ETQ_MONTA.MON_CAMPO , 'VAR' ) != 0 then
			sColunas := nvl(sColunas,'') || lpad( nVAR, nVARIE, '0' );
		end if;


	end if;

        sProcesso := 'Procurando numero sequencial';

        if   RTRIM(regGA_ETQ_MONTA.MON_CAMPO) = ' COD_DIVI4 +  VAR' AND regGA_ETQ_MONTA.MON_SUFIXO = 'SEQ' then

                   open curNextSeq;
                   fetch curNextSeq into nNextSeq;
                   close curNextSeq;

               	   nNextSeq := substr(nNextSeq,9,3);
 		   nNextSeq := nvl(nNextSeq,0) + 1;

        elsif RTRIM(regGA_ETQ_MONTA.MON_CAMPO) = ' COD_DIVI4' AND regGA_ETQ_MONTA.MON_SUFIXO = 'SEQ' then

                   open  curNextSeq2;
                   fetch curNextSeq2 into nNextSeq;
                   close curNextSeq2;

               	   nNextSeq := substr(nNextSeq,6,3);
 		   nNextSeq := nvl(nNextSeq,0) + 1;

        elsif RTRIM(regGA_ETQ_MONTA.MON_CAMPO) is null AND regGA_ETQ_MONTA.MON_SUFIXO = 'SEQ' then

                   open  curNextSeq3;
                   fetch curNextSeq3 into nNextSeq;
                   close curNextSeq3;

               	   nNextSeq := substr(nNextSeq,2,4);
 		   nNextSeq := nvl(nNextSeq,0) + 1;

       elsif regGA_ETQ_MONTA.MON_SUFIXO = 'SEQ' then

                   open  curNextSeq4;
                   fetch curNextSeq4 into nNextSeq;
                   close curNextSeq4;

                   nNextSeq := substr(nNextSeq,length(nNextSeq)-2,3);

 		   nNextSeq := nvl(nNextSeq,0) + 1;

	end if;

--	cEtq := '020' || lpad(regDivi4.COD_DIVI2,2,'0') || lpad(regDivi4.COD_DIVI3,2,'0') || lpad(regDivi4.COD_DIVI4,2,'0') || lpad(nNextSeq,3,'0');

	sProcesso := 'Montando PAN_NUMER';

        if RTRIM(regGA_ETQ_MONTA.MON_CAMPO) is null AND regGA_ETQ_MONTA.MON_SUFIXO = 'SEQ' then

              sEtqAux := nvl(regGA_ETQ_MONTA.MON_PREFIXO,'') || rtrim(ltrim(sColunas)) || lpad(nNextSeq,4,'0');

        else

              sEtqAux := nvl(regGA_ETQ_MONTA.MON_PREFIXO,'') || rtrim(ltrim(sColunas)) || lpad(nNextSeq,3,'0');

        end if;

	if length( sEtqAux ) > 12 then
		cEtq := '999999999999';
	else
		cEtq := sEtqAux;
	end if;

	close curGA_ETQ_MONTA;

  exception
        when others Then
                nRetorno := 1;
                errosql := substr( SQLERRM , 1, 240 );
                insert into log_erro values
                ( 'Falha na Procedure Gap_GeraEtiqueta ' || USER || ' ' ||
                  TO_CHAR( SYSDATE , 'DD-MM-YY-HH24:MI:SS' ) || sProcesso || ' - ' ||
                  ErroSql  );
end;

 