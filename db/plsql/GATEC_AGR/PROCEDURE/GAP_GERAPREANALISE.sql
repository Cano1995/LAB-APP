CREATE OR REPLACE Procedure Gap_GeraPreAnalise( nIDD4 In Number,
								nCOD_EMPR In Number,
						            nSAF_ANO_SAFRA In NUmber,
								nEtq  In Number,
                                                              nVaried In Number,
							      nRetorno In Out Number )
Is

nID_PRE_ANALI Number(7);
sProcesso     varchar2(2000);
sABV_VARIED   char(15);

ErroSql Varchar2(2000);

Cursor curVaried_Cana Is
  Select RTRIM(ABV_VARIE)
     From GA_VARIE_USINA
       Where COD_VARIE_USINA = nVaried;

Cursor curId_Pre_Anali Is
  Select NUM
     From SEQUENCIA
       Where OBJETO = 'GA_PRE_ANALI';

Cursor curMaxNumero Is
  Select Nvl(Max(ID_PRE_ANALI),0)
     From GA_PRE_ANALI;

Begin

    Open curId_Pre_Anali;
    Fetch curId_Pre_Anali Into nID_PRE_ANALI;

    If curId_Pre_Anali%NOTFOUND Then

	Open curMaxNumero;
	Fetch curMaxNumero Into nID_PRE_ANALI;
	Close curMaxNumero;

    Else

	Update SEQUENCIA set Num = Num + 1 Where OBJETO = 'GA_PRE_ANALI';

    End If;

    nID_PRE_ANALI := nID_PRE_ANALI + 1;

    Close curID_PRE_ANALI;

    Open curVaried_Cana;
    Fetch curVaried_Cana Into sABV_VARIED;
    Close curVaried_Cana;

    sProcesso := 'Inserindo em GA_PRE_ANALI' ;
    Insert Into GA_PRE_ANALI( ID_PRE_ANALI,
			      	COD_EMPR,
			      	SAF_ANO_SAFRA,
			      	PAN_NUMER,
			      	PAN_DT,
                                PAN_VARIED,
                		PAN_BRIX,
					PAN_LS,
					PAN_PBU,
					PAN_AR,
					PAN_POL_CALDO )
			      values( nID_PRE_ANALI,
				        nCOD_EMPR,
			      	  nSAF_ANO_SAFRA,
			      	  nEtq,
			      	  SYSDATE,
                                  sABV_VARIED,
					  0,
					  0,
					  0,
					  0,
                                          0 );

    sProcesso := 'Inserindo em GA_MOV_PRE_ANALI';
    Insert Into GA_MOV_PRE_ANALI( ID_PRE_ANALI,
				  ID_DIVI4,
				  MPA_FLAG_ORIGEM )
		      values( nID_PRE_ANALI,
			      nIDD4,
			      1 );

    Exception
	When Others Then
		nRetorno := 1;
		ErroSql := substr( SQLERRM , 1, 240 );
		Insert Into Log_erro Values
		( 'Falha na Procedure Gap_GeraPreAnalise ' || USER || ' ' ||
	 	  TO_CHAR( SYSDATE , 'DD-MM-YY-HH24:MI:SS' ) || ' ' || sProcesso || ' ' ||
		  ErroSql || ' ' || 'COD_EMPR = ' || nCOD_EMPR || ' SAF_ANO_SAFRA = ' || nSAF_ANO_SAFRA ||
		  ' PAN_NUMER = ' || nEtq || ' ID_PRE_ANALI = ' || nID_PRE_ANALI );

End;

 