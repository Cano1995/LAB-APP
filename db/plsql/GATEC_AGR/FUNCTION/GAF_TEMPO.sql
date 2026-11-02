CREATE OR REPLACE Function  gaf_Tempo( nCOD_EMPR      in     number,
 				 nSAF_ANO_SAFRA in     number,
				 nCOD_DIVI1     in     number,
				 nCOD_DIVI2     in     number,
				 nCOD_FRENTE    in     number,
				 nCOD_AGRUP     in     number,
				 nNRO_CARGA     in     number,
				 nID_CONJU      in     number ) return number is
-- Declarar variaveis locais
nMaximo number;
nTempoCiclos number;
nTempoCampo  number;
cursor curColheTrans is
	select count( distinct(
			decode( mis.ID_CLAS_EQUIP,
					14, mis.COD_MIS,
					null ) ) ) COLHEDORA,
		 count( distinct(
			decode( mis.ID_CLAS_EQUIP,
					23, mis.COD_MIS,
					null ) ) ) TRANSBORDO
		from  GA_FRENTE_D2_EQUIP fre,
			GA_CPMIS_COMPL_MIS mis
			where fre.COD_MIS = mis.COD_MIS
			  and fre.COD_EMPR = nCOD_EMPR
			  and fre.SAF_ANO_SAFRA = nSAF_ANO_SAFRA
			  and fre.COD_DIVI1 = nCOD_DIVI1
			  and fre.COD_DIVI2 = nCOD_DIVI2
			  and fre.COD_FRENTE = nCOD_FRENTE;
regColheTrans curColheTrans%ROWTYPE;
cursor curTempoDefault is
	select ( ( DI2_DIST_MED_T1  / COMP_T1_VAZIO    ) * 60 +
		   ( DI2_DIST_MED_T1  / COMP_T1_CARRE    ) * 60 +
		   ( DI2_DIST_MED_T2  / COMP_T2_VAZIO    ) * 60 +
		   ( DI2_DIST_MED_T2  / COMP_T2_CARRE    ) * 60 +
		   ( DI2_DIST_MED_ASF / COMP_ASF_VAZIO   ) * 60 +
		   ( DI2_DIST_MED_ASF / COMP_ASF__CARRE  ) * 60 ) TEMPO
	    from GA_DIVI2         di2,
		   GA_COMPOS_AGRUP  agr
		 where di2.COD_DIVI2 = nCOD_DIVI2
		   and di2.COD_DIVI1 = nCOD_DIVI1
		   and di2.SAF_ANO_SAFRA = nSAF_ANO_SAFRA
		   and di2.COD_EMPR = nCOD_EMPR
		   and COMP_NR_CARGAS  = nNRO_CARGA
		   and COD_AGRUP       = nCOD_AGRUP;
regTempoDefault curTempoDefault%ROWTYPE;
cursor curContarCiclos is
	select count( ID_CICLO_EXTERNO ) QUANTOS,
		   avg( CIE_TEMPO_CICLO  ) TMPCICLOS
		from GA_CICLOS_EXTERNOS
		  where CIE_TEMPO_CICLO   <= nMaximo
		    and COD_EMPR_CHEG      = nCOD_EMPR
		    and SAF_ANO_SAFRA_CHEG = nSAF_ANO_SAFRA
		    and COD_DIVI1_CHEG     = nCOD_DIVI1
		    and COD_DIVI2_CHEG     = nCOD_DIVI2
		    and COD_FRENTE_CHEG    = nCOD_FRENTE
		    and ID_CONJU_CHEG      = nID_CONJU
		    and CIE_ATIVO          != 'N'
		    and CIE_TEMPO_CICLO    > 0;
regContarCiclos curContarCiclos%ROWTYPE;
cursor curGA_CONFIG_CTR is
	select CON_MARG_CICLO,
		 CON_NUM_VIAG_CICLO,
		 CON_TMP_CAMPO_INTE,
		 CON_TMP_CAMPO_PICA,
		 CON_TMP_CAMPO_PICA_TRANS
		from GA_CONFIG_CTR;
regGA_CONFIG_CTR curGA_CONFIG_CTR%ROWTYPE;
begin
	-- Abrindo configuracao
	open curGA_CONFIG_CTR;
	fetch curGA_CONFIG_CTR into regGA_CONFIG_CTR;
	-- Calculando tempo padrao para Agrupamento/Cargas
	open curTempoDefault;
	fetch curTempoDefault into regTempoDefault;
	nMaximo := regTempoDefault.TEMPO * ( 1 + ( regGA_CONFIG_CTR.CON_MARG_CICLO / 100 ) );
	open curContarCiclos;
	fetch curContarCiclos into regContarCiclos;
	if regContarCiclos.QUANTOS > regGA_CONFIG_CTR.CON_NUM_VIAG_CICLO then
			-- Pegando media dos ciclos
			nTempoCiclos := regContarCiclos.TMPCICLOS;
--			nTempoCiclos := regGA_CONFIG_CTR.CON_NUM_VIAG_CICLO;
	else
			-- Pegando valor default
			nTempoCiclos := regTempoDefault.TEMPO;
--			nTempoCiclos := regGA_CONFIG_CTR.CON_NUM_VIAG_CICLO;
	end if;
	close curTempoDefault;
	close curContarCiclos;
	-- Verificar se existe Colhedoras e Transbordo
	open curColheTrans;
	fetch curColheTrans into regColheTrans;
	if regColheTrans.COLHEDORA > 0 then
		-- Verificar se existe TRANSBORDO
		if regColheTrans.TRANSBORDO > 0 then
			nTempoCampo := regGA_CONFIG_CTR.CON_TMP_CAMPO_PICA_TRANS;
		else
			nTempoCampo := regGA_CONFIG_CTR.CON_TMP_CAMPO_PICA;
		end if;
	else
		nTempoCampo := regGA_CONFIG_CTR.CON_TMP_CAMPO_INTE;
	end if;
--       	insert into tmp_tempo (tmp_ciclo, tmp_config)
--	 values (nTempoCiclos, nTempoCampo);
--	commit;
--	nTempoCiclos := nTempoCiclos + nTempoCampo;
	close curColheTrans;
	close curGA_CONFIG_CTR;
	return nTempoCampo;
end gaf_Tempo;

 