CREATE OR REPLACE PACKAGE GAPK_AGRUPDINAMICO IS
type typCondAgr is record (
	COD_DIVI1       number(1),
	COD_DIVI2       number(1),
	COD_DIVI3       number(1),
	COD_VARIE_USINA number(1),
	COD_SOLO_USINA  number(1),
	COD_ESTAG_USINA number(1),
	MUN_CEP         number(1),
	PLANTIOCORTE    number(1),
	DI4_ESPAC       number(1),
	DI4_DECLI       number(1) );
recCondAgr typCondAgr;
type typAgrup is record (
	COD_DIVI1       GA_DIVI4.COD_DIVI1%TYPE            ,
	COD_DIVI2       GA_DIVI4.COD_DIVI2%TYPE            ,
	COD_DIVI3       GA_DIVI4.COD_DIVI3%TYPE            ,
	COD_VARIE_USINA GA_VARIE_USINA.COD_VARIE_USINA%TYPE,
	COD_SOLO_USINA  GA_SOLOS_USINA.COD_SOLO_USINA%TYPE ,
	COD_ESTAG_USINA GA_DIVI4.COD_ESTAG_USINA%TYPE      ,
	MUN_CEP         GA_DIVI4.MUN_CEP%TYPE              ,
	PLANTIOCORTE    varchar2(7)                        ,
	DI4_ESPAC       GA_DIVI4.DI4_ESPAC%TYPE            ,
	DI4_DECLI       GA_DIVI4.DI4_DECLI%TYPE             );
-- Agrupamento Atual
recAgrAtual typAgrup;
-- Agrupamento Anterior
recAgrAnter typAgrup;
type typGA_AGRUP is record
(     ID_ESPEC  GA_AGRUP.ID_ESPEC%TYPE,
	ID_DIVI4  GA_AGRUP.ID_DIVI4%TYPE );
-- Agrup. para insert
recGA_AGRUP typGA_AGRUP;
-- Variaveis
nErro          number(1);
sErroSql 	   varchar2(240);
sProcesso      varchar2(240);  -- Rotina atual
nLinhas        integer;		 -- Linhas cursor dinamico
sSelect        varchar2(2000);
sOrderBy       varchar2(2000);
nID_DIVI4 	   GA_DIVI4.ID_DIVI4%TYPE;
nCOD_GRUPO     GA_ESPEC.COD_GRUPO%TYPE;
nCOD_SUBGR     GA_ESPEC.COD_SUBGR%TYPE;
nID_ESPEC      GA_ESPEC.ID_ESPEC%TYPE;
curAGRUP       number;
-- Cursores
-- ID_ESPEC que ja existem
cursor curGA_ESPEC is
	select ID_ESPEC
		from GA_ESPEC
		  where COD_GRUPO = nCOD_GRUPO
		    and COD_SUBGR = nCOD_SUBGR
           order by ID_ESPEC;
recGA_ESPEC curGA_ESPEC%ROWTYPE;
-- Proced. Principal
	procedure gap_Main( nCOD_EMPR      in number,
				  nSAF_ANO_SAFRA in number,
				  sSelecao       in varchar2,
     				  pCOD_GRUPO     in number,
				  pCOD_SUBGR     in number,
				  nRetorno       in out number,
				  sErro          in out varchar2 );
-- Criterios de Selecao
	procedure gap_Criterio( sSelecao in varchar2 );
-- Order By segundo os criterio
	procedure gap_Orderby;
-- teste do vetor atual com vetor anterior
	function gaf_Compara return boolean;
-- Procurar o ID_ESPEC necessario
	procedure gap_ProcEspec( cTipo in varchar2 );
END GAPK_AGRUPDINAMICO;

 