CREATE OR REPLACE package gapk_CtrTrafego is
-- Area para variaveis globais
	gTmpCampo number;
	gTmpCiclos number;
	-- Tempo do Ciclo para vazao dos caminhoes
	function gaf_TempoCiclo( nCOD_EMPR      in     number,
 				       nSAF_ANO_SAFRA in     number,
					 nCOD_DIVI1     in     number,
					 nCOD_DIVI2     in     number,
					 nCOD_FRENTE    in     number,
					 nCOD_AGRUP     in     number,
					 nNRO_CARGA     in     number,
					 nID_CONJU      in     number ) return number;
	pragma restrict_references( gaf_TempoCiclo, 'WNDS' ) ;
	-- Tempo do Ciclo para vazao dos caminhoes em IDA
	function gaf_TempoCicloIda( 	nCOD_EMPR      in     number,
 				       	nSAF_ANO_SAFRA in     number,
						nCOD_DIVI1     in     number,
						nCOD_DIVI2     in     number,
						nCOD_FRENTE    in     number,
						nCOD_AGRUP     in     number,
						nNRO_CARGA     in     number,
						nID_CONJU      in     number ) return number;
	pragma restrict_references( gaf_TempoCicloIda, WNDS ) ;
	-- Peso do ciclo para vazao dos caminhoes
	function gaf_PesoCiclo( nCOD_EMPR      in     number,
	 				nSAF_ANO_SAFRA in     number,
					nCOD_DIVI1     in     number,
					nCOD_DIVI2     in     number,
					nCOD_FRENTE    in     number,
					nCOD_AGRUP     in     number,
					nID_CONJU      in     number ) return number;
	pragma restrict_references( gaf_PesoCiclo, 'WNDS' ) ;
	-- Procedure para calculo da vazao para ID_CLASS_EQUIP = 10 ( Caminhao )
	procedure gap_CalcClasse10( nCOD_EMPR      in     number,
					    nSAF_ANO_SAFRA in     number,
					    nCOD_DIVI1     in     number,
					    nCOD_DIVI2     in     number,
					    nCOD_FRENTE    in     number,
				          nRetorno       in out number,
					    sErroSql       in out varchar2 );
	-- Procedure para calculo da vazao para ID_CLASS_EQUIP = 3 ( Carregadora )
	procedure gap_CalcClasse3(  nCOD_EMPR      in     number,
					    nSAF_ANO_SAFRA in     number,
					    nCOD_DIVI1     in     number,
					    nCOD_DIVI2     in     number,
					    nCOD_FRENTE    in     number,
					    nCOD_AGRUP	 in     number,
					    nPesoMedio     in out number,
				          nRetorno       in out number,
					    sErroSql       in out varchar2 );
	-- Procedure para calculo da vazao para ID_CLASS_EQUIP = 14 ( Colhedora )
	procedure gap_CalcClasse14( nCOD_EMPR      in     number,
					    nSAF_ANO_SAFRA in     number,
					    nCOD_DIVI1     in     number,
					    nCOD_DIVI2     in     number,
					    nCOD_FRENTE    in     number,
					    nCOD_AGRUP	 in     number,
					    nPesoMedio     in out number,
				          nRetorno       in out number,
					    sErroSql       in out varchar2 );
	-- Procedure para atualizar o Défict/Excesso da frente
	procedure gap_CalcDefExc( nCOD_EMPR      in     number,
					  nSAF_ANO_SAFRA in     number,
					  nCOD_DIVI1     in     number,
					  nCOD_DIVI2     in     number,
					  nCOD_FRENTE    in     number,
					  nRetorno       in out number,
				  	  sErroSql       in out varchar2 );
end gapk_CtrTrafego;

 