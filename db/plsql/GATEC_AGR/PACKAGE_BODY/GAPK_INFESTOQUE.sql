CREATE OR REPLACE package body gapk_InfEstoque as
function gaf_TempoParado( nCOD_EMPR      in number,
			   	  nSAF_ANO_SAFRA in number,
                  	  nID_HILO       in number,
				  dDataIni	     in date  ,
				  dDataFim	     in date ) return number is
cursor curGA_INF_PARADA is
	select sum( PAR_TEMPO ) PAR_TEMPO
	    from GA_INF_PARADA
		where
		      gaf_DataCompleta( PAR_DATA_INICIO,
					      PAR_HORA_INICIO ) >= dDataIni
		  and gaf_DataCompleta( PAR_DATA_FINAL,
					      PAR_HORA_FINAL ) <= dDataFim
		  and ID_HILO	  = nID_HILO
		  and SAF_ANO_SAFRA = nSAF_ANO_SAFRA
	        and COD_EMPR      = nCOD_EMPR;
regGA_INF_PARADA curGA_INF_PARADA%ROWTYPE;
begin
	open curGA_INF_PARADA;
	fetch curGA_INF_PARADA into regGA_INF_PARADA;
	close curGA_INF_PARADA;
	return regGA_INF_PARADA.PAR_TEMPO;
end gaf_TempoParado;
function gaf_PosicaoEstoq( cTipo		in varchar2,
				   nCOD_EMPR	in number,
				   nSAF_ANO_SAFRA in number,
				   nID_HILO	      in number,
				   dDataIni		in date  ) return number is
cursor curGA_INF_ESTOQUE is
	select nvl(IES_PESO,0) IES_PESO,
	       nvl(IES_VIAGEM,0) IES_VIAGEM
	from   GA_INF_ESTOQUE
	where  gaf_DataCompleta( IES_DATA, IES_HORA ) =
		(select max( gaf_DataCompleta( IES_DATA, IES_HORA ) )
		 from  GA_INF_ESTOQUE est
		 ----where gaf_DataCompleta( IES_DATA, IES_HORA ) <= dDataini
             Where  trunc(IES_DATA) = trunc(dDataini)
		   and  est.ID_HILO = GA_INF_ESTOQUE.ID_HILO
		   and  est.SAF_ANO_SAFRA = GA_INF_ESTOQUE.SAF_ANO_SAFRA
		   and  est.COD_EMPR = GA_INF_ESTOQUE.COD_EMPR  )
	and    ID_HILO = nID_HILO
	and    SAF_ANO_SAFRA = nSAF_ANO_SAFRA
	and    COD_EMPR = nCOD_EMPR;
regGA_INF_ESTOQUE curGA_INF_ESTOQUE%ROWTYPE;
begin
	open curGA_INF_ESTOQUE;
	fetch curGA_INF_ESTOQUE into regGA_INF_ESTOQUE;
      IF   SQL%NOTFOUND  THEN
           regGA_INF_ESTOQUE.IES_PESO   := 0;
           regGA_INF_ESTOQUE.IES_VIAGEM := 0;
      END IF;
	close curGA_INF_ESTOQUE;
	if cTipo = 'PESO' then
		return regGA_INF_ESTOQUE.IES_PESO;
	else
		return regGA_INF_ESTOQUE.IES_VIAGEM;
	end if;
end gaf_PosicaoEstoq;
end gapk_InfEstoque;
