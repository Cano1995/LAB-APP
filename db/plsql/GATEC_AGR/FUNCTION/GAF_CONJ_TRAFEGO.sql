CREATE OR REPLACE Function Gaf_Conj_Trafego( 	nID_Conju       In Number ,
                                              	sMotriz         In String ,
						nTipo		In Number )
Return String
Is
nCod_Agrup Number(5) := 0 ;
sRet	   String(40):= '';
Cursor curAgrup Is
   Select 	cod_agrup Agrup
   From 	ga_cpmis_compl_mis A
   Where  	cod_mis = sMotriz;
regAgrup curAgrup%ROWTYPE;
Cursor curConj Is
   Select  	con.ID_CONJU Conjunto	,
		con.DSC_CONJU Desc_Conj
   From  	GA_VAR_CONJUNTO  	con,
   		GA_CPMIS_COMPL_MIS  	mis,
    		GA_AGRUP_MIS   		agr
   Where  	mis.COD_AGRUP   	= agr.COD_AGRUP  and
    		con.TIPO_CANA   	= agr.AGR_TIPO_CANA and
    		mis.COD_MIS   		= sMotriz      and
    		con.COD_PADRAO in (
     			Select 	COD_PADRAO Cod_Padrao
     			From 	GA_VAR_CONJUNTO
     			Where 	ID_CONJU = nID_Conju )  and
    		con.TIPO_CANA in (
     			Select 	agr1.AGR_TIPO_CANA Tipo_Cana
     			From 	GA_AGRUP_MIS agr1 ,
 				GA_CPMIS_COMPL_MIS mis1
     			Where 	mis1.COD_MIS = sMotriz ) and
	    	con.TIPO_PESO   = 'E'    and
    		con.COD_AGRUP_MOTRIZ = nCod_Agrup;
regConj curConj%ROWTYPE;
Cursor curFalha Is
   Select 	dsc_conju Dsc
   From 	ga_var_conjunto
   Where  	id_conju = nCod_Agrup;
regFalha curFalha%ROWTYPE;
Begin
   Open curAgrup;
   Fetch curAgrup Into regAgrup;
   Close curAgrup;
   nCod_Agrup := regAgrup.Agrup;
   Open curConj;
   Fetch curConj Into regConj;
   Close curConj;
   if nvl(regConj.Conjunto,0) = 0 Then
       nCod_Agrup := nID_Conju;
       Open curFalha;
       Fetch curFalha Into regFalha;
       Close curFalha;
       sRet       := regFalha.Dsc;
   else
       nCod_Agrup := regConj.Conjunto;
       sRet       := regConj.Desc_Conj;
   end if;
   if nTipo = 2 Then
      sRet := to_char( nCod_Agrup );
   End if;
   sRet := rtrim( sRet );
   Return sRet;
   Exception
      When Others Then
      nCod_Agrup := nID_Conju;
      Return 'Erro';
End Gaf_Conj_Trafego;

 