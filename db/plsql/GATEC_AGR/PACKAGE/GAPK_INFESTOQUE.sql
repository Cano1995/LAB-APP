CREATE OR REPLACE package gapk_InfEstoque as
	function gaf_TempoParado( nCOD_EMPR      in number,
				    	  nSAF_ANO_SAFRA in number,
	                  	  nID_HILO       in number,
					  dDataIni	     in date  ,
					  dDataFim	     in date ) return number;
	pragma restrict_references( gaf_TempoParado, 'WNDS' );
	function gaf_PosicaoEstoq( cTipo		in varchar2,
					   nCOD_EMPR	in number,
					   nSAF_ANO_SAFRA in number,
					   nID_HILO	      in number,
					   dDataIni		in date ) return number;
	pragma restrict_references( gaf_PosicaoEstoq, 'WNDS' );
end gapk_InfEstoque;

 