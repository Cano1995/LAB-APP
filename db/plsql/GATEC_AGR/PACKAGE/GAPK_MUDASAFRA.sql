CREATE OR REPLACE Package Gapk_MudaSafra As
nFalha    number;
nLinhas   integer;
sProcesso varchar2(2000);
sErroSQL  varchar2(2000);
nCOD_EMPR GA_EMPR.COD_EMPR%TYPE;
nSAF_ANO_SAFRA GA_SAFRAS.SAF_ANO_SAFRA%TYPE;
Type typGA_DIVI4 Is Record (
	ID_DIVI4           GA_DIVI4.ID_DIVI4%TYPE,
	COD_EMPR           GA_DIVI4.COD_EMPR%TYPE,
	SAF_ANO_SAFRA      GA_DIVI4.SAF_ANO_SAFRA%TYPE,
	COD_DIVI1          GA_DIVI4.COD_DIVI1%TYPE,
	COD_DIVI2          GA_DIVI4.COD_DIVI2%TYPE,
	COD_DIVI3          GA_DIVI4.COD_DIVI3%TYPE,
	COD_DIVI4          GA_DIVI4.COD_DIVI4%TYPE,
	ID_FUNDO_AGRIC     GA_DIVI4.ID_FUNDO_AGRIC%TYPE,
	COD_ESTAG_USINA    GA_DIVI4.COD_ESTAG_USINA%TYPE,
	MUN_CEP            GA_DIVI4.MUN_CEP%TYPE,
	DI4_AREA_TOTAL     GA_DIVI4.DI4_AREA_TOTAL%TYPE,
	DI4_AREA_INUTI     GA_DIVI4.DI4_AREA_INUTI%TYPE,
	DI4_AREA_CARRE     GA_DIVI4.DI4_AREA_CARRE%TYPE,
	DI4_ESPAC          GA_DIVI4.DI4_ESPAC%TYPE,
	DI4_DECLI          GA_DIVI4.DI4_DECLI%TYPE,
	DI4_SITUA          GA_DIVI4.DI4_SITUA%TYPE,
	DI4_DT_PLANT       GA_DIVI4.DI4_DT_PLANT%TYPE,
	DI4_DT_CORTE_ANTER GA_DIVI4.DI4_DT_CORTE_ANTER%TYPE,
	DI4_DT_PRIM_CORTE  GA_DIVI4.DI4_DT_PRIM_CORTE%TYPE,
	DI4_DT_CORTE_ATUAL GA_DIVI4.DI4_DT_CORTE_ATUAL%TYPE,
	DI4_LATIT          GA_DIVI4.DI4_LATIT%TYPE,
	DI4_LONG           GA_DIVI4.DI4_LONG%TYPE,
	DI4_ALTIT          GA_DIVI4.DI4_ALTIT%TYPE,
	DI4_COORD_ORTOG_X  GA_DIVI4.DI4_COORD_ORTOG_X%TYPE,
	DI4_COORD_ORTOG_Y  GA_DIVI4.DI4_COORD_ORTOG_Y%TYPE,
	DI4_COORD_ORTOG_Z  GA_DIVI4.DI4_COORD_ORTOG_Z%TYPE,
	DI4_PER_URB_LEGAL  GA_DIVI4.DI4_PER_URB_LEGAL%TYPE,
	DI4_PER_URB_EFET   GA_DIVI4.DI4_PER_URB_EFET%TYPE,
	DI4_DT_DIGIT       GA_DIVI4.DI4_DT_DIGIT%TYPE,
	DI4_HR_DIGIT       GA_DIVI4.DI4_HR_DIGIT%TYPE,
	DI4_OPER_DIGIT     GA_DIVI4.DI4_OPER_DIGIT%TYPE );
recGA_DIVI4 typGA_DIVI4;
--      Procedure Gap_DuplicaTrigger( typGA_DIVI4 In     typGA_DIVI4 ,
--                                              nRetorno    In Out Number );
	Procedure Gap_DuplicaMain( sWhere    In     varchar2,
					   sWhereDel In     varchar2,
					   nRepro    In     number,
					   nQuantos  In Out number,
					   nDeletado in Out number,
					 sErro   in Out varchar2,
					   nRetorno  In Out number );
	Procedure Gap_DuplicaInicio( nID_DIVI4 In     Number,
					     nRetorno  In Out Number );
	Function  Gaf_Sequencia( sTabela In varchar2,
					 sColuna in varchar2,
					 nTamCol In number ) Return Number;
	Procedure Gap_DuplicaDeleta( sWhere   In     varchar2,
					     nRetorno In Out number );
--      Pragma restrict_references( Gaf_Sequencia, 'WNDS' );
End Gapk_MudaSafra;

 